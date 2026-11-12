// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step56_test_flowcv_login.js
 * Original role: Connects to an active Chrome CDP debugging session, opens FlowCV login,
 * and signs in with credentials read exclusively from private environment/secret config.
 * Modifications for public reuse:
 *   - Stripped real email and hardcoded primary/fallback passwords; now loaded via secrets.js.
 *   - Replaced device artifact paths with cfg.paths.artifactsDir and cross-platform browser.js.
 */
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { getFlowCvCredentials } = require('../lib/secrets');
const { connectCdp } = require('../lib/browser');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);
  const creds = getFlowCvCredentials(cfg);
  if (!creds.configured) {
    throw new Error('Set FLOWCV_EMAIL and PORTAL_PRIMARY_PASSWORD / FLOWCV_PASSWORD in .env before running FlowCV login.');
  }

  const b = await connectCdp(cfg);
  try {
    const ctx = b.contexts()[0];
    const p = ctx.pages().find((pg) => pg.url().includes('flowcv')) || ctx.pages()[0];
    if (!p.url().includes('flowcv')) {
      await p.goto(cfg.rules.flowcv?.loginUrl || 'https://app.flowcv.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await p.waitForTimeout(2000);
    }

    const emailBtn = p.getByText('Login with Email');
    if (await emailBtn.isVisible().catch(() => false)) {
      await emailBtn.click();
      await p.waitForTimeout(1000);
    }

    for (let i = 0; i < creds.passwords.length; i++) {
      const pw = creds.passwords[i];
      await p.fill('#inputemail', creds.email);
      await p.fill('#inputpassword', pw);
      await p.locator('form button').filter({ hasText: /^Login$/ }).click();
      await p.waitForTimeout(3500);
      const url = p.url();
      console.log(`Attempt #${i + 1} -> URL:`, url);
      if (!url.includes('/login')) {
        console.log('FLOWCV LOGIN SUCCEEDED!');
        break;
      }
    }
    await p.screenshot({ path: path.join(cfg.paths.artifactsDir, 'flowcv_login_result.png') });
  } finally {
    await b.close().catch(() => {});
  }
})();
