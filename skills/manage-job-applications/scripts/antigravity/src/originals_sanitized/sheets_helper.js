/**
 * SANITIZED ORIGINAL SCRIPT: sheets_helper.js
 * Original role: Google OAuth refresh-token exchange, spreadsheet status updates,
 * Confirmed Answers reader, and dead-link/company-close batch utility.
 * Modifications for public reuse:
 *   - Removed hardcoded Google OAuth clientId/clientSecret and private Sheet IDs.
 *   - Removed hardcoded Windows Temp token file paths; wired to src/lib/secrets.js and env vars.
 *   - Added transparent fallback to src/lib/storage.js local folder mode when STORAGE_BACKEND=local.
 */
const fs = require('fs');
const { loadConfig } = require('../lib/config');
const { getGoogleOAuthClient, readTokenFile, writeTokenFile } = require('../lib/secrets');
const { createStorageAdapter } = require('../lib/storage');

async function getAccessToken(cfg = null) {
  const conf = cfg || loadConfig();
  const tokenPath = conf.paths.googleTokenPath;
  const tok = readTokenFile(tokenPath);
  if (!tok || !tok.refreshToken) {
    throw new Error(
      `Missing Google OAuth token file at ${tokenPath}. Place your private OAuth token JSON there (chmod 600) or switch STORAGE_BACKEND=local.`
    );
  }

  const oauth = getGoogleOAuthClient();
  if (!oauth.configured) {
    throw new Error(
      'Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in environment. Set them in .env or switch STORAGE_BACKEND=local.'
    );
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      refresh_token: tok.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const j = await res.json();
  if (!j.access_token) {
    throw new Error('Token refresh failed: ' + JSON.stringify(j));
  }
  const existing = fs.existsSync(tokenPath) ? JSON.parse(fs.readFileSync(tokenPath, 'utf8')) : {};
  existing.access_token = j.access_token;
  writeTokenFile(tokenPath, existing);
  return j.access_token;
}

async function updateStatus(region, jobId, statusText, cfg = null) {
  const conf = cfg || loadConfig();
  if (!String(jobId || '').trim()) throw new Error('A nonempty exact job ID is required.');
  if (conf.storageBackend !== 'google') {
    const local = createStorageAdapter(conf);
    const updated = await local.updateStatus(region, jobId, statusText);
    console.log(`Local tracker updated (${updated} match(es)) for ${region} [${jobId}] -> ${statusText}`);
    return updated;
  }

  const isPrimary = /slovakia|primary/i.test(region);
  const sheetId = isPrimary ? conf.google.sheets.primary : conf.google.sheets.secondary;
  if (!sheetId) {
    throw new Error(`Missing Sheet ID env var for region "${region}".`);
  }

  const regionCfg = isPrimary ? conf.rules.googleSheets.regions.primary : conf.rules.googleSheets.regions.secondary;
  const tab = regionCfg.tab;
  const col = regionCfg.statusColumn;

  const token = await getAccessToken(conf);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!A9:M120`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r[0] && String(jobId || '').trim() && r[0].toString().trim().toLowerCase() === String(jobId).trim().toLowerCase()) {
      const rowNum = 9 + i;
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}!${col}${rowNum}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: [[statusText]] })
        }
      );
      const uJson = await updateRes.json();
      console.log(`Updated ${tab} R${rowNum} (${r[0]} - ${r[1]}) -> ${statusText} |`, uJson.updatedCells ? 'OK' : uJson);
      updated++;
    }
  }
  return updated;
}

async function getConfirmedAnswersAndCounts(cfg = null) {
  const conf = cfg || loadConfig();
  if (!String(jobId || '').trim()) throw new Error('A nonempty exact job ID is required.');
  if (conf.storageBackend !== 'google') {
    const local = createStorageAdapter(conf);
    return {
      mode: 'local',
      primary: local.listJobs('primary'),
      secondary: local.listJobs('secondary'),
      confirmed: local.listConfirmedAnswers()
    };
  }

  const token = await getAccessToken(conf);
  const primarySheetId = conf.google.sheets.primary;
  const secondarySheetId = conf.google.sheets.secondary;
  if (!primarySheetId || !secondarySheetId) {
    throw new Error('SLOVAKIA_SHEET_ID and SCHENGEN_SHEET_ID must be set when STORAGE_BACKEND=google.');
  }

  const primaryTab = conf.rules.googleSheets.regions.primary.tab;
  const secondaryTab = conf.rules.googleSheets.regions.secondary.tab;

  const [r1, r2, r3] = await Promise.all([
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${primarySheetId}/values/${encodeURIComponent(primaryTab)}!A8:M120`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${secondarySheetId}/values/${encodeURIComponent(secondaryTab)}!A8:M120`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${primarySheetId}/values/${encodeURIComponent('Confirmed Answers!A1:F50')}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
  ]);

  return {
    mode: 'google',
    primary: r1.values || [],
    secondary: r2.values || [],
    confirmed: r3.values || []
  };
}

async function runCli() {
  const conf = loadConfig();
  const args = process.argv.slice(2);

  if (args[0] === 'close-dead-links') {
    // Pass comma-separated closed IDs via --ids=ID1,ID2
    const idsArg = args.find((a) => a.startsWith('--ids=')) || '';
    const closedIds = idsArg.replace('--ids=', '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const id of closedIds) {
      await updateStatus('secondary', id, 'Closed / Expired', conf);
    }
  } else if (args[0] === 'counts') {
    const res = await getConfirmedAnswersAndCounts(conf);
    console.log(JSON.stringify({
      mode: res.mode,
      primaryCount: res.primary.length,
      secondaryCount: res.secondary.length,
      confirmedAnswersCount: res.confirmed.length
    }, null, 2));
  } else if (args[0] === 'update') {
    const [, region, jobId, ...rest] = args;
    if (!region || !jobId || !rest.length) {
      console.error('Usage: node sheets_helper.js update <primary|secondary> <jobId> <statusText>');
      process.exit(1);
    }
    await updateStatus(region, jobId, rest.join(' '), conf);
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  getAccessToken,
  updateStatus,
  getConfirmedAnswersAndCounts
};
