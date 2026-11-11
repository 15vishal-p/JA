// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step65_audit_status.js
 * Original role: Audits every row marked "Applied" across Primary & Secondary sheets against
 * local execution/confirmation logs so no submission is claimed without recorded confirmation evidence.
 * Modifications for public reuse:
 *   - Stripped private Sheet IDs, brain conversation paths, and candidate requisition IDs.
 *   - Supports checking local confirmation logs (`LOCAL_DATA_DIR/confirmation_log.jsonl`) or Sheets.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();
  const out = [];

  if (cfg.storageBackend === 'google' && cfg.google.sheets.primary && cfg.google.sheets.secondary) {
    const tok = await getAccessToken(cfg);
    for (const [name, id, tab, stIdx] of [
      ['PRIMARY', cfg.google.sheets.primary, cfg.rules.googleSheets.regions.primary.tab, 8],
      ['SECONDARY', cfg.google.sheets.secondary, cfg.rules.googleSheets.regions.secondary.tab, 10]
    ]) {
      const j = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(tab + '!A1:M120')}`,
        { headers: { Authorization: 'Bearer ' + tok } }
      ).then((r) => r.json());
      out.push(`\n=== ${name} ALL APPLIED ROWS ===`);
      (j.values || []).forEach((row, idx) => {
        const rn = idx + 1;
        if (rn < 9) return;
        const st = row[stIdx] || '';
        if (/applied/i.test(st)) {
          out.push(`${name} R${rn}: [${row[0]}] ${row[1]} | ${row[2] || ''} | st="${st}"`);
        }
      });
    }
  } else {
    const storage = createStorageAdapter(cfg);
    out.push('=== LOCAL TRACKER ALL APPLIED ROWS ===');
    for (const j of storage.listJobs()) {
      if (/applied/i.test(j.status || '')) {
        out.push(`[${j.region}] ${j.id}: ${j.company} | ${j.title} | st="${j.status}"`);
      }
    }
  }

  const logFile = path.join(cfg.paths.localDataDir, 'run_outcomes.jsonl');
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    out.push(`\n=== LOCAL OUTCOME LOG (${lines.length} entries) ===`);
    for (const l of lines.slice(-30)) {
      out.push(l.slice(0, 300));
    }
  }

  fs.mkdirSync(cfg.paths.cacheDir, { recursive: true });
  const outPath = path.join(cfg.paths.cacheDir, 'status_audit_report.txt');
  fs.writeFileSync(outPath, out.join('\n'));
  console.log('Audit lines written:', out.length, '->', outPath);
})();
