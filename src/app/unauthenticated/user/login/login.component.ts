import { take } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '@ngrx/store';
import { selectAccountInfo, selectAccountConfigs, selectAccountConfigValue } from '../../../store/auth/auth.selectors';
import { User } from '../../../model/models';
import { environment } from '../../../../environments/environment';
import { setAccountInfo } from '../../../store/auth';
import { setAuthData } from '../../../store/auth/auth.actions';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';


  accountInfo$: any;
  accountConfigs$: any;
  otpEnabled$: any;
  loginResponse: any;
  isShowReCaptcha: any;
  accountInfo: any;
  returnUrl: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store,
    private authService: AuthService,
    public messageService: MessageService,
  ) {
    this.accountInfo$ = this.store.select(selectAccountInfo);
    this.accountConfigs$ = this.store.select(selectAccountConfigs);
    this.otpEnabled$ = this.store.select(selectAccountConfigValue('ENABLE_OTP'));
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      userRole: ['', [Validators.required]],
    });
    this.loadInitialData(); // Call to load initial data
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(form: any) {
    const user = new User();
    user.user_name = (form.value.email).trim();
    user.password = (form.value.password).trim();
  user.account_id = this.accountInfo?.account_guid; // Use optional chaining
    user.account_domain = environment.windowLocationHost;
    user.tax_id = form.value.pan;
    console.log('user123: ' + JSON.stringify(user));
    this.authService.login(user).subscribe(
      data => {
        this.loginResponse = data;
        console.log(data);
        if (this.loginResponse.returnUrl && this.loginResponse.user && this.loginResponse.user.otp) {
          this.accountInfo = this.loginResponse.user.account;
          this.store.dispatch(setAccountInfo({ accountInfo: this.accountInfo }));
          this.store.dispatch(setAuthData({ userData: this.loginResponse.user, token: data.token }));
          setTimeout(() => {
            window.location.href = this.loginResponse.returnUrl;
          }, 100);
        }
          else if (this.loginResponse.maximumAttempt) {
            this.messageService.clear();
            this.messageService.add({
              key: 'errorKey',
              severity: 'error',
              sticky: true,
              summary: 'User account disabled. Please reset your password to login (note - reset password link is sent to your registered email post Reset Password request)',
              detail: ''
            });
          } else if (this.loginResponse.attempts) {
            this.messageService.clear();
            this.messageService.add({
              key: 'errorKey',
              severity: 'error',
              sticky: true,
              summary: 'Incorrect password. After 3 unsuccessfull attempts, your account will be blocked',
              detail: ''
            });
          } else if (this.loginResponse.maxWrongOTPAttempt) {
            this.messageService.clear();
            this.messageService.add({
              key: 'errorKey',
              severity: 'error',
              sticky: true,
              summary: this.loginResponse.message,
              detail: ''
            });
          } else if (this.loginResponse.errorMessage) {
            this.messageService.clear();
            this.messageService.add({
              key: 'errorKey',
              severity: 'error',
              sticky: true,
              summary: this.loginResponse.errorMessage,
              detail: ''
            });
          } else {
            // if (this.loginResponse.user) {
            if (!this.loginResponse.isPasswordEmty) {
              this.userValidate(data)
              // let isMobile = this.util.isMobile
              // if(isMobile.link && isMobile.isMobile){
              //   setTimeout(function () {
              //     window.location.href = isMobile.link
              //   }, 25);
              // }else if((['Investor Role','Prospective Investor Role'].includes(this.loginResponse.user.user_sub_role) && isMobile.isMobile) || !isMobile.isMobile) {
              //   this.userValidate(data)
              // }else {
              //   this.appNotFoundmessages = 'The mobile App for this account has not been enabled, please use your laptop to complete the request.'
              // }

            } else {
              this.messageService.clear();
              this.messageService.add({
                key: 'errorKey',
                severity: 'error',
                sticky: true,
                summary: 'Please set/reset the password to login',
                detail: ''
              });
              this.router.navigate(['reset'], { state: { email: form.value.email } });
            }
            // }
          }

        },
        errResponse => {
  
          switch (errResponse.status) {
            case 401:
              this.messageService.clear();
              this.messageService.add({
                key: 'errorKey',
                severity: 'error',
                sticky: true,
                summary: 'Email and password not matched!',
                detail: ''
              });
              break;
            case 404:
              console.log(JSON.stringify(errResponse));
              this.messageService.clear();
              this.messageService.add({
                key: 'errorKey',
                severity: 'error',
                sticky: true,
                summary: errResponse.error.message,
                detail: ''
              });
              break;
            default:
              if (errResponse.error != null) {
                console.log(JSON.stringify(errResponse));
              }
          }
        }
      );
  }

  userValidate(data:any) {
   
    sessionStorage.setItem('activeSession', 'true');
  this.accountInfo = this.loginResponse.user.account;
  this.store.dispatch(setAccountInfo({ accountInfo: this.accountInfo }));
  this.store.dispatch(setAuthData({ userData: this.loginResponse.user, token: data.token }));
  localStorage.setItem('authToken', data.token);
    if (this.loginResponse.user.user_role === 'AMC' || this.loginResponse.user.user_role === 'Distributor') {
      // this.localStorageService.setJsonValue('isGuest', true);
    } else {
      // this.localStorageService.setJsonValue('isGuest', false);
    }
    if (this.loginResponse.user.user_role === 'SuperAdmin') {
      console.log('User login : ' + JSON.stringify(this.loginResponse.user));
      window.location.href = '/superadmin';
    } else {
       if (data && data.returnUrl) {
              this.router.navigate([data.returnUrl], { queryParams: { returnUrl: this.returnUrl } });
            } else {
              if (this.returnUrl) {
                this.router.navigate([this.returnUrl]);
              } else if (this.loginResponse.user.account.account_type === "distributor") {
                if (this.loginResponse.user.user_sub_role == "IT Admin Role") {
                  this.router.navigate(['wealthadmin'])
                } else if (this.loginResponse.user.user_sub_role === "Investor Role") {
                  // Optionally, store activeTabInvestor in Redux or sessionStorage if needed
                  window.location.href = "/dashboard/investor";
                } else {
                  // Optionally, store activeTabWealthDashboard in Redux or sessionStorage if needed
                  window.location.href = "/dashboard/distributor";
                }
              } else if (this.loginResponse.user.user_sub_role === "Investor Role") {
                // Optionally, store activeTabInvestor in Redux or sessionStorage if needed
                window.location.href = "/dashboard/investor";
              } else if (this.loginResponse.user.user_role === "Distributor" &&
                this.loginResponse.user.user_sub_role == "Single Login Distributor Role") {
                // Optionally, store activeTabFundmanager in Redux or sessionStorage if needed
                window.location.href = "/dashboard/user/distributor";
              } else if (this.loginResponse.user.user_role === "AMC" &&
                this.loginResponse.user.user_sub_role == "IT Admin Role") {
                this.router.navigate(['admin'])
              } else {
                // Optionally, store activeTabFundmanager in Redux or sessionStorage if needed
                window.location.href = "/dashboard";
              }
            }
    }
  }

  loadInitialData(): void {
    this.accountInfo$.pipe(take(1)).subscribe(accountInfo => {
      this.accountInfo = accountInfo;
    });

  }

}
