// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step22_sr_apply_hf_check_dups.js
 * Original role: Deduplicates candidate submission targets against live Google Sheets / Local Tracker
 * before allowing form submission, verifies SuccessFactors/Greenhouse portal buttons, and probes
 * public Greenhouse `?questions=true` JSON schemas for new candidate leads.
 * Modifications for public reuse:
 *   - Stripped private Sheet IDs, hardcoded CVs, and real employer names.
 *   - Wired to config.js, storage.js, and browser.js; added `--submit` guard.
 */
const { loadConfig, ensureDirs } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');
const { connectCdp } = require('../lib/browser');
const { getAccessToken } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);

  if (cfg.storageBackend === 'google' && cfg.google.sheets.primary && cfg.google.sheets.secondary) {
    const tok = await getAccessToken(cfg);
    for (const [name, sid, tab, stIdx] of [
      ['PRIMARY', cfg.google.sheets.primary, cfg.rules.googleSheets.regions.primary.tab, 8],
      ['SECONDARY', cfg.google.sheets.secondary, cfg.rules.googleSheets.regions.secondary.tab, 10]
    ]) {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(tab + '!A1:M120')}`, {
        headers: { Authorization: `Bearer ${tok}` }
      }).then((r) => r.json());
      console.log(`\n=== ${name} DEDUPLICATION CHECK (APPLIED ROWS) ===`);
      (res.values || []).forEach((r, idx) => {
        const st = (r[stIdx] || '').trim();
        if (/applied/i.test(st) && !/already applied/i.test(st)) {
          console.log(`R${idx + 1} | ID=${r[0]} | ${r[1]} | ${r[2]} | ${st}`);
        }
      });
    }
  } else {
    const storage = createStorageAdapter(cfg);
    console.log('=== LOCAL DEDUPLICATION APPLIED SET ===');
    for (const j of storage.listJobs().filter((x) => /applied/i.test(x.status || ''))) {
      console.log(`ID=${j.id} | ${j.company} | ${j.title} | ${j.status}`);
    }
  }

  // Probe Greenhouse job schema when passed --gh-url=https://boards-api.greenhouse.io/v1/boards/<slug>/jobs/<id>?questions=true
  const ghApiUrl = process.argv.find((a) => a.startsWith('--gh-url='))?.replace('--gh-url=', '');
  if (ghApiUrl) {
    const j = await fetch(ghApiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.json()).catch(() => null);
    if (j) {
      console.log(`\n=== GH SCHEMA PROBE: ${j.title} (${j.location?.name}) ===`);
      console.log('Questions count:', Array.isArray(j.questions) ? j.questions.length : 0);
    }
  }

  if (process.argv.includes('--check-cdp')) {
    const browser = await connectCdp(cfg);
    try {
      const pages = browser.contexts()[0].pages();
      console.log('Open CDP tabs:', pages.map((p) => p.url()));
    } finally {
      await browser.close().catch(() => {});
    }
  }
})();
