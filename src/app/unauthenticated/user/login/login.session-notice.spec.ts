import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { SessionNoticeService } from '../../../core/auth/session-notice.service';
import { SESSION_COPY } from '../../../core/auth/session.model';
import { LoginComponent } from './login.component';

/**
 * The user-facing half of the work: what someone actually sees when they arrive at
 * the login screen, and whether a screen reader user gets the same information.
 */
describe('LoginComponent: session notice', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let notices: SessionNoticeService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideMockStore({
          initialState: {
            authState: { userData: null, token: null, accountInfo: null, accountConfigs: null },
          },
        }),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            userDetails: null,
            login: () => of({}),
            loginWithOTP1: () => of({}),
            setOTP: () => of({}),
            markSessionActive: jasmine.createSpy('markSessionActive'),
          },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    });

    notices = TestBed.inject(SessionNoticeService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  function render(): void {
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  }

  function panel(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.session-ended');
  }

  it('says nothing when the user simply opened the login page', () => {
    render();
    expect(panel()).toBeNull();
  });

  it('says nothing after a manual sign-out', () => {
    // SIGNED_OUT is never written by SessionManager; this asserts the second line of
    // defence - even if it were, the screen would stay quiet.
    notices.write('SIGNED_OUT');
    render();
    expect(panel()).toBeNull();
  });

  it('explains an expired session in plain language', () => {
    notices.write('EXPIRED');
    render();

    const text = panel()?.textContent ?? '';
    expect(text).toContain(SESSION_COPY.ended.heading);
    expect(text).toContain(SESSION_COPY.ended.body);
    expect(text).toContain(SESSION_COPY.ended.action);
  });

  it('never uses the words that read as an accusation or leak the mechanism', () => {
    notices.write('EXPIRED');
    render();

    const text = (panel()?.textContent ?? '').toLowerCase();
    ['unauthorized', 'authentication failed', 'access denied', '401', 'token', 'logged out'].forEach(
      banned => expect(text).withContext(`copy must not contain "${banned}"`).not.toContain(banned),
    );
  });

  it('shows the same calm copy for a corrupted credential', () => {
    // Scenario C: the user is told what to do, not what was wrong with their token.
    notices.write('INVALID');
    render();
    expect(panel()?.textContent).toContain(SESSION_COPY.ended.heading);
  });

  it('carries the message to a screen reader by moving focus to it', fakeAsync(() => {
    // A role="alert" that is present at page load has no change for the live region
    // to announce. Focus is what makes it reliably read out - and it also puts a
    // keyboard user at the top of the form rather than wherever the browser left them.
    notices.write('EXPIRED');
    render();
    tick();

    const element = panel();
    expect(element).not.toBeNull();
    expect(element?.getAttribute('role')).toBe('alert');
    expect(element?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(element);
  }));

  it('names itself through a real heading rather than an aria-label', fakeAsync(() => {
    notices.write('EXPIRED');
    render();
    tick();

    const heading = fixture.nativeElement.querySelector('#session-ended-heading');
    expect(heading?.tagName).toBe('H3');
    expect(panel()?.getAttribute('aria-labelledby')).toBe('session-ended-heading');
  }));

  it('hands focus to the first field when the user takes the primary action', fakeAsync(() => {
    notices.write('EXPIRED');
    render();
    tick();

    const action = fixture.nativeElement.querySelector('.session-ended__action') as HTMLButtonElement;
    expect(action.textContent?.trim()).toBe(SESSION_COPY.ended.action);
    action.click();
    fixture.detectChanges();
    tick();

    expect(panel()).withContext('the explanation is done').toBeNull();
    expect((document.activeElement as HTMLElement)?.id).toBe('email');
  }));

  it('is shown once and not replayed on the next visit', () => {
    notices.write('EXPIRED');
    render();
    expect(panel()).not.toBeNull();

    // Second arrival at the login screen - a reload, or a later visit.
    TestBed.resetTestingModule();
    expect(notices.consume()).withContext('nothing left to replay').toBeNull();
  });

  it('picks up a safe return path so sign-in finishes the journey', () => {
    notices.writeReturnUrl('/portfolio');
    render();
    expect(fixture.componentInstance.returnUrl).toBe('/portfolio');
  });

  it('discards a tampered return path', () => {
    sessionStorage.setItem('aifm.session.returnUrl', 'https://evil.example/steal');
    render();
    expect(fixture.componentInstance.returnUrl).toBeNull();
  });
});
