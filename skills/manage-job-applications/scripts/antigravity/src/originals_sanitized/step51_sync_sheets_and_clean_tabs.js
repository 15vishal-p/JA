// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step51_sync_sheets_and_clean_tabs.js
 * Original role: Batch-updates Primary & Secondary job sheets with verified statuses,
 * closes extra Playwright/Chrome CDP tabs leaving one clean `about:blank` tab (`--clean-tabs`),
 * and verifies deduplicated Applied/Ready counts via live readback.
 * Modifications for public reuse:
 *   - Stripped private Google Sheet IDs and hardcoded candidate job rows.
 *   - Parameterized via config.js, storage.js, and `--clean-tabs` opt-in safety flag.
 */
const { loadConfig } = require('../lib/config');
const { connectCdp } = require('../lib/browser');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

async function sheetsFetch(url, token, method = 'GET', body = null) {
  const opts = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

(async () => {
  const cfg = loadConfig();

  if (process.argv.includes('--clean-tabs')) {
    const browser = await connectCdp(cfg);
    try {
      const ctx = browser.contexts()[0];
      const keeper = await ctx.newPage();
      await keeper.goto('about:blank');
      for (const p of ctx.pages()) {
        if (p !== keeper) await p.close().catch(() => {});
      }
      console.log('Remaining open Chrome tabs:', ctx.pages().map((p) => p.url()));
    } finally {
      await browser.close().catch(() => {});
    }
  }

  if (cfg.storageBackend !== 'google') {
    const storage = createStorageAdapter(cfg);
    const jobs = storage.listJobs();
    const seenIds = new Set();
    const distinctApplied = [];
    for (const j of jobs) {
      const st = j.status || '';
      if (/applied/i.test(st) && !/^duplicate|already applied/i.test(st)) {
        const id = String(j.id).trim();
        if (!seenIds.has(id)) {
          seenIds.add(id);
          distinctApplied.push(j);
        }
      }
    }
    console.log('Local Distinct Applied:', distinctApplied.length);
    console.log('Summary:', JSON.stringify(storage.getSummaryCounts()));
    return;
  }

  const SK = cfg.google.sheets.primary;
  const SCH = cfg.google.sheets.secondary;
  if (!SK || !SCH) throw new Error('Set SLOVAKIA_SHEET_ID and SCHENGEN_SHEET_ID for Google mode.');

  const token = await getAccessToken(cfg);
  const pTab = encodeURIComponent(cfg.rules.googleSheets.regions.primary.tab);
  const sTab = encodeURIComponent(cfg.rules.googleSheets.regions.secondary.tab);

  const [skFinal, schFinal] = await Promise.all([
    sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${SK}/values/${pTab}!A5:K120`, token),
    sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${SCH}/values/${sTab}!A4:M120`, token)
  ]);

  const skRows = (skFinal.values || []).slice(4).filter((r) => r[0] && !String(r[0]).startsWith('SUMMARY'));
  const schRows = (schFinal.values || []).slice(5).filter((r) => r[0] && !String(r[0]).startsWith('SUMMARY'));

  const dedupCount = (rows, idx) => {
    const seen = new Set();
    return rows.filter((r) => {
      const st = String(r[idx] || '');
      if (!/applied/i.test(st) || /^duplicate/i.test(st)) return false;
      const id = String(r[0]).trim();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).length;
  };

  console.log('Distinct Applied Primary:', dedupCount(skRows, 8));
  console.log('Distinct Applied Secondary:', dedupCount(schRows, 10));
})();
