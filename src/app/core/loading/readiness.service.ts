import { Injectable, computed, signal } from '@angular/core';
import {
  FAILED_STATES,
  READINESS_MANIFEST,
  RESOLVED_STATES,
  ReadinessContext,
  TaskDefinition,
  TaskState,
} from './readiness.model';

export type SessionPhase =
  | 'idle'
  | 'discovering' // manifest seeded, conditionals unresolved - progress is indeterminate
  | 'loading'
  | 'settled'
  | 'degraded'; // closed, but something failed

interface TaskRuntime {
  readonly def: TaskDefinition;
  state: TaskState;
  /** Requests currently open for this task; a task may span more than one. */
  open: number;
  startedAt?: number;
}

/** One checklist row. Tasks sharing a label collapse into a single step. */
export interface ReadinessStep {
  readonly label: string;
  readonly state: 'done' | 'active' | 'waiting' | 'failed';
}

/**
 * Weight buckets. Request COUNT is a weak proxy for work here - a cached dates
 * lookup returns in tens of milliseconds while a portfolio aggregate takes seconds -
 * so unweighted counting would race to 80% and then sit there. Three coarse buckets
 * track that reality without claiming per-endpoint precision the model cannot
 * support.
 */
const WEIGHTS: Readonly<Record<string, number>> = {
  funds: 1,
  'investor-token': 1,
  dates: 1,
  insights: 1,
  'latest-documents': 1,
  'document-types': 1,
  'document-list': 3,
  overview: 3,
  'portfolio-summary': 3,
  distribution: 3,
  performance: 8,
  holdings: 8,
};
const DEFAULT_WEIGHT = 3;

/**
 * Tracks whether the CURRENT screen has the data it needs.
 *
 * The rule this service exists to enforce: **an empty in-flight set is not
 * completion.** Loading runs as sequential waves (`funds/summary` -> `dates` ->
 * dispatch -> N component fetches), each issued from inside the previous stage's
 * subscribe callback, so the network genuinely goes quiet between them. Anything
 * that infers "done" from live traffic reports 100% during every one of those gaps -
 * which is precisely the defect this replaces.
 *
 * Here the denominator is seeded from the route's manifest before the first request
 * is issued, so 100% is reachable only when every declared blocking task has reached
 * a resolved state.
 */
@Injectable({ providedIn: 'root' })
export class ReadinessService {
  private readonly tasks = signal<ReadonlyMap<string, TaskRuntime>>(new Map());
  private readonly phaseState = signal<SessionPhase>('idle');
  private readonly contextState = signal<ReadinessContext | null>(null);
  private readonly epochState = signal(0);
  /** Highest percentage shown this session; progress must never move backwards. */
  private readonly peak = signal(0);
  /**
   * Tasks fetched once per app lifetime rather than once per screen - the fund list
   * is loaded on startup and never refetched on navigation. Recording it as a fact
   * (rather than inferring "is this the first session?" from a boolean) means a new
   * session skips it because it genuinely already happened.
   */
  /**
   * Releases a session where nothing is in flight but work is still listed.
   *
   * Waves are chained - each stage is issued from the previous stage's subscribe
   * callback - so a brief zero-in-flight gap is normal and must NOT be treated as
   * completion. But a task that is required and never issued produces the same
   * shape permanently, and the blocking overlay then cannot be dismissed. This is
   * generous enough to never fire between real waves, and short enough that a wiring
   * mistake degrades to a released screen plus a loud warning rather than a freeze.
   */
  private static readonly STALL_MS = 4000;
  private stallTimer?: ReturnType<typeof setTimeout>;

  /** App-scoped tasks already resolved; survives reset() by design. */
  private readonly appResolved = new Set<string>();
  /** Fund-scoped tasks, recorded against the fund they were resolved for. */
  private readonly fundResolved = new Map<string, string | null>();
  private activeFund: string | null = null;
  /**
   * True once this session has reached a terminal phase.
   *
   * A tagged request arriving after that - paginating the documents table, changing
   * the as-of date, any refresh - must NOT drag the blocking overlay back over a
   * screen the user is already reading. Those calls still resolve their task, but
   * the phase stays terminal so the scrim does not reappear.
   */
  private closed = false;

  readonly phase = this.phaseState.asReadonly();
  readonly context = this.contextState.asReadonly();
  readonly epoch = this.epochState.asReadonly();

  /** Blocking tasks that have NOT reached a resolved state. */
  readonly outstanding = computed(() =>
    [...this.tasks().values()].filter(t => t.def.blocking && !RESOLVED_STATES.has(t.state))
  );

  readonly isLoading = computed(
    () => this.phaseState() === 'discovering' || this.phaseState() === 'loading'
  );

  /**
   * True while conditional tasks remain unresolved - the caller should render an
   * indeterminate indicator rather than a number, because the required set is not
   * yet fully known.
   */
  readonly isIndeterminate = computed(() => this.phaseState() === 'discovering');

  /**
   * Progress, 0-100.
   *
   * The peak clamp alone is NOT sufficient to keep this honest. Once a session
   * settles the peak holds 100, and if new work then appears - a late request, or
   * registerUnknown reopening the frontier - the readout would keep showing 100 while
   * a step spins. That is the original defect returning through a different door.
   *
   * So completion is gated on the PHASE, not on the peak: while anything blocking is
   * unresolved the readout is capped below 100 no matter how high the peak climbed.
   */
  readonly percent = computed(() => {
    // Only a clean close earns 100. A degraded session keeps the ratio it actually
    // achieved, so "loaded with problems" never renders as a full bar.
    if (this.phaseState() === 'settled') return 100;
    return Math.min(this.peak(), 95);
  });

  readonly failedCount = computed(
    () => [...this.tasks().values()].filter(t => FAILED_STATES.has(t.state)).length
  );

  /** What the app is waiting on right now, for the stage line. */
  readonly activeLabel = computed(() => {
    const active = [...this.tasks().values()]
      .filter(t => t.state === 'inFlight' || t.state === 'retrying')
      .sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0))[0];
    return active ? active.def.label : null;
  });

  /** The checklist. Tasks sharing a label collapse into one row, in manifest order. */
  readonly steps = computed<ReadinessStep[]>(() => {
    const byLabel = new Map<string, TaskRuntime[]>();
    for (const task of this.tasks().values()) {
      if (!task.def.blocking) continue;
      const group = byLabel.get(task.def.label);
      if (group) group.push(task);
      else byLabel.set(task.def.label, [task]);
    }
    return [...byLabel.entries()]
      // A step whose every task was skipped is not part of this screen's work - the
      // investor-token call on first load, for example. Showing it as a completed
      // tick claims something ran that never did.
      .filter(([, group]) => !group.every(t => t.state === 'skipped'))
      .map(([label, group]) => {
      if (group.some(t => FAILED_STATES.has(t.state))) return { label, state: 'failed' as const };
      if (group.every(t => RESOLVED_STATES.has(t.state))) return { label, state: 'done' as const };
      if (group.some(t => t.state === 'inFlight' || t.state === 'retrying')) {
        return { label, state: 'active' as const };
      }
      return { label, state: 'waiting' as const };
    });
  });

  /**
   * Begin a new session, seeding every task the manifest declares for this screen.
   *
   * Advancing the epoch supersedes the previous session: responses stamped with the
   * old epoch can no longer move progress, so a slow Fund A response cannot score
   * against Fund B.
   */
  /** Record which fund the next session belongs to, so fund-scoped tasks refresh. */
  setActiveFund(fundGuid: string | null): void {
    this.activeFund = fundGuid;
  }

  openSession(context: ReadinessContext): number {
    const seeded = new Map<string, TaskRuntime>();
    for (const def of READINESS_MANIFEST[context]) {
      seeded.set(def.id, { def, state: this.seedState(def), open: 0 });
    }
    this.tasks.set(seeded);
    this.contextState.set(context);
    this.peak.set(0);
    this.closed = false;
    this.phaseState.set(this.hasUnresolvedPredicates(seeded) ? 'discovering' : 'loading');
    this.epochState.update(n => n + 1);
    return this.epochState();
  }

  /**
   * Resolve whether a conditional task is actually required for this fund/role.
   *
   * A skipped task stays in the denominator as a resolved item rather than being
   * removed, so resolving it can never make the bar jump forwards or backwards.
   */
  resolvePredicate(taskId: string, required: boolean): void {
    this.patch(taskId, task => {
      if (task.state !== 'pendingPredicate') return task;
      return { ...task, state: required ? 'pending' : 'skipped' };
    });
    this.refreshPhase();
  }

  /** A request for this task has been issued. */
  markInFlight(taskId: string): void {
    this.patch(taskId, task => ({
      ...task,
      state: 'inFlight',
      open: task.open + 1,
      startedAt: task.startedAt ?? Date.now(),
    }));
    this.refreshPhase();
  }

  /**
   * A request for this task reached a terminal state.
   *
   * A task spanning several requests only resolves once the last one settles, so a
   * component firing two calls cannot half-complete its checklist row.
   */
  markSettled(taskId: string, state: TaskState): void {
    this.patch(taskId, task => {
      const open = Math.max(0, task.open - 1);
      // Failure is sticky: one failed request marks the whole step failed even if a
      // sibling succeeded, because the step's data is incomplete either way.
      const next = FAILED_STATES.has(task.state) ? task.state : state;
      const resolved: TaskState = open > 0 ? 'inFlight' : next;
      if (open === 0) this.recordResolution(task.def, resolved);
      return { ...task, open, state: resolved };
    });
    this.refreshPhase();
  }

  /**
   * Declare that a task's work will not happen in this session.
   *
   * Used when a screen reuses data it already has - switching tab does not refetch
   * the fund list, and issues no investor-token call - so those tasks are neither
   * pending nor achievements to tick. A skipped task resolves for drain purposes and
   * is hidden from the checklist, so the user sees only the work this screen is
   * actually doing.
   */
  skip(taskId: string): void {
    this.patch(taskId, task => {
      if (RESOLVED_STATES.has(task.state)) return task;
      this.recordResolution(task.def, 'skipped');
      return { ...task, state: 'skipped' };
    });
    this.refreshPhase();
  }

  /** Full teardown, for logout - drops even app-lifetime facts. */
  clearAll(): void {
    this.appResolved.clear();
    this.fundResolved.clear();
    this.activeFund = null;
    this.reset();
  }

  /** A retry is under way. Progress stalls; it must never regress. */
  markRetrying(taskId: string): void {
    this.patch(taskId, task => ({ ...task, state: 'retrying' }));
  }

  /**
   * Reconciliation escape hatch.
   *
   * The manifest is a second source of truth and will drift the moment somebody adds
   * a component and forgets an entry. Rather than silently closing a session while
   * that request is still running - the original bug wearing a declarative disguise -
   * an unknown task id registers itself and reopens the frontier, failing safe
   * toward "still loading".
   */
  registerUnknown(taskId: string): void {
    // No session is open - this route declared no readiness work. A straggler from
    // the previous screen (a retry, or a shared widget) must not conjure an overlay
    // on a route that deliberately has none.
    if (this.contextState() === null) return;
    if (this.tasks().has(taskId)) return;
    console.warn(
      `[Readiness] request tagged "${taskId}" has no manifest entry for context ` +
        `"${this.contextState()}". Treating it as required so the session cannot ` +
        `close early - add it to READINESS_MANIFEST.`
    );
    const next = new Map(this.tasks());
    next.set(taskId, {
      // Label carries the task id: an unattributed row that just says "Loading data"
      // is undiagnosable from a screenshot.
      def: { id: taskId, label: `Loading ${taskId}`, blocking: true },
      state: 'pending',
      open: 0,
    });
    this.tasks.set(next);
    this.refreshPhase();
  }

  /**
   * Resolve every task that has not been issued and never will be.
   *
   * Needed when a screen turns out to have no work left to do - no funds returned,
   * or the fund list request failed - because a task that is required but never
   * requested can never settle, and the session would hang at "loading" forever with
   * no way for the user to dismiss it.
   */
  closeUnstarted(state: TaskState = 'skipped'): void {
    const next = new Map(this.tasks());
    for (const [id, task] of next) {
      if (task.state === 'pending' || task.state === 'pendingPredicate') {
        next.set(id, { ...task, state });
      }
    }
    this.tasks.set(next);
    this.refreshPhase();
  }

  reset(): void {
    this.clearStallTimer();
    // appResolved / fundResolved deliberately survive: navigating to a screen with
    // no readiness context does not unload the fund list, so returning to a tracked
    // screen must not re-list it as pending work that will never be requested.
    this.tasks.set(new Map());
    this.contextState.set(null);
    this.phaseState.set('idle');
    this.peak.set(0);
    this.epochState.update(n => n + 1);
  }

  /**
   * Whether a task is work for THIS session, or something already done.
   *
   * Carrying resolved app/fund-scoped tasks forward is what lets a tab change list
   * only its own work: the fund list is not refetched on navigation, so showing it
   * as pending would wait for a request that never comes, and showing it as a tick
   * would claim something ran that did not.
   */
  private seedState(def: TaskDefinition): TaskState {
    const scope = def.scope ?? 'screen';
    if (scope === 'app' && this.appResolved.has(def.id)) return 'skipped';
    if (scope === 'fund' && this.fundResolved.get(def.id) === this.activeFund) {
      return 'skipped';
    }
    return def.conditional ? 'pendingPredicate' : 'pending';
  }

  /** Remember a resolution so later sessions can carry it forward. */
  private recordResolution(def: TaskDefinition, state: TaskState): void {
    if (!RESOLVED_STATES.has(state)) return;
    const scope = def.scope ?? 'screen';
    if (scope === 'app') this.appResolved.add(def.id);
    else if (scope === 'fund') this.fundResolved.set(def.id, this.activeFund);
  }

  private hasUnresolvedPredicates(tasks: ReadonlyMap<string, TaskRuntime>): boolean {
    return [...tasks.values()].some(t => t.state === 'pendingPredicate');
  }

  private clearStallTimer(): void {
    if (this.stallTimer !== undefined) {
      clearTimeout(this.stallTimer);
      this.stallTimer = undefined;
    }
  }

  private armStallTimer(tasks: TaskRuntime[]): void {
    this.clearStallTimer();
    const inFlight = tasks.some(t => t.state === 'inFlight' || t.state === 'retrying');
    const waiting = tasks.filter(
      t => t.def.blocking && (t.state === 'pending' || t.state === 'pendingPredicate')
    );
    if (inFlight || waiting.length === 0) return;

    this.stallTimer = setTimeout(() => {
      this.stallTimer = undefined;
      const stalled = [...this.tasks().values()].filter(
        t => t.def.blocking && (t.state === 'pending' || t.state === 'pendingPredicate')
      );
      if (!stalled.length) return;
      console.warn(
        `[Readiness] no request was issued for ${stalled
          .map(t => t.def.id)
          .join(', ')} in context "${this.contextState()}". Releasing the overlay - ` +
          `these tasks are declared but never requested, so the manifest and the ` +
          `call sites have drifted.`
      );
      // timedOut, NOT skipped: skipped is a clean resolution and would close the
      // session as `settled` at 100% - turning a wiring bug into a green, fully
      // loaded screen with no data. A hang gets reported; a false 100% does not.
      this.closeUnstarted('timedOut');
    }, ReadinessService.STALL_MS);
  }

  private patch(taskId: string, update: (task: TaskRuntime) => TaskRuntime): void {
    const current = this.tasks();
    const task = current.get(taskId);
    if (!task) return;
    const next = new Map(current);
    next.set(taskId, update(task));
    this.tasks.set(next);
  }

  /**
   * Recompute phase and percentage.
   *
   * The percentage is capped at 95 until the session actually closes, so the readout
   * cannot show completion while anything is still outstanding - and it is clamped
   * to its own peak, turning a growing denominator into a stall rather than a
   * backwards jump.
   */
  private refreshPhase(): void {
    const tasks = [...this.tasks().values()];
    if (!tasks.length) {
      this.clearStallTimer();
      return;
    }
    this.armStallTimer(tasks);

    if (this.hasUnresolvedPredicates(this.tasks())) {
      this.phaseState.set('discovering');
      return;
    }

    const blocking = tasks.filter(t => t.def.blocking);
    let total = 0;
    let done = 0;
    for (const task of blocking) {
      const weight = WEIGHTS[task.def.id] ?? DEFAULT_WEIGHT;
      total += weight;
      if (RESOLVED_STATES.has(task.state)) done += weight;
    }

    const allResolved = blocking.every(t => RESOLVED_STATES.has(t.state));
    if (allResolved) {
      this.peak.set(100);
      this.closed = true;
      this.phaseState.set(this.failedCount() > 0 ? 'degraded' : 'settled');
      return;
    }

    // Post-settle work is a refresh, not a page load: resolve it, but never re-arm
    // the blocking overlay over content the user is already reading.
    if (this.closed) return;
    this.phaseState.set('loading');
    const raw = total === 0 ? 0 : Math.floor((done / total) * 20) * 5;
    this.peak.update(previous => Math.max(previous, Math.min(95, raw)));
  }
}
