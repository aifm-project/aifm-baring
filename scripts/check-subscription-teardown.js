#!/usr/bin/env node
/**
 * Fails when a component, pipe or directive subscribes without tearing down.
 *
 * This exists because untorn-down subscriptions caused real, user-visible bugs here
 * and are invisible to every unit test in the suite:
 *
 *   - web-documents and documents-preview kept calling the document APIs from
 *     DESTROYED components on every later fund change, so the Portfolio tab was seen
 *     issuing document-types / document-list / latest-documents.
 *   - fund-selector's router subscription outlived the component, which the layout
 *     destroys and rebuilds via *ngIf, so a tab switch fired the dates request once
 *     per past visit to insights/notifications/profile.
 *   - GetCurrencyByUnitsPipe subscribed in its constructor with no teardown, and it
 *     is instantiated once per binding - the holdings table binds it inside an
 *     *ngFor, so every fund change minted a fresh leaking set.
 *
 * The app has no ESLint setup, so this is a plain Node check with no dependencies.
 * If ESLint is ever added, replace this with rxjs-angular-x/prefer-takeuntil
 * configured with { alias: ['takeUntilDestroyed'], checkDecorators: ['Component',
 * 'Directive', 'Pipe'] } - a real rule beats a regex.
 *
 * Usage: node scripts/check-subscription-teardown.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'app');

/** Teardown mechanisms that count as managing a subscription's lifetime. */
const TEARDOWN = [
  'takeUntilDestroyed',
  'takeUntil(',
  'selectedFundDate$', // shared helper; applies takeUntilDestroyed internally
  '.unsubscribe()',
  'ngOnDestroy',
  'first()',
  'take(1)',
];

/**
 * Files exempt from the check, each with a stated reason. Add here only when the
 * subscription provably cannot outlive its consumer.
 */
const ALLOWLIST = new Map([
  // Unauthenticated screens are torn down by a full page navigation on success.
  ['unauthenticated/user/login/login.component.ts', 'full reload on auth transition'],
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(component|pipe|directive)\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (ALLOWLIST.has(rel)) continue;

  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('.subscribe(')) continue;
  if (TEARDOWN.some(marker => src.includes(marker))) continue;

  // Count only long-lived sources. A one-shot HTTP call completes on its own.
  const longLived = /\.(select|events|pipe)\(|Subject|BehaviorSubject|valueChanges/.test(src);
  if (!longLived) continue;

  offenders.push(rel);
}

if (offenders.length) {
  console.error('\nSubscriptions without teardown:\n');
  for (const file of offenders) console.error(`  src/app/${file}`);
  console.error(
    '\nA subscription to a long-lived source (store.select, router.events, a Subject,\n' +
      'valueChanges) outlives the component unless it is torn down. Where the callback\n' +
      'fetches, the destroyed component keeps issuing requests forever.\n\n' +
      'Fix: .pipe(takeUntilDestroyed(this.destroyRef)) with\n' +
      '     private readonly destroyRef = inject(DestroyRef);\n'
  );
  process.exit(1);
}

console.log('Subscription teardown check passed.');
