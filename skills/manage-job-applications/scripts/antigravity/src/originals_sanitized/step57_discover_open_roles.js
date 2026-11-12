// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step57_discover_open_roles.js
 * Original role: Probes Greenhouse, Ashby, and SmartRecruiters public ATS JSON APIs,
 * deduplicates against already-tracked Job IDs and (company|title) keys, filters out
 * senior/excluded roles and non-target geographies, and prioritizes Tier-1 locations.
 * Modifications for public reuse:
 *   - Replaced hardcoded board list & Schengen Sheet ID with config/targets.json and storage adapter.
 *   - Supports both STORAGE_BACKEND=local and STORAGE_BACKEND=google for deduplication.
 */
const { loadConfig } = require('../lib/config');
const { connectCdp } = require('../lib/browser');
const { createStorageAdapter } = require('../lib/storage');
const { getAccessToken } = require('./sheets_helper');

async function fetchJson(url) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

async function probeBoard(b) {
  const out = [];
  if (b.ats === 'greenhouse' || b.ats === 'greenhouse-eu') {
    const host = b.eu ? 'boards-api.eu.greenhouse.io' : 'boards-api.greenhouse.io';
    const d = await fetchJson(`https://${host}/v1/boards/${b.slug}/jobs`);
    if (d && Array.isArray(d.jobs)) {
      for (const j of d.jobs) {
        out.push({
          company: b.company,
          ats: b.eu ? 'greenhouse-eu' : 'greenhouse',
          id: String(j.id),
          title: j.title || '',
          loc: j.location?.name || '',
          url: j.absolute_url || ''
        });
      }
    }
  } else if (b.ats === 'ashby') {
    const d = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${b.slug}`);
    if (d && Array.isArray(d.jobs)) {
      for (const j of d.jobs) {
        out.push({
          company: b.company,
          ats: 'ashby',
          id: String(j.id || '').slice(0, 12),
          title: j.title || '',
          loc: j.location || (Array.isArray(j.secondaryLocations) ? j.secondaryLocations.map((l) => l.location).join(', ') : ''),
          url: j.jobUrl || j.applyUrl || ''
        });
      }
    }
  } else if (b.ats === 'smartrecruiters') {
    const d = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${b.slug}/postings?limit=100`);
    if (d && Array.isArray(d.content)) {
      for (const j of d.content) {
        const loc = [j.location?.city, j.location?.country].filter(Boolean).join(', ');
        out.push({
          company: b.company,
          ats: 'smartrecruiters',
          id: String(j.id),
          title: j.name || '',
          loc,
          url: `https://jobs.smartrecruiters.com/${b.slug}/${j.id}`
        });
      }
    }
  }
  return out;
}

(async () => {
  const cfg = loadConfig();
  const roleRx = new RegExp(cfg.targets.roleRegex, 'i');
  const excludeRx = new RegExp(cfg.targets.excludeRegex, 'i');
  const targetLocRx = new RegExp(cfg.targets.targetLocationsRegex, 'i');
  const boardProbes = cfg.targets.boardProbes || [];

  const existingIds = new Set();
  const existingTitles = new Set();

  if (cfg.storageBackend === 'google' && cfg.google.sheets.secondary) {
    const tok = await getAccessToken(cfg);
    const tab = encodeURIComponent(cfg.rules.googleSheets.regions.secondary.tab);
    const sch = await (await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cfg.google.sheets.secondary}/values/${tab}!A9:M120?valueRenderOption=FORMULA`, {
      headers: { Authorization: 'Bearer ' + tok }
    })).json();
    for (const r of sch.values || []) {
      if (r[0]) existingIds.add(String(r[0]).trim());
      if (r[3]) existingTitles.add(`${(r[1] || '').toLowerCase()}|${(r[3] || '').toLowerCase()}`);
    }
  } else {
    const storage = createStorageAdapter(cfg);
    for (const j of storage.listJobs()) {
      if (j.id) existingIds.add(String(j.id).trim());
      if (j.title) existingTitles.add(`${(j.company || '').toLowerCase()}|${j.title.toLowerCase()}`);
    }
  }
  console.log('Existing tracked job IDs count:', existingIds.size);

  if (process.argv.includes('--check-linkedin')) {
    const browser = await connectCdp(cfg);
    try {
      const ctx = browser.contexts()[0];
      const page = ctx.pages()[0] || (await ctx.newPage());
      await page.goto('https://www.linkedin.com/my-items/saved-jobs/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => console.log('LI err:', e.message));
      await page.waitForTimeout(2500);
      console.log('LinkedIn URL:', page.url(), 'Title:', await page.title());
    } finally {
      await browser.close().catch(() => {});
    }
  }

  const results = await Promise.all(boardProbes.map(probeBoard));
  const all = results.flat();
  console.log('Total raw jobs scanned across ATS APIs:', all.length);

  const filtered = all.filter((j) => {
    if (!roleRx.test(j.title)) return false;
    if (excludeRx.test(j.title)) return false;
    if (existingIds.has(j.id)) return false;
    if (existingTitles.has(`${(j.company || '').toLowerCase()}|${(j.title || '').toLowerCase()}`)) return false;
    if (/\b(senior manager|lead|head|director|principal)\b/i.test(j.title)) return false;
    return targetLocRx.test(j.loc);
  });

  filtered.sort((a, b) => {
    const aTier1 = /berlin|munich|münchen|frankfurt|walldorf|germany/i.test(a.loc) ? 0 : 1;
    const bTier1 = /berlin|munich|münchen|frankfurt|walldorf|germany/i.test(b.loc) ? 0 : 1;
    if (aTier1 !== bTier1) return aTier1 - bTier1;
    return a.company.localeCompare(b.company);
  });

  console.log(`\n=== MATCHING UNAPPLIED CANDIDATES (${filtered.length}) ===`);
  filtered.forEach((j) => {
    console.log(`[${j.ats}] ${j.company} | ID=${j.id} | ${j.title} | Loc="${j.loc}" | ${j.url}`);
  });
})();
