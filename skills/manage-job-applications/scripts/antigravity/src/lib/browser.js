/**
 * NEW REUSABLE ADAPTER: src/lib/browser.js
 * Cross-platform Playwright helper wrapping Chrome CDP attachment, clean headless launch
 * for PDF export, and mandatory CAPTCHA / human-verification detection.
 */
function getPlaywright() {
  try {
    return require('playwright-core');
  } catch (err) {
    throw new Error(
      'Missing playwright-core dependency. Run "npm install" in the repository root before executing browser automation scripts. Underlying error: ' + err.message
    );
  }
}

async function connectCdp(cfg) {
  const { chromium } = getPlaywright();
  const cdpUrl = cfg?.browser?.cdpUrl || process.env.CHROME_CDP_URL || 'http://127.0.0.1:9222';
  return chromium.connectOverCDP(cdpUrl);
}

async function launchBrowser(cfg, overrides = {}) {
  const { chromium } = getPlaywright();
  const launchOpts = {
    headless: overrides.headless ?? cfg?.browser?.headless ?? true,
    args: overrides.args || []
  };
  if (cfg?.browser?.executablePath) {
    launchOpts.executablePath = cfg.browser.executablePath;
  } else if (cfg?.browser?.channel) {
    launchOpts.channel = cfg.browser.channel;
  }
  return chromium.launch(launchOpts);
}

/**
 * Inspects rendered iframes for visible hCaptcha / reCAPTCHA / Cloudflare Turnstile challenges.
 * Workflow rule: NEVER bypass CAPTCHAs programmatically; stop and hand off to human owner.
 */
async function detectHumanGate(page) {
  return page.evaluate(() => {
    const iframes = [...document.querySelectorAll('iframe[src*="hcaptcha"], iframe[src*="recaptcha"], iframe[src*="challenges.cloudflare.com"], iframe[title*="challenge" i]')];
    const visibleChallenges = iframes
      .map((f) => {
        const r = f.getBoundingClientRect();
        return { src: (f.src || '').slice(0, 120), title: f.title || '', width: r.width, height: r.height };
      })
      .filter((f) => f.width > 50 && f.height > 50);

    return {
      blockedByChallenge: visibleChallenges.length > 0,
      visibleChallenges
    };
  });
}

module.exports = {
  getPlaywright,
  connectCdp,
  launchBrowser,
  detectHumanGate
};
