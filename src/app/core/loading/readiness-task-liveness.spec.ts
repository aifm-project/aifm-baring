import { READINESS_MANIFEST, TASK } from './readiness.model';

/**
 * Liveness gate: every task a manifest declares must actually be tagged on a real
 * request somewhere in the app.
 *
 * This is the spec that would have caught the INSIGHTS manifest. Two tasks were
 * declared for /insights, but neither `getExplorTypes()` nor the news-and-insights
 * `getExploreDetails()` call passed a task id - so nothing would ever have moved
 * them out of `pending`, and the overlay would have hung at 0% forever. Exactly the
 * bug the manifest was added to fix, reproduced one level down.
 *
 * The call-site inventory below is maintained by hand on purpose: a static scan of
 * the source from inside Karma is not available, and an explicit list makes the
 * omission visible in review. Adding a task to a manifest without adding it here
 * fails, which is the prompt to go and tag the request.
 */
const TAGGED_CALL_SITES: Readonly<Record<string, string>> = {
  [TASK.FUNDS]: 'fund-selector -> fundService.getFunds',
  [TASK.INVESTOR_TOKEN]: 'fund-selector -> fundService.getFundInvestorToken',
  [TASK.DATES]: 'fund-selector -> fundService.getDates',
  [TASK.OVERVIEW]: 'overview -> fundService.getPerformanceData',
  [TASK.PERFORMANCE]: 'performance -> fundService.getPerformanceData (x2)',
  [TASK.HOLDINGS]: 'investment-table -> fundService.getDates + portfolioData',
  [TASK.PORTFOLIO_SUMMARY]: 'portfolio-overview -> fundService.portfolioData',
  [TASK.DISTRIBUTION]: 'distribution-chart -> fundService.portfolioData',
  [TASK.DOCUMENT_TYPES]: 'web-documents -> documentService.getDocumentTypes',
  [TASK.DOCUMENT_LIST]: 'web-documents -> documentService.loadDocuments',
  [TASK.INSIGHTS]: 'insights + news-and-insights -> explorService.getExploreDetails',
  [TASK.INSIGHT_TYPES]: 'news-and-insights -> explorService.getExplorTypes',
  [TASK.LATEST_DOCUMENTS]: 'documents-preview -> documentService.loadLatestDocuments',
};

describe('readiness task liveness', () => {
  it('every manifest task is tagged on a real request', () => {
    const untagged: string[] = [];
    for (const [context, tasks] of Object.entries(READINESS_MANIFEST)) {
      for (const task of tasks) {
        if (!TAGGED_CALL_SITES[task.id]) untagged.push(`${context}/${task.id}`);
      }
    }
    expect(untagged)
      .withContext(
        'These tasks are declared but no request tags them, so they can never ' +
          'settle and the overlay will hang. Tag the call site, or remove the task.'
      )
      .toEqual([]);
  });

  it('every TASK constant is used by at least one manifest', () => {
    const used = new Set<string>();
    for (const tasks of Object.values(READINESS_MANIFEST)) {
      for (const task of tasks) used.add(task.id);
    }
    const orphans = Object.values(TASK).filter(id => !used.has(id));
    expect(orphans).withContext('TASK constants no manifest references').toEqual([]);
  });

  it('has no stale call-site entries', () => {
    const declared = new Set<string>();
    for (const tasks of Object.values(READINESS_MANIFEST)) {
      for (const task of tasks) declared.add(task.id);
    }
    const stale = Object.keys(TAGGED_CALL_SITES).filter(id => !declared.has(id));
    expect(stale).withContext('call sites listed for tasks no manifest declares').toEqual([]);
  });
});
