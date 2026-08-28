import { take } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { AfterViewInit, Component, ElementRef, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
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
import { SessionNoticeService } from '../../../core/auth/session-notice.service';
import { EXPLAINED_REASONS, SESSION_COPY, isSafeReturnUrl } from '../../../core/auth/session.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, NgOtpInputComponent ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Copy shown when the server gives us no usable error text. */
  private static readonly GENERIC_ERROR =
    "We couldn't sign you in. Please try again, or contact support if this keeps happening.";

  /** Per-session wire format "iv:ciphertext:tag" — never surface this to a user. */
  private static readonly CIPHERTEXT_RE = /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

  /** Copy for the "your session has ended" panel. Bound by the template. */
  readonly sessionCopy = SESSION_COPY.ended;

  /**
   * True when this visit to the login screen is the result of a session that ended
   * without the user asking. Drives the persistent panel - never set for a manual
   * sign-out, which is the whole reason the reason is carried at all.
   */
  showSessionNotice = false;

  @ViewChild('sessionNotice') private sessionNoticeRef?: ElementRef<HTMLElement>;
  @ViewChild('emailField') private emailFieldRef?: ElementRef<HTMLInputElement>;

  private readonly sessionNotices = inject(SessionNoticeService);

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
    // Read the handover from the session that just ended, BEFORE anything else can
    // navigate away. `consume` both reads and deletes, so a reload of this page shows
    // the explanation once and then stops - a banner that reappears on every refresh
    // trains people to ignore it.
    const notice = this.sessionNotices.consume();
    this.showSessionNotice = !!notice && EXPLAINED_REASONS.has(notice.reason);
    // Where to put the user back once they sign in. Validated on write and again
    // here on read, because sessionStorage is writable by any script on the origin.
    const savedReturnUrl = this.sessionNotices.consumeReturnUrl();
    this.returnUrl = savedReturnUrl ?? null;

    this.loadInitialData(); // Call to load initial data
    this.loadOtpConfig(); // Load OTP configuration
    // Redirect if already logged in
    //  this.showOtpScreen = true;
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.userDetails?.user_role === 'Investor' ? '/documents' : '/dashboard']);
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
   * Move focus to the session panel once it exists.
   *
   * A `role="alert"` that is already in the DOM at page load is not reliably
   * announced by screen readers - the live region has nothing to observe changing.
   * Moving focus to the panel is what actually guarantees the message is read out,
   * and it also puts the keyboard user at the top of the form rather than wherever
   * the browser happened to leave them after the navigation. `tabindex="-1"` on the
   * panel makes it focusable programmatically without adding it to the tab order.
   */
  ngAfterViewInit(): void {
    if (!this.showSessionNotice) return;
    // One frame later: focusing an element in the same tick as its insertion is
    // ignored by some engines because layout has not run.
    setTimeout(() => this.sessionNoticeRef?.nativeElement?.focus(), 0);
  }

  /**
   * "Sign in again" - the panel's primary action. It does not navigate (the user is
   * already where they need to be); it clears the explanation and hands focus to the
   * first field, which is the only thing left to do.
   */
  onSignInAgain(): void {
    this.showSessionNotice = false;
    setTimeout(() => this.emailFieldRef?.nativeElement?.focus(), 0);
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

  /** First candidate that is a real, non-blank string; null when there is none. */
  private firstText(...candidates: unknown[]): string | null {
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const trimmed = candidate.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') continue;
      if (LoginComponent.CIPHERTEXT_RE.test(trimmed)) continue;
      return trimmed;
    }
    return null;
  }

  /**
   * Reads the server's error text off a 200-with-error-flags body. The API is
   * inconsistent about the field name (`errormessage` on the OTP routes,
   * `errorMessage` elsewhere, `message` on some), so read all three rather than
   * letting one absent field render a blank toast.
   */
  private serverText(response: any): string | null {
    return this.firstText(response?.errormessage, response?.errorMessage, response?.message);
  }

  /** Reads error text off an HttpErrorResponse whose body shape we can't trust. */
  private httpText(errResponse: any): string | null {
    return this.firstText(
      errResponse?.error?.errormessage,
      errResponse?.error?.errorMessage,
      errResponse?.error?.message,
      typeof errResponse?.error === 'string' ? errResponse.error : null,
    );
  }

  /**
   * The only way this component raises an error. Guarantees the toast is never
   * blank — `summary` is always a literal category and `detail` always falls
   * back to generic copy — and always clears the loading flags so the submit
   * button can't be left permanently disabled.
   */
  private showError(summary: string, detail?: string | null, opts?: { sticky?: boolean }): void {
    const text = this.firstText(detail) ?? LoginComponent.GENERIC_ERROR;
    this.isLoading = false;
    this.isOtpLoading = false;
    this.errorMessage = text;
    this.messageService.clear();
    this.messageService.add({
      severity: 'error',
      summary,
      detail: text,
      ...(opts?.sticky ? { sticky: true } : { life: 6000 }),
    });
  }

  /**
   * Terminal fallback for a response we don't recognise. Logs the raw payload so
   * a renamed/removed backend field stays visible to engineers instead of being
   * silently masked by the generic copy.
   */
  private showUnmappedError(context: string, payload: unknown, summary = 'Login Failed'): void {
    console.error(`login: unmapped ${context} response`, payload);
    this.showError(summary, this.serverText(payload));
  }

  onLogin(form: any) {
    this.errorMessage = '';
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
    user.termsAccepted = true
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
       if (this.loginResponse.maximumAttempt) {
          this.showError(
            'Account Disabled',
            this.serverText(this.loginResponse) ||
              'User account disabled. Please reset your password to login.',
          );
        } else if (this.loginResponse.attempts) {
          this.showError(
            'Incorrect Password',
            'Incorrect password. After 3 unsuccessful attempts, your account will be blocked.',
          );
        } else if (this.loginResponse.maxWrongOTPAttempt) {
          this.showError('Too Many Attempts', this.serverText(this.loginResponse));
        } else if (this.loginResponse.errorMessage || this.loginResponse.errormessage) {
          // The API spells this field both ways depending on the route; read both
          // so a casing difference can't turn a real error into a silent success.
          this.showError('Login Failed', this.serverText(this.loginResponse));
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
        console.error('Login error:', errResponse);

        switch (errResponse?.status) {
          case 401:
            // Scenario E. Never "Authentication Failed" and never a session story:
            // nothing expired, the details typed were simply not a match.
            this.showError('Sign in unsuccessful', this.credentialMismatchText());
            break;
          case 404:
            this.showError('User Not Found', this.httpText(errResponse) || 'User account not found!');
            break;
          case 0:
            this.showError(
              'Connection Problem',
              "We couldn't reach the server. Check your connection and try again.",
            );
            break;
          default:
            this.showError('Login Error', this.httpText(errResponse));
        }
      },
    );
  }

  /**
   * Where a freshly signed-in user lands.
   *
   * Only two sources are trusted, in order: the path this app itself captured when it
   * turned the user away, and the role default. The server's `returnUrl` field is
   * NOT consulted - on this backend it is an "OTP required" flag rather than a
   * destination, and routing to it would send a signed-in user to an OTP screen. Any
   * destination that did come from off-device would be validated the same way as one
   * from storage: an open redirect is an open redirect whichever side of the wire
   * proposed it.
   */
  private resolveDestination(): string {
    if (isSafeReturnUrl(this.returnUrl)) return this.returnUrl;
    return this.loginResponse?.user?.user_role === 'Investor' ? '/documents' : '/dashboard';
  }

  /** Credential-failure copy that matches what the tenant actually asked for. */
  private credentialMismatchText(): string {
    return this.loginViaOtpOnly
      ? "We couldn't find an account for those details. Please check and try again."
      : SESSION_COPY.credentials;
  }

    userValidate(data:any) {
    // Reached whenever no error flag matched, which includes bodies that carry
    // neither a user nor a recognised flag — bail with a real message instead of
    // throwing on `.user.account` and leaving the screen silent.
    if (!this.loginResponse?.user) {
      this.showUnmappedError('login', this.loginResponse);
      return;
    }
     localStorage.removeItem('fundInvestorToken');
    this.isLoading = false;
    sessionStorage.setItem('activeSession', 'true');
    this.accountInfo = this.loginResponse.user.account;
    this.store.dispatch(setAccountInfo({ accountInfo: this.accountInfo }));
    if (this.loginResponse.user.user_role === 'SuperAdmin') {
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
        if (this.loginResponse.user.user_role === 'Investor' && this.loginResponse.is_taxId == 0 && !this.showOtpScreen) {
          this.showPanNumber = true;
          this.loginForm.get('pan').addValidators(Validators.required)
        } else {
          // Establish the session, THEN navigate - in that order, unconditionally.
          //
          // The previous shape had two navigation branches (server-supplied
          // returnUrl, then locally-held returnUrl) that both ran BEFORE
          // setAuthData/authToken were written. Either of them would have landed on a
          // guarded route with no session in the store, so AuthGuard would bounce the
          // user straight back to the login screen. It never fired only because
          // `this.returnUrl` was assigned nowhere; populating it (which is what makes
          // "return to where you were" work at all) would have turned a dead branch
          // into a redirect loop.
          this.store.dispatch(setAuthData({ userData: this.loginResponse.user, token: data.token }));
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userGuid', this.loginResponse.user.user_guid);
          localStorage.setItem('userRole', this.loginResponse.user.user_sub_role);
          this.authService.markSessionActive();

          const destination = this.resolveDestination();
          this.messageService.add({
            severity: 'success',
            summary: 'Login Successful!',
            detail: `Welcome back, ${this.loginResponse.user.display_name || 'User'}!`,
            life: 3000
          });
          setTimeout(() => {
            // A full document load, not a router navigation, and deliberately so: it
            // guarantees that nothing held in memory from a previous session in this
            // tab - NgRx slices, component caches, an open document - can survive into
            // the new user's first paint.
            window.location.href = destination;
          }, 500);
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
    user.termsAccepted = true

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
          this.showError(
            'Account Disabled',
            this.serverText(loginResponse) ||
              'User account disabled. Please reset your password to login.',
          );
        } else if (loginResponse.maxWrongOTPAttempt) {
          this.showError(
            'Too Many Attempts',
            this.serverText(loginResponse) ||
              'Maximum OTP attempts exceeded. Please try again later.',
          );
        } else if (loginResponse.wrongOTPAttempts > 0) {
          this.showError(
            'Invalid OTP',
            this.serverText(loginResponse) ||
              `Incorrect OTP. ${loginResponse.wrongOTPAttempts} attempts remaining.`,
          );
        } else if (loginResponse.isOtpExpired) {
          this.hideResendOTP = true;
          this.showError(
            'OTP Expired',
            this.serverText(loginResponse) || 'Your OTP has expired. Please request a new one.',
          );
        } else if (loginResponse.user && !loginResponse.isPasswordEmty) {
          // OTP verified successfully
          this.errorMessage = '';
          this.messageService.add({
            severity: 'success',
            summary: 'OTP Verified',
            detail: 'Your OTP has been verified successfully.',
            life: 3000,
          });
          this.userValidate(this.loginResponse);
        } else if (loginResponse.isPasswordEmty) {
          this.isLoading = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Password Required',
            detail: 'Please set/reset your password to login.',
            life: 5000,
          });
        } else {
          // Don't report an unrecognised response as "set your password" — that
          // is a confident wrong diagnosis. Surface what the server said instead.
          this.showUnmappedError('OTP verification', loginResponse, 'OTP Verification Failed');
        }
      },
      (errResponse) => {
        console.error('OTP verification error:', errResponse);

        switch (errResponse?.status) {
          case 401:
            this.showError(
              'Sign in unsuccessful',
              this.httpText(errResponse) ||
                "That code didn't match. Please check it and try again.",
            );
            break;
          case 404:
            this.showError('Not Found', this.httpText(errResponse) || 'User not found.');
            break;
          case 0:
            this.showError(
              'Connection Problem',
              "We couldn't reach the server. Check your connection and try again.",
            );
            break;
          default:
            this.showError(
              'OTP Error',
              this.httpText(errResponse) || 'An error occurred during OTP verification.',
            );
        }
      },
    );
  }
  otpBasedLogin(user): void {
    if (!this.loginViaOtpOnly) {
      // No request will be made, so release the button the caller disabled.
      this.isLoading = false;
      return;
    }
      this.authService.loginWithOTP1(user).subscribe(
        (data) => {
          this.isLoading = false
          this.loginResponse = data;
          if (
            (this.loginViaOtpOnly) &&
            this.loginResponse.returnUrl
          ) {
            if (!this.loginResponse.user) {
              this.showUnmappedError('OTP login', this.loginResponse);
              return;
            }
            this.accountInfo = this.loginResponse.user.account;
            this.errorMessage = '';
            this.showOtpScreen = true
            this.isOtpLoading =false
            this.loginForm.get('otpControl')?.setValidators([Validators.required]);
            this.loginForm.get('otpControl')?.updateValueAndValidity();
            this.startCountdown()
          } else if (this.loginResponse.maximumAttempt) {
            this.showError(
              'Account Disabled',
              this.serverText(this.loginResponse) ||
                'User account disabled. Please reset your password to login (note - reset password link is sent to your registered email post Reset Password request)',
              { sticky: true },
            );
          } else if (this.loginResponse.attempts) {
            this.showError(
              'Sign In Failed',
              this.serverText(this.loginResponse) || this.credentialAttemptsText(),
              { sticky: true },
            );
          } else if (this.loginResponse.maxWrongOTPAttempt) {
            this.showError(
              'Too Many Attempts',
              this.serverText(this.loginResponse) ||
                'Maximum OTP attempts exceeded. Please try again later.',
              { sticky: true },
            );
          } else if (this.loginResponse.wrongOTPAttempts > 0) {
            this.showError(
              'Invalid OTP',
              this.serverText(this.loginResponse) ||
                `Incorrect OTP. ${this.loginResponse.wrongOTPAttempts} attempts remaining.`,
              { sticky: true },
            );
          } else if (this.loginResponse.user) {
            if (!this.loginResponse.isPasswordEmty) {
              this.userValidate(data);
            } else {
              this.showError(
                'Password Required',
                'Please set/reset the password to login',
                { sticky: true },
              );
            }
          } else {
            // Previously a silent no-op: a 200 with no user and no recognised
            // flag left the user staring at an unchanged form with no feedback.
            this.showUnmappedError('OTP login', this.loginResponse);
          }
        },
        (errResponse) => {
          console.error('OTP login error:', errResponse);
          switch (errResponse?.status) {
            case 401:
              this.showError(
                'Sign in unsuccessful',
                this.httpText(errResponse) || this.credentialMismatchText(),
                { sticky: true },
              );
              break;
            case 404:
              this.showError(
                'User Not Found',
                this.httpText(errResponse) || 'User account not found!',
                { sticky: true },
              );
              break;
            case 0:
              this.showError(
                'Connection Problem',
                "We couldn't reach the server. Check your connection and try again.",
              );
              break;
            default:
              // `errResponse.error` can be null (offline/CORS) or an undecrypted
              // ciphertext string — both used to yield a blank toast, or throw.
              this.showError('Login Error', this.httpText(errResponse), { sticky: true });
          }
        },
      );
  }

  /** Lockout-warning copy that matches what the tenant actually asked for. */
  private credentialAttemptsText(): string {
    return this.loginViaOtpOnly
      ? 'Sign in failed. After 3 unsuccessful attempts, your account will be blocked.'
      : 'Incorrect password. After 3 unsuccessful attempts, your account will be blocked.';
  }
  reSendOTP(): void {
    if (!this.loginResponse?.user || !this.accountInfo) {
      // Previously returned silently, leaving "Resend OTP" as a dead button.
      this.showError(
        "Couldn't Resend OTP",
        'Your session has expired. Please start again from the login screen.',
      );
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
        } else {
          // Covers both an explicit errormessage and a body we don't recognise —
          // either way the user pressed a button and must be told what happened.
          this.showUnmappedError('OTP resend', data, "Couldn't Resend OTP");
        }
      },
      (errResponse) => {
        console.error('OTP resend error:', errResponse);
        this.showError(
          "Couldn't Resend OTP",
          this.httpText(errResponse) || 'Failed to resend OTP. Please try again.',
        );
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
