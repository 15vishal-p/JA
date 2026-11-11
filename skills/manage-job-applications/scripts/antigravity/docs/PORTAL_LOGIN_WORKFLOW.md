> Review amendments: actual residence must remain accurate; a job city is a labeled target. All example answers require the current user's confirmation. Live adapters are experimental and disabled unless explicitly enabled. Google storage is partial; use connected Drive tools for verified PDF archiving. Historical descriptions below describe the supplied export and do not supersede these amendments. No live portal tests were performed.

# Career Portal & CV Builder Authentication Workflow

This document specifies how the automation kit authenticates into employer career portals (Workday, SAP SuccessFactors, Cornerstone, Taleo, iCIMS, SmartRecruiters) and FlowCV without storing plaintext passwords in source code, git repositories, or shared Google Drive documents.

---

## 1. Security Architecture & Secret Storage

1. **Private Storage Only:** Credentials are loaded at runtime via `src/lib/secrets.js` from environment variables (`.env`, gitignored) or an OS keychain / user-restricted secrets store:
   - `PORTAL_LOGIN_EMAIL` — Primary registration & sign-in email across ATS portals.
   - `PORTAL_PRIMARY_PASSWORD` — Primary portal password attempted first.
   - `PORTAL_FALLBACK_PASSWORD` — Fallback password attempted automatically if a portal rejects the primary password due to differing length/symbol complexity rules or older registration history.
   - `FLOWCV_EMAIL` & `FLOWCV_PASSWORD` — Optional dedicated CV builder credentials (defaults to `PORTAL_LOGIN_EMAIL` + portal password list if omitted).
2. **Never Store Secrets in Trackers:** Shared Drive documents (`Career Site Login Directory`), Google Sheets, screenshots, and application logs record **only**:
   - Official career portal URL
   - Non-secret login email identifier
   - Password manager entry label
   - Login method (`password manager` / `Google SSO` / `email+password`)
   - Account status (`active` / `pending verification` / `locked`) and last verified login date.
3. **Never Echo Secrets:** Scripts log password attempts by index (`Password attempt #1`, `#2`) and never write passwords, OTPs, session URLs, or refresh tokens to stdout or log files.

---

## 2. Automated Login Mechanics by Platform

### A. Chrome CDP Shared Session Model (Primary Pattern)
Because modern ATS platforms rely heavily on session cookies, email one-time codes (OTP), passkeys, and anti-bot challenges:
1. Chrome is launched once by the user with `--remote-debugging-port=9222` and a persistent `--user-data-dir`.
2. Automation scripts connect over `chromium.connectOverCDP(CHROME_CDP_URL)` (`src/lib/browser.js`) rather than spinning up disposable incognito sessions.
3. Scripts **always inspect whether a portal tab is already signed in** before triggering login UI, preserving existing cookies and saved drafts.

### B. Workday Multi-Tenant Login (`apply_clarios_auth.js`)
Each company operates an isolated Workday tenant (`https://<company>.wd<N>.myworkdayjobs.com/...`) with its own independent candidate account:
1. Navigate to the job posting URL and wait for DOM hydration (`domcontentloaded` + `~3000ms`).
2. Check visibility of `button[data-automation-id="utilityButtonSignIn"]`. If hidden, the tenant session is already authenticated.
3. If visible, click `utilityButtonSignIn`, fill `input[data-automation-id="email"]` and `input[data-automation-id="password"]`, and click `button[data-automation-id="signInSubmitButton"]`.
4. If login fails with primary password, retry with fallback password; if neither account exists on that tenant, trigger `"Create Account"` flow and check the user's inbox if email verification is required.
5. Once authenticated, check `"Candidate Home / My Applications"` for existing drafts or prior submissions before clicking `adventureButton` (`Apply`) -> `"Use My Last Application"` / `"Autofill with Resume"`.

### C. SAP SuccessFactors (`step3_check_mr_and_login_sr_ey.js`)
SuccessFactors instances (`career2.successfactors.eu`, `career55.sapsf.eu`, etc.) are also isolated per company tenant:
1. Check for visible `#username` and `#password` inputs.
2. Iterate through `creds.passwords` (`[primary, fallback]`), submitting via `button:has-text("Sign In"), input[type="submit"][value="Sign In"]`.
3. Inspect body text for failure indicators (`invalid`, `incorrect`, `does not match`, `locked`, `create an account`) **and** confirm `#username` has left the DOM before reporting `SIGNED_IN`.
4. If both passwords fail and `#username` remains visible, inspect and click `a:has-text("Create an account")` cleanly so account registration can proceed or be handed off to the candidate.

### D. FlowCV Login (`step56_test_flowcv_login.js`)
1. Attach to an open `flowcv.com` tab or navigate to `https://app.flowcv.com/login`.
2. Click `"Login with Email"` if present.
3. Fill `#inputemail` and `#inputpassword`, click `form button:has-text("Login")`, wait for redirect off `/login`, and capture a state screenshot.
4. Try `creds.passwords` in order, exiting early as soon as `!url.includes('/login')`.

---

## 3. Non-Secret Portal Directory Schema

Maintain a clean directory using this structure (zero passwords stored):

```yaml
- company: "Example Corp"
  portal_url: "https://example.wd5.myworkdayjobs.com/careers"
  login_email: "applicant@example.com"
  password_manager_entry: "Example Corp Workday"
  login_method: "email+password"
  account_status: "active" # active | pending_verification | locked | unknown
  last_verified_date: "YYYY-MM-DD"
  notes: "Requires email verification link on initial registration; no 2FA after setup."
```

## 4. Handoff Rules for Multi-Step Security Gates

- **OTP / Email Verification Links:** Scripts pause when a portal asks for an email code (`e.g. Cornerstone / Oracle Cloud / Greenhouse verification code`); the human supplies or clicks the verification link in the CDP Chrome session, and scripts **never store verification codes** in trackers.
- **CAPTCHAs & Passkeys:** Any visible `hCaptcha`, `reCAPTCHA`, Cloudflare challenge, or WebAuthn prompt pauses automation immediately (`BLOCKED: HUMAN_VERIFICATION`) while other independent tabs continue in parallel.
- **No Cross-Assistant Session Inheritance:** Never assume ChatGPT Work, Gemini, and local Antigravity share Chrome cookies; each assistant must verify sign-in state live in its active browser environment.
