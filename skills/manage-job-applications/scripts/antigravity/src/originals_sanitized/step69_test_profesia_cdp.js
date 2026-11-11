// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step69_test_profesia_cdp.js
 * Original role: Diagnostic probe verifying whether a job board blocking headless HTTP (403)
 * loads cleanly inside an interactive authenticated Chrome CDP session, and extracting Apply/Redirect links.
 * Modifications for public reuse:
 *   - Stripped specific vacancy URL and personal Windows artifact path.
 *   - Accepts `--url=<job-board-url>` (skips network if placeholder).
 */
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { connectCdp } = require('../lib/browser');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  const url = process.argv.find((a) => a.startsWith('--url='))?.replace('--url=', '') || '';
  if (!url || url.includes('example.com')) {
    throw new Error('Pass a target URL to test inside Chrome CDP via --url=https://...');
  }

  const browser = await connectCdp(cfg);
  const ctx = browser.contexts()[0];
  console.log('Open tabs:', ctx.pages().map((p) => p.url()).join(' | '));

  const testPage = await ctx.newPage();
  try {
    await testPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch((e) => console.log('Nav err:', e.message));
    await testPage.waitForTimeout(3000);
    const title = await testPage.title();
    const links = await testPage.evaluate(() =>
      Array.from(document.querySelectorAll('a, button'))
        .filter((el) => /apply|poslať|reagovať|company|redirect/i.test((el.innerText || '') + ' ' + (el.href || '')))
        .map((el) => `${el.tagName}: ${(el.innerText || '').trim().slice(0, 40)} => ${el.href || ''}`)
    );
    console.log('Title:', title);
    console.log('Candidate Apply Links:', links.slice(0, 15));
    await testPage.screenshot({ path: path.join(cfg.paths.artifactsDir, 'board_cdp_probe.png') });
  } finally {
    await testPage.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
