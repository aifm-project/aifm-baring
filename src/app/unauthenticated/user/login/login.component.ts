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
  imports: [CommonModule, ReactiveFormsModule,ToastModule ],
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
     this.messageService.add({
              key: 'successSkKey',
              severity: 'error',
              sticky: true,
              summary: 'User account disabled. Please reset your password to login (note - reset password link is sent to your registered email post Reset Password request)',
              detail: ''
            });
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
   this.isLoading = false
    sessionStorage.setItem('activeSession', 'true');
  this.accountInfo = this.loginResponse.user.account;
  this.store.dispatch(setAccountInfo({ accountInfo: this.accountInfo }));
    if (this.loginResponse.user.user_role === 'SuperAdmin') {
      console.log('User login : ' + JSON.stringify(this.loginResponse.user));
      window.location.href = '/superadmin';
    } else {
       if (data.multi_user_role.length > 1 && data.multiUserId == 0) {
        this.multiUserRole = true;
        this.multiUserRoles = data.multi_user_role
        this.loginForm.get('userRole').addValidators(Validators.required)
      } else {
        this.loginForm.get('userRole').removeValidators(Validators.required)
        if (this.loginResponse.user.user_role === 'Investor' && this.loginResponse.is_taxId == 0) {
          this.showPanNumber = true;
        } else {
          if (data && data.returnUrl) {
            this.router.navigate([data.returnUrl], { queryParams: { returnUrl: this.returnUrl } });
          } else {
            if (this.returnUrl) {
              this.router.navigate([this.returnUrl]);
            } else {
              // Optionally, store activeTabFundmanager in Redux or sessionStorage if needed
              this.store.dispatch(setAuthData({ userData: this.loginResponse.user, token: data.token }));
              localStorage.setItem('authToken', data.token);
              window.location.href = "/dashboard";
            }
          }
        }
      }
      //  if (data && data.returnUrl) {
      //         this.router.navigate([data.returnUrl], { queryParams: { returnUrl: this.returnUrl } });
      //       } else {
      //         if (this.returnUrl) {
      //           this.router.navigate([this.returnUrl]);
      //         } else if (this.loginResponse.user.account.account_type === "distributor") {
      //           if (this.loginResponse.user.user_sub_role == "IT Admin Role") {
      //             this.router.navigate(['wealthadmin'])
      //           } else if (this.loginResponse.user.user_sub_role === "Investor Role") {
      //             // Optionally, store activeTabInvestor in Redux or sessionStorage if needed
      //             window.location.href = "/dashboard/investor";
      //           } else {
      //             // Optionally, store activeTabWealthDashboard in Redux or sessionStorage if needed
      //             window.location.href = "/dashboard/distributor";
      //           }
      //         } else if (this.loginResponse.user.user_sub_role === "Investor Role") {
      //           // Optionally, store activeTabInvestor in Redux or sessionStorage if needed
      //           window.location.href = "/dashboard/investor";
      //         } else if (this.loginResponse.user.user_role === "Distributor" &&
      //           this.loginResponse.user.user_sub_role == "Single Login Distributor Role") {
      //           // Optionally, store activeTabFundmanager in Redux or sessionStorage if needed
      //           window.location.href = "/dashboard/user/distributor";
      //         } else if (this.loginResponse.user.user_role === "AMC" &&
      //           this.loginResponse.user.user_sub_role == "IT Admin Role") {
      //           this.router.navigate(['admin'])
      //         } else {
      //           // Optionally, store activeTabFundmanager in Redux or sessionStorage if needed
      //           window.location.href = "/dashboard";
      //         }
      //       }
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
