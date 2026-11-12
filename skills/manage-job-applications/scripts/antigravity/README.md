# Antigravity source toolkit (portal adapters)

Sanitized source supplied by Antigravity, with additional review fixes. These are platform-specific Node scripts, separate from the portable AI instructions in `../../skills/manage-job-applications`.

Offline checks do not validate live portal selectors, login outcomes or submission receipts. Inspect the live form with supported tools and follow the host's authentication, consent and submission rules. Do not use a target city as actual residence. Do not evade bot detection or CAPTCHA safeguards.

Local tracking is the supported complete storage interface. Google helpers cover specific existing-sheet operations; there is no complete interchangeable Google adapter or automatic Drive PDF uploader. Use the AI host's connected Drive tools for archiving and verify the returned file link. Missing Google credentials do not guarantee automatic fallback; explicitly configure local mode when needed. Keep one writer per local tracker; concurrent writes are not locked.

All examples require the current user's verified facts and answers. Installing this code creates no schedule. No live applications were submitted during this review.

## Prerequisites & Runtime Requirements

- **Node.js `>= 20.0.0`** (uses built-in `fetch`, `node:test`, `URLSearchParams`)
- **Google Chrome or Chromium** installed locally (for CDP multi-tab automation and A4 PDF rendering)
- **Playwright Core** (`playwright-core` declared in `package.json`)
- **Optional:** `xlsx` (`optionalDependencies`) if using `generate_sheets_v2.js` to update `.xlsx` sponsor workbooks

## Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Create private local configuration from sanitized examples
cp .env.example .env
cp config/profile.example.json config/profile.json
cp config/rules.example.json config/rules.json
cp config/answers.example.json config/answers.json
cp config/targets.example.json config/targets.json

# 3. Verify environment paths and storage mode (safe offline check)
npm run doctor

# 4. Run syntax check, PII/secret scanner, and offline smoke tests
npm run verify
```

### Launching Chrome with CDP (Required for Attended Browser Scripts)

Start Chrome using an isolated profile directory on debugging port `9222` so you stay in control of SSO logins, passkeys, email verification OTPs, and CAPTCHAs:

**Windows (PowerShell):**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\JobKitChromeProfile"
```

**macOS / Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/jobkit-chrome-profile"
```

## Security & Secret Storage Model

1. **Zero secrets in code or trackers:** OAuth client IDs, client secrets, refresh tokens, and portal passwords are read strictly through `src/lib/secrets.js` from environment variables or a user-restricted token file (`~/.config/job-automation-kit/google_token.json`, `0600`).
2. **Placeholder safety guard:** `assertRealProfile()` aborts live form scripts if `profile.json` still contains `{{...}}` placeholders.
3. **Dry-run default on submission scripts:** Portal submission scripts capture pre-submit screenshots and halt before final submission unless `--submit` is explicitly passed.
4. **Human-gate respect:** `detectHumanGate()` inspects rendered iframes for `hCaptcha`, `reCAPTCHA`, or Cloudflare Turnstile challenges and stops cleanly for manual owner completion.

## Documentation Map

- [`docs/WORKFLOW.md`](./docs/WORKFLOW.md) — Scoring rubric, candidate facts/answers rules, dynamic CV tailoring, confirmation criteria, and deduplication/retry handling
- [`docs/PORTAL_LOGIN_WORKFLOW.md`](./docs/PORTAL_LOGIN_WORKFLOW.md) — Career portal authentication across Workday, SAP SuccessFactors, FlowCV, and password manager handoff
- [`docs/AI_ASSISTANT_COORDINATION.md`](./docs/AI_ASSISTANT_COORDINATION.md) — How Antigravity, Gemini, and ChatGPT share state and avoid overwriting work
- [`docs/SCHEDULES_ARCHITECTURE.md`](./docs/SCHEDULES_ARCHITECTURE.md) — Scheduled automation patterns, checkpoints, and observability
- [`docs/FILE_INVENTORY.md`](./docs/FILE_INVENTORY.md) — Complete per-file inventory, inputs, outputs, external side effects, and known limitations

## Tracker identity and validation

Jobs use normalized employer plus requisition; a canonical HTTP(S) URL is the fallback. Keep meaningful URL query parameters. Records missing both identities are rejected. ID-only status updates reject employer ambiguity. Status summaries recognize explicit labels; unknown legacy labels remain unclassified. Custom profiles require nonempty names, valid email and E.164 phone, actual residence, and no unresolved placeholders.

Use `npm ci --ignore-scripts` with the committed lockfile, then `npm run verify`. CI runs the same checks on Node 20 and 22; it performs no live applications.
