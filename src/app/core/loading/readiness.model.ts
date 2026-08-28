import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Which screen's data requirements are in force.
 *
 * Deliberately NOT derived from `router.url` string comparisons (which is what
 * fund-selector did): routes here are flat and carry no fund parameter, so the
 * context is declared in route `data` and read once.
 */
export type ReadinessContext = 'DASHBOARD' | 'PORTFOLIO' | 'DOCUMENTS' | 'INSIGHTS';

export type TaskState =
  | 'pendingPredicate' // required-ness not yet known (depends on an earlier response)
  | 'pending' // required, not yet issued
  | 'inFlight'
  | 'retrying'
  | 'succeeded'
  | 'empty' // 200 with no rows - still resolved
  | 'skipped' // predicate resolved false - stays in the denominator
  | 'failed'
  | 'cancelled'
  | 'timedOut';

/**
 * States that let a task stop blocking session closure.
 *
 * `empty` and `skipped` are resolved on purpose. Treating "200 with no rows" or
 * "not applicable to this fund" as unresolved is how a session hangs at 95%
 * forever; treating them as failures is how a healthy screen reports an error.
 */
export const RESOLVED_STATES: ReadonlySet<TaskState> = new Set<TaskState>([
  'succeeded',
  'empty',
  'skipped',
  'failed',
  'cancelled',
  'timedOut',
]);

/** Resolved, but not successfully - drives the DEGRADED tally. */
export const FAILED_STATES: ReadonlySet<TaskState> = new Set<TaskState>([
  'failed',
  'timedOut',
]);

export interface TaskDefinition {
  /** Stable id; the same id is stamped on the request via READINESS_TASK. */
  readonly id: string;
  /**
   * What the user sees. Named by outcome, never by endpoint - an LP did not ask
   * for a "dates lookup". Tasks sharing a label render as ONE checklist row, so a
   * component firing two requests still reads as a single step.
   */
  readonly label: string;
  /** Blocking tasks gate completion. Non-blocking ones never hold the screen. */
  readonly blocking: boolean;
  /**
   * How often this data is actually refetched. Drives whether a NEW session lists
   * the task as work or carries it forward as already-done.
   *
   *   'app'    - fetched once per app session (the fund list). Never refetched on
   *              navigation, so listing it again would be work that never arrives.
   *   'fund'   - refetched only when the selected fund changes.
   *   'screen' - refetched every time the screen is entered (the default).
   *
   * Declaring this on the task replaces callers remembering to call skip() at each
   * navigation site - which is exactly the kind of implicit rule that got missed for
   * /documents and /insights.
   */
  readonly scope?: 'app' | 'fund' | 'screen';
  /**
   * True when the task's required-ness cannot be known at session open and is
   * resolved later by `resolvePredicate()`. Such a task counts in the denominator
   * from the start, so resolving it can never make the bar jump.
   */
  readonly conditional?: boolean;
}

export const TASK = {
  FUNDS: 'funds',
  INVESTOR_TOKEN: 'investor-token',
  DATES: 'dates',
  OVERVIEW: 'overview',
  PERFORMANCE: 'performance',
  HOLDINGS: 'holdings',
  PORTFOLIO_SUMMARY: 'portfolio-summary',
  DISTRIBUTION: 'distribution',
  DOCUMENT_TYPES: 'document-types',
  DOCUMENT_LIST: 'document-list',
  INSIGHTS: 'insights',
  INSIGHT_TYPES: 'insight-types',
  LATEST_DOCUMENTS: 'latest-documents',
} as const;

/**
 * The required work per screen, declared up front.
 *
 * This is the whole point of the redesign. The previous implementation inferred
 * completion from observed traffic, so the moment the in-flight count hit zero it
 * declared 100% - which happens BETWEEN waves, because each stage is issued from
 * inside the previous stage's subscribe callback. Seeding the denominator here
 * means "nothing is running" and "everything is done" stop being the same state.
 *
 * Verified against source: every route child renders unconditionally (no *ngIf
 * gating), so per-route cardinality is static. Only parameters - the role-dependent
 * URL, the classGuid, the date - are discovered at runtime.
 */
export const READINESS_MANIFEST: Readonly<Record<ReadinessContext, readonly TaskDefinition[]>> = {
  DASHBOARD: [
    { id: TASK.FUNDS, label: 'Fund list', blocking: true, scope: 'app' },
    { id: TASK.INVESTOR_TOKEN, label: 'Account access', blocking: true, conditional: true, scope: 'fund' },
    { id: TASK.DATES, label: 'Valuation dates', blocking: true },
    { id: TASK.OVERVIEW, label: 'Investment overview', blocking: true },
    { id: TASK.PERFORMANCE, label: 'Fund performance', blocking: true },
    { id: TASK.HOLDINGS, label: 'Your holdings', blocking: true },
    // Editorial and preview content: useful, but the screen is usable without them.
    { id: TASK.INSIGHTS, label: 'Insights', blocking: false },
    { id: TASK.LATEST_DOCUMENTS, label: 'Recent documents', blocking: false },
  ],
  PORTFOLIO: [
    { id: TASK.FUNDS, label: 'Fund list', blocking: true, scope: 'app' },
    { id: TASK.INVESTOR_TOKEN, label: 'Account access', blocking: true, conditional: true, scope: 'fund' },
    { id: TASK.DATES, label: 'Valuation dates', blocking: true },
    { id: TASK.PORTFOLIO_SUMMARY, label: 'Portfolio summary', blocking: true },
    { id: TASK.HOLDINGS, label: 'Your holdings', blocking: true },
    { id: TASK.DISTRIBUTION, label: 'Industry breakdown', blocking: true },
  ],
  DOCUMENTS: [
    { id: TASK.FUNDS, label: 'Fund list', blocking: true, scope: 'app' },
    { id: TASK.INVESTOR_TOKEN, label: 'Account access', blocking: true, conditional: true, scope: 'fund' },
    { id: TASK.DOCUMENT_TYPES, label: 'Document categories', blocking: true },
    { id: TASK.DOCUMENT_LIST, label: 'Documents', blocking: true },
  ],
  // Editorial content, independent of the selected fund - no fund list, no dates.
  INSIGHTS: [
    { id: TASK.INSIGHT_TYPES, label: 'Insight categories', blocking: true },
    { id: TASK.INSIGHTS, label: 'Articles', blocking: true },
  ],
};

/**
 * Routes with no readiness context do no tracked loading, so they must show no
 * overlay at all. Listed here only for documentation - the absence of
 * `data.readinessContext` in app.routes.ts is what actually drives it.
 *
 *   /notifications  - no HTTP calls
 *   /profile        - userService is mocked (of(...).pipe(delay)), not HTTP
 *   /user/**        - unauthenticated; login has its own inline spinner
 *   ''              - DefaultLandingGuard only redirects
 *
 * Do NOT default an unlisted route to a real context. Doing so opens a session whose
 * tasks that route never requests, and the overlay then hangs forever - which is
 * exactly what /insights did while it fell back to DASHBOARD.
 */

/**
 * Stamped on a request to attribute it to a readiness task.
 *
 * Opt-in by design. The previous interceptor counted EVERY request, so the tenant
 * config call, document downloads and editorial content all moved the number.
 * Untagged requests are invisible to readiness - which is the correct default for
 * a user-initiated download or a background refresh.
 */
export const READINESS_TASK = new HttpContextToken<string | null>(() => null);

/** Stamped at issue time so a response from a superseded session can be discarded. */
export const READINESS_EPOCH = new HttpContextToken<number>(() => -1);

/** Convenience for call sites: `{ context: readinessContext(TASK.DATES) }`. */
export function readinessContext(taskId: string, existing?: HttpContext): HttpContext {
  return (existing ?? new HttpContext()).set(READINESS_TASK, taskId);
}
