// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step74b_check_sch_ready_and_timeline.js
 * Original role: Lists all remaining "Ready"/"Staged" candidate leads in the secondary market
 * tracker alongside the tail of the Production Tracker activity log for quick session resume.
 * Modifications for public reuse:
 *   - Parameterized Sheet IDs and tab names from src/lib/config.js.
 *   - Added STORAGE_BACKEND=local fallback.
 */
const { loadConfig } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();

  if (cfg.storageBackend !== 'google') {
    const storage = createStorageAdapter(cfg);
    const jobs = storage.listJobs('secondary').filter((j) => /ready|staged/i.test(j.status || ''));
    console.log('=== LOCAL SECONDARY READY/STAGED QUEUE ===');
    jobs.forEach((j) => console.log(`[${j.id}] ${j.company} | ${j.title} | ${j.location} | ${j.status}`));
    return;
  }

  const SCH = cfg.google.sheets.secondary;
  const PT = cfg.google.sheets.productionTracker;
  if (!SCH || !PT) {
    throw new Error('SCHENGEN_SHEET_ID and PRODUCTION_TRACKER_SHEET_ID are required in Google mode.');
  }

  const tok = await getAccessToken(cfg);
  const secondaryTab = cfg.rules.googleSheets.regions.secondary.tab;

  const [schRes, ptRes] = await Promise.all([
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SCH}/values/${encodeURIComponent(`${secondaryTab}!A9:M120`)}`, {
      headers: { Authorization: `Bearer ${tok}` }
    }).then((r) => r.json()),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${PT}/values/${encodeURIComponent('Activity Log!A75:J120')}`, {
      headers: { Authorization: `Bearer ${tok}` }
    }).then((r) => r.json())
  ]);

  console.log('=== REMAINING READY/STAGED ROWS ===');
  (schRes.values || []).forEach((r, idx) => {
    const rowNum = 9 + idx;
    const st = String(r[10] || '');
    if (/ready|staged/i.test(st)) {
      console.log(`R${rowNum}: [${r[0]}] ${r[1]} | ${r[3]} | ${r[4]} | st="${st}"`);
    }
  });

  console.log('\n=== LATEST PRODUCTION TRACKER ACTIVITY TAIL ===');
  (ptRes.values || []).forEach((r, idx) => {
    if (r[0]) console.log(`R${75 + idx}: ${r[0]} | ${r[1]} | ${r[4]} | ${r[3]}`);
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
