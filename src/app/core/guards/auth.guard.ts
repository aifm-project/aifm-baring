import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // TODO: Implement actual authentication check
    const isAuthenticated = this.checkAuthentication();

    if (!isAuthenticated) {
      return this.router.createUrlTree(['/user/login']);
    }

    return true;
  }

  private checkAuthentication(): boolean {
    // TODO: Replace with actual authentication logic
    // For now, check if token exists in localStorage
    return !!localStorage.getItem('auth_token');
  }
}
