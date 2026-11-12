// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step64d_check_chrome_and_formulas.js
 * Original role: Checks active Chrome CDP tabs, reads top/bottom Google Sheets `FORMULA` strings
 * (`valueRenderOption=FORMULA`) to verify KPI header/footer bounds, and inventories confirmation screenshots.
 * Modifications for public reuse:
 *   - Stripped private Sheet IDs, hardcoded row numbers, and personal Windows brain directory paths.
 *   - Parameterized via src/lib/config.js and src/lib/browser.js.
 */
const fs = require('fs');
const { loadConfig } = require('../lib/config');
const { connectCdp } = require('../lib/browser');
const { getAccessToken } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();

  try {
    const browser = await connectCdp(cfg);
    console.log('=== CHROME OPEN TABS ===');
    for (const ctx of browser.contexts()) {
      for (const p of ctx.pages()) {
        const title = await p.title().catch(() => '');
        console.log(`TAB: ${p.url()} | TITLE: ${title}`);
      }
    }
    await browser.close().catch(() => {});
  } catch (e) {
    console.log('CDP unavailable (start Chrome with --remote-debugging-port=9222):', e.message);
  }

  if (cfg.storageBackend === 'google' && cfg.google.sheets.primary && cfg.google.sheets.secondary) {
    const tok = await getAccessToken(cfg);
    const pTab = cfg.rules.googleSheets.regions.primary.tab;
    const sTab = cfg.rules.googleSheets.regions.secondary.tab;

    for (const [label, sid, range] of [
      ['PRIMARY_FORMULAS_TOP', cfg.google.sheets.primary, `${pTab}!A1:M10`],
      ['PRIMARY_FORMULAS_BOT', cfg.google.sheets.primary, `${pTab}!A80:M100`],
      ['SECONDARY_FORMULAS_TOP', cfg.google.sheets.secondary, `${sTab}!A1:M10`],
      ['SECONDARY_FORMULAS_BOT', cfg.google.sheets.secondary, `${sTab}!A80:M100`]
    ]) {
      const u = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${encodeURIComponent(range)}?valueRenderOption=FORMULA`;
      const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } }).then((x) => x.json());
      console.log(`\n=== ${label} ===`);
      (r.values || []).forEach((row, i) => {
        if (row.some((c) => String(c || '').startsWith('='))) {
          console.log(`+${i}:`, row.join(' | '));
        }
      });
    }
  }

  if (fs.existsSync(cfg.paths.artifactsDir)) {
    const shots = fs.readdirSync(cfg.paths.artifactsDir).filter((f) => f.startsWith('confirmed_') || f.startsWith('pre_'));
    console.log('\n=== LOCAL ARTIFACT SCREENSHOTS ===');
    console.log(shots.join('\n') || '(none)');
  }
})().catch((e) => console.error(e));
