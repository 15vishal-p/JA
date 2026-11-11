// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: apply_bolt_and_flix.js
 * Original role: Multi-tab Chrome CDP runner automating Ashby nested survey forms and
 * standard Greenhouse forms (first_name/last_name/email/phone/resume/custom questions/privacy)
 * and updating tracker status ONLY after confirmation text is observed.
 * Modifications for public reuse:
 *   - Removed real candidate PII, specific employer URLs, and personal demographics.
 *   - Driven by `--job=<jobId>` matching an entry in config/targets.json (`sampleJobs`).
 *   - Added `--submit` gate (defaults to screenshot-only preview).
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { connectCdp, detectHumanGate } = require('../lib/browser');
const { updateStatus } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const shouldSubmit = process.argv.includes('--submit');
  const jobIdArg = process.argv.find((a) => a.startsWith('--job='))?.replace('--job=', '');
  const cand = cfg.profile.candidate;
  const jobs = (cfg.targets?.sampleJobs || []).filter((j) => !jobIdArg || j.id === jobIdArg);

  const cvMapFile = path.join(cfg.paths.cacheDir, 'job_cv_map.json');
  const cvMap = fs.existsSync(cvMapFile) ? JSON.parse(fs.readFileSync(cvMapFile, 'utf8')) : {};

  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];

    for (const job of jobs) {
      const cvPath = cvMap[job.id] || job.cvPath;
      const page = ctx.pages().find((p) => p.url().includes(job.id) || (job.link && p.url().startsWith(job.link)));
      if (!page || !cvPath) continue;

      await page.bringToFront();
      const cookieBtn = page.locator('button:has-text("Accept All"), button:has-text("Accept"), button:has-text("Allow all")').first();
      if (await cookieBtn.count().catch(() => 0)) {
        await cookieBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(400);
      }

      if (job.ats === 'greenhouse') {
        await page.locator('input[name="first_name"], #first_name').first().fill(cand.firstName);
        await page.locator('input[name="last_name"], #last_name').first().fill(cand.lastName);
        await page.locator('input[name="email"], #email').first().fill(cand.email);
        await page.locator('input[name="phone"], #phone').first().fill(cand.phone);
        await page.locator('input[type="file"]').first().setInputFiles(cvPath);
      } else if (job.ats === 'ashby') {
        await page.locator('input[name="apply:_systemfield_name"], #_systemfield_name').first().fill(cand.fullName);
        await page.locator('input[name="apply:_systemfield_email"], #_systemfield_email').first().fill(cand.email);
        await page.locator('input[type="tel"]').first().fill(cand.phone);
        await page.locator('input[type="file"]').first().setInputFiles(cvPath);
      }

      const preShot = path.join(cfg.paths.artifactsDir, `pre_${job.id}.png`);
      await page.screenshot({ path: preShot });

      const gate = await detectHumanGate(page);
      if (gate.blockedByChallenge) {
        console.log(`HOLD [${job.id}]: Visible challenge iframe present.`);
        continue;
      }

      if (!shouldSubmit) {
        console.log(`DRY-RUN [${job.id}]: Pre-submit screenshot saved to ${preShot}`);
        continue;
      }

      const subBtn = page.locator('button:has-text("Submit application"), button:has-text("Submit your application")').first();
      await subBtn.scrollIntoViewIfNeeded();
      await subBtn.click();
      await page.waitForTimeout(6000);

      await page.screenshot({ path: path.join(cfg.paths.artifactsDir, `confirmed_${job.id}.png`) });
      const resText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1200));
      console.log('Needs verification: reconcile the role-specific receipt and employer portal before updating tracker status.');

    }
  } finally {
    await browser.close().catch(() => {});
  }
})();
