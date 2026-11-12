// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step48_submit_sumup.js
 * Original role: Clicks final submit button on a pre-verified Greenhouse embed tab,
 * checks DOM validation errors & visible hCaptcha/reCAPTCHA frames, and captures proof screenshot.
 * Modifications for public reuse:
 *   - Parameterized `--token=<jobId>` and artifacts path via src/lib/config.js.
 *   - Enforces explicit `--submit` CLI flag so accidental runs never submit applications.
 */
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { connectCdp, detectHumanGate } = require('../lib/browser');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const jobToken = process.argv.find((a) => a.startsWith('--token='))?.replace('--token=', '') || '';
  if (!jobToken) throw new Error('Provide --token=<jobId>');
  if (!process.argv.includes('--submit')) {
    throw new Error('Safety guard: pass --submit explicitly after visual pre-submit verification.');
  }

  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const tab = ctx.pages().find((p) => p.url().includes(jobToken));
    if (!tab) throw new Error(`Tab matching ${jobToken} not found`);

    await tab.bringToFront();
    if ((await detectHumanGate(tab)).blockedByChallenge) throw new Error('Human verification required before submission.');
    const btn = tab.locator('button[type="submit"]:has-text("Submit application"), button:has-text("Submit application")').first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await tab.waitForTimeout(8000);

    const gate = await detectHumanGate(tab);
    const res = await tab.evaluate(() => ({
      url: location.href,
      text: document.body.innerText.slice(0, 1500),
      errs: [...document.querySelectorAll('[class*="error" i], [role="alert"]')].map((e) => e.innerText.trim()).filter(Boolean)
    }));
    const proofShot = path.join(cfg.paths.artifactsDir, `confirmed_${jobToken}.png`);
    await tab.screenshot({ path: proofShot, fullPage: true });
    console.log('Post-submit result:', JSON.stringify({ ...res, hasChallenge: gate.blockedByChallenge, proofShot }, null, 2));
  } finally {
    await browser.close().catch(() => {});
  }
})();
