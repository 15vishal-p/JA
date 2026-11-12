// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: apply_enpal_ashby.js
 * Original role: Standard Ashby ATS application form automation (fills candidate info,
 * autocomplete city, CV PDF upload, language radios, numeric salary, relocation, work auth,
 * GDPR consent, captures pre-submit screenshot, and submits only with `--submit`).
 * Modifications for public reuse:
 *   - Stripped candidate PII, specific employer URL, and real CV path.
 *   - Parameterized via config/profile.json, config/targets.json, and `--url=<ashby-url> --cv=<pdf>`.
 *   - Added explicit `--submit` safety switch (defaults to review/screenshot only).
 */
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { launchBrowser, detectHumanGate } = require('../lib/browser');

async function main() {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const jobUrl = process.argv.find((a) => a.startsWith('--url='))?.replace('--url=', '') || '';
  const cvPath = process.argv.find((a) => a.startsWith('--cv='))?.replace('--cv=', '') || '';
  const targetCity = cfg.profile.candidate?.homeCity;
  if (!targetCity) throw new Error('Confirm actual homeCity before filling a location field.');
  const salaryValue = process.argv.find((a) => a.startsWith('--salary='))?.replace('--salary=', '') || '';
  const shouldSubmit = process.argv.includes('--submit');

  if (!jobUrl || jobUrl.includes('example.com')) {
    throw new Error('Provide a live Ashby job URL via --url=https://jobs.ashbyhq.com/...');
  }
  if (!cvPath) {
    throw new Error('Provide a verified PDF path via --cv=/path/to/tailored_cv.pdf');
  }

  const cand = cfg.profile.candidate;
  const browser = await launchBrowser(cfg, { headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(jobUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const applyBtn = page.locator('button:has-text("Apply"), a:has-text("Apply")').first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.locator('#_systemfield_name').fill(cand.fullName);
    await page.locator('#_systemfield_email').fill(cand.email);
    await page.locator('input[type="tel"]').fill(cand.phone);

    const locInput = page.locator('input[placeholder="Start typing..."]');
    if (await locInput.isVisible().catch(() => false)) {
      await locInput.fill(targetCity);
      await page.waitForTimeout(1000);
      const option = page.locator('[role="option"], [class*="option"], [class*="menuItem"]').first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      } else {
        await locInput.press('Enter');
      }
    }

    await page.locator('input[type="file"]').first().setInputFiles(cvPath);
    await page.waitForTimeout(2000);

    const linkedinInput = page.locator('input[type="url"]');
    if (await linkedinInput.isVisible().catch(() => false) && cand.linkedinUrl) {
      await linkedinInput.fill(cand.linkedinUrl);
    }

    if (salaryValue) {
      const salaryInput = page.locator('input[type="number"]');
      if (await salaryInput.isVisible().catch(() => false)) {
        await salaryInput.fill(String(salaryValue));
      }
    }

    const consentBox = page.locator('input[id*="_systemfield_data_consent_ack"]');
    if (await consentBox.count()) {
      console.log('Review this employer-specific consent manually before submitting.');
      return;
    }

    await page.waitForTimeout(1500);
    const filledPic = path.join(cfg.paths.artifactsDir, 'ashby_filled_state.png');
    await page.screenshot({ path: filledPic, fullPage: true });
    console.log('Filled state screenshot saved to:', filledPic);

    const gate = await detectHumanGate(page);
    if (gate.blockedByChallenge) {
      console.log('STOPPED: Visible CAPTCHA/human verification gate detected:', gate.visibleChallenges);
      return;
    }

    if (!shouldSubmit) {
      console.log('Dry-run complete. Re-run with --submit after inspecting', filledPic);
      return;
    }

    await page.locator('button:has-text("Submit Application"), button:has-text("Submit application")').first().click();
    await page.waitForTimeout(6000);

    const finalPic = path.join(cfg.paths.artifactsDir, 'ashby_submit_result.png');
    await page.screenshot({ path: finalPic, fullPage: true });
    const bodyText = await page.innerText('body');
    if (/thank you|received|successful/i.test(bodyText)) {
      console.log('Possible confirmation text: independently verify the role-specific employer receipt before marking Applied.');
    } else {
      console.log('WARNING: Confirmation text not detected; check screenshot:', finalPic);
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
