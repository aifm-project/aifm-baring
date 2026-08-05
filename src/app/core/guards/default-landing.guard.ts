import { Injectable } from '@angular/core';
import { Router, UrlTree, CanActivate } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAuthState } from '../../store/auth';

@Injectable({
  providedIn: 'root',
})
export class DefaultLandingGuard implements CanActivate {
  constructor(private router: Router, private store: Store) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(selectAuthState).pipe(
      map(authState => {
        const isInvestor = authState?.userData?.user_role === 'Investor';
        return this.router.createUrlTree([isInvestor ? '/documents' : '/dashboard']);
      })
    );
  }
}
