/**
 * NEW REUSABLE ADAPTER: src/lib/secrets.js
 * Private credential and OAuth token loader.
 * - Never embeds secrets in code or logs.
 * - Reads portal/FlowCV/Google OAuth credentials from environment variables or a private,
 *   user-restricted token file outside the git workspace (~/.config/job-automation-kit/google_token.json).
 * - Designed so an installer can swap in an OS keychain provider (Windows Credential Manager,
 *   macOS Keychain, libsecret) without altering workflow scripts.
 */
const fs = require('fs');
const path = require('path');

function isPlaceholder(val) {
  return !val || /\{\{.+\}\}/.test(String(val));
}

function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: !isPlaceholder(clientId) && !isPlaceholder(clientSecret)
  };
}

function readTokenFile(tokenPath) {
  if (!tokenPath || !fs.existsSync(tokenPath)) {
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  return {
    accessToken: raw.access_token || raw.accessToken || '',
    refreshToken: raw.refresh_token || raw.refreshToken || '',
    expiresAt: raw.expiry_date || raw.expires_at || 0
  };
}

function writeTokenFile(tokenPath, tokenData) {
  const dir = path.dirname(tokenPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2), { mode: 0o600 });
}

function getPortalCredentials(cfg) {
  const email = process.env.PORTAL_LOGIN_EMAIL || cfg?.profile?.candidate?.email || '';
  const primaryPassword = process.env.PORTAL_PRIMARY_PASSWORD || '';
  const fallbackPassword = process.env.PORTAL_FALLBACK_PASSWORD || '';
  const passwords = [primaryPassword, fallbackPassword].filter((p) => !isPlaceholder(p));

  return {
    email: isPlaceholder(email) ? '' : email,
    passwords,
    configured: !isPlaceholder(email) && passwords.length > 0
  };
}

function getFlowCvCredentials(cfg) {
  const portal = getPortalCredentials(cfg);
  const email = !isPlaceholder(process.env.FLOWCV_EMAIL) ? process.env.FLOWCV_EMAIL : portal.email;
  const flowPw = !isPlaceholder(process.env.FLOWCV_PASSWORD) ? process.env.FLOWCV_PASSWORD : '';
  const passwords = [flowPw, ...portal.passwords].filter(Boolean);
  return {
    email,
    passwords: [...new Set(passwords)],
    configured: Boolean(email) && passwords.length > 0
  };
}

module.exports = {
  isPlaceholder,
  getGoogleOAuthClient,
  readTokenFile,
  writeTokenFile,
  getPortalCredentials,
  getFlowCvCredentials
};
