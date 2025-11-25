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
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  showPan = false;
  isLoading = false;
  errorMessage = '';


  accountInfo$: any;
  accountConfigs$: any;
  otpEnabled$: any;
  loginResponse: any;
  isShowReCaptcha: any;
  accountInfo: any;
  returnUrl: any;
  public emailPattern= "/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/";
  multiUserRole: boolean;
  multiUserRoles: any;
  showPanNumber: boolean;
  loginViaOtpOnly: boolean;
  isShowAutocomplete: boolean;
  tncReqd: boolean;
  multiUserId: any;
  multiUserSubRole: any;
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
    this.loadConfig()
    this.loginForm = this.fb.group({
      email:  ['', [Validators.required]],
      password: ['', [Validators.required]],
      userRole: [''],
      pan:[]
    });
    this.loadInitialData(); // Call to load initial data
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  togglePanVisibility(): void {
    this.showPan = !this.showPan;
  }

  onLogin(form: any) {
    const user = new User();
    this.isLoading = true
    user.user_name = (form.value.email).trim();
    user.password = (form.value.password).trim();
    user.account_id = this.accountInfo?.account_guid; // Use optional chaining
    user.account_domain = environment.windowLocationHost;
    user.multiUserRole = this.multiUserRole;
    user.multiUserId = this.multiUserId;
    user.multiUserSubRole = this.multiUserSubRole;
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
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Account Disabled',
              detail: 'User account disabled. Please reset your password to login.',
              life: 5000
            });
          } else if (this.loginResponse.attempts) {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Incorrect Password',
              detail: 'Incorrect password. After 3 unsuccessful attempts, your account will be blocked.',
              life: 5000
            });
          } else if (this.loginResponse.maxWrongOTPAttempt) {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.loginResponse.message,
              life: 5000
            });
          } else if (this.loginResponse.errorMessage) {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Login Failed',
              detail: this.loginResponse.errorMessage,
              life: 5000
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
              this.isLoading = false;
              this.messageService.add({
                severity: 'warn',
                summary: 'Password Required',
                detail: 'Please set/reset the password to login.',
                life: 5000
              });
              this.router.navigate(['reset'], { state: { email: form.value.email } });
            }
            // }
          }

        },
        errResponse => {
          this.isLoading = false;
          console.error('Login error:', errResponse);

          switch (errResponse.status) {
            case 401:
              this.messageService.add({
                severity: 'error',
                summary: 'Authentication Failed',
                detail: 'Email and password do not match!',
                life: 5000
              });
              break;
            case 404:
              this.messageService.add({
                severity: 'error',
                summary: 'User Not Found',
                detail: errResponse.error?.message || 'User account not found!',
                life: 5000
              });
              break;
            default:
              this.messageService.add({
                severity: 'error',
                summary: 'Login Error',
                detail: errResponse.error?.message || 'An error occurred during login. Please try again.',
                life: 5000
              });
          }
        }
      );
  }

  userValidate(data:any) {
    this.isLoading = false;
    sessionStorage.setItem('activeSession', 'true');
    this.accountInfo = this.loginResponse.user.account;
    this.store.dispatch(setAccountInfo({ accountInfo: this.accountInfo }));
    if (this.loginResponse.user.user_role === 'SuperAdmin') {
      console.log('User login : ' + JSON.stringify(this.loginResponse.user));
      setTimeout(() => {
        window.location.href = '/superadmin';
      }, 500);
    } else {
       if (data.multi_user_role.length > 1 && data.multiUserId == 0) {
        this.multiUserRole = true;
        this.multiUserRoles = data.multi_user_role
        this.loginForm.get('userRole').addValidators(Validators.required)
      } else {
        this.loginForm.get('userRole').removeValidators(Validators.required)
        if (this.loginResponse.user.user_role === 'Investor' && this.loginResponse.is_taxId == 0) {
          this.showPanNumber = true;
          this.loginForm.get('pan').addValidators(Validators.required)
        } else {
          if (data && data.returnUrl) {
            setTimeout(() => {
              this.router.navigate([data.returnUrl], { queryParams: { returnUrl: this.returnUrl } });
            }, 500);
          } else {
            if (this.returnUrl) {
              setTimeout(() => {
                this.router.navigate([this.returnUrl]);
              }, 500);
            } else {
              // Optionally, store activeTabFundmanager in Redux or sessionStorage if needed
              this.store.dispatch(setAuthData({ userData: this.loginResponse.user, token: data.token }));
              localStorage.setItem('authToken', data.token);
              setTimeout(() => {
                 localStorage.setItem('userGuid',this.loginResponse.user.user_guid);
                localStorage.setItem('userRole',this.loginResponse.user.user_sub_role);
                this.messageService.add({
                  severity: 'success',
                  summary: 'Login Successful!',
                  detail: `Welcome back, ${this.loginResponse.user.display_name || 'User'}!`,
                  life: 3000
                });
                window.location.href = "/dashboard";
              }, 500);
            }
          }
        }
      }
     
    }
  }

  loadInitialData(): void {
    this.accountInfo$.pipe(take(1)).subscribe(accountInfo => {
      this.accountInfo = accountInfo;
    });

  }

    onRoleChange(event) {
    this.multiUserId = +event.value;

    var selectedRole: any = this.multiUserRoles.find((e: any) => (e.user_id === +event.value));
    this.multiUserSubRole = selectedRole.user_sub_role;
    if (selectedRole.user_sub_role === 'Investor Role') {
      this.showPanNumber = true;
      this.loginForm.get('pan').addValidators(Validators.required)
    } else {
      this.loginForm.get('pan').removeValidators(Validators.required)
      this.loginForm.patchValue({
        pan:null
      })
      this.showPanNumber = false;
    }
    setTimeout(() => {
      this.loginForm.get('pan').updateValueAndValidity()
    },100);
  }

    loadConfig() {
    if (this.accountInfo && this.accountInfo?.account_configs) {
      for (const config of this.accountInfo?.account_configs)
        if (config?.key === 'TNC_REQD') {
          this.tncReqd = +config?.value ? true : false;
        }
        else if (config?.key === 'AUTOCOMPLETE') {
          this.isShowAutocomplete = config?.value === 'Y' ? true : false
        } else if (config?.key === 'LOGIN_VIA_OTP_ONLY') {
          this.loginViaOtpOnly = config?.value === '1' ? true : false
        }
    }
  }

}
