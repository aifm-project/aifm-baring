import { Routes } from '@angular/router';
import { routes } from '../../app.routes';
import { READINESS_MANIFEST, ReadinessContext, TASK } from './readiness.model';

/**
 * Coverage gates for the readiness manifest.
 *
 * Three bugs shipped from the same root cause - a route whose readiness context was
 * missing, wrong, or unreachable:
 *
 *   /documents  had no session at all (the URL strings it was matched against did
 *               not include it), so the previous screen's checklist stayed visible.
 *   /insights   had no context and the lookup DEFAULTED to DASHBOARD, seeding tasks
 *               that route never requests. The overlay hung at 10% forever.
 *   INSIGHTS    was then added as a manifest with two tasks that no call site
 *               tagged - which would have hung at 0% for the same reason.
 *
 * Unit tests of the service passed through every one of them, because none of this
 * is service logic: it is wiring between routes, manifests and call sites. These
 * specs assert that wiring directly.
 */

/**
 * The deliberate decision for every routable path in the app.
 *
 * Adding a route without adding it here fails the first spec. That is the point: the
 * failure mode being prevented is somebody adding a screen and never deciding
 * whether it loads anything.
 */
const ROUTE_READINESS_DECISION: Readonly<Record<string, ReadinessContext | 'NONE'>> = {
  user: 'NONE', // unauthenticated; login has its own inline spinner
  '': 'NONE', // DefaultLandingGuard only redirects
  dashboard: 'DASHBOARD',
  portfolio: 'PORTFOLIO',
  documents: 'DOCUMENTS',
  insights: 'INSIGHTS',
  notifications: 'NONE', // makes no HTTP calls
  profile: 'NONE', // userService is mocked - of(...).pipe(delay), not HTTP
  '**': 'NONE', // wildcard redirect
};

/** Every path in the route tree, with the readinessContext declared on it. */
function flatten(rs: Routes, out: Array<{ path: string; context?: string }> = []) {
  for (const route of rs) {
    if (route.path !== undefined) {
      out.push({ path: route.path, context: route.data?.['readinessContext'] });
    }
    if (route.children) flatten(route.children, out);
  }
  return out;
}

describe('readiness route coverage', () => {
  const declared = flatten(routes);

  it('every route has an explicit readiness decision', () => {
    const undecided = declared
      .map(r => r.path)
      .filter(path => !(path in ROUTE_READINESS_DECISION));
    expect(undecided)
      .withContext(
        'Add each path to ROUTE_READINESS_DECISION with its context, or "NONE" if ' +
          'the screen loads nothing. Never let it fall back to a default context.'
      )
      .toEqual([]);
  });

  it('each route declares the context its decision says it should', () => {
    for (const { path, context } of declared) {
      const decision = ROUTE_READINESS_DECISION[path];
      if (decision === undefined) continue; // reported by the spec above
      if (decision === 'NONE') {
        expect(context)
          .withContext(`route "${path}" should declare no readinessContext`)
          .toBeUndefined();
      } else {
        expect(context)
          .withContext(`route "${path}" should declare readinessContext ${decision}`)
          .toBe(decision);
      }
    }
  });

  it('every declared context exists in the manifest', () => {
    for (const { path, context } of declared) {
      if (!context) continue;
      expect(Object.keys(READINESS_MANIFEST))
        .withContext(`route "${path}" declares unknown context "${context}"`)
        .toContain(context);
    }
  });

  it('every manifest is reachable from at least one route', () => {
    // An orphan manifest is dead weight that will drift out of sync unnoticed.
    const used = new Set(declared.map(r => r.context).filter(Boolean));
    for (const context of Object.keys(READINESS_MANIFEST)) {
      expect(used.has(context))
        .withContext(`manifest "${context}" is not referenced by any route`)
        .toBe(true);
    }
  });

  it('every manifest task id is a known TASK constant', () => {
    const known = new Set<string>(Object.values(TASK));
    for (const [context, tasks] of Object.entries(READINESS_MANIFEST)) {
      for (const task of tasks) {
        expect(known.has(task.id))
          .withContext(`${context} declares unknown task id "${task.id}"`)
          .toBe(true);
      }
    }
  });

  it('no manifest declares the same task twice', () => {
    for (const [context, tasks] of Object.entries(READINESS_MANIFEST)) {
      const ids = tasks.map(t => t.id);
      expect(new Set(ids).size).withContext(`${context} has duplicate task ids`).toBe(ids.length);
    }
  });

  it('every context has at least one blocking task', () => {
    // A manifest of only non-blocking tasks would settle instantly and the overlay
    // would never mean anything.
    for (const [context, tasks] of Object.entries(READINESS_MANIFEST)) {
      expect(tasks.some(t => t.blocking))
        .withContext(`${context} declares no blocking work`)
        .toBe(true);
    }
  });
});
