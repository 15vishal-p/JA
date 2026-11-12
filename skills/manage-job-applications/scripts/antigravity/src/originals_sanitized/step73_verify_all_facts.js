// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step73_verify_all_facts.js
 * Original role: Cross-sheet & candidate-fact verification audit script validating that
 * KPI totals, Candidate Profile Summary tab facts, Confirmed Answers, and Production Tracker
 * statuses remain synchronized and free of conflicting dates or duplicate-row distortion.
 * Modifications for public reuse:
 *   - Replaced private Google Sheet IDs and hardcoded personal candidate details with
 *     config.google.sheets and config.profile comparisons.
 *   - Added STORAGE_BACKEND=local verification path using LocalStorageAdapter.
 */
const { loadConfig } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

async function getValues(tok, sheetId, range) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${tok}` } }
  );
  const j = await res.json();
  if (!res.ok) throw new Error(`${sheetId} ${range} HTTP ${res.status}: ${JSON.stringify(j)}`);
  return j.values || [];
}

function summarizeTrackerLog(rows) {
  let done = 0, inProgress = 0, blocked = 0, notStarted = 0;
  for (const r of rows.slice(1)) {
    const st = String(r[4] || '').trim().toLowerCase();
    if (!st) continue;
    if (st === 'done') done++;
    else if (st === 'in progress') inProgress++;
    else if (st === 'blocked') blocked++;
    else if (st === 'not started') notStarted++;
  }
  return { total: done + inProgress + blocked + notStarted, done, inProgress, blocked, notStarted };
}

(async () => {
  const cfg = loadConfig();

  if (cfg.storageBackend !== 'google') {
    const storage = createStorageAdapter(cfg);
    const counts = storage.getSummaryCounts();
    const answers = storage.listConfirmedAnswers();
    console.log('=== LOCAL STORAGE FACT AUDIT ===');
    console.log('Candidate:', cfg.profile.candidate?.fullName, '| Email:', cfg.profile.candidate?.email);
    console.log('Tracker Counts:', JSON.stringify(counts));
    console.log('Confirmed Answers entries:', answers.length);
    return;
  }

  const SK = cfg.google.sheets.primary;
  const SCH = cfg.google.sheets.secondary;
  const PT = cfg.google.sheets.productionTracker;
  const GT = cfg.google.sheets.assistantSync;
  if (!SK || !SCH || !PT || !GT) {
    throw new Error('Set all 4 Sheet IDs in .env when running step73_verify_all_facts under STORAGE_BACKEND=google.');
  }

  const tok = await getAccessToken(cfg);
  const primaryTab = cfg.rules.googleSheets.regions.primary.tab;
  const secondaryTab = cfg.rules.googleSheets.regions.secondary.tab;

  const [skVals, schVals, profVals, ansVals, ptLog, gtLog] = await Promise.all([
    getValues(tok, SK, `${primaryTab}!A1:K120`),
    getValues(tok, SCH, `${secondaryTab}!A1:M120`),
    getValues(tok, SK, 'Candidate Profile Summary!A1:F45'),
    getValues(tok, SK, 'Confirmed Answers!A1:F30'),
    getValues(tok, PT, 'Activity Log!A1:J150'),
    getValues(tok, GT, 'Activity Log!A1:J100')
  ]);

  console.log('=== 1. PRIMARY & SECONDARY SHEET KPIS ===');
  console.log('Primary R6:', JSON.stringify(skVals[5] || []));
  console.log('Secondary R5:', JSON.stringify(schVals[4] || []));

  console.log('\n=== 2. CANDIDATE PROFILE SUMMARY CONSISTENCY CHECK ===');
  const flatProf = profVals.map((r) => r.join(' ')).join('\n');
  const candEmail = cfg.profile.candidate?.email || '';
  const candCity = cfg.profile.candidate?.homeCity || '';
  console.log('Profile contains configured email:', Boolean(candEmail && flatProf.includes(candEmail)));
  console.log('Profile contains home city:', Boolean(candCity && flatProf.includes(candCity)));
  console.log('Confirmed Answers rows:', ansVals.length);

  console.log('\n=== 3. TRACKER OVERVIEW RECONCILIATION ===');
  console.log('PT Activity Log summary:', JSON.stringify(summarizeTrackerLog(ptLog)));
  console.log('GT Activity Log summary:', JSON.stringify(summarizeTrackerLog(gtLog)));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
