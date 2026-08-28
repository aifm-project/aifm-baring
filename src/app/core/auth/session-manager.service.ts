import { HttpClient, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';

import { clearAuthData, setAuthData } from '../../store/auth/auth.actions';
import { selectAuthState } from '../../store/auth/auth.selectors';
import { clearDates } from '../../store/date/date.action';
import { clearFundData } from '../../store/fund/fund.action';
import { ReadinessService } from '../loading/readiness.service';
import { RequestTrackerService } from '../services/request-tracker.service';
import { PdfViewerService } from '../../shared/services/pdf-viewer.service';
import { SessionNoticeService } from './session-notice.service';
import {
  EXPLAINED_REASONS,
  SESSION_BROADCAST_KEY,
  SESSION_COPY,
  SESSION_REFRESH,
  SessionEndReason,
  SessionState,
  isSafeReturnUrl,
} from './session.model';

/** What the user is shown when the server says "authenticated, but not for this". */
export interface AccessNotice {
  readonly heading: string;
  readonly body: string;
}

/** Keys holding a credential. Named once so cleanup and inspection cannot drift. */
const TOKEN_KEYS = ['authToken', 'fundInvestorToken'] as const;

/**
 * The single owner of "is this session still usable, and what happens when it isn't".
 *
 * ## Why one service
 *
 * Before this existed, the HTTP interceptor called `AuthService.logout()` directly on
 * every 401. `logout()` cleared both storages and assigned `window.location.href`.
 * On a dashboard that issues ten requests in parallel - which every screen in this
 * app does - an expired session therefore ran ten full teardowns and ten navigations
 * back to back, and the user arrived at the login page with no explanation of any
 * kind. Both defects have the same root cause: the decision was taken per-response
 * instead of per-session.
 *
 * Everything here follows from making that decision exactly once:
 *
 *  - `state` is a latch. The first 401 to arrive owns the outcome; every later one
 *    is absorbed (Scenario D). There is no counter to get out of step and no
 *    "already logging out" boolean that some path forgets to reset - a terminal
 *    state is terminal.
 *  - Refresh is single-flight through one shared observable, so N queued requests
 *    produce one renewal attempt and then all retry (Scenario A).
 *  - Ending a session is one method with one ordering, so cleanup, notification,
 *    cross-tab signalling and navigation cannot be done half-way by one caller and
 *    differently by another.
 *
 * ## What it deliberately does not do
 *
 * It does not decide whether a response *is* an authentication failure - the
 * interceptor does that, because only it can see the decoded body. And it never
 * formats a technical reason into user-facing text: the copy is a constant, chosen
 * so that an expired token, a revoked token and a corrupted token all read the same.
 * The difference between them is useful to an attacker and useless to the account
 * holder.
 */
@Injectable({ providedIn: 'root' })
export class SessionManager {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly http = inject(HttpClient);
  private readonly notices = inject(SessionNoticeService);
  private readonly readiness = inject(ReadinessService);
  private readonly tracker = inject(RequestTrackerService);
  private readonly pdfViewer = inject(PdfViewerService);
  private readonly refreshConfig = inject(SESSION_REFRESH);
  private readonly destroyRef = inject(DestroyRef);

  /** Terminal once it leaves ACTIVE for ENDING. Read by the interceptor latch. */
  private readonly stateSignal = signal<SessionState>('ACTIVE');
  readonly state = this.stateSignal.asReadonly();

  /** A 403 explanation, rendered by <app-session-alert>. At most one at a time. */
  private readonly accessNoticeSignal = signal<AccessNotice | null>(null);
  readonly accessNotice = this.accessNoticeSignal.asReadonly();

  /** The in-flight renewal, shared by every request that hit a 401 at the same time. */
  private refresh$: Observable<string | null> | null = null;

  private readonly onStorage = (event: StorageEvent) => this.handleStorageEvent(event);

  constructor() {
    // Cross-tab awareness (Scenario H). `storage` fires only in OTHER tabs of the
    // same origin, which is exactly the audience: this tab already knows.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorage);
      this.destroyRef.onDestroy(() => window.removeEventListener('storage', this.onStorage));
    }
  }

  /** True once the session is on its way out; no further handling may start. */
  isTerminal(): boolean {
    const state = this.stateSignal();
    return state === 'ENDING' || state === 'ENDED';
  }

  /** Requests to the renewal endpoint must never be treated as renewable themselves. */
  isRefreshRequest(url: string): boolean {
    const endpoint = this.refreshConfig.endpoint;
    return !!endpoint && url.indexOf(endpoint) > -1;
  }

  /**
   * Decide what a 401 on a protected route means, and act on it exactly once.
   *
   * Emits the access token to retry the request with. Completes WITHOUT emitting when
   * the session is over - the caller then simply never retries, and its subscriber
   * sees a completion with no value rather than an error. That is deliberate: a
   * screen whose session has just ended is being navigated away from, and surfacing
   * ten component-level error states on the way out is the cascade this replaces.
   */
  handleUnauthorized(request: HttpRequest<unknown>, error: HttpErrorResponse): Observable<string> {
    // Scenario D: the first 401 already owns this. Absorb the rest in silence.
    if (this.isTerminal()) return EMPTY;

    // Scenario F: the renewal call itself was rejected. This is terminal by
    // definition - there is nothing left to renew with, and re-entering the refresh
    // path here is how an infinite loop is built.
    if (this.isRefreshRequest(request.url)) {
      this.endSession('EXPIRED');
      return EMPTY;
    }

    if (!this.refreshConfig.enabled) {
      this.endSession(this.classify(error));
      return EMPTY;
    }

    // A per-fund investor token is a scoped credential the renewal endpoint does not
    // issue. Renewing the account token and replaying the request with it would send
    // the request under a WIDER scope than it was made with, which in a fund
    // reporting product means answering with data the original request was not
    // entitled to. End the session instead.
    if (this.usedScopedToken(request)) {
      this.endSession('EXPIRED');
      return EMPTY;
    }

    return this.refreshOnce().pipe(switchMap(token => (token ? of(token) : EMPTY)));
  }

  /**
   * Report a 403 (Scenario J).
   *
   * Authorisation, not authentication: the user is who they say they are and stays
   * signed in. Ending the session here would log people out of the whole product
   * because one widget asked for one thing they cannot see.
   */
  reportForbidden(): void {
    if (this.isTerminal()) return;
    // Ten forbidden widgets are still one message.
    if (this.accessNoticeSignal()) return;
    this.accessNoticeSignal.set({
      heading: SESSION_COPY.forbidden.heading,
      body: SESSION_COPY.forbidden.body,
    });
  }

  dismissAccessNotice(): void {
    this.accessNoticeSignal.set(null);
  }

  /**
   * The user pressed Logout (Scenario G).
   *
   * Same teardown, different reason - and the reason is the whole point: no expiry
   * notice is written, so the login screen stays quiet for someone who meant to be
   * there. It also captures no return URL: they asked to leave, not to be sent back.
   */
  signOut(): void {
    this.endSession('SIGNED_OUT');
  }

  /**
   * End the session once. Every path out of an authenticated state comes through
   * here, in this order:
   *
   *  1. latch, so the ninth concurrent 401 does none of the following;
   *  2. stop the loading UI, so the screen cannot be left under a spinner that will
   *     never resolve (Section 9) - and bump the readiness epoch, so a response
   *     already in flight from the old session cannot score against anything;
   *  3. drop in-memory user state, including the fund/date slices and any open
   *     document - a financial app must not carry one user's holdings into the next
   *     user's first paint;
   *  4. wipe persisted state;
   *  5. only THEN write the explanation and the return path, which would otherwise
   *     be erased by step 4;
   *  6. tell the other tabs, unless this tab is itself following another tab;
   *  7. navigate exactly once, replacing history so Back does not land on a screen
   *     whose data is gone.
   */
  endSession(reason: SessionEndReason, options?: { remote?: boolean }): void {
    if (this.isTerminal()) return;
    this.stateSignal.set('ENDING');

    const returnUrl = reason === 'SIGNED_OUT' ? null : this.currentReturnUrl();

    this.accessNoticeSignal.set(null);
    this.refresh$ = null;

    this.readiness.clearAll();
    this.tracker.reset();
    this.pdfViewer.closePdf();

    this.store.dispatch(clearAuthData());
    this.store.dispatch(clearFundData());
    this.store.dispatch(clearDates());

    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // Storage can throw in hardened/private modes. Cleanup must continue: a
      // half-finished sign-out that leaves the user on an authenticated screen is
      // strictly worse than one that fails to clear a cache entry.
    }

    if (EXPLAINED_REASONS.has(reason)) this.notices.write(reason);
    if (returnUrl) this.notices.writeReturnUrl(returnUrl);

    if (!options?.remote) this.broadcast(reason);

    this.stateSignal.set('ENDED');
    // navigateByUrl rather than window.location.href: a document reload discards the
    // sessionStorage handover timing, costs a full bootstrap, and makes the exit feel
    // like a crash. The login screen is a route like any other.
    this.router.navigateByUrl('/user/login', { replaceUrl: true }).catch(() => {
      // A guard or resolver rejecting the navigation must not strand the user on a
      // screen whose session is gone. Fall back to a hard navigation.
      this.hardNavigate('/user/login');
    });
  }

  /**
   * Last-resort navigation, kept behind a method so it is a seam: a test can assert
   * the fallback fires without the assertion navigating the test runner itself.
   */
  protected hardNavigate(url: string): void {
    if (typeof window !== 'undefined') window.location.href = url;
  }

  /**
   * Called by the guard when it turns a deep link away. Keeps the destination so
   * sign-in can complete the journey the user actually started.
   */
  captureReturnUrl(url: string): void {
    if (isSafeReturnUrl(url)) this.notices.writeReturnUrl(url);
  }

  /**
   * Mark a fresh session. Called after a successful sign-in so a tab that ended a
   * session and stayed open (SPA navigation keeps the app alive) can be used again.
   */
  markActive(): void {
    this.stateSignal.set('ACTIVE');
    this.accessNoticeSignal.set(null);
    this.refresh$ = null;
  }

  // ---------------------------------------------------------------- internals

  /**
   * One renewal per wave, shared by every waiting request.
   *
   * `shareReplay` with `refCount: false` is the load-bearing detail. The first 401 to
   * arrive builds the observable; the other nine reuse it, so the endpoint sees one
   * call. refCount stays false because these subscribers are components that may be
   * destroyed mid-flight - with refCount the last one leaving would cancel a renewal
   * the remaining requests still depend on. `finalize` clears the handle so the NEXT
   * expiry starts a new attempt rather than replaying this one's stale result.
   */
  private refreshOnce(): Observable<string | null> {
    if (this.refresh$) return this.refresh$;

    this.stateSignal.set('REFRESHING');
    const { endpoint, tokenField } = this.refreshConfig;

    this.refresh$ = this.http.post<Record<string, unknown>>(endpoint, {}).pipe(
      map(body => {
        const token = body?.[tokenField];
        if (typeof token !== 'string' || !token.trim()) {
          // A 200 with no token is a failed renewal wearing a success status.
          throw new Error('refresh: response carried no token');
        }
        return token;
      }),
      tap(token => this.adoptToken(token)),
      catchError(() => {
        // Covers 401 (refresh token itself rejected), 500, timeout and offline
        // alike: whatever the cause, we cannot prove the session is still good, and
        // continuing to retry protected calls with a credential the server rejects
        // is what produces a retry storm.
        this.endSession('EXPIRED');
        return of(null);
      }),
      finalize(() => {
        this.refresh$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.refresh$;
  }

  /** Persist a renewed token in both places the app reads it from. */
  private adoptToken(token: string): void {
    try {
      localStorage.setItem('authToken', token);
    } catch {
      /* non-fatal: the retry below carries the token explicitly */
    }
    let userData: unknown = null;
    this.store
      .select(selectAuthState)
      .pipe(take(1))
      .subscribe(state => (userData = state?.userData ?? null));
    if (userData) this.store.dispatch(setAuthData({ userData, token }));
    this.stateSignal.set('ACTIVE');
  }

  /** True when the request carried a fund-scoped investor token rather than the account token. */
  private usedScopedToken(request: HttpRequest<unknown>): boolean {
    let scoped: string | null = null;
    try {
      scoped = localStorage.getItem('fundInvestorToken');
    } catch {
      return false;
    }
    if (!scoped) return false;
    return request.headers.get('x-access-token') === scoped;
  }

  /**
   * Distinguish "the credential aged out" from "the credential was unreadable".
   *
   * Both end the session and both show identical copy; the reason exists for logs and
   * for tests, not for the user. Nothing derived from the server's error body is ever
   * rendered - an authentication endpoint's error text is written for developers and
   * regularly names the mechanism.
   */
  private classify(error: HttpErrorResponse): SessionEndReason {
    const body: any = error?.error;
    const text = typeof body === 'string' ? body : (body?.message ?? body?.errorMessage ?? '');
    return /invalid|malformed|signature|decode/i.test(String(text)) ? 'INVALID' : 'EXPIRED';
  }

  /** The current route, if it is worth returning to. */
  private currentReturnUrl(): string | null {
    const url = this.router.url;
    return isSafeReturnUrl(url) ? url : null;
  }

  /** Ring the doorbell for other tabs. Carries a reason and a timestamp, nothing else. */
  private broadcast(reason: SessionEndReason): void {
    try {
      localStorage.setItem(SESSION_BROADCAST_KEY, JSON.stringify({ reason, at: Date.now() }));
    } catch {
      /* cross-tab sync is best-effort; this tab is already handled */
    }
  }

  /**
   * Follow another tab out.
   *
   * Two shapes arrive here. An explicit signal on our own key, and `key === null`,
   * which is what `localStorage.clear()` in another tab produces - worth honouring
   * because it is how any older code path ends a session. Either way this tab ends
   * with `remote: true` so it does not broadcast back and start a ping-pong; the
   * latch in `endSession` would stop it after one bounce anyway, but not rebroadcasting
   * is clearer than relying on that.
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.storageArea && event.storageArea !== localStorage) return;
    const isSignal = event.key === SESSION_BROADCAST_KEY && !!event.newValue;
    const isClear = event.key === null;
    if (!isSignal && !isClear) return;
    if (this.isTerminal()) return;
    // A tab sitting on the login screen has nothing to end and no one to tell.
    if (!this.looksAuthenticated()) return;
    this.endSession('REMOTE', { remote: true });
  }

  private looksAuthenticated(): boolean {
    let authenticated = false;
    this.store
      .select(selectAuthState)
      .pipe(take(1))
      .subscribe(state => (authenticated = !!state?.userData));
    if (authenticated) return true;
    try {
      return TOKEN_KEYS.some(key => !!localStorage.getItem(key));
    } catch {
      return false;
    }
  }
}
