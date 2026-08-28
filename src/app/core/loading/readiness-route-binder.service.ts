import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationError, ResolveEnd, Router } from '@angular/router';
import { ReadinessService } from './readiness.service';
import { ReadinessContext, TASK } from './readiness.model';

/**
 * Binds the router to the readiness session, for EVERY route.
 *
 * This exists because the previous arrangement put session lifecycle inside
 * `FundSelectorComponent`, and that failed twice for the same reason: coverage.
 *
 *  - `/documents` matched neither of the two URL strings that component checked, so
 *    no session opened and the previous screen's checklist stayed visible.
 *  - `/insights` does not render `FundSelectorComponent` at all, so no code path
 *    there could open a session - and the context lookup defaulted to DASHBOARD,
 *    seeding tasks that route never requests. The overlay hung at 10% forever.
 *
 * Two rules follow, and both are load-bearing:
 *
 *  1. The binder lives at router level, not inside any screen's component, so a
 *     route cannot opt out by omission.
 *  2. A route with no `data.readinessContext` gets NO session and NO overlay. There
 *     is deliberately no default context: defaulting is what turned a missing
 *     annotation into a permanently stuck overlay rather than a visible no-op.
 */
@Injectable({ providedIn: 'root' })
export class ReadinessRouteBinder {
  private readonly router = inject(Router);
  private readonly readiness = inject(ReadinessService);
  /**
   * Captured as a field initializer, which IS an injection context.
   *
   * start() is called from App.ngOnInit(), which is NOT one, so the argument-less
   * takeUntilDestroyed() threw NG0203 there - silently killing the subscription, so
   * no session ever opened on navigation and switching tabs showed no overlay at
   * all. Fund switching kept working only because it calls openSession directly.
   */
  private readonly destroyRef = inject(DestroyRef);

  private started = false;
  private activeContext: ReadinessContext | null = null;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      // ResolveEnd, not NavigationEnd. Router order is:
      //   ... GuardsCheckEnd -> ResolveEnd -> ActivationStart -> [components
      //   constructed, ngOnInit runs, requests fire] -> NavigationEnd
      // Binding on NavigationEnd opens the session AFTER the screen's components
      // have already issued their requests: those get stamped with the old epoch,
      // openSession then replaces the task map and bumps the epoch, and the
      // interceptor's epoch guard silently drops their settle - leaving every task
      // stuck pending. ResolveEnd runs after guards have passed but before any
      // component exists, which closes that window structurally.
      if (event instanceof ResolveEnd) {
        this.sync(this.contextFromSnapshot(event));
        return;
      }
      // An abandoned navigation must not leave the previous screen's session live.
      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.sync(this.contextForCurrentRoute());
      }
    });

    // The first navigation may already have completed before start() runs.
    this.sync(this.contextForCurrentRoute());
  }

  /** The context declared by the route being resolved (its snapshot is the future). */
  private contextFromSnapshot(event: ResolveEnd): ReadinessContext | null {
    let route = event.state.root;
    while (route.firstChild) route = route.firstChild;
    return (route.data?.['readinessContext'] as ReadinessContext) ?? null;
  }

  /** The context declared by the deepest activated route, or null if none. */
  private contextForCurrentRoute(): ReadinessContext | null {
    let route = this.router.routerState.root;
    while (route.firstChild) route = route.firstChild;
    return (route.snapshot.data?.['readinessContext'] as ReadinessContext) ?? null;
  }

  private sync(context: ReadinessContext | null): void {
    if (context === this.activeContext) return;
    this.activeContext = context;

    if (!context) {
      // Notifications, profile, login: no tracked loading, so no overlay at all.
      this.readiness.reset();
      return;
    }

    this.readiness.openSession(context);

    // Navigation never issues the investor-token call - only picking a different
    // fund does. Resolving it here keeps the session out of the indeterminate
    // discovery phase; onFundSelect opens its own session with the real predicate.
    this.readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
  }
}
