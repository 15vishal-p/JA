// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: wave4b_workday_all3.js
 * Original role: Automates Workday Step 3 -> Step 4 -> Step 5 Review navigation across
 * active Chrome CDP tabs, cleanly splitting parsed Work Experience blocks from profile.json
 * and repairing parsed Education Field of Study fields.
 * Modifications for public reuse:
 *   - Stripped all real candidate employment descriptions, company names, dates, and req IDs.
 *   - Dynamically reads experience & education entries from config.profile.cvTemplate.
 *   - Accepts `--match=<url-substring>` to target any open Workday application tab cleanly.
 */
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { connectCdp } = require('../lib/browser');

async function pickWdDropdown(page, btnId, optionRegex) {
  const btn = page.locator(`#${btnId}`).first();
  if (!(await btn.count())) return `MISSING:${btnId}`;
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await btn.click();
  await page.waitForTimeout(500);
  const picked = await page.evaluate((reStr) => {
    const re = new RegExp(reStr, 'i');
    const lbs = [...document.querySelectorAll('[role="listbox"]')].filter((lb) => lb.offsetParent !== null);
    for (const lb of lbs) {
      const opts = [...lb.querySelectorAll('[role="option"]')];
      const m = opts.find((o) => re.test(o.innerText.trim()));
      if (m) {
        m.click();
        return m.innerText.trim();
      }
    }
    return null;
  }, optionRegex);
  await page.waitForTimeout(300);
  return picked;
}

async function splitWorkdayExperience(page, experiences = []) {
  if (!experiences.length) return;
  let existingIds = await page.evaluate(() =>
    [...document.querySelectorAll('input[id^="workExperience-"][id$="--jobTitle"]')].map((i) => i.id.split('--')[0])
  );
  console.log('  Existing WE blocks:', existingIds);

  if (existingIds.length === 1) {
    const weSection = page.locator('[aria-labelledby*="Work-Experience"], div:has(> h3:has-text("Work Experience")), div:has(> h4:has-text("Work Experience"))').first();
    const addBtn = weSection.locator('button[data-automation-id="add-button"]').first();
    const fallbackAdd = page.locator('button[data-automation-id="add-button"]').first();
    const btnToClick = (await addBtn.count()) ? addBtn : fallbackAdd;

    for (let idx = 0; idx < experiences.length; idx++) {
      const exp = experiences[idx];
      if (idx > 0) {
        await btnToClick.scrollIntoViewIfNeeded();
        await btnToClick.click();
        await page.waitForTimeout(800);
        existingIds = await page.evaluate(() =>
          [...document.querySelectorAll('input[id^="workExperience-"][id$="--jobTitle"]')].map((i) => i.id.split('--')[0])
        );
      }
      const prefix = existingIds[existingIds.length - 1];
      if (!prefix) continue;

      await page.locator(`#${prefix}--jobTitle`).fill(exp.title || '');
      await page.locator(`#${prefix}--companyName`).fill(exp.company || '');
      await page.locator(`#${prefix}--location`).fill(exp.location || '');

      if (exp.currentlyWorkHere) {
        const cw = page.locator(`#${prefix}--currentlyWorkHere`);
        if ((await cw.count()) && !(await cw.isChecked())) await cw.check({ force: true });
      }
      if (exp.startMonth) await page.locator(`#${prefix}--startDate-dateSectionMonth-input`).fill(String(exp.startMonth));
      if (exp.startYear) await page.locator(`#${prefix}--startDate-dateSectionYear-input`).fill(String(exp.startYear));
      if (!exp.currentlyWorkHere && exp.endMonth) {
        await page.locator(`#${prefix}--endDate-dateSectionMonth-input`).fill(String(exp.endMonth));
      }
      if (!exp.currentlyWorkHere && exp.endYear) {
        await page.locator(`#${prefix}--endDate-dateSectionYear-input`).fill(String(exp.endYear));
      }
      await page.locator(`#${prefix}--roleDescription`).fill((exp.bullets || []).join('\n'));
    }
    console.log('  After split WE blocks:', existingIds);
  }
}

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const matchSub = process.argv.find((a) => a.startsWith('--match='))?.replace('--match=', '') || 'myworkdayjobs.com';
  const primaryEdu = cfg.profile.cvTemplate?.education?.[0] || {};
  const experiences = cfg.profile.cvTemplate?.experience || [];

  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const wdPage = ctx.pages().find((p) => p.url().includes(matchSub));
    if (!wdPage) {
      throw new Error(`No open Chrome CDP tab matching "${matchSub}"`);
    }

    await wdPage.bringToFront();
    await splitWorkdayExperience(wdPage, experiences);

    const fosInput = wdPage.locator('input[id$="--fieldOfStudy"]').first();
    if ((await fosInput.count()) && primaryEdu.fieldOfStudy) {
      await fosInput.scrollIntoViewIfNeeded();
      await fosInput.click();
      await fosInput.fill(primaryEdu.fieldOfStudy.split(/[,&]/)[0].trim());
      await wdPage.keyboard.press('Enter');
      await wdPage.waitForTimeout(1000);
      await wdPage.evaluate((targetFos) => {
        const popups = [...document.querySelectorAll('[data-automation-id="selectWidgetPopup"], [role="listbox"]')].filter((p) => p.offsetParent !== null);
        for (const pop of popups) {
          const opt = [...pop.querySelectorAll('[data-automation-id="promptOption"]')].find((o) => o.innerText.toLowerCase().includes(targetFos.toLowerCase()));
          if (opt) { opt.click(); return; }
        }
      }, primaryEdu.fieldOfStudy.split(' ')[0]);
    }

    await wdPage.locator('[data-automation-id="pageFooterNextButton"]').click();
    await wdPage.waitForTimeout(2500);
    await wdPage.screenshot({ path: path.join(cfg.paths.artifactsDir, 'workday_step_after_we.png'), fullPage: true });
    console.log('Advanced Workday page cleanly ->', wdPage.url());
  } finally {
    await browser.close().catch(() => {});
  }
})();
