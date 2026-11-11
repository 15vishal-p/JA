# Coordination Between Antigravity, Gemini & ChatGPT

This workflow was built so three distinct AI assistants can advance the same job search without duplicating applications, overwriting each other's trackers, or losing context between chats.

## 1. Role Split & Shared Source of Truth

| Assistant / Environment | Primary Execution Strength | Tracker Owned / Updated |
|---|---|---|
| **Antigravity** (Local IDE + Node + Chrome CDP) | High-throughput local Node scripts, ATS API board discovery, Playwright CDP multi-tab form filling, headless Chromium A4 PDF generation, cross-sheet REST reconciliation & automated verification (`step65c`, `step73`) | Direct updates to Primary/Secondary Job Sheets + Production Tracker & Assistant Sync Sheets (or Local JSON/MD in `local` mode) |
| **ChatGPT** (Browser Work / Cloud Tasks) | Interactive portal walkthroughs, FlowCV browser editing & visual page inspection, detailed manual score assessments, daily consolidation batches (`Production_Tracker.md`) | Primary **`Production Tracker — Master Log`** (`PT-xxxx`) + `Production_Tracker.md` companion + `Confirmed Answers` tab + `START HERE` Master Guide |
| **Gemini** (Google Workspace Connected) | Workspace document sync, Drive folder/Doc organization, Gmail confirmation searches, interview prep, cross-checking ChatGPT handoff items | **`Gemini Production Tracker — Master Log`** (`GT-xxxx`) + **`ChatGPT Handoff Log`** tab (`PT-xxxx` mirror) |

*(In public reusable setups, `GEMINI_TRACKER_SHEET_ID` and `PRODUCTION_TRACKER_SHEET_ID` can point to your own Assistant Sync and Master Production Tracker sheets, or both write cleanly into `LOCAL_DATA_DIR/Production_Tracker.md` and `activity_log.json` in `local` mode.)*

## 2. Shared Workspace Layout (Google Drive OR Local Fallback)

```text
<Workspace Root: Google Drive Folder OR LOCAL_DATA_DIR>
├── START HERE — Job Application Master Guide.md   # Top handover state & active conflicts
├── Autonomous Job Application — Master Prompt.md  # Portable instructions for any assistant
├── Application_and_CV_Localization_Rules.md       # Dynamic city matching & screening defaults
├── Career_Site_Login_Directory.md                 # Portal URLs + login method (ZERO passwords)
├── Jobs /
│   ├── Primary Market Opportunities Sheet         # Active jobs, scores, status, Confirmed Answers
│   └── Secondary Market Opportunities Sheet       # Visa sponsor matrix & prioritized leads
├── Production Tracker /
│   ├── Master Log (PT-xxxx) & Production_Tracker.md
│   └── Assistant Sync Log (GT-xxxx) + ChatGPT Handoff Log
└── Tailored CVs /                                 # Immutable named final PDFs per job
```

## 3. Reconciliation & Anti-Collision Rules

1. **Read Before Acting:** Every assistant starts by reading `START HERE`, the latest dated tracker entries, and the `Confirmed Answers` register, **then reconciles against live employer portals / inbox confirmations** rather than blindly trusting stale spreadsheet cells.
2. **Never Overwrite Prior History:** Append new dated rows (`PT-xxxx` / `GT-xxxx` / `TASK-xxxx`) or supersede stale status cells with explicit date & evidence notes; never delete historical audit trails.
3. **Never Inherit Unverified Claims or Sessions:**
   - Do not mark `Applied` based on another assistant's `"Uploaded"` or `"Draft saved"` note without observing an employer confirmation page, application ID, or email receipt.
   - Do not assume one assistant's browser cookies or password manager autofill carry over to another assistant.
4. **Handoff Block Format:** Whenever pausing or finishing a batch, record:
   - Exact resume URL & step name
   - Exact tailored CV filename & storage link
   - Newly confirmed answers (with employer scope!)
   - Exact blocker (e.g., `hCaptcha on submit`, `HTTP 403 outside CDP`, `email OTP pending`).

## 4. Portable Master Prompt (Paste into Any AI Assistant)

Use this sanitized instruction block when starting a session in **Antigravity**, **Gemini**, or **ChatGPT**:

```markdown
You are my execution-focused AI Job Application Assistant. Follow these rules:
1. Read `config/profile.json`, `config/rules.json`, `config/answers.json`, and the latest `Production_Tracker.md` / active tracker before taking action.
2. Execute in priority order: (1) Finish valid incomplete drafts/queued items, (2) Check saved/bookmarked jobs, (3) Discover new open roles from configured boards/portals, (4) Reconcile submission confirmations.
3. Score every role 0–100 honestly from verified experience only. Prioritize >=90; below 90 requires an explicit exception rationale and gap note. Never override legal authorization or mandatory language requirements.
4. Generate a dedicated CV per job dynamically setting the header city to match the exact job posting city. Check extracted PDF text and visual layout before upload.
5. Check tracker IDs, `(company|title)` keys, and candidate portal history before submitting to prevent duplicates.
6. Authenticate using private credentials (never log or store passwords in trackers). Pause and ask the user immediately for CAPTCHAs, OTPs, passkeys, missing mandatory facts, or new employer-specific legal agreements.
7. Mark `Applied` ONLY after observing confirmation page text, application ID, portal Applied status, or confirmation email. Capture screenshots/receipts and update the tracker immediately.
```
