import { Injectable, computed, signal } from '@angular/core';

interface LiveRequest {
  /** Path TEMPLATE only - never the raw URL. See toPathTemplate(). */
  template: string;
  startedAt: number;
}

/** A path segment that looks like a guid/opaque id rather than a route word. */
const ID_SEGMENT = /^[0-9a-fA-F][0-9a-fA-F-]{7,}$/;

/**
 * Reduce a request URL to a path template, dropping the origin, the query string
 * and every identifier-shaped segment.
 *
 * Request URLs in this app embed investor identity - e.g.
 * `funds/{fund_guid}/investors/{user_guid}/performance?asOnDate=...`. Retaining or
 * logging those puts an investor identifier into memory and into the browser
 * console in production builds. Only the shape is ever needed here: the shape is
 * what picks a label and what is safe to report in telemetry.
 */
export function toPathTemplate(rawUrl: string): string {
  const path = (rawUrl || '').split('?')[0].replace(/^https?:\/\/[^/]+/i, '');
  return path
    .split('/')
    .map(segment => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
}

/** Releases the overlay if a request never settles. See `begin()`. */
const WATCHDOG_MS = 60_000;

/** Human labels for the endpoints this app actually calls, longest match first. */
const URL_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['funds/summary', 'Loading funds'],
  ['/performance', 'Loading fund performance'],
  ['/portfolio', 'Loading portfolio holdings'],
  ['/dates', 'Loading available dates'],
  ['/documents', 'Loading documents'],
  ['users/login', 'Signing you in'],
  ['otp', 'Verifying your code'],
  ['account', 'Loading your account'],
];

/**
 * Tracks in-flight HTTP requests so a single global overlay can render from them.
 *
 * Why a Map of tokens rather than an integer counter: the previous implementation
 * used a module-level `let requestCount = 0` incremented in the interceptor body and
 * decremented in `finalize`. Two things went wrong with that shape.
 *
 *  1. A counter can drift. If a request incremented but never reached `finalize` -
 *     the interceptor wraps `from(preAuthEncryptRequest(...))`, a Web Crypto promise
 *     that can hang, and a synchronous throw before the pipe was built skipped
 *     `finalize` entirely - the count never returned to zero and the full-screen
 *     scrim stayed up permanently with no way for the user to dismiss it.
 *  2. `delete` on a Map is idempotent and cannot go negative, so a double-release is
 *     harmless and the "nothing in flight" condition is structurally sound rather
 *     than defended by a `Math.max(0, n)` patch that would mask the underlying bug.
 *
 * Note this service does NOT decide when the overlay is painted - it only reports
 * state. Show/hide timing (anti-flash delay, minimum visible duration) lives with the
 * single subscriber in `app.ts`, so there is exactly one writer to ngx-spinner.
 */
@Injectable({ providedIn: 'root' })
export class RequestTrackerService {
  private nextToken = 0;
  private readonly watchdogs = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly live = signal<ReadonlyMap<number, LiveRequest>>(new Map());

  /** Requests started and settled in the current wave. Reset when the wave drains. */
  private readonly issued = signal(0);
  private readonly settled = signal(0);

  /**
   * Highest percentage shown in this wave. A wave's denominator grows as new
   * requests join, so the raw ratio can fall; clamping to the peak turns what would
   * be a backwards-moving number into a stall. A progress readout that goes down
   * reads as failure and discredits the indicator.
   */
  private readonly peak = signal(0);

  readonly inFlight = computed(() => this.live().size);
  readonly isLoading = computed(() => this.inFlight() > 0);

  /**
   * Progress across the current wave, 0-100.
   *
   * Deliberately coarse (5% buckets) and capped at 95 until the wave actually
   * drains: request count is a weak proxy for work - a cached date lookup and a
   * portfolio aggregate both count as one - so finer digits would claim precision
   * the model cannot support. Reaching exactly 100 is reserved for "everything
   * settled", which is what actually dismisses the overlay.
   */
  readonly percent = computed(() => this.peak());

  /** What the app is currently waiting on, from the longest-running live request. */
  readonly label = computed(() => {
    let oldest: LiveRequest | null = null;
    for (const entry of this.live().values()) {
      if (!oldest || entry.startedAt < oldest.startedAt) oldest = entry;
    }
    if (!oldest) return 'Loading';
    const template = oldest.template.toLowerCase();
    for (const [fragment, label] of URL_LABELS) {
      if (template.indexOf(fragment) > -1) return label;
    }
    return 'Loading data';
  });

  /**
   * Register a request. Returns the token that must be passed to `end()`.
   *
   * The watchdog releases the token if nothing settles it within WATCHDOG_MS. It
   * deliberately does NOT cancel the request - it only stops a hung call from
   * holding the screen hostage - and it logs, so a strand stays visible in
   * telemetry rather than being silently absorbed.
   */
  begin(url: string): number {
    const template = toPathTemplate(url);
    const token = this.nextToken++;
    const next = new Map(this.live());
    next.set(token, { template, startedAt: Date.now() });
    this.live.set(next);
    this.issued.update(n => n + 1);
    this.recompute();

    this.watchdogs.set(
      token,
      setTimeout(() => {
        // Template only: the raw URL carries investor identifiers.
        console.error(
          `[RequestTracker] request exceeded ${WATCHDOG_MS}ms without settling; ` +
            `releasing the loading overlay. Path: ${template}`
        );
        this.end(token);
      }, WATCHDOG_MS)
    );

    return token;
  }

  /**
   * Release a request. Idempotent: called from `finalize`, which fires on success,
   * error AND unsubscribe, so a token may be released more than once.
   */
  end(token: number): void {
    const timer = this.watchdogs.get(token);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.watchdogs.delete(token);
    }

    const current = this.live();
    if (!current.has(token)) return;

    const next = new Map(current);
    next.delete(token);
    this.live.set(next);
    this.settled.update(n => n + 1);

    if (next.size === 0) {
      // NOT completion. Loading runs as sequential waves - each stage is issued from
      // inside the previous stage's subscribe callback - so the in-flight map empties
      // BETWEEN waves while the screen still has no data. Reporting 100 here is
      // exactly the false-completion defect: it fired after /account, again after
      // funds/summary, and again after the dates call, all before wave 3 issued.
      //
      // Only closeSession() may reach 100, and only a caller that knows the whole
      // required task set may call it. Until then the readout holds below 100.
      this.issued.set(0);
      this.settled.set(0);
      return;
    }
    this.recompute();
  }

  /**
   * Declare the current context fully loaded. This is the ONLY way the readout can
   * reach 100, and it is deliberately not reachable from anything that merely
   * observes network traffic - see the comment in end().
   */
  closeSession(): void {
    this.peak.set(100);
  }

  /**
   * Clear all state. Called on logout, where in-flight requests are torn down and
   * any surviving token would otherwise keep the overlay up on the login screen.
   */
  reset(): void {
    for (const timer of this.watchdogs.values()) clearTimeout(timer);
    this.watchdogs.clear();
    this.live.set(new Map());
    this.issued.set(0);
    this.settled.set(0);
    this.peak.set(0);
  }

  private recompute(): void {
    const issued = this.issued();
    const settled = this.settled();
    if (issued === 0) {
      this.peak.set(0);
      return;
    }
    const raw = Math.floor((settled / issued) * 20) * 5; // 5% buckets
    this.peak.update(previous => Math.max(previous, Math.min(95, raw)));
  }
}
