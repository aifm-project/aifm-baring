import { HttpErrorResponse, HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { PdfViewerService } from '../../shared/services/pdf-viewer.service';
import { ReadinessService } from '../loading/readiness.service';
import { RequestTrackerService } from '../services/request-tracker.service';
import { clearAuthData } from '../../store/auth/auth.actions';
import { clearDates } from '../../store/date/date.action';
import { clearFundData } from '../../store/fund/fund.action';
import { SessionManager } from './session-manager.service';
import { SessionNoticeService } from './session-notice.service';
import {
  SESSION_BROADCAST_KEY,
  SESSION_NOTICE_KEY,
  SESSION_REFRESH,
  SESSION_RETURN_URL_KEY,
  SessionRefreshConfig,
} from './session.model';

const REFRESH_ENDPOINT = 'https://api.test/api/v1/session/renew';

function protectedRequest(url = 'https://api.test/api/v1/funds/summary'): HttpRequest<unknown> {
  return new HttpRequest('GET', url);
}

function unauthorized(body: unknown = { message: 'expired' }): HttpErrorResponse {
  return new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: body });
}

interface Harness {
  manager: SessionManager;
  router: { url: string; navigateByUrl: jasmine.Spy };
  store: MockStore;
  notices: SessionNoticeService;
  http: HttpTestingController;
}

function setup(refresh?: Partial<SessionRefreshConfig>, routerUrl = '/portfolio'): Harness {
  const router = {
    url: routerUrl,
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
  };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideMockStore({
        initialState: {
          authState: { userData: { user_guid: 'u-1' }, token: 't-1', accountInfo: null, accountConfigs: null },
        },
      }),
      { provide: Router, useValue: router },
      {
        provide: SESSION_REFRESH,
        useValue: { enabled: false, endpoint: REFRESH_ENDPOINT, tokenField: 'token', ...refresh },
      },
    ],
  });

  return {
    manager: TestBed.inject(SessionManager),
    router,
    store: TestBed.inject(MockStore),
    notices: TestBed.inject(SessionNoticeService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('SessionManager', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ------------------------------------------------------------------ Scenario D
  describe('concurrent failures (Scenario D)', () => {
    it('turns ten simultaneous 401s into one navigation and one message', () => {
      const { manager, router, http } = setup();
      const completions: number[] = [];

      // The real shape of the bug: a dashboard fires ~10 requests at once and the
      // session has already expired, so all ten come back 401 within a few ms.
      for (let i = 0; i < 10; i++) {
        manager
          .handleUnauthorized(protectedRequest(`https://api.test/api/v1/thing-${i}`), unauthorized())
          .subscribe({ complete: () => completions.push(i) });
      }

      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/user/login', { replaceUrl: true });
      expect(completions.length).withContext('every caller terminates').toBe(10);
      // One notice, not ten - the notice store holds a single key, but the assertion
      // that matters is that nine of the ten calls did no work at all.
      expect(sessionStorage.getItem(SESSION_NOTICE_KEY)).not.toBeNull();
      http.verify();
    });

    it('emits nothing to the suppressed callers, so no component renders an error', () => {
      const { manager } = setup();
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();

      let emitted = false;
      let errored = false;
      let completed = false;
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe({
        next: () => (emitted = true),
        error: () => (errored = true),
        complete: () => (completed = true),
      });

      expect(emitted).withContext('no retry token').toBe(false);
      expect(errored).withContext('no error cascade').toBe(false);
      expect(completed).withContext('terminates cleanly').toBe(true);
    });

    it('stays terminal - a 401 arriving after the redirect changes nothing', () => {
      const { manager, router } = setup();
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      const first = router.navigateByUrl.calls.count();

      // A slow request from the old session landing after the user is already gone.
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      manager.endSession('EXPIRED');

      expect(router.navigateByUrl.calls.count()).toBe(first);
      expect(manager.state()).toBe('ENDED');
    });
  });

  // ------------------------------------------------------------------ Scenario B/C
  describe('unrecoverable session (Scenarios B and C)', () => {
    it('clears every store slice, not just the auth one', () => {
      // Data isolation: this is a financial product, and the next person to sign in
      // on this machine must not see the previous person's fund or as-of-date state.
      const { manager, store } = setup();
      const dispatch = spyOn(store, 'dispatch').and.callThrough();

      manager.endSession('EXPIRED');

      expect(dispatch).toHaveBeenCalledWith(clearAuthData());
      expect(dispatch).toHaveBeenCalledWith(clearFundData());
      expect(dispatch).toHaveBeenCalledWith(clearDates());
    });

    it('wipes both storages', () => {
      const { manager } = setup();
      localStorage.setItem('authToken', 'secret');
      localStorage.setItem('fundInvestorToken', 'scoped-secret');
      sessionStorage.setItem('activeSession', 'true');

      manager.endSession('EXPIRED');

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('fundInvestorToken')).toBeNull();
      expect(sessionStorage.getItem('activeSession')).toBeNull();
    });

    it('writes the notice AFTER the wipe, or the wipe would eat it', () => {
      // Ordering bug this pins: writing the explanation before clear() means the
      // whole mechanism silently does nothing and the user lands on login unexplained.
      const { manager } = setup();
      manager.endSession('EXPIRED');
      expect(sessionStorage.getItem(SESSION_NOTICE_KEY)).not.toBeNull();
    });

    it('closes any open document so it cannot be read after the session ends', () => {
      const { manager } = setup();
      const pdf = TestBed.inject(PdfViewerService);
      pdf.openPdf('https://api.test/doc.pdf', 'Statement.pdf');

      manager.endSession('EXPIRED');

      pdf.pdfConfig$.subscribe(config => expect(config.isOpen).toBe(false)).unsubscribe();
    });

    it('preserves the route the user was on, so sign-in returns them there', () => {
      const { manager } = setup(undefined, '/portfolio');
      manager.endSession('EXPIRED');
      expect(sessionStorage.getItem(SESSION_RETURN_URL_KEY)).toBe('/portfolio');
    });

    it('does not preserve a route that fails the open-redirect check', () => {
      const { manager } = setup(undefined, '//evil.example/steal');
      manager.endSession('EXPIRED');
      expect(sessionStorage.getItem(SESSION_RETURN_URL_KEY)).toBeNull();
    });

    it('replaces history, so Back does not return to a screen with no data', () => {
      const { manager, router } = setup();
      manager.endSession('EXPIRED');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/user/login', { replaceUrl: true });
    });

    it('treats an unreadable token as a session to recover, not a message to explain', () => {
      const { manager } = setup();
      manager
        .handleUnauthorized(protectedRequest(), unauthorized({ message: 'invalid signature' }))
        .subscribe();

      const notice = JSON.parse(sessionStorage.getItem(SESSION_NOTICE_KEY) ?? '{}');
      expect(notice.reason).withContext('classified, but the user sees identical copy').toBe('INVALID');
    });
  });

  // ------------------------------------------------------------------ Scenario G
  describe('manual sign-out (Scenario G)', () => {
    it('leaves no expiry notice for someone who chose to leave', () => {
      const { manager } = setup();
      manager.signOut();
      expect(sessionStorage.getItem(SESSION_NOTICE_KEY)).toBeNull();
    });

    it('does not capture a return URL - they asked to leave, not to be sent back', () => {
      const { manager } = setup(undefined, '/portfolio');
      manager.signOut();
      expect(sessionStorage.getItem(SESSION_RETURN_URL_KEY)).toBeNull();
    });

    it('still performs the full teardown', () => {
      const { manager, router } = setup();
      localStorage.setItem('authToken', 'secret');
      manager.signOut();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------ Scenario J
  describe('authorisation failure (Scenario J)', () => {
    it('explains a 403 without touching the session', () => {
      const { manager, router } = setup();
      localStorage.setItem('authToken', 'secret');

      manager.reportForbidden();

      expect(manager.accessNotice()?.heading).toBe('Access unavailable');
      expect(manager.accessNotice()?.body).toBe("You don't have permission to access this information.");
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(localStorage.getItem('authToken')).withContext('still signed in').toBe('secret');
    });

    it('shows one message however many widgets are refused', () => {
      const { manager } = setup();
      for (let i = 0; i < 5; i++) manager.reportForbidden();
      expect(manager.accessNotice()).not.toBeNull();
      manager.dismissAccessNotice();
      expect(manager.accessNotice()).toBeNull();
    });

    it('stays quiet once the session is ending - the bigger event owns the screen', () => {
      const { manager } = setup();
      manager.endSession('EXPIRED');
      manager.reportForbidden();
      expect(manager.accessNotice()).toBeNull();
    });
  });

  // ------------------------------------------------------------------ Scenario A
  describe('silent refresh (Scenario A)', () => {
    it('is off by default, because this backend has no renewal endpoint', () => {
      const { manager, router, http } = setup();
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      http.expectNone(REFRESH_ENDPOINT);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });

    it('renews once for a whole wave of 401s and retries each of them', () => {
      const { manager, router, http } = setup({ enabled: true });
      const tokens: string[] = [];

      for (let i = 0; i < 8; i++) {
        manager
          .handleUnauthorized(protectedRequest(`https://api.test/api/v1/thing-${i}`), unauthorized())
          .subscribe(token => tokens.push(token));
      }

      // One renewal, not eight. This is the single-flight guarantee.
      const renewal = http.expectOne(REFRESH_ENDPOINT);
      renewal.flush({ token: 'fresh-token' });

      expect(tokens.length).toBe(8);
      expect(new Set(tokens)).toEqual(new Set(['fresh-token']));
      expect(router.navigateByUrl).withContext('the user never noticed').not.toHaveBeenCalled();
      expect(localStorage.getItem('authToken')).toBe('fresh-token');
      http.verify();
    });

    it('ends the session once when the renewal is rejected, and terminates every waiter', () => {
      const { manager, router, http } = setup({ enabled: true });
      let emissions = 0;
      let completions = 0;

      for (let i = 0; i < 4; i++) {
        manager.handleUnauthorized(protectedRequest(`https://api.test/x${i}`), unauthorized()).subscribe({
          next: () => emissions++,
          complete: () => completions++,
        });
      }

      http.expectOne(REFRESH_ENDPOINT).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(emissions).withContext('nothing retried').toBe(0);
      expect(completions).withContext('nothing left hanging').toBe(4);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });

    it('ends the session when the renewal endpoint is down rather than retrying forever', () => {
      const { manager, router, http } = setup({ enabled: true });
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      http.expectOne(REFRESH_ENDPOINT).flush(null, { status: 500, statusText: 'Server Error' });
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });

    it('treats a 200 that carries no token as a failed renewal', () => {
      // Otherwise the retry goes out with `undefined` in the header and the whole
      // wave 401s again - a renewal that "succeeded" into an infinite loop.
      const { manager, router, http } = setup({ enabled: true });
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      http.expectOne(REFRESH_ENDPOINT).flush({ token: '' });
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });

    it('never renews in response to the renewal call failing (Scenario F)', () => {
      const { manager, router, http } = setup({ enabled: true });

      manager.handleUnauthorized(new HttpRequest('POST', REFRESH_ENDPOINT, {}), unauthorized()).subscribe();

      // The defining assertion against recursion: no renewal request was issued.
      http.expectNone(REFRESH_ENDPOINT);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      http.verify();
    });

    it('starts a fresh renewal for the NEXT expiry rather than replaying a stale one', () => {
      const { manager, http } = setup({ enabled: true });

      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      http.expectOne(REFRESH_ENDPOINT).flush({ token: 'first' });

      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      http.expectOne(REFRESH_ENDPOINT).flush({ token: 'second' });

      expect(localStorage.getItem('authToken')).toBe('second');
      http.verify();
    });

    it('will not renew a fund-scoped token into a wider-scoped one', () => {
      // Replaying a fund-scoped request under the account token would answer it from
      // a broader entitlement than it was made with. In a fund reporting product that
      // is a data-exposure bug, not a convenience.
      const { manager, router, http } = setup({ enabled: true });
      localStorage.setItem('fundInvestorToken', 'scoped-token');
      const scoped = new HttpRequest('GET', 'https://api.test/api/v1/funds/x/performance').clone({
        setHeaders: { 'x-access-token': 'scoped-token' },
      });

      manager.handleUnauthorized(scoped, unauthorized()).subscribe();

      http.expectNone(REFRESH_ENDPOINT);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });

    it('does not renew once a sign-out has started', () => {
      const { manager, http } = setup({ enabled: true });
      manager.signOut();
      manager.handleUnauthorized(protectedRequest(), unauthorized()).subscribe();
      http.expectNone(REFRESH_ENDPOINT);
      http.verify();
    });
  });

  // ------------------------------------------------------------------ Scenario H
  describe('multiple tabs (Scenario H)', () => {
    function fireStorage(key: string | null, newValue: string | null): void {
      window.dispatchEvent(
        new StorageEvent('storage', { key, newValue, storageArea: localStorage }),
      );
    }

    it('follows another tab out', () => {
      const { manager, router } = setup();
      localStorage.setItem('authToken', 'secret');

      fireStorage(SESSION_BROADCAST_KEY, JSON.stringify({ reason: 'SIGNED_OUT', at: Date.now() }));

      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(manager.state()).toBe('ENDED');
    });

    it('honours a bare localStorage.clear() from another tab', () => {
      // Any older code path that ends a session by clearing storage produces a
      // storage event with a null key. A tab that ignored it would sit there looking
      // signed in with no credential behind it.
      const { manager, router } = setup();
      localStorage.setItem('authToken', 'secret');
      fireStorage(null, null);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(manager.state()).toBe('ENDED');
    });

    it('does not echo the signal back and start a ping-pong', () => {
      const { manager } = setup();
      localStorage.setItem('authToken', 'secret');
      fireStorage(SESSION_BROADCAST_KEY, JSON.stringify({ reason: 'SIGNED_OUT', at: Date.now() }));
      expect(localStorage.getItem(SESSION_BROADCAST_KEY)).toBeNull();
      expect(manager.state()).toBe('ENDED');
    });

    it('ignores the signal on a tab that is already at the login screen', () => {
      const { manager, router, store } = setup();
      store.setState({ authState: { userData: null, token: null, accountInfo: null, accountConfigs: null } });
      localStorage.clear();

      fireStorage(SESSION_BROADCAST_KEY, JSON.stringify({ reason: 'SIGNED_OUT', at: Date.now() }));

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(manager.state()).toBe('ACTIVE');
    });

    it('broadcasts a reason and a timestamp only - never a token', () => {
      const { manager } = setup();
      manager.endSession('EXPIRED');
      const signal = JSON.parse(localStorage.getItem(SESSION_BROADCAST_KEY) ?? '{}');
      expect(Object.keys(signal).sort()).toEqual(['at', 'reason']);
    });

    it('ignores storage events from sessionStorage', () => {
      const { manager, router } = setup();
      localStorage.setItem('authToken', 'secret');
      window.dispatchEvent(
        new StorageEvent('storage', { key: null, newValue: null, storageArea: sessionStorage }),
      );
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(manager.state()).toBe('ACTIVE');
    });
  });

  // ------------------------------------------------------------------ Section 9
  describe('loading state when the session ends mid-load', () => {
    it('releases the blocking overlay instead of leaving it up forever', () => {
      // The screen this replaces: ten requests in flight, all 401, the overlay owned
      // by requests that will never return a body, and no way for the user to dismiss
      // it. The overlay renders from ReadinessService, so clearing it is what actually
      // takes the scrim down.
      const { manager } = setup();
      const readiness = TestBed.inject(ReadinessService);
      readiness.openSession('DASHBOARD');
      expect(readiness.isLoading()).withContext('overlay is up').toBe(true);

      manager.endSession('EXPIRED');

      expect(readiness.isLoading()).withContext('overlay released').toBe(false);
    });

    it('advances the readiness epoch so a straggler cannot score against the next session', () => {
      const { manager } = setup();
      const readiness = TestBed.inject(ReadinessService);
      const before = readiness.epoch();

      manager.endSession('EXPIRED');

      expect(readiness.epoch()).not.toBe(before);
    });

    it('drops in-flight request tracking so the progress bar does not follow the user out', () => {
      const { manager } = setup();
      const tracker = TestBed.inject(RequestTrackerService);
      tracker.begin('https://api.test/api/v1/funds/summary');

      manager.endSession('EXPIRED');

      expect(tracker.isLoading()).toBe(false);
    });
  });

  describe('re-entry after a session ends', () => {
    it('accepts a new session in the same tab once sign-in succeeds', () => {
      // The app is no longer torn down by a document reload on the way to login, so a
      // tab that ended a session keeps this service alive. Without markActive the
      // latch would silently swallow the NEXT session's authentication handling.
      const { manager } = setup();
      manager.endSession('EXPIRED');
      expect(manager.isTerminal()).toBe(true);

      manager.markActive();

      expect(manager.isTerminal()).toBe(false);
      expect(manager.state()).toBe('ACTIVE');
    });
  });

  describe('navigation failure', () => {
    it('falls back to a hard navigation rather than stranding the user', async () => {
      const { manager, router } = setup();
      const hard = spyOn(manager as any, 'hardNavigate');
      router.navigateByUrl.and.returnValue(Promise.reject(new Error('guard rejected')));

      manager.endSession('EXPIRED');
      await Promise.resolve();
      await Promise.resolve();

      expect(hard).toHaveBeenCalledWith('/user/login');
      expect(manager.state()).toBe('ENDED');
    });
  });
});
