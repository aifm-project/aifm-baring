import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { ReadinessService } from './readiness.service';
import { TASK } from './readiness.model';

/**
 * The invariant these specs exist to protect:
 *
 *   Progress must never read 100 while a required task is outstanding.
 *
 * The shipped defect was a tracker that inferred completion from live traffic. Load
 * runs as sequential waves - `funds/summary`, then `dates`, then a dispatch that
 * wakes N components - each issued from inside the previous stage's subscribe
 * callback. So the in-flight set empties BETWEEN waves while the screen still has no
 * data, and "nothing is running" was read as "everything is done".
 *
 * The first spec below is the one that would have caught it.
 */
describe('ReadinessService', () => {
  let readiness: ReadinessService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReadinessService] });
    readiness = TestBed.inject(ReadinessService);
  });

  /** Drive a task through issue -> settle, as the interceptor does. */
  const run = (taskId: string, outcome: 'succeeded' | 'empty' | 'failed' = 'succeeded') => {
    readiness.markInFlight(taskId);
    readiness.markSettled(taskId, outcome);
  };

  describe('the wave gap', () => {
    it('does not report 100 when the in-flight set empties between waves', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);

      // Wave 1 completes. Nothing is in flight - the old tracker declared 100 here.
      run(TASK.FUNDS);
      expect(readiness.percent()).toBeLessThan(100);
      expect(readiness.outstanding().length).toBeGreaterThan(0);

      // Wave 2 completes. Still nothing in flight, still nothing on screen.
      run(TASK.DATES);
      expect(readiness.percent()).toBeLessThan(100);

      // Only once wave 3 lands is the screen actually ready.
      run(TASK.PORTFOLIO_SUMMARY);
      run(TASK.HOLDINGS);
      run(TASK.DISTRIBUTION);
      expect(readiness.percent()).toBe(100);
      expect(readiness.phase()).toBe('settled');
    });

    it('never reaches 100 with any blocking task unresolved, across every context', () => {
      for (const context of ['DASHBOARD', 'PORTFOLIO', 'DOCUMENTS'] as const) {
        readiness.openSession(context);
        readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
        while (readiness.outstanding().length > 1) {
          run(readiness.outstanding()[0].def.id);
          expect(readiness.percent())
            .withContext(`${context}: 100 reported with work outstanding`)
            .toBeLessThan(100);
        }
        run(readiness.outstanding()[0].def.id);
        expect(readiness.percent()).toBe(100);
      }
    });
  });

  describe('discovery', () => {
    it('is indeterminate until conditional tasks resolve', () => {
      readiness.openSession('DASHBOARD');
      expect(readiness.isIndeterminate()).toBe(true);
      expect(readiness.phase()).toBe('discovering');

      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, true);
      expect(readiness.isIndeterminate()).toBe(false);
      expect(readiness.phase()).toBe('loading');
    });

    it('counts a skipped task as resolved without moving the denominator backwards', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);
      const afterFunds = readiness.percent();

      run(TASK.DATES);
      expect(readiness.percent()).toBeGreaterThanOrEqual(afterFunds);
      expect(readiness.percent()).toBeLessThan(100);
    });
  });

  describe('superseded sessions', () => {
    it('advances the epoch so a previous session can be identified', () => {
      const first = readiness.openSession('PORTFOLIO');
      const second = readiness.openSession('PORTFOLIO');
      expect(second).toBeGreaterThan(first);
    });

    it('starts a fund switch from zero rather than inheriting the old progress', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);
      run(TASK.DATES);
      expect(readiness.percent()).toBeGreaterThan(0);

      readiness.openSession('PORTFOLIO');
      expect(readiness.percent()).toBe(0);
    });
  });

  describe('terminal states', () => {
    it('treats an empty 200 as resolved, not as a failure', () => {
      readiness.openSession('DOCUMENTS');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);
      run(TASK.DOCUMENT_TYPES);
      run(TASK.DOCUMENT_LIST, 'empty');
      expect(readiness.percent()).toBe(100);
      expect(readiness.phase()).toBe('settled');
    });

    it('closes as degraded - never as a clean 100 - when a required task fails', () => {
      readiness.openSession('DOCUMENTS');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);
      run(TASK.DOCUMENT_TYPES);
      run(TASK.DOCUMENT_LIST, 'failed');
      expect(readiness.phase()).toBe('degraded');
      expect(readiness.failedCount()).toBe(1);
    });

    it('keeps a multi-request task open until its last request settles', () => {
      readiness.openSession('DASHBOARD');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      // performance fires two calls that share one checklist step
      readiness.markInFlight(TASK.PERFORMANCE);
      readiness.markInFlight(TASK.PERFORMANCE);
      readiness.markSettled(TASK.PERFORMANCE, 'succeeded');

      const step = readiness.steps().find(s => s.label === 'Fund performance');
      expect(step?.state).toBe('active');

      readiness.markSettled(TASK.PERFORMANCE, 'succeeded');
      expect(readiness.steps().find(s => s.label === 'Fund performance')?.state).toBe('done');
    });
  });

  describe('manifest drift', () => {
    it('reopens the frontier for a tagged request with no manifest entry', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);
      run(TASK.DATES);
      run(TASK.PORTFOLIO_SUMMARY);
      run(TASK.HOLDINGS);

      // Somebody added a component and forgot the manifest entry.
      readiness.registerUnknown('newly-added-widget');
      run(TASK.DISTRIBUTION);

      // Fails safe toward "still loading" rather than closing early.
      expect(readiness.percent()).toBeLessThan(100);
      run('newly-added-widget');
      expect(readiness.percent()).toBe(100);
    });
  });

  describe('tasks that are never requested', () => {
    // Regression: a task marked required whose request is never issued can never
    // settle, so the session hangs and the blocking overlay stays up with no way for
    // the user to dismiss it. This shipped: on FIRST load the investor-token call is
    // never made (that path only runs from onFundSelect), but the predicate was
    // resolved to `required`, so "Account access" waited forever.
    it('hangs if a required task is never issued - closeUnstarted is the release', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, true); // required...
      run(TASK.FUNDS);
      run(TASK.DATES);
      run(TASK.PORTFOLIO_SUMMARY);
      run(TASK.HOLDINGS);
      run(TASK.DISTRIBUTION);

      // ...but no request for it was ever sent, so everything else finishing is
      // not enough - this is the hang.
      expect(readiness.percent()).toBeLessThan(100);
      expect(readiness.isLoading()).toBe(true);

      readiness.closeUnstarted('skipped');
      expect(readiness.percent()).toBe(100);
      expect(readiness.isLoading()).toBe(false);
    });

    it('releases the session when the fund list comes back empty', () => {
      readiness.openSession('PORTFOLIO');
      run(TASK.FUNDS, 'empty');
      // Nothing downstream will ever be requested.
      readiness.closeUnstarted('skipped');
      expect(readiness.isLoading()).toBe(false);
      expect(readiness.isIndeterminate()).toBe(false);
    });

    it('releases the session when the chain root fails', () => {
      readiness.openSession('DASHBOARD');
      run(TASK.FUNDS, 'failed');
      readiness.closeUnstarted('skipped');
      expect(readiness.isLoading()).toBe(false);
      expect(readiness.phase()).toBe('degraded');
    });

    it('escapes the discovering phase even if no predicate is ever resolved', () => {
      readiness.openSession('PORTFOLIO');
      expect(readiness.isIndeterminate()).toBe(true);
      readiness.closeUnstarted('skipped');
      expect(readiness.isIndeterminate()).toBe(false);
      expect(readiness.isLoading()).toBe(false);
    });
  });

  describe('scoping to the work a screen actually does', () => {
    it('shows only the work this tab does when switching tabs', () => {
      // Switching tab reuses the selected fund: no fund-list call, no token call.
      // The checklist must not tick steps that never ran.
      readiness.openSession('PORTFOLIO');
      readiness.skip(TASK.FUNDS);
      readiness.skip(TASK.INVESTOR_TOKEN);

      const labels = readiness.steps().map(s => s.label);
      expect(labels).not.toContain('Fund list');
      expect(labels).not.toContain('Account access');
      expect(labels).toEqual([
        'Valuation dates',
        'Portfolio summary',
        'Your holdings',
        'Industry breakdown',
      ]);
    });

    it('still reaches 100 with skipped work excluded from the visible steps', () => {
      readiness.openSession('PORTFOLIO');
      readiness.skip(TASK.FUNDS);
      readiness.skip(TASK.INVESTOR_TOKEN);
      run(TASK.DATES);
      run(TASK.PORTFOLIO_SUMMARY);
      run(TASK.HOLDINGS);
      expect(readiness.percent()).toBeLessThan(100);
      run(TASK.DISTRIBUTION);
      expect(readiness.percent()).toBe(100);
    });

    it('shows the dashboard tab only its own work', () => {
      readiness.openSession('DASHBOARD');
      readiness.skip(TASK.FUNDS);
      readiness.skip(TASK.INVESTOR_TOKEN);
      expect(readiness.steps().map(s => s.label)).toEqual([
        'Valuation dates',
        'Investment overview',
        'Fund performance',
        'Your holdings',
      ]);
    });
  });

  describe('100 can never coexist with outstanding work', () => {
    // Regression for a real screenshot: the Portfolio session had settled (peak 100),
    // then Documents work appeared. The peak clamp is monotonic, so the readout kept
    // showing 100 while a step was still spinning - the original defect returning
    // through a different door. Completion is now gated on the PHASE, not the peak.
    it('does not re-block the screen when work appears after settling', () => {
      // Earlier this asserted the opposite - that late work should drop the readout
      // below 100. That was wrong: once the session has settled the overlay is gone
      // and the user is reading the page, so re-arming a full-screen scrim over it
      // is worse than a stale number nobody can see. The invariant that matters is
      // the one below: 100 is never shown WHILE the overlay is up with work
      // outstanding.
      readiness.openSession('PORTFOLIO');
      readiness.skip(TASK.INVESTOR_TOKEN);
      run(TASK.FUNDS);
      run(TASK.DATES);
      run(TASK.PORTFOLIO_SUMMARY);
      run(TASK.HOLDINGS);
      run(TASK.DISTRIBUTION);
      expect(readiness.phase()).toBe('settled');

      readiness.registerUnknown('late-arriving-request');
      readiness.markInFlight('late-arriving-request');
      expect(readiness.isLoading())
        .withContext('late work must not put the blocking overlay back up')
        .toBe(false);
    });

    it('holds below 100 for every intermediate state of every context', () => {
      for (const context of ['DASHBOARD', 'PORTFOLIO', 'DOCUMENTS'] as const) {
        readiness.openSession(context);
        readiness.skip(TASK.INVESTOR_TOKEN);
        let guard = 0;
        while (readiness.outstanding().length > 0 && guard++ < 50) {
          const remaining = readiness.outstanding().length;
          if (remaining > 0) {
            expect(readiness.percent())
              .withContext(`${context}: reported 100 with ${remaining} outstanding`)
              .toBeLessThan(100);
          }
          run(readiness.outstanding()[0].def.id);
        }
        expect(readiness.percent()).withContext(context).toBe(100);
      }
    });
  });

  describe('each tab reports only its own work', () => {
    it('switching to Documents replaces the Portfolio checklist entirely', () => {
      // The shipped bug: /documents matched neither /portfolio nor /dashboard, so no
      // session opened and the Portfolio steps stayed on screen while Documents
      // loaded, with an unattributed "Loading data" row appended.
      readiness.openSession('PORTFOLIO');
      readiness.skip(TASK.INVESTOR_TOKEN);
      run(TASK.FUNDS);
      run(TASK.DATES);
      expect(readiness.steps().map(s => s.label)).toContain('Portfolio summary');

      readiness.openSession('DOCUMENTS');
      readiness.skip(TASK.FUNDS);
      readiness.skip(TASK.INVESTOR_TOKEN);

      const labels = readiness.steps().map(s => s.label);
      expect(labels).toEqual(['Document categories', 'Documents']);
      expect(labels).not.toContain('Portfolio summary');
      expect(labels).not.toContain('Industry breakdown');
      expect(labels).not.toContain('Loading data');
      expect(readiness.percent()).toBeLessThan(100);
    });

    it('never leaks a step from one context into another', () => {
      const seen: Record<string, string[]> = {};
      for (const context of ['DASHBOARD', 'PORTFOLIO', 'DOCUMENTS'] as const) {
        readiness.openSession(context);
        readiness.skip(TASK.FUNDS);
        readiness.skip(TASK.INVESTOR_TOKEN);
        seen[context] = readiness.steps().map(s => s.label);
      }
      expect(seen['PORTFOLIO']).not.toContain('Investment overview');
      expect(seen['DASHBOARD']).not.toContain('Industry breakdown');
      expect(seen['DOCUMENTS']).not.toContain('Valuation dates');
      expect(seen['DOCUMENTS']).not.toContain('Your holdings');
    });
  });

  describe('stall watchdog', () => {
    // A task that is required but whose request is never issued has the same shape
    // as a normal between-waves gap - except it lasts forever, and the blocking
    // overlay cannot be dismissed. This releases it loudly rather than freezing.
    it('releases a session where a required task is never requested', fakeAsync(() => {
      readiness.openSession('DASHBOARD');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, true); // required, never issued
      run(TASK.FUNDS);
      run(TASK.DATES);
      run(TASK.OVERVIEW);
      run(TASK.PERFORMANCE);
      run(TASK.HOLDINGS);

      expect(readiness.isLoading()).toBe(true);
      expect(readiness.percent()).toBeLessThan(100);

      tick(4000);
      expect(readiness.isLoading()).toBe(false);
      discardPeriodicTasks();
    }));

    it('does not fire during a normal gap between waves', fakeAsync(() => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);

      // Wave 2 starts well within the window, as the real chain does.
      tick(50);
      readiness.markInFlight(TASK.DATES);
      tick(4000);

      // Still loading: an in-flight request must hold the session open indefinitely.
      expect(readiness.isLoading()).toBe(true);
      readiness.markSettled(TASK.DATES, 'succeeded');
      discardPeriodicTasks();
    }));
  });

  describe('a wiring bug must never render as success', () => {
    // The stall watchdog releases a session where a required task is never
    // requested. Releasing it as `skipped` would close the session clean at 100% -
    // a green, fully-loaded screen with no data. A hang gets reported by users; a
    // false 100% does not, so the watchdog must degrade, never succeed.
    it('a stalled session closes degraded, not at 100%', fakeAsync(() => {
      readiness.openSession('DASHBOARD');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, true); // required, never issued
      run(TASK.FUNDS);
      run(TASK.DATES);
      run(TASK.OVERVIEW);
      run(TASK.PERFORMANCE);
      run(TASK.HOLDINGS);

      tick(4000);
      expect(readiness.isLoading()).toBe(false);
      expect(readiness.phase()).toBe('degraded');
      expect(readiness.percent()).toBeLessThan(100);
      expect(readiness.failedCount()).toBeGreaterThan(0);
      discardPeriodicTasks();
    }));
  });

  describe('refresh after the screen is ready', () => {
    // Paginating the documents table, or changing the as-of date, re-issues a
    // tagged request. That must resolve its task WITHOUT dragging the blocking
    // overlay back over content the user is already reading.
    it('does not re-arm the overlay for work issued after settling', () => {
      readiness.openSession('DOCUMENTS');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      run(TASK.FUNDS);
      run(TASK.DOCUMENT_TYPES);
      run(TASK.DOCUMENT_LIST);
      expect(readiness.phase()).toBe('settled');
      expect(readiness.isLoading()).toBe(false);

      // User clicks page 2 - same task id, re-issued.
      readiness.markInFlight(TASK.DOCUMENT_LIST);
      expect(readiness.isLoading())
        .withContext('a refresh must not blank the screen with the overlay')
        .toBe(false);

      readiness.markSettled(TASK.DOCUMENT_LIST, 'succeeded');
      expect(readiness.isLoading()).toBe(false);
    });
  });

  describe('steps', () => {
    it('reports only blocking work, in manifest order', () => {
      readiness.openSession('DASHBOARD');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      const labels = readiness.steps().map(s => s.label);
      expect(labels).toContain('Your holdings');
      // Optional work must not appear as a blocking step.
      expect(labels).not.toContain('Insights');
      expect(labels).not.toContain('Recent documents');
    });

    it('hides a step whose work was skipped rather than ticking it', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      expect(readiness.steps().map(s => s.label)).not.toContain('Account access');
    });

    it('shows a conditional step once it is genuinely required', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, true);
      expect(readiness.steps().map(s => s.label)).toContain('Account access');
    });

    it('names the task currently in flight', () => {
      readiness.openSession('PORTFOLIO');
      readiness.resolvePredicate(TASK.INVESTOR_TOKEN, false);
      readiness.markInFlight(TASK.HOLDINGS);
      expect(readiness.activeLabel()).toBe('Your holdings');
    });
  });
});
