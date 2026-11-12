// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step3_check_mr_and_login_sr_ey.js
 * Original role: Authenticates against SAP SuccessFactors candidate portals using universal
 * candidate email and primary -> fallback password rotation from private secrets storage,
 * and falls back cleanly to "Create an account" inspection when neither password succeeds.
 * Modifications for public reuse:
 *   - Stripped real candidate email, hardcoded passwords, and employer URLs.
 *   - NEVER prints password attempts to stdout.
 */
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { getPortalCredentials } = require('../lib/secrets');
const { connectCdp } = require('../lib/browser');

async function sfLoginOrRegister(page, label, creds) {
  console.log(`\n=== SUCCESSFACTORS AUTH: ${label} | ${page.url()} ===`);
  for (let idx = 0; idx < creds.passwords.length; idx++) {
    const u = page.locator('#username');
    const p = page.locator('#password');
    if (await u.isVisible({ timeout: 2000 }).catch(() => false)) {
      await u.fill(creds.email);
      await p.fill(creds.passwords[idx]);
      await page.locator('button:has-text("Sign In"), input[type="submit"][value="Sign In"]').first().click({ timeout: 4000 });
      await page.waitForTimeout(3500);
      const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      console.log(`Password attempt #${idx + 1} -> URL: ${page.url()}`);
      if (!/invalid|incorrect|does not match|not match|locked|create an account/i.test(body.slice(0, 450)) && !(await page.locator('#username').isVisible().catch(() => false))) {
        console.log(`${label}: SIGNED IN!`);
        return 'SIGNED_IN';
      }
      if (!(await page.locator('#username').isVisible().catch(() => false))) {
        return 'MOVED';
      }
    }
  }
  const createLnk = page.locator('a:has-text("Create an account")').first();
  if (await createLnk.isVisible({ timeout: 1500 }).catch(() => false)) {
    await createLnk.click({ timeout: 3000 });
    await page.waitForTimeout(3000);
    console.log(`${label}: Opened Create Account view -> ${page.url()}`);
    return 'CREATE_ACCOUNT';
  }
  return 'UNKNOWN';
}

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  const creds = getPortalCredentials(cfg);
  if (!creds.configured) {
    throw new Error('Set PORTAL_LOGIN_EMAIL and PORTAL_PRIMARY_PASSWORD in .env.');
  }

  const targetHost = process.argv.find((a) => a.startsWith('--host='))?.replace('--host=', '') || 'sapsf.eu';
  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find((p) => p.url().includes(targetHost));
    if (!page) {
      console.log(`No open Chrome CDP tab matching "${targetHost}".`);
      return;
    }
    await page.bringToFront();
    const res = await sfLoginOrRegister(page, targetHost, creds);
    await page.screenshot({ path: path.join(cfg.paths.artifactsDir, 'sf_after_auth.png'), fullPage: true });
    console.log('Auth outcome:', res);
  } finally {
    await browser.close().catch(() => {});
  }
})();

module.exports = { sfLoginOrRegister };
