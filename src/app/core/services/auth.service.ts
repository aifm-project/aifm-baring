import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Store } from '@ngrx/store';
import { setAccountInfo, setAccountConfigs } from '../../store/auth/auth.actions';
import { selectAuthState } from '../../store/auth/auth.selectors';
import { LoginResponse, User } from '../../model/models';
import { DomSanitizer } from '@angular/platform-browser';
import { SessionManager } from '../auth/session-manager.service';

export interface LoginCredentials {
  email: string;
  password: string;
  userRole: string;
}

@Injectable({
  providedIn: 'root',
  
})
export class AuthService {
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;
  accountInfo: any;
  userDetails: User;
  logedToken: string;

  constructor(
    private router: Router,
    public httpClient: HttpClient,
    private store: Store,
    private sanitizer: DomSanitizer,
    private sessionManager: SessionManager
  ) {
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  public login(user: User): Observable<LoginResponse> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    // Never log `user` — it carries the plaintext password and PAN.
    return this.httpClient.post<LoginResponse>(environment.serverEndPoint + "users/login", user, { headers: headers });
  }

   public loginWithOTP1(user: User): Observable<LoginResponse> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    // Never log `user` — it carries the plaintext password and PAN.
    return this.httpClient.post<LoginResponse>(environment.serverEndPoint + "users/otp/login", user, { headers: headers });
  }

  resedOTP(formData): Observable<LoginResponse> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    return this.httpClient.post<any>(environment.serverEndPoint + "users/resend/otp/login", formData, { headers: headers });
  }

  setOTP(formData): Observable<LoginResponse> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    return this.httpClient.post<any>(environment.serverEndPoint + "otp", formData, { headers: headers });
  }

  loginWithOTP(formData): Observable<any> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    return this.httpClient.post<any>(environment.serverEndPoint + "otp/login", formData, { headers: headers });
  }

  signupWithOTP(formData): Observable<any> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    return this.httpClient.post<any>(environment.serverEndPoint + "otp/signup", formData, { headers: headers });
  }
  
  /**
   * The user asked to leave (Scenario G).
   *
   * All the teardown that used to live here — clearing both storages, dispatching
   * clearAuthData, navigating — now lives in SessionManager, because it has to be
   * identical whether the user pressed Logout or their session expired, and because
   * it has to happen exactly once no matter how many callers ask for it. What is
   * NOT identical is the reason, and the reason is what decides whether the login
   * screen explains itself: someone who chose to sign out is not told their session
   * ended.
   *
   * Kept as a method (rather than deleted) because it is the API the navbar and any
   * future caller already know; it is now a one-line delegation.
   */
  logout(): void {
    this.isAuthenticatedSubject.next(false);
    this.sessionManager.signOut();
  }

  /** Called by the login screen once a new session is established. */
  markSessionActive(): void {
    this.isAuthenticatedSubject.next(true);
    this.sessionManager.markActive();
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    let hasAuth = false;
    this.store.select(selectAuthState).subscribe(authState => {
      hasAuth = !!(authState && authState.userData && authState.token);
      if(hasAuth){
        this.logedToken = authState.token
        this.userDetails = authState.userData
      }
    }).unsubscribe();
    return hasAuth;
  }

  getToken(): string | null {
  return this.logedToken;
  }

  getUserRole(): string | null {
  return null;
  }

  getUserEmail(): string | null {
  return null;
  }

  getAccountData(): Observable<any> {
    const domainName = environment.windowLocationHost;
    return this.httpClient.get<any>(
      environment.serverEndPoint + 'account?domain=' + domainName
    ).pipe(
      map(accountInfo => {
        // Only handle successful responses; errors are handled by the interceptor
        console.log('load before app start ', accountInfo);
        this.store.dispatch(setAccountInfo({ accountInfo }));
        if (Array.isArray(accountInfo.account_configs)) {
          const configMap = accountInfo.account_configs.reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
          if(configMap['ENCRYPT']){
            localStorage.setItem('ENCRYPT', configMap['ENCRYPT']);
          }
          this.store.dispatch(setAccountConfigs({ accountConfigs: configMap }));
        }
        return accountInfo;
      }),
      catchError(error => {
        // This runs inside provideAppInitializer. An unhandled error here rejects
        // bootstrapApplication, and the user gets a blank white document with no
        // markup and no way forward - the worst possible outcome for a tenant-config
        // lookup that the login screen can survive without. Fail soft: the app
        // renders, the login form uses its built-in defaults, and the failure is
        // visible to engineers in the console rather than to the user as a void.
        console.error('account: tenant configuration could not be loaded', error?.status ?? error);
        return of(null);
      })
    );
  }

  getUserPic():Observable<any>{
      let headers = new HttpHeaders({ "x-access-token": this.logedToken });
  let url = environment.serverEndPoint + "users/" + this.userDetails.user_guid + "/download";
    return this.httpClient
    .get(url, { responseType: "blob",headers })
    .pipe(map((val) => this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(val))));
  }
}
