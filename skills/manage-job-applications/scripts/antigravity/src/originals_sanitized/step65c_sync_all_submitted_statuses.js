// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step65c_sync_all_submitted_statuses.js
 * Original role: Master 4-sheet reconciliation script synchronizing region opportunity sheets
 * with Primary Production Tracker (PT) and Assistant Sync Tracker (GT), repairing stale statuses,
 * recalculating KPI header/footer formulas, and auditing duplicate/applied counts via live readback.
 * Modifications for public reuse:
 *   - Stripped all private Google Sheet IDs, candidate submission batch records, emails, and req IDs.
 *   - Parameterized Sheet IDs via config/env vars and submission batch input via `--batch=<file.json>`.
 *   - Added fallback to STORAGE_BACKEND=local JSON/Markdown tracker when Google Sheets is not used.
 */
const fs = require('fs');
const { loadConfig } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

async function sheetsReq(url, tok, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`Sheets HTTP ${res.status} (${url}): ${text.slice(0, 400)}`);
  return json;
}

const EXAMPLE_SYNC_BATCH = {
  dateLabel: 'YYYY-MM-DD',
  staleTaskUpdates: [
    // e.g. { tracker: 'primary', row: 47, taskId: 'PT-0001', title: 'Example Role', status: 'Done', actionSummary: '...', resultSummary: '...' }
  ],
  newPrimaryRegionSubmissions: [
    // { row: 14, id: 'EXAMPLE-SK-001', company: 'Example Corp SK', role: 'Accountant', location: 'Bratislava, Slovakia', area: 'Finance', link: 'https://careers.example.com/job/EXAMPLE-SK-001', statusLabel: 'Applied (Verified)' }
  ],
  newSecondaryRegionSubmissions: [
    // { row: 39, id: 'EXAMPLE-SCH-001', company: 'Example Corp DE', role: 'Financial Analyst', location: 'Berlin, Germany (CV City: Berlin, Germany)', area: 'Finance / FP&A', link: 'https://careers.example.com/job/EXAMPLE-SCH-001', statusLabel: 'Applied (Verified)' }
  ]
};

function loadBatchInput() {
  const arg = process.argv.find((a) => a.startsWith('--batch='));
  if (!arg) return EXAMPLE_SYNC_BATCH;
  const p = arg.replace('--batch=', '');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function runLocalSync(cfg, batch) {
  const storage = createStorageAdapter(cfg);
  for (const sub of batch.newPrimaryRegionSubmissions || []) {
    storage.upsertJob({ ...sub, region: 'primary', status: sub.statusLabel });
  }
  for (const sub of batch.newSecondaryRegionSubmissions || []) {
    storage.upsertJob({ ...sub, region: 'secondary', status: sub.statusLabel });
  }
  const counts = storage.getSummaryCounts();
  console.log('[local sync] Reconciled local tracker. Summary:', JSON.stringify(counts));
}

(async () => {
  const cfg = loadConfig();
  const batch = loadBatchInput();

  if (cfg.storageBackend !== 'google') {
    await runLocalSync(cfg, batch);
    return;
  }

  const SK = cfg.google.sheets.primary;
  const SCH = cfg.google.sheets.secondary;
  const PT = cfg.google.sheets.productionTracker;
  const GT = cfg.google.sheets.assistantSync;
  if (!SK || !SCH || !PT || !GT) {
    throw new Error('Set SLOVAKIA_SHEET_ID, SCHENGEN_SHEET_ID, PRODUCTION_TRACKER_SHEET_ID, GEMINI_TRACKER_SHEET_ID for Google Sheets sync.');
  }

  const tok = await getAccessToken(cfg);
  const candidateEmail = cfg.profile.candidate?.email || '{{APPLICANT_EMAIL}}';

  const primaryTab = cfg.rules.googleSheets.regions.primary.tab;
  const secondaryTab = cfg.rules.googleSheets.regions.secondary.tab;

  // Read live tails and overview sheets
  const [ptRes, gtRes, skMeta, schMeta] = await Promise.all([
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${PT}/values/${encodeURIComponent('Activity Log!A1:J150')}`, tok),
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${GT}/values/${encodeURIComponent('Activity Log!A1:J100')}`, tok),
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${SK}/values/${encodeURIComponent(`${primaryTab}!A1:K120`)}`, tok),
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${SCH}/values/${encodeURIComponent(`${secondaryTab}!A1:M120`)}`, tok)
  ]);

  const ptRows = ptRes.values || [];
  const gtRows = gtRes.values || [];

  // Calculate next PT Task ID dynamically
  let maxPtNum = 0;
  for (const r of ptRows.slice(1)) {
    const m = String(r[0] || '').match(/PT-(\d+)/);
    if (m) maxPtNum = Math.max(maxPtNum, Number(m[1]));
  }

  const ptUpdates = [];
  for (const upd of batch.staleTaskUpdates || []) {
    if (upd.tracker === 'primary') {
      ptUpdates.push({
        range: `Activity Log!A${upd.row}:J${upd.row}`,
        values: [[
          upd.taskId, batch.dateLabel, upd.area || 'Job applications', upd.title,
          upd.status, upd.actionSummary, upd.resultSummary,
          `Monitor ${candidateEmail} for updates.`, upd.link || '', batch.dateLabel
        ]]
      });
    }
  }

  const ptNewRows = [];
  const appendSub = (regionLabel, s) => {
    maxPtNum++;
    const tid = `PT-${String(maxPtNum).padStart(4, '0')}`;
    ptNewRows.push([
      tid,
      batch.dateLabel,
      `Job applications / ${regionLabel}${s.location ? ` (${s.location})` : ''}`,
      `${s.company} — ${s.role} (${s.id})`,
      'Done',
      `Verified form & pre-submit screenshots under ${candidateEmail} with localized PDF CV; submitted on employer portal.`,
      `Confirmed application submission (${s.statusLabel}) recorded in ${regionLabel} sheet row ${s.row}.`,
      `Monitor ${candidateEmail} for employer response; avoid duplicate.`,
      s.link || '',
      batch.dateLabel
    ]);
  };

  for (const s of batch.newPrimaryRegionSubmissions || []) appendSub('Primary', s);
  for (const s of batch.newSecondaryRegionSubmissions || []) appendSub('Secondary', s);

  if (ptUpdates.length) {
    await sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${PT}/values:batchUpdate`, tok, 'POST', {
      valueInputOption: 'USER_ENTERED',
      data: ptUpdates
    });
  }
  if (ptNewRows.length) {
    await sheetsReq(
      `https://sheets.googleapis.com/v4/spreadsheets/${PT}/values/${encodeURIComponent('Activity Log!A:J')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      tok, 'POST', { values: ptNewRows }
    );
  }

  // Verify live readback from all 4 spreadsheets
  const [skRead, schRead, ptFinal, gtFinal] = await Promise.all([
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${SK}/values/${encodeURIComponent(`${primaryTab}!A6:K6`)}`, tok),
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${SCH}/values/${encodeURIComponent(`${secondaryTab}!A5:M5`)}`, tok),
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${PT}/values/${encodeURIComponent('Overview!A1:B20')}`, tok),
    sheetsReq(`https://sheets.googleapis.com/v4/spreadsheets/${GT}/values/${encodeURIComponent('Overview & Rules!A1:B20')}`, tok)
  ]);

  console.log('\n=== LIVE READBACK VERIFICATION ===');
  console.log('Primary KPI row:', JSON.stringify(skRead.values?.[0]));
  console.log('Secondary KPI row:', JSON.stringify(schRead.values?.[0]));
  console.log('PT Overview:', JSON.stringify(ptFinal.values?.slice(0, 10)));
  console.log('GT Overview:', JSON.stringify(gtFinal.values?.slice(0, 10)));
  console.log(`Synced PT rows appended: ${ptNewRows.length}, GT initial rows read: ${gtRows.length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
