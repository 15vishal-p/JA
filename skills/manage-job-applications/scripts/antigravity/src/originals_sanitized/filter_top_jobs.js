// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: filter_top_jobs.js
 * Original role: Filters raw region job dumps for actionable vacancies (excluding Applied/Closed/Expired),
 * classifies ATS portal types by URL hostname, sorts descending by fit score, and persists top queue JSON.
 * Modifications for public reuse:
 *   - Replaced Windows Temp paths with cfg.paths.cacheDir via src/lib/config.js.
 *   - Generalized portal classification beyond personal employer names.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');

function getPortal(urlStr) {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    if (h.includes('profesia.sk')) return 'Profesia.sk';
    if (h.includes('workday') || h.includes('myworkdayjobs')) return 'Workday';
    if (h.includes('greenhouse')) return 'Greenhouse';
    if (h.includes('lever.co')) return 'Lever';
    if (h.includes('ashbyhq')) return 'Ashby';
    if (h.includes('smartrecruiters')) return 'SmartRecruiters';
    if (h.includes('csod.com')) return 'Cornerstone';
    if (h.includes('successfactors')) return 'SuccessFactors';
    if (h.includes('pracazarohom')) return 'PracaZaRohom';
    return h;
  } catch {
    return 'unknown';
  }
}

const cfg = loadConfig();
ensureDirs(cfg);

const primaryFile = path.join(cfg.paths.cacheDir, 'all_primary_links.json');
const secondaryFile = path.join(cfg.paths.cacheDir, 'all_secondary_links.json');

let primary = [];
let secondary = [];
if (fs.existsSync(primaryFile) || fs.existsSync(secondaryFile)) {
  primary = fs.existsSync(primaryFile) ? JSON.parse(fs.readFileSync(primaryFile, 'utf8')) : [];
  secondary = fs.existsSync(secondaryFile) ? JSON.parse(fs.readFileSync(secondaryFile, 'utf8')) : [];
} else {
  const storage = createStorageAdapter(cfg);
  primary = storage.listJobs('primary');
  secondary = storage.listJobs('secondary');
}

const isActionable = (j) => {
  const st = (j.status || '').toLowerCase();
  return Boolean(j.link) && !st.includes('applied') && !st.includes('closed') && !st.includes('expired');
};

const pActionable = primary.filter(isActionable);
const sActionable = secondary.filter(isActionable);

console.log(`Actionable Primary: ${pActionable.length}`);
console.log(`Actionable Secondary: ${sActionable.length}`);

const allActionable = [
  ...pActionable.map((j) => ({ ...j, domain: 'Primary', portal: getPortal(j.link) })),
  ...sActionable.map((j) => ({ ...j, domain: 'Secondary', portal: getPortal(j.link) }))
].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

console.log('\nTop 40 Actionable Jobs across both regions:');
allActionable.slice(0, 40).forEach((j, i) => {
  console.log(`${i + 1}. [${j.score}] [${j.domain}] ${j.company} - ${j.title} | Portal: ${j.portal} | URL: ${j.link}`);
});

const outPath = path.join(cfg.paths.cacheDir, 'top_actionable_jobs.json');
fs.writeFileSync(outPath, JSON.stringify(allActionable, null, 2));
console.log('Saved queue snapshot:', outPath);
