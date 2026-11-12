// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: apply_clarios_auth.js
 * Original role: Authenticated Workday portal sign-in & Apply launcher using standard Workday
 * `data-automation-id` selectors (`utilityButtonSignIn`, `email`, `password`, `signInSubmitButton`, `adventureButton`).
 * Modifications for public reuse:
 *   - Stripped hardcoded employer URL, candidate email, and password literal.
 *   - Wired to src/lib/config.js, src/lib/secrets.js, and src/lib/browser.js.
 *   - Accepts `--url=<workday-job-url>`.
 */
const path = require('path');
const { loadConfig, ensureDirs, assertRealProfile } = require('../lib/config');
const { getPortalCredentials } = require('../lib/secrets');
const { launchBrowser } = require('../lib/browser');

async function main() {
  const cfg = loadConfig();
  ensureDirs(cfg);
  assertRealProfile(cfg);

  const jobUrl = process.argv.find((a) => a.startsWith('--url='))?.replace('--url=', '') || '';
  if (!jobUrl || jobUrl.includes('example.com')) {
    throw new Error('Pass a valid target Workday posting URL via --url=https://<tenant>.myworkdayjobs.com/...');
  }

  const creds = getPortalCredentials(cfg);
  if (!creds.configured) {
    throw new Error('Set PORTAL_LOGIN_EMAIL and PORTAL_PRIMARY_PASSWORD in .env.');
  }

  const browser = await launchBrowser(cfg, { headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const signInBtn = page.locator('button[data-automation-id="utilityButtonSignIn"]');
    if (await signInBtn.isVisible().catch(() => false)) {
      console.log('Signing in to Workday tenant...');
      await signInBtn.click();
      await page.waitForTimeout(1500);
      await page.locator('input[data-automation-id="email"]').fill(creds.email);
      await page.locator('input[data-automation-id="password"]').fill(creds.passwords[0]);
      await page.locator('button[data-automation-id="signInSubmitButton"]').click({ force: true });
      await page.waitForTimeout(4000);
    } else {
      console.log('Already signed in on current session.');
    }

    const applyBtn = page.locator('a[data-automation-id="adventureButton"], button[data-automation-id="adventureButton"]').first();
    await applyBtn.waitFor({ state: 'visible', timeout: 15000 });
    await applyBtn.click({ force: true });
    await page.waitForTimeout(4000);

    const pic = path.join(cfg.paths.artifactsDir, 'workday_apply_options.png');
    await page.screenshot({ path: pic, fullPage: true });
    console.log('Post-Apply URL:', page.url(), '| Screenshot:', pic);
  } finally {
    await browser.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
