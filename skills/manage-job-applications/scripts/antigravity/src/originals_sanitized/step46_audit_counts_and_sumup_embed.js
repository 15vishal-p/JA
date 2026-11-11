// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step46_audit_counts_and_sumup_embed.js
 * Original role: Performs row-by-row tracker audit AND bypasses broken corporate-wrapper
 * Greenhouse file uploads by navigating directly to `https://job-boards.greenhouse.io/embed/job_app`
 * and attaching the tailored CV via Playwright `waitForEvent('filechooser')`.
 * Modifications for public reuse:
 *   - Replaced private Sheet IDs, candidate CV filenames, and employer board/token literals
 *     with CLI args `--board=<slug> --token=<id> --cv=<pdfPath>` and src/lib/config.js.
 */
const path = require('path');
const { loadConfig } = require('../lib/config');
const { connectCdp } = require('../lib/browser');
const { getConfirmedAnswersAndCounts } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();
  const data = await getConfirmedAnswersAndCounts(cfg);
  console.log('=== PRIMARY REGION CONFIRMED/ACTIVE AUDIT ===', data.primary.length);
  console.log('=== SECONDARY REGION CONFIRMED/ACTIVE AUDIT ===', data.secondary.length);

  const board = process.argv.find((a) => a.startsWith('--board='))?.replace('--board=', '') || '';
  const jobToken = process.argv.find((a) => a.startsWith('--token='))?.replace('--token=', '') || '';
  const cvPath = process.argv.find((a) => a.startsWith('--cv='))?.replace('--cv=', '') || '';
  if (!board || !jobToken || !cvPath) {
    console.log('Usage for embed fallback probe: --board=<ghBoardSlug> --token=<jobId> --cv=<pdfPath>');
    return;
  }

  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const tab = ctx.pages().find((p) => p.url().includes(jobToken)) || (await ctx.newPage());
    await tab.bringToFront();
    const embedUrl = `https://job-boards.greenhouse.io/embed/job_app?for=${encodeURIComponent(board)}&token=${encodeURIComponent(jobToken)}`;
    await tab.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await tab.waitForTimeout(3000);

    const hasFirst = await tab.locator('#first_name').count();
    console.log('Direct embed loaded:', tab.url(), 'has #first_name:', hasFirst);
    if (hasFirst) {
      if (await tab.locator('button:has-text("Attach")').count()) {
        const [fc] = await Promise.all([
          tab.waitForEvent('filechooser', { timeout: 10000 }),
          tab.locator('button:has-text("Attach")').first().click()
        ]);
        await fc.setFiles(cvPath);
      } else {
        await tab.locator('input[type="file"]').first().setInputFiles(cvPath);
      }
      await tab.waitForTimeout(3500);
      const fname = path.basename(cvPath);
      const uploaded = await tab.evaluate((name) => document.body.innerText.includes(name), fname);
      console.log('Embed resume upload verified:', uploaded);
    }
  } finally {
    await browser.close().catch(() => {});
  }
})();
