import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Store } from '@ngrx/store';
import { clearAuthData } from '../../store/auth/auth.actions';
import { setAccountInfo, setAccountConfigs } from '../../store/auth/auth.actions';
import { selectAuthState } from '../../store/auth/auth.selectors';
import { LoginResponse, User } from '../../model/models';
import { DomSanitizer } from '@angular/platform-browser';

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
    private sanitizer: DomSanitizer
  ) {
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  public login(user: User): Observable<LoginResponse> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    console.log("Calling endpoint: " + environment.serverEndPoint + "users/login" + JSON.stringify(user));
    return this.httpClient.post<LoginResponse>(environment.serverEndPoint + "users/login", user, { headers: headers });
  }

   public loginWithOTP1(user: User): Observable<LoginResponse> {
    let headers = new HttpHeaders({ "enable-encryption": "true" });
    console.log("Calling endpoint: " + environment.serverEndPoint + "users/otp/login" + JSON.stringify(user));
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
  
  logout(): void {
  this.isAuthenticatedSubject.next(false);
    this.store.dispatch(clearAuthData());
      window.location.href = "/user/login";
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
