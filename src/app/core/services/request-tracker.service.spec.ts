import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { RequestTrackerService, toPathTemplate } from './request-tracker.service';

/**
 * These assertions exist because of a real production defect: a module-level request
 * counter drove a full-screen blocking overlay, drifted above zero, and left the
 * scrim covering already-rendered figures with no way for the user to dismiss it.
 *
 * The invariant under test is narrow and absolute: after every request that started
 * has been released, `isLoading()` MUST be false. Every case below is a path that
 * previously could, or plausibly could, leave it true.
 */
describe('RequestTrackerService', () => {
  let tracker: RequestTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RequestTrackerService] });
    tracker = TestBed.inject(RequestTrackerService);
  });

  it('starts idle', () => {
    expect(tracker.isLoading()).toBe(false);
    expect(tracker.inFlight()).toBe(0);
  });

  it('is loading while a request is open and idle once it is released', () => {
    const token = tracker.begin('/api/funds/summary');
    expect(tracker.isLoading()).toBe(true);
    tracker.end(token);
    expect(tracker.isLoading()).toBe(false);
  });

  it('releasing the same token twice cannot drive the count negative', () => {
    const a = tracker.begin('/api/a');
    const b = tracker.begin('/api/b');
    tracker.end(a);
    tracker.end(a); // duplicate release - finalize can fire on error AND unsubscribe
    expect(tracker.inFlight()).toBe(1);
    expect(tracker.isLoading()).toBe(true);
    tracker.end(b);
    expect(tracker.isLoading()).toBe(false);
  });

  it('releasing an unknown token does not disturb live requests', () => {
    const token = tracker.begin('/api/a');
    tracker.end(9999);
    expect(tracker.isLoading()).toBe(true);
    tracker.end(token);
    expect(tracker.isLoading()).toBe(false);
  });

  it('settles to idle for overlapping requests released out of order', () => {
    const tokens = Array.from({ length: 50 }, (_, i) => tracker.begin(`/api/${i}`));
    // Release in a shuffled-but-deterministic order: odds first, then evens.
    tokens.filter((_, i) => i % 2 === 1).forEach(t => tracker.end(t));
    tokens.filter((_, i) => i % 2 === 0).forEach(t => tracker.end(t));
    expect(tracker.inFlight()).toBe(0);
    expect(tracker.isLoading()).toBe(false);
  });

  it('a request that never settles releases the overlay via the watchdog', fakeAsync(() => {
    tracker.begin('/api/hangs-forever');
    expect(tracker.isLoading()).toBe(true);
    tick(60_000);
    expect(tracker.isLoading()).toBe(false);
  }));

  it('reset clears everything, including pending watchdogs', fakeAsync(() => {
    tracker.begin('/api/a');
    tracker.begin('/api/b');
    tracker.reset();
    expect(tracker.isLoading()).toBe(false);
    expect(tracker.percent()).toBe(0);
    tick(60_000); // watchdogs must not fire after a reset
    expect(tracker.isLoading()).toBe(false);
  }));

  describe('percent', () => {
    it('never decreases when a new request joins mid-wave', () => {
      const a = tracker.begin('/api/a');
      const b = tracker.begin('/api/b');
      tracker.end(a); // 1 of 2 settled
      const afterFirst = tracker.percent();

      tracker.begin('/api/c'); // denominator grows - raw ratio would fall
      expect(tracker.percent()).toBeGreaterThanOrEqual(afterFirst);

      tracker.end(b);
      expect(tracker.percent()).toBeGreaterThanOrEqual(afterFirst);
    });

    it('stays below 100 while anything is still in flight', () => {
      const a = tracker.begin('/api/a');
      const b = tracker.begin('/api/b');
      tracker.end(a);
      expect(tracker.percent()).toBeLessThan(100);
      tracker.end(b);
    });

    it('does NOT reach 100 just because the in-flight set drained', () => {
      // This is the shipped defect, now asserted in reverse. Load runs as sequential
      // waves and each stage is issued from inside the previous stage's subscribe
      // callback, so the in-flight set empties BETWEEN waves while the screen still
      // has no data. Draining must never be read as completion.
      const a = tracker.begin('/api/funds/summary');
      tracker.end(a);
      expect(tracker.isLoading()).toBe(false);
      expect(tracker.percent()).toBeLessThan(100);
    });

    it('reaches 100 only when a caller that knows the required set says so', () => {
      const a = tracker.begin('/api/funds/summary');
      tracker.end(a);
      expect(tracker.percent()).toBeLessThan(100);
      tracker.closeSession();
      expect(tracker.percent()).toBe(100);
    });

    it('counts a failed request as settled so the wave can complete', () => {
      // The tracker is outcome-blind by design: finalize fires for success AND
      // error. If errors did not settle, one 500 would pin the overlay forever.
      const ok = tracker.begin('/api/ok');
      const bad = tracker.begin('/api/explodes');
      tracker.end(ok);
      tracker.end(bad); // released by finalize on the error path
      expect(tracker.isLoading()).toBe(false);
    });
  });

  describe('redaction', () => {
    it('strips investor identifiers from retained paths', () => {
      // Request URLs embed investor identity. Retaining or logging them puts an
      // identifier into memory and into the production console.
      const raw =
        'https://api.example.com/funds/9f2a41c8-77bd-4e11-9a03-2b6c/investors/' +
        'ab3e91f0-22cd-4a77-8e51-9d0a/performance?asOnDate=2026-06-30';
      const template = toPathTemplate(raw);
      expect(template).toBe('/funds/:id/investors/:id/performance');
      expect(template).not.toContain('9f2a41c8');
      expect(template).not.toContain('ab3e91f0');
      expect(template).not.toContain('asOnDate');
    });
  });

  describe('label', () => {
    it('names the endpoint being waited on', () => {
      tracker.begin('https://api.example.com/funds/abc/classes/def/performance?asOnDate=x');
      expect(tracker.label()).toBe('Loading fund performance');
    });

    it('falls back to a generic label for unrecognised urls', () => {
      tracker.begin('https://api.example.com/something/unmapped');
      expect(tracker.label()).toBe('Loading data');
    });

    it('is idle-safe when nothing is in flight', () => {
      expect(tracker.label()).toBe('Loading');
    });
  });
});
