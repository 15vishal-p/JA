// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: build_eligible_queue.js
 * Original role: Builds strict eligible submission queue by excluding Applied, Closed, Expired,
 * Held, and Blocked statuses and sorting highest manual fit score first.
 * Modifications for public reuse:
 *   - Replaced Windows Temp paths with cfg.paths.cacheDir and LocalStorageAdapter fallback.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { createStorageAdapter } = require('../lib/storage');

function isEligible(j, excludeWords = ['applied', 'closed', 'expired', 'held', 'blocked']) {
  if (!j.link) return false;
  const s = (j.status || '').toLowerCase();
  return !excludeWords.some((w) => s.includes(w));
}

const cfg = loadConfig();
ensureDirs(cfg);

const primaryFile = path.join(cfg.paths.cacheDir, 'all_primary_links.json');
const secondaryFile = path.join(cfg.paths.cacheDir, 'all_secondary_links.json');

const storage = createStorageAdapter(cfg);
const primary = fs.existsSync(primaryFile) ? JSON.parse(fs.readFileSync(primaryFile, 'utf8')) : storage.listJobs('primary');
const secondary = fs.existsSync(secondaryFile) ? JSON.parse(fs.readFileSync(secondaryFile, 'utf8')) : storage.listJobs('secondary');

const excludeWords = cfg.rules?.deduplication?.excludeStatuses || ['applied', 'closed', 'expired', 'held', 'blocked'];
const pClean = primary.filter((j) => isEligible(j, excludeWords)).map((j) => ({ ...j, region: 'primary' }));
const sClean = secondary.filter((j) => isEligible(j, excludeWords)).map((j) => ({ ...j, region: 'secondary' }));

console.log(`Eligible Primary jobs: ${pClean.length}`);
console.log(`Eligible Secondary jobs: ${sClean.length}`);

const combined = [...pClean, ...sClean].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
console.log(`Total Eligible Jobs: ${combined.length}\n`);

combined.forEach((j, idx) => {
  console.log(`${idx + 1}. [${j.score}] [${j.region}] ${j.company} | ${j.title} | ${j.link} | Status: ${j.status}`);
});

const outPath = path.join(cfg.paths.cacheDir, 'eligible_jobs_queue.json');
fs.writeFileSync(outPath, JSON.stringify(combined, null, 2));
