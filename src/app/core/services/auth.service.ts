import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoginCredentials {
  email: string;
  password: string;
  userRole: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {}

  login(credentials: LoginCredentials): Observable<boolean> {
    return new Observable((observer) => {
      // TODO: Replace with actual API call
      // Simulating API call
      setTimeout(() => {
        // Mock successful login
        const mockToken = 'mock-jwt-token-' + Date.now();
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('user_email', credentials.email);
        localStorage.setItem('user_role', credentials.userRole);

        this.isAuthenticatedSubject.next(true);
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/user/login']);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }
}
