// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step43_submit_4_and_prep_2.js
 * Original role: Demonstrates three critical production resilience techniques:
 *   1. Flushing a debounced react-bootstrap-typeahead Location input via clean page reload before fast typing.
 *   2. Submitting a Lever form with explicit visible hCaptcha iframe detection (`detectHumanGate`) so the
 *      script halts cleanly instead of misreporting submission when gated.
 *   3. Capturing full-page confirmation screenshots across multi-tab ATS workflows.
 * Modifications for public reuse:
 *   - Replaced candidate PII, hard-coded job IDs, and device paths with config/CLI flags.
 *   - Added `--submit` flag safety guard.
 */
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { connectCdp, detectHumanGate } = require('../lib/browser');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const cand = cfg.profile.candidate;
  const shouldSubmit = process.argv.includes('--submit');
  const tabMatch = process.argv.find((a) => a.startsWith('--tab='))?.replace('--tab=', '') || '';
  const cvPath = process.argv.find((a) => a.startsWith('--cv='))?.replace('--cv=', '') || '';

  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const pages = ctx.pages();

    // Pattern A: Typeahead-cached form clean reload + fast type to prevent stale debounced suggestions
    const typeaheadPage = tabMatch ? pages.find((p) => p.url().includes(tabMatch)) : null;
    if (typeaheadPage && cvPath) {
      await typeaheadPage.bringToFront();
      await typeaheadPage.reload({ waitUntil: 'domcontentloaded', timeout: 25000 });
      await typeaheadPage.waitForTimeout(3000);

      await typeaheadPage.locator('input[type="file"]').first().setInputFiles(cvPath);
      await typeaheadPage.waitForTimeout(4500);

      await typeaheadPage.locator('#firstName').fill(cand.firstName).catch(() => {});
      await typeaheadPage.locator('#lastName').fill(cand.lastName).catch(() => {});
      await typeaheadPage.locator('#email').fill(cand.email).catch(() => {});
      await typeaheadPage.locator('#phoneNumber').fill(cand.phoneLocal || cand.phone).catch(() => {});

      const loc = typeaheadPage.locator('input[aria-label="Location"]');
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded();
        await loc.click();
        await typeaheadPage.keyboard.press('Control+a');
        await typeaheadPage.keyboard.press('Backspace');
        await typeaheadPage.waitForTimeout(500);
        // Send burst faster than debounce threshold so widget fires a single clean lookup
        await loc.pressSequentially((cand.homeCity || 'Bratislava').slice(0, 4), { delay: 15 });
        await typeaheadPage.waitForTimeout(2000);
      }
      await typeaheadPage.screenshot({ path: path.join(cfg.paths.artifactsDir, 'step1_reloaded_check.png'), fullPage: true });
    }

    // Pattern B: Safe submit with hCaptcha / Cloudflare / reCAPTCHA visible iframe check
    const leverMatch = process.argv.find((a) => a.startsWith('--lever='))?.replace('--lever=', '') || '';
    const leverPage = leverMatch ? pages.find((p) => p.url().includes(leverMatch)) : null;
    if (leverPage && shouldSubmit) {
      await leverPage.bringToFront();
      const btn = leverPage.locator('button[type="submit"], input[type="submit"], button:has-text("Submit application")').first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await leverPage.waitForTimeout(6000);

      const gate = await detectHumanGate(leverPage);
      const outShot = path.join(cfg.paths.artifactsDir, 'post_submit_lever_check.png');
      await leverPage.screenshot({ path: outShot, fullPage: true });

      if (gate.blockedByChallenge) {
        console.log('HALTED BY HUMAN CHALLENGE (hCaptcha/reCAPTCHA visible):', JSON.stringify(gate.visibleChallenges));
      } else {
        const snippet = await leverPage.evaluate(() => document.body.innerText.slice(0, 1200));
        console.log('Post-submit URL:', leverPage.url(), '| Body preview:', snippet.slice(0, 300));
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
})();
