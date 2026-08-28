import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Per-section loading indicator.
 *
 * Deliberately NOT a global overlay. The previous full-screen ngx-spinner was driven
 * by a single module-level request counter, so the slowest request in flight kept the
 * scrim over sections whose data had already arrived - and because ngx-spinner defers
 * show() and hide() onto the same Subject behind a 10ms timer with no reference
 * counting, the two could land out of order and strand the overlay on permanently.
 *
 * This renders from one section's own `isLoading` flag, so it is a pure function of
 * that section's state: it cannot outlive the request it describes, and one slow
 * widget can never block a sibling that is already showing real figures.
 */
@Component({
  selector: 'app-section-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-loader" [class.section-loader--inline]="inline" role="status">
      <span class="section-loader__spinner" aria-hidden="true"></span>
      <span class="section-loader__label" [class.visually-hidden]="inline">{{ label }}</span>
    </div>
  `,
  styleUrls: ['./section-loader.component.scss'],
})
export class SectionLoaderComponent {
  /**
   * Announced to screen readers and (unless `inline`) shown on screen. Keep it
   * specific - "Loading investment overview" beats a bare "Loading...".
   */
  @Input() label = 'Loading';

  /** Compact variant: spinner only on screen, label left for assistive tech. */
  @Input() inline = false;
}
