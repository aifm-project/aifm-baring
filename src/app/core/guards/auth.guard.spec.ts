import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { SessionManager } from '../auth/session-manager.service';
import { AuthGuard } from './auth.guard';

function stateFor(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('AuthGuard', () => {
  function configure(userData: unknown): AuthGuard {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          initialState: { authState: { userData, token: 't', accountInfo: null, accountConfigs: null } },
        }),
        {
          provide: Router,
          useValue: { createUrlTree: () => ({}) as UrlTree, url: url => url, navigateByUrl: () => Promise.resolve(true) },
        },
        {
          provide: SessionManager,
          useValue: { captureReturnUrl: jasmine.createSpy('captureReturnUrl') },
        },
      ],
    });
    return TestBed.inject(AuthGuard);
  }

  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('lets a signed-in user through and captures nothing', done => {
    const guard = configure({ user_guid: 'u-1' });
    const manager = TestBed.inject(SessionManager) as any;

    guard.canActivate({} as ActivatedRouteSnapshot, stateFor('/portfolio')).subscribe(result => {
      expect(result).toBe(true);
      expect(manager.captureReturnUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('remembers the destination when it turns a deep link away', done => {
    // The bookmark case: someone opens /portfolio from an email after their session
    // has gone. Without this they sign in and land on the default page, having lost
    // the thing they clicked.
    const guard = configure(null);
    const manager = TestBed.inject(SessionManager) as any;

    guard.canActivate({} as ActivatedRouteSnapshot, stateFor('/portfolio')).subscribe(() => {
      expect(manager.captureReturnUrl).toHaveBeenCalledWith('/portfolio');
      done();
    });
  });

  it('sends an unauthenticated visitor to the login screen', done => {
    const guard = configure(null);
    guard.canActivate({} as ActivatedRouteSnapshot, stateFor('/dashboard')).subscribe(result => {
      expect(result).not.toBe(true);
      done();
    });
  });
});
