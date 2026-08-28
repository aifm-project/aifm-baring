import { TestBed } from '@angular/core/testing';
import { NavigationCancel, ResolveEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ReadinessRouteBinder } from './readiness-route-binder.service';
import { ReadinessService } from './readiness.service';

/**
 * The binder is the layer that kept breaking, and none of it is service logic - it
 * is wiring between routes, route data and sessions. Three bugs shipped here:
 * /documents opened no session, /insights opened the WRONG one (a DASHBOARD default),
 * and the trigger fired after components had already issued their requests.
 *
 * These specs drive the binder with synthetic router events so the wiring itself is
 * asserted, without needing the lazy route tree or AuthGuard.
 */
describe('ReadinessRouteBinder', () => {
  let events: Subject<any>;
  let binder: ReadinessRouteBinder;
  let readiness: ReadinessService;
  let deepestData: Record<string, unknown>;

  /** Minimal router stand-in: an events stream plus a current-route snapshot. */
  function routerStub() {
    return {
      events: events.asObservable(),
      routerState: { root: { firstChild: null, snapshot: { data: deepestData } } },
    } as unknown as Router;
  }

  /**
   * A real ResolveEnd carrying the future snapshot.
   *
   * Must be a genuine instance: the binder discriminates with `instanceof`, so a
   * plain object cast to the type is silently ignored.
   */
  let navId = 0;
  function resolveEnd(data: Record<string, unknown>) {
    const state = { root: { firstChild: null, data } } as any;
    return new ResolveEnd(++navId, '/test', '/test', state);
  }

  beforeEach(() => {
    events = new Subject<any>();
    deepestData = {};
    TestBed.configureTestingModule({
      providers: [ReadinessService, { provide: Router, useFactory: routerStub }],
    });
    readiness = TestBed.inject(ReadinessService);
    binder = TestBed.inject(ReadinessRouteBinder);
    binder.start();
  });

  it('opens no session for a route that declares no context', () => {
    events.next(resolveEnd({}));
    expect(readiness.context()).toBeNull();
    expect(readiness.isLoading()).toBe(false);
    expect(readiness.steps()).toEqual([]);
  });

  it('never falls back to a default context', () => {
    // /insights had no context and the lookup defaulted to DASHBOARD, seeding tasks
    // that route never requests - the overlay then hung at 10% forever.
    events.next(resolveEnd({}));
    expect(readiness.context()).not.toBe('DASHBOARD');
    expect(readiness.context()).toBeNull();
  });

  it('opens the declared session on navigation', () => {
    events.next(resolveEnd({ readinessContext: 'PORTFOLIO' }));
    expect(readiness.context()).toBe('PORTFOLIO');
    expect(readiness.isLoading()).toBe(true);
  });

  describe('switching tabs', () => {
    it('opens a new session showing only the new tab work', () => {
      events.next(resolveEnd({ readinessContext: 'DASHBOARD' }));
      // The fund list resolves once, app-wide.
      readiness.markInFlight('funds');
      readiness.markSettled('funds', 'succeeded');

      events.next(resolveEnd({ readinessContext: 'PORTFOLIO' }));

      expect(readiness.context()).toBe('PORTFOLIO');
      expect(readiness.isLoading())
        .withContext('a tab switch must put the overlay back into loading')
        .toBe(true);

      const labels = readiness.steps().map(s => s.label);
      expect(labels).toEqual([
        'Valuation dates',
        'Portfolio summary',
        'Your holdings',
        'Industry breakdown',
      ]);
      expect(readiness.percent()).toBeLessThan(100);
    });

    it('carries the fund list forward instead of re-listing it', () => {
      events.next(resolveEnd({ readinessContext: 'DASHBOARD' }));
      readiness.markInFlight('funds');
      readiness.markSettled('funds', 'succeeded');

      events.next(resolveEnd({ readinessContext: 'DOCUMENTS' }));
      const labels = readiness.steps().map(s => s.label);
      expect(labels).not.toContain('Fund list');
      expect(labels).toEqual(['Document categories', 'Documents']);
    });

    it('covers every context, including ones with no fund-selector on screen', () => {
      for (const context of ['DASHBOARD', 'PORTFOLIO', 'DOCUMENTS', 'INSIGHTS'] as const) {
        events.next(resolveEnd({ readinessContext: context }));
        expect(readiness.context()).withContext(`${context} did not open`).toBe(context);
        expect(readiness.isLoading()).withContext(`${context} not loading`).toBe(true);
      }
    });

    it('clears the session when moving to a route with no context', () => {
      events.next(resolveEnd({ readinessContext: 'PORTFOLIO' }));
      expect(readiness.isLoading()).toBe(true);

      // e.g. /profile - no tracked loading, so no overlay.
      events.next(resolveEnd({}));
      expect(readiness.context()).toBeNull();
      expect(readiness.isLoading()).toBe(false);
    });

    it('ignores a repeated navigation to the same context', () => {
      events.next(resolveEnd({ readinessContext: 'PORTFOLIO' }));
      readiness.markInFlight('dates');
      readiness.markSettled('dates', 'succeeded');
      const afterDates = readiness.percent();

      events.next(resolveEnd({ readinessContext: 'PORTFOLIO' }));
      expect(readiness.percent())
        .withContext('same-context navigation must not reset progress')
        .toBe(afterDates);
    });
  });

  it('does not strand a session when a navigation is cancelled', () => {
    events.next(resolveEnd({ readinessContext: 'PORTFOLIO' }));
    expect(readiness.isLoading()).toBe(true);

    deepestData = {}; // the guard sent us somewhere with no context
    events.next(new NavigationCancel(1, '/portfolio', 'blocked'));
    expect(readiness.isLoading()).toBe(false);
  });
});
