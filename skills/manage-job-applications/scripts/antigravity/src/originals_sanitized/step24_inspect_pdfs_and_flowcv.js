// Experimental imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Experimental adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: step24_inspect_pdfs_and_flowcv.js
 * Original role: Inspects FlowCV session state, captures login/resume DOM metadata,
 * updates a confirmed application row, and runs live HTTP URL health checks on candidate targets.
 * Modifications for public reuse:
 *   - Replaced device paths, hardcoded Sheet IDs, and personal target URLs with config/sample targets.
 */
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { connectCdp } = require('../lib/browser');
const { updateStatus } = require('./sheets_helper');

(async () => {
  const cfg = loadConfig();
  ensureDirs(cfg);

  const updateId = process.argv.find((a) => a.startsWith('--confirm-id='))?.replace('--confirm-id=', '');
  if (updateId) {
    await updateStatus('secondary', updateId, `Applied & Confirmed (${new Date().toISOString().slice(0, 10)})`, cfg);
  }

  const browser = await connectCdp(cfg);
  try {
    const ctx = browser.contexts()[0];
    const fc = ctx.pages().find((p) => p.url().includes('flowcv.com'));
    if (fc) {
      await fc.bringToFront();
      const loginBtn = fc.locator('a:has-text("Login"), button:has-text("Login")').first();
      if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginBtn.click();
        await fc.waitForTimeout(2500);
      }
      await fc.screenshot({ path: path.join(cfg.paths.artifactsDir, 'flowcv_login.png'), fullPage: false });
      const info = await fc.evaluate(() => ({
        url: location.href,
        inputs: [...document.querySelectorAll('input')].map((i) => ({ type: i.type, name: i.name, placeholder: i.placeholder })),
        buttons: [...document.querySelectorAll('button, a')].map((b) => (b.innerText || '').trim()).filter(Boolean).slice(0, 25)
      }));
      console.log('=== FLOWCV LOGIN PAGE ===\n', JSON.stringify(info, null, 2));
    }

    const targets = (cfg.targets?.sampleJobs || []).map((j) => [j.company + ' ' + j.id, j.link]);
    for (const [label, url] of targets) {
      if (url.includes('example.com')) {
        console.log(`CHECK ${label}: placeholder URL skipped (${url})`);
        continue;
      }
      try {
        const r = await fetch(url, { redirect: 'follow' });
        const body = await r.text();
        console.log(`CHECK ${label}: status=${r.status} finalUrl=${r.url} len=${body.length} removed=${/removed|no longer|not found|404/i.test(body.slice(0, 5000))}`);
      } catch (e) {
        console.log(`CHECK ${label}: err=${e.message}`);
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
})();
