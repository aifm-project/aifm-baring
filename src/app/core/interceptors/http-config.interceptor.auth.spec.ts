import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { SessionManager } from '../auth/session-manager.service';
import { SESSION_NOTICE_KEY, SESSION_REFRESH, SessionRefreshConfig } from '../auth/session.model';
import { environment } from '../../../environments/environment';
import { httpConfigInterceptor } from './http-config.interceptor';

const API = environment.serverEndPoint;
const REFRESH_ENDPOINT = API + 'session/renew';

/**
 * End-to-end through the real interceptor, because the interesting failures live in
 * the wiring rather than in either piece alone: which URLs count as pre-auth, whether
 * a 403 is mistaken for a 401, and whether an error still reaches the caller after the
 * session machinery has had its say.
 */
describe('httpConfigInterceptor: authentication handling', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: { url: string; navigateByUrl: jasmine.Spy };
  let manager: SessionManager;

  function configure(refresh?: Partial<SessionRefreshConfig>): void {
    router = {
      url: '/dashboard',
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpConfigInterceptor])),
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

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    manager = TestBed.inject(SessionManager);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    configure();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('protected routes', () => {
    it('ends the session once for a wave of parallel 401s', () => {
      const urls = [
        API + 'funds/summary',
        API + 'funds/abc/performance',
        API + 'funds/abc/portfolio',
        API + 'funds/abc/dates',
        API + 'documents',
      ];
      urls.forEach(url => http.get(url).subscribe({ next: () => {}, error: () => {} }));

      urls.forEach(url =>
        backend.expectOne(url).flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' }),
      );

      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      backend.verify();
    });

    it('does not surface an error to the caller once the session is ending', () => {
      // Five components each showing their own failure state on the way out is the
      // cascade this design exists to prevent.
      const errors: unknown[] = [];
      const completions: number[] = [];
      for (let i = 0; i < 3; i++) {
        http.get(API + 'thing/' + i).subscribe({
          next: () => {},
          error: e => errors.push(e),
          complete: () => completions.push(i),
        });
      }
      for (let i = 0; i < 3; i++) {
        backend.expectOne(API + 'thing/' + i).flush(null, { status: 401, statusText: 'Unauthorized' });
      }

      expect(errors.length).toBe(0);
      expect(completions.length).withContext('all three terminate, none hang').toBe(3);
    });

    it('records an explanation for the login screen', () => {
      http.get(API + 'funds/summary').subscribe({ next: () => {}, error: () => {} });
      backend.expectOne(API + 'funds/summary').flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(sessionStorage.getItem(SESSION_NOTICE_KEY)).not.toBeNull();
    });

    it('handles 419 the same way a session-expiry filter would intend', () => {
      http.get(API + 'funds/summary').subscribe({ next: () => {}, error: () => {} });
      backend.expectOne(API + 'funds/summary').flush(null, { status: 419, statusText: 'Session Expired' });

      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('pre-auth routes (Scenario E)', () => {
    const preAuthUrls = [
      API + 'users/login',
      API + 'users/otp/login',
      API + 'users/resend/otp/login',
      API + 'otp/login',
      API + 'otp/signup',
      API + 'otp',
      API + 'account?domain=bpepindia.aifmetrics.com',
    ];

    preAuthUrls.forEach(url => {
      it(`leaves a 401 from ${url.replace(API, '')} to the login screen`, () => {
        let received: any = null;
        http.get(url).subscribe({ next: () => {}, error: e => (received = e) });
        backend
          .expectOne(url)
          .flush({ message: 'bad credentials' }, { status: 401, statusText: 'Unauthorized' });

        // The caller MUST still get the error - it is what renders "the email or
        // password you entered is incorrect".
        expect(received?.status).toBe(401);
        expect(router.navigateByUrl).withContext('no session teardown').not.toHaveBeenCalled();
        expect(sessionStorage.getItem(SESSION_NOTICE_KEY)).withContext('no expiry story').toBeNull();
        expect(manager.state()).toBe('ACTIVE');
      });
    });

    it('does not treat an unrelated URL as pre-auth just because it contains "otp"', () => {
      // The segment matcher exists for exactly this: a substring test on "otp" would
      // quietly exempt real endpoints from session handling.
      const url = API + 'funds/otpfund/performance';
      http.get(url).subscribe({ next: () => {}, error: () => {} });
      backend.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('failures that are not authentication failures', () => {
    const cases: ReadonlyArray<readonly [string, number]> = [
      ['offline or blocked by CORS', 0],
      ['bad request', 400],
      ['not found', 404],
      ['server error', 500],
      ['bad gateway', 502],
      ['service unavailable', 503],
      ['gateway timeout', 504],
    ];

    cases.forEach(([label, status]) => {
      it(`does not sign the user out on ${label} (${status})`, () => {
        let received: any = null;
        const url = API + 'funds/summary';
        http.get(url).subscribe({ next: () => {}, error: e => (received = e) });
        backend.expectOne(url).flush(null, { status, statusText: label });

        expect(received?.status).toBe(status);
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        expect(manager.state()).toBe('ACTIVE');
      });
    });
  });

  describe('403 (Scenario J)', () => {
    it('explains the refusal, keeps the session, and still reports the error', () => {
      let received: any = null;
      const url = API + 'funds/abc/portfolio';
      http.get(url).subscribe({ next: () => {}, error: e => (received = e) });
      backend.expectOne(url).flush(null, { status: 403, statusText: 'Forbidden' });

      expect(manager.accessNotice()?.heading).toBe('Access unavailable');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(received?.status).withContext('caller can still render its own state').toBe(403);
    });

    it('shows one notice for a page full of refusals', () => {
      for (let i = 0; i < 4; i++) {
        http.get(API + 'widget/' + i).subscribe({ next: () => {}, error: () => {} });
      }
      for (let i = 0; i < 4; i++) {
        backend.expectOne(API + 'widget/' + i).flush(null, { status: 403, statusText: 'Forbidden' });
      }
      expect(manager.accessNotice()).not.toBeNull();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('with silent refresh enabled', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      configure({ enabled: true });
      localStorage.setItem('authToken', 'stale-token');
    });

    it('renews once and replays every queued request with the new token', () => {
      const results: unknown[] = [];
      const urls = [API + 'a', API + 'b', API + 'c'];
      urls.forEach(url => http.get(url).subscribe({ next: v => results.push(v), error: () => {} }));
      urls.forEach(url =>
        backend.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' }),
      );

      backend.expectOne(REFRESH_ENDPOINT).flush({ token: 'fresh-token' });

      // Each original request is replayed exactly once, carrying the renewed token.
      urls.forEach(url => {
        const replay = backend.expectOne(url);
        expect(replay.request.headers.get('x-access-token')).toBe('fresh-token');
        replay.flush({ ok: true });
      });

      expect(results.length).toBe(3);
      expect(router.navigateByUrl).withContext('invisible to the user').not.toHaveBeenCalled();
      backend.verify();
    });

    it('ends the session if the replayed request is rejected again', () => {
      // One retry, then stop. Without this the pair (renew, replay) could ping-pong.
      http.get(API + 'a').subscribe({ next: () => {}, error: () => {} });
      backend.expectOne(API + 'a').flush(null, { status: 401, statusText: 'Unauthorized' });
      backend.expectOne(REFRESH_ENDPOINT).flush({ token: 'fresh-token' });
      backend.expectOne(API + 'a').flush(null, { status: 401, statusText: 'Unauthorized' });

      backend.expectNone(REFRESH_ENDPOINT);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      backend.verify();
    });

    it('never renews in response to the renewal call being rejected', () => {
      http.get(API + 'a').subscribe({ next: () => {}, error: () => {} });
      backend.expectOne(API + 'a').flush(null, { status: 401, statusText: 'Unauthorized' });

      backend.expectOne(REFRESH_ENDPOINT).flush(null, { status: 401, statusText: 'Unauthorized' });

      // The recursion test: exactly one renewal was ever issued.
      backend.expectNone(REFRESH_ENDPOINT);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      backend.verify();
    });
  });
});
