import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionManager } from '../../../core/auth/session-manager.service';

/**
 * The single in-app surface for authorisation problems (Scenario J).
 *
 * ## Why not a toast
 *
 * This app already has PrimeNG toasts, and a toast was the obvious place to put
 * "you don't have permission to see this". It is the wrong place. A toast is
 * time-boxed: it disappears whether or not the user read it, it is easy to miss
 * while looking at a chart on the other side of the screen, and a screen reader user
 * who is mid-sentence loses it entirely. For a message that explains why part of the
 * page is empty, the explanation has to persist for as long as the emptiness does.
 *
 * There is also a plumbing reason. PrimeNG's `MessageService` is provided in three
 * different injectors here (root, `App`, and `LoginComponent`), and a `<p-toast>`
 * renders only messages from the instance in ITS injector chain. A root-level service
 * publishing to the root instance would post into a toast that no one has mounted -
 * a message that silently goes nowhere is worse than no message at all.
 *
 * ## Accessibility
 *
 * `role="alert"` (implicitly `aria-live="assertive"`, `aria-atomic="true"`) is correct
 * here because the element is INSERTED in response to a user action rather than being
 * present at load - the case where alerts are reliably announced. Focus is
 * deliberately not stolen: the user did not ask to be moved, and the message is not a
 * decision they must make before continuing. It is dismissible by pointer, by keyboard
 * and by Escape, the icon carries `aria-hidden` because the heading already says it in
 * words, and severity is conveyed by heading text and an icon, never by colour alone.
 */
@Component({
  selector: 'app-session-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notice(); as alert) {
      <div class="session-alert" role="alert" (keydown.escape)="dismiss()">
        <span class="session-alert__icon" aria-hidden="true">!</span>
        <div class="session-alert__text">
          <p class="session-alert__heading">{{ alert.heading }}</p>
          <p class="session-alert__body">{{ alert.body }}</p>
        </div>
        <button
          type="button"
          class="session-alert__dismiss"
          (click)="dismiss()"
          aria-label="Dismiss this message">
          Dismiss
        </button>
      </div>
    }
  `,
  styles: [
    `
      .session-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        /* Sits in the document flow under the navbar rather than floating over the
           page: an overlay would cover content at 200% zoom and on small screens. */
        margin: 12px auto;
        max-width: 1200px;
        padding: 14px 16px;
        border: 1px solid #8a5300;
        border-left-width: 4px;
        border-radius: 6px;
        background: #fff8ec;
        color: #3d2a00;
      }

      .session-alert__icon {
        flex: 0 0 auto;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #8a5300;
        color: #fff;
        font-weight: 700;
        line-height: 22px;
        text-align: center;
      }

      .session-alert__text {
        flex: 1 1 auto;
        min-width: 0;
      }

      .session-alert__heading {
        margin: 0 0 2px;
        font-size: 15px;
        font-weight: 600;
      }

      .session-alert__body {
        margin: 0;
        font-size: 14px;
        /* #5a4100 on #fff8ec clears 4.5:1; the palette is not load-bearing anyway,
           since the heading states the problem in words. */
        color: #5a4100;
      }

      .session-alert__dismiss {
        flex: 0 0 auto;
        padding: 6px 12px;
        border: 1px solid #8a5300;
        border-radius: 4px;
        background: transparent;
        color: #3d2a00;
        font-size: 14px;
        cursor: pointer;
      }

      .session-alert__dismiss:hover {
        background: #f3e3c7;
      }

      /* Never rely on the UA default outline: several global stylesheets in this app
         remove it. An explicit, offset outline keeps the control visible for keyboard
         users regardless of what else is loaded. */
      .session-alert__dismiss:focus-visible {
        outline: 3px solid #0c4faf;
        outline-offset: 2px;
      }

      @media (max-width: 600px) {
        .session-alert {
          flex-wrap: wrap;
          margin: 12px;
        }
      }
    `,
  ],
})
export class SessionAlertComponent {
  private readonly sessionManager = inject(SessionManager);

  readonly notice = this.sessionManager.accessNotice;

  dismiss(): void {
    this.sessionManager.dismissAccessNotice();
  }
}
