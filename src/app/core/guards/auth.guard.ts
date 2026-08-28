import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, CanActivate } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAuthState } from '../../store/auth';
import { SessionManager } from '../auth/session-manager.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly sessionManager = inject(SessionManager);

  constructor(private router: Router, private store: Store) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.store.select(selectAuthState).pipe(
      map(authState => {
        const isAuthenticated = !!(authState && authState.userData);
        if (isAuthenticated) return true;

        // Deep link into a protected screen without a session - a bookmark, a link
        // from an email, or a reload after the session ended. Remember where they
        // were trying to go so signing in finishes the journey instead of dumping
        // them on the default landing page. The URL is validated inside
        // captureReturnUrl before it is stored, and again before it is used.
        this.sessionManager.captureReturnUrl(state.url);
        return this.router.createUrlTree(['/user/login']);
      })
    );
  }
}
