import { Component, ElementRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Account } from './model/models';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { RequestTrackerService } from './core/services/request-tracker.service';
import { ReadinessService } from './core/loading/readiness.service';
import { ReadinessRouteBinder } from './core/loading/readiness-route-binder.service';

/**
 * Requests faster than this never paint the overlay. Most of this app's waves
 * include a cached dates lookup that returns in tens of milliseconds; without a
 * delay those alone would flash a full-screen scrim.
 */
const SHOW_DELAY_MS = 300;

/** Once painted, the overlay stays at least this long so it can never strobe. */
const MIN_VISIBLE_MS = 500;

/** After this long the overlay admits the wait is unusual. */
const SLOW_AFTER_MS = 8_000;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgxSpinnerModule, LoadingBarHttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [MessageService],
})
export class App implements OnInit {
  accountInfo: Account;

  private readonly tracker = inject(RequestTrackerService);
  private readonly readiness = inject(ReadinessService);
  private readonly readinessRoutes = inject(ReadinessRouteBinder);
  private readonly spinner = inject(NgxSpinnerService);

  private shownAt = 0;
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private slowTimer?: ReturnType<typeof setTimeout>;
  private lastFocused: HTMLElement | null = null;

  private readonly visible = signal(false);
  private readonly slow = signal(false);

  readonly loaderPercent = computed(() => this.readiness.percent());
  readonly loaderSteps = computed(() => this.readiness.steps());
  readonly loaderIndeterminate = computed(() => this.readiness.isIndeterminate());
  readonly loaderIsSlow = computed(() => this.slow());

  /** Names the work in progress; falls back to the phase when nothing is in flight. */
  readonly loaderTitle = computed(() => {
    if (this.readiness.isIndeterminate()) return 'Preparing your data';
    const active = this.readiness.activeLabel();
    return active ? active + '…' : 'Loading your data';
  });

  constructor(
    private _elementRef: ElementRef,
    private titleService: Title,
  ) {
    /**
     * The ONLY place in the app that calls spinner.show()/hide().
     *
     * The previous implementation called them straight from the HTTP interceptor
     * on every request, keyed off a global counter, which meant the slowest request
     * in flight owned the scrim for every other one - already-rendered figures sat
     * dimmed behind a "Loading..." panel until the last straggler returned. Routing
     * every transition through one subscriber keeps ngx-spinner's state a pure
     * function of `visible`, and puts the show/hide timing in one readable place.
     */
    effect(() => {
      // Readiness - not in-flight traffic - decides whether the screen is ready.
      // Those two answers differ exactly at wave boundaries, which is where the old
      // indicator reported false completion.
      const loading = this.readiness.isLoading();
      if (loading) {
        this.scheduleShow();
      } else {
        this.scheduleHide();
      }
    });
  }

  ngOnInit(): void {
    // Bind readiness sessions to routing for every route, from the app root - the
    // only place that exists regardless of which screen is shown. The layout hides
    // <app-fund-selector> on /insights, /notifications and /profile, so session
    // lifecycle could never have been reached there from inside that component.
    this.readinessRoutes.start();
    this._elementRef.nativeElement.removeAttribute('ng-version');
    if (this.accountInfo && this.accountInfo['name']) {
      this.titleService.setTitle(this.accountInfo['name']);
    }
  }

  private scheduleShow(): void {
    clearTimeout(this.hideTimer);
    if (this.visible() || this.showTimer) return;

    this.showTimer = setTimeout(() => {
      this.showTimer = undefined;
      this.visible.set(true);
      this.shownAt = Date.now();
      this.lastFocused = document.activeElement as HTMLElement | null;
      this.applyInert(true);
      this.spinner.show();
      this.slowTimer = setTimeout(() => this.slow.set(true), SLOW_AFTER_MS);
    }, SHOW_DELAY_MS);
  }

  private scheduleHide(): void {
    // The wave drained before the overlay was ever painted - the common case for
    // cached responses. Drop the pending show and leave the screen untouched.
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
      return;
    }
    if (!this.visible() || this.hideTimer) return;

    const shownFor = Date.now() - this.shownAt;
    const wait = Math.max(0, MIN_VISIBLE_MS - shownFor);
    this.hideTimer = setTimeout(() => {
      this.hideTimer = undefined;
      clearTimeout(this.slowTimer);
      this.slow.set(false);
      this.visible.set(false);
      this.spinner.hide();
      this.applyInert(false);
      // Return focus to wherever the user was before the screen was taken over.
      this.lastFocused?.focus?.();
      this.lastFocused = null;
    }, wait);
  }

  /**
   * ngx-spinner leaves the obscured content focusable, so without this a keyboard
   * user can Tab into controls they can neither see nor operate. `inert` removes
   * the subtree from focus order and the accessibility tree in one attribute.
   */
  private applyInert(on: boolean): void {
    const shell = document.getElementById('app-shell');
    if (!shell) return;
    if (on) {
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-busy', 'true');
    } else {
      shell.removeAttribute('inert');
      shell.removeAttribute('aria-busy');
    }
  }
}
