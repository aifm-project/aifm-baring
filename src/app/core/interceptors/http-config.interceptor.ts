// src/app/core/interceptors/http-config.interceptor.ts
import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import * as Crypto from 'crypto-js';
import { environment } from '../../../environments/environment';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PreAuthEncryptionService } from '../services/pre-auth-encryption.service';

// Per-session wire format "ivBase64:ciphertextBase64:tagBase64" (matches the
// backend's SESSION_FORMAT_REGEX). Used to recognise an encrypted body without
// relying on the X-encrypted response header, which isn't exposed cross-origin.
const SESSION_CIPHERTEXT_REGEX = /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

let requestCount = 0; // ← GLOBAL counter
export function httpConfigInterceptor(
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const authService = inject(AuthService);
  const spinner = inject(NgxSpinnerService);
  const preAuthEncryption = inject(PreAuthEncryptionService);

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
    prepared$ = from(preAuthEncryptRequest(req, preAuthCtx, preAuthEncryption));
  } else {
    prepared$ = of(stripEncryptionHeader(req));
  }

  requestCount++; // Count up
  spinner.show();

  return prepared$.pipe(
    switchMap(preparedRequest => next(preparedRequest)),
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
        let bytes = Crypto.AES.decrypt(
          error.error.text,
          environment.genericAlpha
        );
        return of(
          new HttpResponse({
            status: 200,
            body: JSON.parse(bytes.toString(Crypto.enc.Utf8)),
          })
        );
      } else if (error.status == 401) {
        authService.logout();
      }
      if (preAuthEncrypt && preAuthCtx.aesKey) {
        return from(preAuthDecodeError(error, preAuthCtx.aesKey, preAuthEncryption)).pipe(
          switchMap(decoded => throwError(() => decoded))
        );
      }
      return throwError(() => error);
    }),
    finalize(() => {
      requestCount--;
      if (requestCount <= 0) {
        spinner.hide();  // Hide only when ALL done
        requestCount = 0;
      }
    })
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
  try {
    const decoded = SESSION_CIPHERTEXT_REGEX.test(raw)
      ? await preAuthEncryption.decrypt(raw, aesKey)
      : JSON.parse(raw);
    return new HttpErrorResponse({
      error: decoded,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url || undefined,
    });
  } catch {
    return error;
  }
}