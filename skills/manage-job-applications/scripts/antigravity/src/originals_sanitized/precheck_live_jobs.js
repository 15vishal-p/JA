// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: precheck_live_jobs.js
 * Original role: Concurrent batched HTTP GET pre-flight check over eligible queue URLs to detect
 * 404/410 dead links and common "job has expired / no longer open" pages before launching browser tabs.
 * Modifications for public reuse:
 *   - Replaced Windows Temp input/output paths with cfg.paths.cacheDir via src/lib/config.js.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');

async function checkUrl(job) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(job.link, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);
    const text = await resp.text();
    const lower = text.toLowerCase();
    const isClosedText =
      lower.includes('no longer available') ||
      lower.includes('job has expired') ||
      lower.includes('job posting has been removed') ||
      lower.includes('position has been filled') ||
      lower.includes('job not found') ||
      lower.includes('this job is no longer open');
    return {
      ...job,
      httpStatus: resp.status,
      finalUrl: resp.url,
      isClosedText
    };
  } catch (e) {
    clearTimeout(timeout);
    return {
      ...job,
      httpStatus: 'ERR',
      error: e.message
    };
  }
}

async function main() {
  const cfg = loadConfig();
  ensureDirs(cfg);
  const queueFile = path.join(cfg.paths.cacheDir, 'eligible_jobs_queue.json');
  const queue = fs.existsSync(queueFile) ? JSON.parse(fs.readFileSync(queueFile, 'utf8')) : [];
  console.log(`Checking ${queue.length} jobs in batches...`);

  const results = [];
  const batchSize = 15;
  for (let i = 0; i < queue.length; i += batchSize) {
    const batch = queue.slice(i, i + batchSize);
    const res = await Promise.all(batch.map(checkUrl));
    results.push(...res);
    process.stdout.write(`Checked ${Math.min(i + batchSize, queue.length)}/${queue.length}\n`);
  }

  const live = results.filter((r) => r.httpStatus === 200 && !r.isClosedText);
  const dead = results.filter((r) => r.httpStatus === 404 || r.httpStatus === 410 || r.isClosedText);
  const blockedOrOther = results.filter((r) => !live.includes(r) && !dead.includes(r));

  console.log('\n=== SUMMARY ===');
  console.log(`Live (HTTP 200, active): ${live.length}`);
  console.log(`Dead/Closed (404/410/closed text): ${dead.length}`);
  console.log(`Blocked/403/Timeout/Other: ${blockedOrOther.length}`);

  fs.writeFileSync(path.join(cfg.paths.cacheDir, 'live_jobs_verified.json'), JSON.stringify(live, null, 2));
  fs.writeFileSync(path.join(cfg.paths.cacheDir, 'dead_jobs_verified.json'), JSON.stringify(dead, null, 2));
  fs.writeFileSync(path.join(cfg.paths.cacheDir, 'other_jobs_verified.json'), JSON.stringify(blockedOrOther, null, 2));

  console.log('\nTop 40 Live Jobs:');
  live.slice(0, 40).forEach((j, i) => {
    console.log(`${i + 1}. [${j.score}] [${j.region}] ${j.company} | ${j.title} | ${j.finalUrl}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkUrl };
