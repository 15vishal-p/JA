// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step47_fill_sumup_embed.js
 * Original role: Fills Greenhouse direct-embed application fields (`#first_name`, `#last_name`,
 * `#email`, `#country` searchable combobox, `#phone`, `#candidate-location` async dropdown), verifies
 * CV filename in DOM, checks for visible reCAPTCHA challenge iframes, and captures pre-submit screenshot.
 * Modifications for public reuse:
 *   - Stripped all candidate PII and specific employer custom question IDs/salary strings.
 *   - Wired to config/profile.json and CLI flags (`--token=<jobId> --cv=<pdfPath>`).
 */
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { connectCdp, detectHumanGate } = require('../lib/browser');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const jobToken = process.argv.find((a) => a.startsWith('--token='))?.replace('--token=', '') || '';
  const cvPath = process.argv.find((a) => a.startsWith('--cv='))?.replace('--cv=', '') || '';
  if (!jobToken || !cvPath) {
    throw new Error('Provide --token=<greenhouseJobToken> --cv=<pdfPath>');
  }

  const cand = cfg.profile.candidate;
  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const tab = ctx.pages().find((p) => p.url().includes(jobToken));
    if (!tab) throw new Error(`No open Chrome CDP tab matching token ${jobToken}`);

    await tab.bringToFront();
    const cvName = path.basename(cvPath);
    const hasCv = await tab.evaluate((n) => document.body.innerText.includes(n), cvName);
    if (!hasCv) {
      const [fc] = await Promise.all([
        tab.waitForEvent('filechooser', { timeout: 10000 }),
        tab.locator('button:has-text("Attach")').first().click()
      ]);
      await fc.setFiles(cvPath);
      await tab.waitForTimeout(3000);
    }

    await tab.locator('#first_name').fill(cand.firstName);
    await tab.locator('#last_name').fill(cand.lastName);
    await tab.locator('#email').fill(cand.email);

    const countryName = cand.homeCountry || 'Slovakia';
    const cCb = tab.locator('#country');
    if (await cCb.count()) {
      await cCb.scrollIntoViewIfNeeded();
      await cCb.click();
      await cCb.pressSequentially(countryName, { delay: 30 });
      await tab.waitForTimeout(600);
      await tab.locator('[role="option"], [id*="-option-"]').filter({ hasText: new RegExp('^' + countryName, 'i') }).first().click().catch(() => {});
      await tab.waitForTimeout(400);
    }

    await tab.locator('#phone').fill(cand.phone);

    const cityName = cand.homeCity || 'Bratislava';
    const cityCb = tab.locator('#candidate-location');
    if (await cityCb.count()) {
      await cityCb.scrollIntoViewIfNeeded();
      await cityCb.click();
      await cityCb.pressSequentially(cityName, { delay: 40 });
      await tab.waitForTimeout(2200);
      await tab.locator('[role="option"], [id*="-option-"]').filter({ hasText: cityName }).first().click().catch(() => {});
      await tab.waitForTimeout(400);
    }

    const gate = await detectHumanGate(tab);
    const shotPath = path.join(cfg.paths.artifactsDir, `pre_embed_${jobToken}.png`);
    await tab.screenshot({ path: shotPath, fullPage: true });
    console.log('Greenhouse embed pre-submit state:', JSON.stringify({ hasCvUploaded: await tab.evaluate((n) => document.body.innerText.includes(n), cvName), blockedByChallenge: gate.blockedByChallenge, screenshot: shotPath }));
  } finally {
    await browser.close().catch(() => {});
  }
})();
