// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step74_inspect_tails.js
 * Original role: Inspects trailing rows, summary footers, and formula anchors across
 * all 4 tracking sheets (Primary Market, Secondary Market, Production Tracker, Assistant Sync)
 * to catch shifted footer indices or appended rows outside COUNTIF bounds.
 * Modifications for public reuse:
 *   - Parameterized Sheet IDs and tab names from src/lib/config.js.
 *   - Added clean STORAGE_BACKEND=local fallback summary.
 */
const { loadConfig } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

async function getValues(tok, id, range, renderOption = 'FORMATTED_VALUE') {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}?valueRenderOption=${renderOption}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  const j = await res.json();
  return j.values || [];
}

(async () => {
  const cfg = loadConfig();

  if (cfg.storageBackend !== 'google') {
    const storage = createStorageAdapter(cfg);
    const jobs = storage.listJobs();
    console.log('=== LOCAL STORAGE TAIL INSPECTION ===');
    console.log('Total jobs:', jobs.length);
    console.log('Last 5 jobs:', JSON.stringify(jobs.slice(-5), null, 2));
    return;
  }

  const SK = cfg.google.sheets.primary;
  const SCH = cfg.google.sheets.secondary;
  const PT = cfg.google.sheets.productionTracker;
  const GT = cfg.google.sheets.assistantSync;
  if (!SK || !SCH || !PT || !GT) {
    throw new Error('Missing Sheet IDs in environment for Google Sheets mode.');
  }

  const tok = await getAccessToken(cfg);
  const primaryTab = cfg.rules.googleSheets.regions.primary.tab;
  const secondaryTab = cfg.rules.googleSheets.regions.secondary.tab;

  const [skTail, schTail, ptTail, gtTail, skForm, schForm] = await Promise.all([
    getValues(tok, SK, `${primaryTab}!A75:K110`),
    getValues(tok, SCH, `${secondaryTab}!A75:M110`),
    getValues(tok, PT, 'Activity Log!A70:J120'),
    getValues(tok, GT, 'Activity Log!A25:J80'),
    getValues(tok, SK, `${primaryTab}!A80:K95`, 'FORMULA'),
    getValues(tok, SCH, `${secondaryTab}!A80:M95`, 'FORMULA')
  ]);

  console.log('=== PRIMARY TAIL (R75+) ===');
  skTail.forEach((r, i) => { if (r.some(Boolean)) console.log(`R${75 + i}:`, r.slice(0, 5), '| st=', r[8]); });

  console.log('\n=== PRIMARY FOOTER FORMULAS ===');
  skForm.forEach((r, i) => { if (r.some((c) => String(c || '').startsWith('='))) console.log(`Formula R${80 + i}:`, JSON.stringify(r)); });

  console.log('\n=== SECONDARY TAIL (R75+) ===');
  schTail.forEach((r, i) => { if (r.some(Boolean)) console.log(`R${75 + i}:`, r.slice(0, 5), '| st=', r[10]); });

  console.log('\n=== SECONDARY FOOTER FORMULAS ===');
  schForm.forEach((r, i) => { if (r.some((c) => String(c || '').startsWith('='))) console.log(`Formula R${80 + i}:`, JSON.stringify(r)); });

  console.log('\n=== PT ACTIVITY LOG TAIL (R70+) ===');
  ptTail.forEach((r, i) => { if (r.some(Boolean)) console.log(`R${70 + i}:`, r[0], '|', r[1], '|', r[4], '|', (r[3] || '').slice(0, 60)); });

  console.log('\n=== GT ACTIVITY LOG TAIL (R25+) ===');
  gtTail.forEach((r, i) => { if (r.some(Boolean)) console.log(`R${25 + i}:`, r[0], '|', r[1], '|', r[4], '|', (r[3] || '').slice(0, 60)); });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
