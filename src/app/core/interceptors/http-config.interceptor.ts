// src/app/core/interceptors/http-config.interceptor.ts
import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, from, throwError, defer } from 'rxjs';
import { catchError, finalize, switchMap, tap, timeout } from 'rxjs/operators';
import * as Crypto from 'crypto-js';
import { environment } from '../../../environments/environment';
import { inject } from '@angular/core';
import { SessionManager } from '../auth/session-manager.service';
import { PreAuthEncryptionService } from '../services/pre-auth-encryption.service';
import { RequestTrackerService } from '../services/request-tracker.service';
import { ReadinessService } from '../loading/readiness.service';
import { READINESS_TASK, TaskState } from '../loading/readiness.model';

// Per-session wire format "ivBase64:ciphertextBase64:tagBase64" (matches the
// backend's SESSION_FORMAT_REGEX). Used to recognise an encrypted body without
// relying on the X-encrypted response header, which isn't exposed cross-origin.
const SESSION_CIPHERTEXT_REGEX = /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

// Routes reached while signed out. A 401 here means "those credentials were
// rejected", not "your session expired" — auto-logging out would clear storage
// and hard-navigate, destroying the error message the caller is about to show.
//
// This list is the Scenario E boundary: it is the only thing separating "the
// password you typed is wrong" from "you have been signed out of the product".
// An endpoint missing from it will log a user out for mistyping their password.
const PRE_AUTH_URL_FRAGMENTS = [
  'users/login',
  'users/otp/login',
  'users/resend/otp/login',
  'otp/login',
  'otp/signup',
  'pre-auth/public-key',
  'session/key-exchange',
  'account?domain',
];

/**
 * Pre-auth routes matched on a whole path SEGMENT rather than a substring.
 *
 * `otp` (the send-a-code route) cannot go in the list above: as a substring it would
 * match any URL that happens to contain those three letters. Matched as a trailing
 * segment it means exactly the one endpoint.
 */
const PRE_AUTH_PATH_SEGMENTS = ['otp'];

/** True for requests made before the user has a session. */
function isPreAuthRequest(request: HttpRequest<any>): boolean {
  if (PRE_AUTH_URL_FRAGMENTS.some(fragment => request.url.indexOf(fragment) > -1)) {
    return true;
  }
  const path = (request.url || '').split('?')[0].replace(/\/+$/, '');
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  return PRE_AUTH_PATH_SEGMENTS.indexOf(lastSegment) > -1;
}

/**
 * Statuses that mean "this credential no longer authenticates you".
 *
 * 419 is not emitted by this backend today. It is included because it is the status
 * a session-expiry filter conventionally returns, and the cost of handling a status
 * that never arrives is nothing, while the cost of the one day it does arrive is a
 * user staring at an unexplained empty screen. 403 is deliberately NOT here — see
 * the 403 branch below.
 */
function isAuthenticationFailure(status: number): boolean {
  return status === 401 || status === 419;
}

export function httpConfigInterceptor(
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const sessionManager = inject(SessionManager);
  const preAuthEncryption = inject(PreAuthEncryptionService);
  const tracker = inject(RequestTrackerService);
  const readiness = inject(ReadinessService);

  // Opt-in attribution. An untagged request is invisible to readiness - correct for
  // tenant config, user-initiated downloads and background refreshes, all of which
  // previously moved the progress number because the old interceptor counted
  // everything it saw.
  const taskId = request.context.get(READINESS_TASK);

  // Everything below runs inside defer() so the whole chain - including the
  // token registration - is built at SUBSCRIBE time, with finalize() already
  // attached on the outside. That is what makes begin/end provably paired: the
  // old code incremented a counter in the function body, so a synchronous throw
  // while building the request (e.g. Crypto.AES.encrypt on a bad body) left the
  // count raised with no finalize ever attached, stranding the overlay for good.
  return defer(() => {
    const token = tracker.begin(request.url);

    // Stamp the epoch at ISSUE time. A response arriving after the user has switched
    // fund or route carries the old epoch and must not score against the new
    // session - otherwise Fund A's slow response completes Fund B's checklist.
    const issuedEpoch = readiness.epoch();
    if (taskId) {
      readiness.registerUnknown(taskId);
      readiness.markInFlight(taskId);
    }

    // Default to cancelled, NOT succeeded: finalize also runs on unsubscribe, so a
    // component destroyed mid-flight would otherwise tick its step green having
    // received nothing. Only an actual response or error overrides this.
    let settledAs: TaskState = 'cancelled';
    return buildRequestChain(request, next, sessionManager, preAuthEncryption).pipe(
      tap(event => {
        if (taskId && event instanceof HttpResponse) {
          const body: any = event.body;
          const isEmpty =
            body == null ||
            (Array.isArray(body) && body.length === 0);
          settledAs = isEmpty ? 'empty' : 'succeeded';
        }
      }),
      catchError(error => {
        settledAs = error?.name === 'TimeoutError' ? 'timedOut' : 'failed';
        return throwError(() => error);
      }),
      finalize(() => {
        tracker.end(token);
        if (!taskId) return;
        // Superseded session: resolve nothing, so the current session's denominator
        // is untouched by work that belonged to a screen the user has left.
        if (issuedEpoch !== readiness.epoch()) return;
        readiness.markSettled(taskId, settledAs);
      })
    );
  });
}

function buildRequestChain(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  sessionManager: SessionManager,
  preAuthEncryption: PreAuthEncryptionService
): Observable<HttpEvent<any>> {

  const enableEncryption = request.headers.get('enable-encryption');
  let tokenSet = false;
  if (request.headers.get('x-access-token')) {
    tokenSet = true;
  }
  let req = request;
  if (!tokenSet) {
    const token = localStorage.getItem('fundInvestorToken') || localStorage.getItem('authToken');
    if (token) {
      req = req.clone({
        setHeaders: {
          'x-access-token': token
        }
      });
    }
  }

  // Determine encryption mode
  const preAuthEncrypt = shouldPreAuthEncrypt(req);

  if (!preAuthEncrypt && enableEncryption === 'true' && environment.genericAlpha) {
    let encryptedMessage = Crypto.AES.encrypt(
      JSON.stringify(req.body),
      environment.genericAlpha
    ).toString();
    const body = { encryptedMessage };
    req = req.clone({ body });
  }

  // Capture the AES key produced during pre-auth encrypt so the same key
  // can decrypt the response and any encrypted error body.
  const preAuthCtx: { aesKey?: CryptoKey } = {};

  let prepared$: Observable<HttpRequest<any>>;
  if (preAuthEncrypt) {
    // ECDH key agreement is a millisecond operation; if it has not settled in ten
    // seconds the request never left the browser. Time it out so the chain always
    // terminates - an unsettled promise here was a path by which the old counter
    // could never return to zero.
    prepared$ = from(preAuthEncryptRequest(req, preAuthCtx, preAuthEncryption)).pipe(
      timeout({ each: 10_000 })
    );
  } else {
    prepared$ = of(stripEncryptionHeader(req));
  }

  // The request as it actually went on the wire, captured for one purpose: a retry
  // after a silent renewal must replay THIS request, not the pre-encryption original.
  // Re-running the chain would re-encrypt an already-encrypted body.
  let sentRequest: HttpRequest<any> = req;

  return prepared$.pipe(
    switchMap(preparedRequest => {
      sentRequest = preparedRequest;
      return next(preparedRequest);
    }),
    switchMap(event => {
      if (preAuthEncrypt && preAuthCtx.aesKey) {
        return from(preAuthDecryptResponse(event, preAuthCtx.aesKey, preAuthEncryption));
      }
      if (event instanceof HttpResponse) {
        // Handle CryptoJS-encrypted responses (status 200 arriving as error.text)
      }
      return of(event);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 200 && error.error && error.error.text && environment.genericAlpha) {
        try {
          const bytes = Crypto.AES.decrypt(error.error.text, environment.genericAlpha);
          return of(
            new HttpResponse({
              status: 200,
              body: JSON.parse(bytes.toString(Crypto.enc.Utf8)),
            })
          );
        } catch {
          // A wrong key yields an empty string and a SyntaxError here. Fall
          // through to the normal error path rather than throwing a bare
          // SyntaxError, which has no .status and no .error for callers to read.
          return throwError(() => error);
        }
      }

      // Decode the body BEFORE acting on the status: an encrypted 401 body
      // carries the real reason, and logging out first would discard it.
      const decoded$ = preAuthEncrypt && preAuthCtx.aesKey
        ? from(preAuthDecodeError(error, preAuthCtx.aesKey, preAuthEncryption))
        : of(error);

      return decoded$.pipe(
        switchMap(decoded => {
          // Scenario E: a rejected sign-in is the login screen's business. It shows
          // "the email or password you entered is incorrect" — it must not be
          // overwritten by a session-expiry story about a session that never began.
          if (isPreAuthRequest(request)) {
            return throwError(() => decoded);
          }

          if (isAuthenticationFailure(decoded.status)) {
            return handleAuthFailure(decoded, sentRequest, next, sessionManager);
          }

          // Scenario J: authenticated, but not entitled to this resource. Explain it
          // and leave the session completely alone. Note the error is still rethrown,
          // so a caller that wants to render its own empty state still can.
          if (decoded.status === 403) {
            sessionManager.reportForbidden();
          }

          // Everything else — 0 (offline/CORS), 5xx, timeouts — is a transport or
          // server problem, NOT an authentication one. Signing a user out because a
          // report service is briefly down is the failure mode this branch exists to
          // avoid; the error travels on to the caller untouched.
          return throwError(() => decoded);
        })
      );
    })
  );
}

/**
 * Hand a protected-route authentication failure to the one component that owns it.
 *
 * There is exactly one retry, and it exists only on the success path of a renewal.
 * The shape below is what keeps that true:
 *
 *  - SessionManager emits a token only when a renewal actually succeeded. When the
 *    session is over it completes without emitting, so `switchMap` never runs and the
 *    chain ends quietly — no error toast from ten components on the way out.
 *  - If the single retry is itself rejected, the session ends there. It is NOT sent
 *    back through `handleUnauthorized`, so there is no path by which a retry can
 *    trigger a renewal that triggers a retry.
 */
function handleAuthFailure(
  error: HttpErrorResponse,
  sentRequest: HttpRequest<any>,
  next: HttpHandlerFn,
  sessionManager: SessionManager
): Observable<HttpEvent<any>> {
  return sessionManager.handleUnauthorized(sentRequest, error).pipe(
    switchMap(token =>
      next(sentRequest.clone({ setHeaders: { 'x-access-token': token } })).pipe(
        catchError((retryError: HttpErrorResponse) => {
          if (retryError?.status === 401 || retryError?.status === 419) {
            sessionManager.endSession('EXPIRED');
          }
          return throwError(() => retryError);
        })
      )
    )
  );
}

/** True when a pre-auth request carries enable-encryption and can use ECDH. */
function shouldPreAuthEncrypt(request: HttpRequest<any>): boolean {
  if (request.headers.get('enable-encryption') !== 'true') {
    return false;
  }
  if (!request.url.startsWith(environment.serverBaseEndPoint) || request.url.indexOf('/api/') === -1) {
    return false;
  }
  if (request.url.indexOf('session/key-exchange') > -1 || request.url.indexOf('pre-auth/public-key') > -1) {
    return false;
  }
  // Allow bodyless GET requests as well as body-present requests (but not FormData uploads).
  return !(request.body instanceof FormData);
}

/** Encrypt a pre-auth request via ephemeral ECDH; stash the AES key for response decryption. */
async function preAuthEncryptRequest(
  request: HttpRequest<any>,
  ctx: { aesKey?: CryptoKey },
  preAuthEncryption: PreAuthEncryptionService
): Promise<HttpRequest<any>> {
  if (request.body != null) {
    // Body present: encrypt it and send { ecdhPublicKey, encryptedMessage }.
    const { ecdhPublicKey, encryptedMessage, aesKey } = await preAuthEncryption.encrypt(request.body);
    ctx.aesKey = aesKey;
    return request.clone({ body: { ecdhPublicKey, encryptedMessage }, responseType: 'text' });
  }
  // Bodyless GET: send ECDH public key as a header so the backend can encrypt its response.
  const { ecdhPublicKey, aesKey } = await preAuthEncryption.prepareGetKey();
  ctx.aesKey = aesKey;
  const headers = request.headers.set('x-ecdh-public-key', ecdhPublicKey);
  return request.clone({ headers, responseType: 'text' });
}

/** Strip a stale enable-encryption flag so plaintext requests stay plaintext. */
function stripEncryptionHeader(request: HttpRequest<any>): HttpRequest<any> {
  if (request.headers.has('enable-encryption')) {
    return request.clone({ headers: request.headers.delete('enable-encryption') });
  }
  return request;
}

/** Decrypt a pre-auth response body (responseType was set to text, so 200s come through here). */
async function preAuthDecryptResponse(
  event: HttpEvent<any>,
  aesKey: CryptoKey,
  preAuthEncryption: PreAuthEncryptionService
): Promise<HttpEvent<any>> {
  if (!(event instanceof HttpResponse)) return event;
  const body = event.body;
  if (typeof body !== 'string' || !body) return event;
  if (SESSION_CIPHERTEXT_REGEX.test(body)) {
    const decrypted = await preAuthEncryption.decrypt(body, aesKey);
    return event.clone({ body: decrypted });
  }
  try { return event.clone({ body: JSON.parse(body) }); }
  catch { return event.clone({ body }); }
}

/** Decrypt a pre-auth error body (4xx responses from login/OTP routes). */
async function preAuthDecodeError(
  error: HttpErrorResponse,
  aesKey: CryptoKey,
  preAuthEncryption: PreAuthEncryptionService
): Promise<HttpErrorResponse> {
  const raw = error.error;
  if (typeof raw !== 'string' || !raw) return error;
  const looksEncrypted = SESSION_CIPHERTEXT_REGEX.test(raw);
  try {
    const decoded = looksEncrypted
      ? await preAuthEncryption.decrypt(raw, aesKey)
      : JSON.parse(raw);
    return new HttpErrorResponse({
      error: decoded,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url || undefined,
    });
  } catch (err) {
    if (looksEncrypted) {
      // The body was encrypted but our key couldn't open it — most likely the
      // backend rotated its static key. The cached key is only invalidated on a
      // *fetch* failure today, so without this a rotation poisons every login
      // attempt for the lifetime of the tab.
      console.error('pre-auth: failed to decrypt error body, resetting cached backend key', err);
      preAuthEncryption.reset();
    }
    // Never hand ciphertext back as if it were a message; callers guard on this,
    // but returning the original error keeps their existing shape expectations.
    return error;
  }
}