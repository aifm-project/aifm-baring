import { take } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '@ngrx/store';
import {
  selectAccountInfo,
  selectAccountConfigs,
  selectAccountConfigValue,
} from '../../../store/auth/auth.selectors';
import { User } from '../../../model/models';
import { environment } from '../../../../environments/environment';
import { setAccountInfo } from '../../../store/auth';
import { setAuthData } from '../../../store/auth/auth.actions';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CustomValidators } from '../../../core/validators/custom-validators';
import { NgOtpInputComponent } from 'ng-otp-input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, NgOtpInputComponent ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  showPassword = false;
  showPan = false;
  isLoading = false;
  errorMessage = '';

  // OTP-related properties
  otpEnabled = false;
  showOtpScreen = false;
  otpExpire = 30;
  otpMaxCount = 5;
  otpSendCount = 0;
  hideResendOTP = false;
  isOtpLoading = false;
  userInfoForOtp: User | null = null;
  countdownSub: Subscription | null = null;
  accountInfo$: any;
  accountConfigs$: any;
  otpEnabled$: any;
  loginResponse: any;
  isShowReCaptcha: any;
  accountInfo: any;
  returnUrl: any;
  public emailPattern =
    "/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/";
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
    this.loadInitialData(); // Call to load initial data
    this.loadOtpConfig(); // Load OTP configuration
    // Redirect if already logged in
    //  this.showOtpScreen = true;
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    console.log('login via OTP', this.loginViaOtpOnly);
    this.loginForm = this.fb.group({
      // Email or Username validator: accepts either valid email or alphanumeric username
      email: [
        '',
        [
          Validators.required,
          CustomValidators.emailOrUsername(),
          CustomValidators.noSpacesValidator(),
        ],
      ],
      password: ['', this.loginViaOtpOnly ? [] : [Validators.required]],
      otpControl: [''],
      userRole: [''],
      // PAN validator: AAAAA0000A format (5 letters, 4 digits, 1 letter)
      pan: ['', [CustomValidators.panValidator()]],
    });
  }

  /**
   * Get the OTP form control with proper typing
   * This is used in the template to avoid type casting issues
   */
  get otpControl(): FormControl | null {
    return this.loginForm?.get('otpControl') as FormControl | null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  togglePanVisibility(): void {
    this.showPan = !this.showPan;
  }

  onLogin(form: any) {
    // If OTP screen is active, verify OTP instead of doing initial login

    const user = new User();
    this.isLoading = true;
    user.user_name = form.value.email.trim();
    user.password = this.loginViaOtpOnly ? '' : form.value.password.trim();
    user.account_id = this.accountInfo?.account_guid; // Use optional chaining
    user.account_domain = environment.windowLocationHost;
    user.multiUserRole = this.multiUserRole;
    user.multiUserId = this.multiUserId;
    user.multiUserSubRole = this.multiUserSubRole;
    user.tax_id = form.value.pan;
    user['isOtpLogin'] = this.loginViaOtpOnly;
    console.log('user123: ' + JSON.stringify(user));
    if (this.showOtpScreen) {
      this.loginWithOTP();
      return;
    }
    if (this.loginViaOtpOnly) {
      this.otpBasedLogin(user);
      return;
    }
    this.authService.login(user).subscribe(
      (data) => {
        this.loginResponse = data;
        this.isLoading = false;
        console.log(data);
       if (this.loginResponse.maximumAttempt) {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Account Disabled',
            detail: 'User account disabled. Please reset your password to login.',
            life: 5000,
          });
        } else if (this.loginResponse.attempts) {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Incorrect Password',
            detail:
              'Incorrect password. After 3 unsuccessful attempts, your account will be blocked.',
            life: 5000,
          });
        } else if (this.loginResponse.maxWrongOTPAttempt) {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.loginResponse.message,
            life: 5000,
          });
        } else if (this.loginResponse.errorMessage) {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: this.loginResponse.errorMessage,
            life: 5000,
          });
        } else {
          // if (this.loginResponse.user) {
          if (!this.loginResponse.isPasswordEmty) {
            this.userValidate(data);
          } else {
            this.isLoading = false;
            this.messageService.add({
              severity: 'warn',
              summary: 'Password Required',
              detail: 'Please set/reset the password to login.',
              life: 5000,
            });
            this.router.navigate(['reset'], { state: { email: form.value.email } });
          }
          // }
        }
      },
      (errResponse) => {
        this.isLoading = false;
        console.error('Login error:', errResponse);

        switch (errResponse.status) {
          case 401:
            this.messageService.add({
              severity: 'error',
              summary: 'Authentication Failed',
              detail: 'Email and password do not match!',
              life: 5000,
            });
            break;
          case 404:
            this.messageService.add({
              severity: 'error',
              summary: 'User Not Found',
              detail: errResponse.error?.message || 'User account not found!',
              life: 5000,
            });
            break;
          default:
            this.messageService.add({
              severity: 'error',
              summary: 'Login Error',
              detail:
                errResponse.error?.message || 'An error occurred during login. Please try again.',
              life: 5000,
            });
        }
      },
    );
  }

    userValidate(data:any) {
     localStorage.removeItem('fundInvestorToken');
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
       if (data.multi_user_role && data.multi_user_role.length > 1 && data.multiUserId == 0) {
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
    this.accountInfo$.pipe(take(1)).subscribe((accountInfo) => {
      this.accountInfo = accountInfo;
      this.loadConfig();
    });
  }

  onRoleChange(event: any): void {
    this.multiUserId = +event.value;

    const selectedRole: any = this.multiUserRoles.find((e: any) => e.user_id === +event.value);
    this.multiUserSubRole = selectedRole.user_sub_role;

    const panControl = this.loginForm.get('pan');

    if (selectedRole.user_sub_role === 'Investor Role') {
      this.showPanNumber = true;
      // Add PAN validators: required + format validation
      panControl?.addValidators([Validators.required, CustomValidators.panValidator()]);
    } else {
      // Remove all validators and clear value
      panControl?.removeValidators([Validators.required, CustomValidators.panValidator()]);
      this.loginForm.patchValue({
        pan: null,
      });
      this.showPanNumber = false;
    }

    // Update validity after changing validators
    setTimeout(() => {
      panControl?.updateValueAndValidity();
    }, 100);
  }

  loadConfig() {
    if (this.accountInfo && this.accountInfo?.account_configs) {
      for (const config of this.accountInfo?.account_configs)
        if (config?.key === 'TNC_REQD') {
          this.tncReqd = +config?.value ? true : false;
        } else if (config?.key === 'AUTOCOMPLETE') {
          this.isShowAutocomplete = config?.value === 'Y' ? true : false;
        } else if (config?.key === 'LOGIN_VIA_OTP_ONLY') {
          this.loginViaOtpOnly = config?.value === '1' ? true : false;
          console.log('LOGIN_VIA_OTP_ONLY', this.loginViaOtpOnly);
        }
    }
  }

  loadOtpConfig(): void {
    if (this.accountInfo && this.accountInfo?.account_configs) {
      for (const config of this.accountInfo?.account_configs) {
        if (config?.key === 'ENABLE_OTP') {
          this.otpEnabled = config?.value === '1' ? true : false;
        } else if (config?.key === 'OTP_EXPIRES') {
          this.otpExpire = parseInt(config?.value) || 30;
        } else if (config?.key === 'OTP_MAX_COUNT') {
          this.otpMaxCount = parseInt(config?.value) || 5;
        }
      }
    }
  }

  getAccountConfigValue(key: string): string {
    if (this.accountInfo && this.accountInfo?.account_configs) {
      const config = this.accountInfo.account_configs.find((c: any) => c.key === key);
      return config?.value || '';
    }
    return '';
  }

  /**
   * Submit OTP for verification
   * Sends OTP to backend and verifies it
   */
  loginWithOTP(): void {
    
    this.isOtpLoading = true;
    const user = new User();
    user.user_name = this.loginResponse.user.email.trim();
    user.account_id = this.accountInfo?.account_guid;
    user.account_domain = environment.windowLocationHost;
    user.user_id = this.loginResponse.user.user_guid;
    user.otp = this.loginForm.get('otpControl')?.value;

    this.authService.loginWithOTP1(user).subscribe(
      (data) => {
        this.isOtpLoading = false;
        this.isLoading = false
        let loginResponse = data
        if(data && data.user && data.token){
          this.loginResponse = data
        }
        // Handle OTP verification errors
        if (loginResponse.maximumAttempt) {
          this.messageService.add({
            severity: 'error',
            summary: 'Account Disabled',
            detail: 'User account disabled. Please reset your password to login.',
            life: 5000,
          });
        } else if (loginResponse.maxWrongOTPAttempt) {
          this.messageService.add({
            severity: 'error',
            summary: 'Too Many Attempts',
            detail:
              loginResponse.message ||
              'Maximum OTP attempts exceeded. Please try again later.',
            life: 5000,
          });
        } else if (loginResponse.wrongOTPAttempts > 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid OTP',
            detail:
              loginResponse.errormessage ||
              `Incorrect OTP. ${loginResponse.wrongOTPAttempts} attempts remaining.`,
            life: 5000,
          });
        } else if (loginResponse.isOtpExpired) {
          this.hideResendOTP = true;
          this.messageService.add({
            severity: 'error',
            summary: 'OTP Expired',
            detail:
              loginResponse.errormessage || 'Your OTP has expired. Please request a new one.',
            life: 5000,
          });
        } else if (loginResponse.user && !loginResponse.isPasswordEmty) {
          // OTP verified successfully
          this.messageService.add({
            severity: 'success',
            summary: 'OTP Verified',
            detail: 'Your OTP has been verified successfully.',
            life: 3000,
          });
          this.userValidate(this.loginResponse);
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Password Required',
            detail: 'Please set/reset your password to login.',
            life: 5000,
          });
        }
      },
      (errResponse) => {
        this.isOtpLoading = false;
        console.error('OTP verification error:', errResponse);

        switch (errResponse.status) {
          case 401:
            this.messageService.add({
              severity: 'error',
              summary: 'Authentication Failed',
              detail: 'OTP verification failed. Please try again.',
              life: 5000,
            });
            break;
          case 404:
            this.messageService.add({
              severity: 'error',
              summary: 'Not Found',
              detail: errResponse.error?.message || 'User not found.',
              life: 5000,
            });
            break;
          default:
            this.messageService.add({
              severity: 'error',
              summary: 'OTP Error',
              detail: errResponse.error?.message || 'An error occurred during OTP verification.',
              life: 5000,
            });
        }
      },
    );
  }
  otpBasedLogin(user): void {
    if (this.loginViaOtpOnly) {
      this.authService.loginWithOTP1(user).subscribe(
        (data) => {
          this.isLoading = false
          this.loginResponse = data;
          if (
            (this.loginViaOtpOnly) &&
            this.loginResponse.returnUrl
          ) {
            this.accountInfo = this.loginResponse.user.account;
            this.showOtpScreen = true
            this.isOtpLoading =false
            this.loginForm.get('otpControl')?.setValidators([Validators.required]);
            this.loginForm.get('otpControl')?.updateValueAndValidity();
            this.startCountdown()
          } else if (this.loginResponse.maximumAttempt) {
            this.messageService.clear();
            this.messageService.add({
              severity: 'error',
              sticky: true,
              summary:
                'User account disabled. Please reset your password to login (note - reset password link is sent to your registered email post Reset Password request)',
              detail: '',
            });
          } else if (this.loginResponse.attempts) {
            this.messageService.clear();
            this.messageService.add({
              severity: 'error',
              sticky: true,
              summary:
                'Incorrect password. After 3 unsuccessfull attempts, your account will be blocked',
              detail: '',
            });
          } else if (this.loginResponse.maxWrongOTPAttempt) {
            this.messageService.clear();
            this.messageService.add({
              severity: 'error',
              sticky: true,
              summary: this.loginResponse.message,
              detail: '',
            });
          } else if (this.loginResponse.wrongOTPAttempts > 0) {
            this.messageService.clear();
            this.messageService.add({
              severity: 'error',
              sticky: true,
              summary: this.loginResponse.errormessage,
              detail: '',
            });
          } else {
            if (this.loginResponse.user) {
              if (!this.loginResponse.isPasswordEmty) {
                this.userValidate(data);
              } else {
                this.messageService.clear();
                this.messageService.add({
                  severity: 'error',
                  sticky: true,
                  summary: 'Please set/reset the password to login',
                  detail: '',
                });
              }
            }
          }
        },
        (errResponse) => {
           this.isLoading = false
          switch (errResponse.status) {
            case 401:
              this.messageService.clear();
              this.messageService.add({
                severity: 'error',
                sticky: true,
                summary: 'Email and password not matched!',
                detail: '',
              });
              break;
            case 404:
              console.log(JSON.stringify(errResponse));
              this.messageService.clear();
              this.messageService.add({
                severity: 'error',
                sticky: true,
                summary: errResponse.error.message,
                detail: '',
              });
              break;
            default:
              if (errResponse.error != null) {
                console.log(JSON.stringify(errResponse));
              }
          }
        },
      );
    }
  }
  reSendOTP(): void {
    if (!this.loginResponse || !this.accountInfo) {
      return;
    }

    this.isOtpLoading = true;
    const otpData = {
      account_id: this.accountInfo.account_guid,
      user_id: this.loginResponse.user.user_guid,
      email: this.loginResponse.user.email,
      account_domain: environment.windowLocationHost,
    };

    this.authService.setOTP(otpData).subscribe(
      (data) => {
        this.isOtpLoading = false;

        if (data.user) {
          this.otpSendCount = data.user.otp_send_count || 0;
          this.loginResponse = data;

          // Check if max resend count reached
          if (this.otpSendCount >= this.otpMaxCount) {
            this.hideResendOTP = true;
            this.messageService.add({
              severity: 'warn',
              summary: 'Resend Limit',
              detail: 'Maximum OTP resend limit reached. Please try again later.',
              life: 5000,
            });
          } else {
            // Reset OTP input field in the form
            this.loginForm.get('otpControl')?.reset();

            // Restart countdown timer
            this.otpExpire = parseInt(this.getAccountConfigValue('OTP_EXPIRES')) || 30;
            this.startCountdown();

            this.messageService.add({
              severity: 'success',
              summary: 'OTP Resent',
              detail: data.message || 'A new OTP has been sent to your registered email.',
              life: 5000,
            });
          }
        } else if (data.errormessage) {
          this.messageService.add({
            severity: 'error',
            summary: 'Resend Failed',
            detail: data.errormessage,
            life: 5000,
          });
        }
      },
      (errResponse) => {
        this.isOtpLoading = false;
        console.error('OTP resend error:', errResponse);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errResponse.error?.message || 'Failed to resend OTP. Please try again.',
          life: 5000,
        });
      },
    );
  }

  /**
   * Start countdown timer for OTP expiration
   * Counts down from otpExpire to 0
   */
  startCountdown(): void {
    // Clear any existing subscription
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }

    const countdownInterval$ = interval(1000).pipe(take(this.otpExpire + 1));

    this.countdownSub = countdownInterval$.subscribe(() => {
      if (this.otpExpire > 0) {
        this.otpExpire--;
      } else {
        // OTP expired - disable resend if max attempts reached
        if (this.otpSendCount >= this.otpMaxCount) {
          this.hideResendOTP = true;
        }
        if (this.countdownSub) {
          this.countdownSub.unsubscribe();
        }
      }
    });
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }
}
