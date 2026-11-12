> Review amendments: actual residence must remain accurate; a job city is a labeled target. All example answers require the current user's confirmation. Live adapters require portal-specific verification and are disabled unless explicitly enabled. Google storage is partial; use connected Drive tools for verified PDF archiving. Historical descriptions below describe the supplied export and do not supersede these amendments. No live portal tests were performed.

# Complete Job Application Workflow

## 1. Points System, Thresholds & Exceptions

Two complementary 0–100 manual fit rubrics evolved across the workflow and are parameterized in `config/rules.json`:

### A. Strict Audit Rubric (`strictMode`)
Used for conservative qualification gating (`40/25/15/10/10` = `100`):
- **Qualifications (40 pts):** Degree alignment, core technical skills, verified language proficiency.
- **Relevant Duties (25 pts):** Direct alignment between JD responsibilities and verified past roles/projects.
- **Concrete Evidence (15 pts):** Quantified volume/impact already established in source CV (never fabricated from JD text).
- **Clarity & Targeting (10 pts):** Dedicated role-tailored CV headline, summary, and section order.
- **Application Readiness (10 pts):** Valid location, work authorization clarity, and immediate availability.

### B. General Weighted Rubric (`generalMode`)
Used in the Autonomous Master Prompt (`30/25/15/15/15` = `100`):
- **Professional Skills Match:** `30`
- **Relevant Work Experience:** `25`
- **Education Match:** `15`
- **Location & Work Eligibility:** `15`
- **Seniority & Responsibilities:** `15`

### Thresholds & Exception Policy
- **Standard Gate:** Prioritize candidates scoring **`> 90 / 100`** (`>= 90` in sheet `COUNTIF` KPI benchmarks; `90–100 = Excellent fit`, `75–89 = Good fit`, `60–74 = Possible fit`, `< 60 = Skip`).
- **Explicit Exception Rule:** Scores below `90` (typically `75–89`) may still be submitted when a concrete exception rationale applies and is recorded alongside honest score breakdown + gaps (for example, transferable AP/R2R foundation matching 87/100 where banking execution ownership is explicitly acknowledged as a development gap).
- **Non-Overridable Hard Blocks:** Essential legal eligibility (e.g., mandatory local citizenship/work permit where sponsorship is unavailable), strict graduation-cohort restrictions, or required B2/C1 local language fluency can **never** be bypassed by a score or tailoring. Never inflate scores to clear a gate.

---

## 2. Verified Candidate Facts & Screening Answers

All reusable answers live in `config/answers.json` (Local Mode) or the **`Confirmed Answers`** tab (Google Sheets Mode) with columns:
`Question / topic | Confirmed answer | Scope / employer | Confirmed on | Source | Reuse rule`.

### Core Operational Rules
1. **Consult Before Asking:** Check the register before interrupting the candidate for a previously answered question.
2. **Scope Isolation:** Distinguish strictly between:
   - *Global candidate facts / preferences:* Notice period (`None; immediately available`), Travel (`100%`, mapped to highest truthful range on dropdowns like `>50%`), Language floors (e.g., German `A1` or `None` — never infer higher), Confirmed actual employment start dates.
   - *Salary answers:* Use `"As per company offer"` for free-text inputs; if a form strictly enforces numeric input, enter **only the explicit minimum salary published in that current JD** (or statutory threshold where applicable). Leave optional numeric fields empty when no minimum is published.
   - *Employer-specific legal answers (DO NOT GENERALIZE):* Non-compete clauses, relative/former-employee conflict declarations, background-check consents, and optional talent-pool retention opt-ins apply **only to the named employer** and require explicit confirmation for unrelated employers.

---

## 3. Role-Specific CV Creation, Dynamic City Localization & Verification

1. **Dedicated CV per Vacancy:** Never reuse an unrelated company's summary or PDF attachment. Every role receives a dedicated PDF named `<Company>_<RoleTag>_<ReqID>_CV.pdf` (or tracked dated FlowCV export).
2. **Dynamic City Header Rule (`resolveCityHeader`):** Always set the header city/country on the CV and ATS application profile to match the exact city of the job posting (e.g., `Berlin, Germany`, `Munich, Germany`, `Amsterdam, Netherlands`, `Tallinn, Estonia`, `Stockholm, Sweden`, `Bratislava, Slovakia`). Never display an offshore origin city inside the target European CV header.
3. **Accounting vs Technical Tailoring (`includeEtlProject`):**
   - *Accounting / Finance Operations roles:* Place Professional Experience first, highlight AP/R2R, reconciliations, journal entries, and close support, and toggle off noisy ETL/AI project blocks unless relevant.
   - *Data / BI / Analytics roles:* Re-enable SQL/Python/ETL/BI technical projects and skills so accounting presets are not inherited accidentally.
4. **FlowCV vs Compliant HTML-to-PDF Generator:**
   - Domestic primary-market roles (e.g., Bratislava/Slovakia rule) require tailoring directly inside the active single FlowCV template, exporting a clean 2-page PDF, and archiving it.
   - High-velocity multi-region applications use `cv_generator_compliant.js` to render ATS-clean A4 PDFs via headless Chromium directly from `profile.json` + dynamic city mapping.
5. **Mandatory PDF Quality Gate (Pre-Upload):** Extract PDF text and visually inspect rendered pages to verify employer targeting, dates, phone prefix (`+421`), email, section order, page count (`<= 2` pages), and absence of clipping or awkward page breaks. Inspect parsed fields after ATS upload because parsers frequently overwrite country, phone prefix, or dates.

---

## 4. Application Submission & Confirmation Evidence

An application may be marked `Applied` **only** when at least one verifiable confirmation signal is observed:
1. Employer confirmation page text (`"Thank you for applying"`, `"Your application has been received"`, `"Application Submitted"`).
2. Issued application/requisition confirmation ID in portal candidate history.
3. Employer confirmation email received in candidate inbox (`PORTAL_LOGIN_EMAIL`).

**What is NOT `Applied`:** Uploading a CV, saving a draft (`"The draft application was saved successfully"`), clicking Submit before page transition, encountering a loading spinner, session timeout, email OTP prompt, or visible CAPTCHA challenge (`Pending` / `Blocked`).

Every live automation run captures pre-submit (`pre_<id>.png`) and post-submit (`confirmed_<id>.png`) screenshots in `ARTIFACTS_DIR` before `sheets_helper.updateStatus` / `storage.updateStatus` writes `Applied & Confirmed`.

---

## 5. Duplicate Prevention, Interrupted Runs & Retry Handling

### Deduplication Strategy (`build_eligible_queue.js`, `step22`, `step57`, `storage.js`)
- Exclude statuses matching `applied`, `closed`, `expired`, `held`, `blocked`, `already applied`, `duplicate`, `skipped`.
- Deduplicate across boards and spreadsheets by **normalized Job ID** AND **`lowercase(company)|lowercase(title)`** AND normalized URL.
- When multiple tracker rows reference the same req ID, explicitly flag secondary rows as `Duplicate Row` and exclude them from unique submission counts (`step51`, `step65c`).
- Before submitting on candidate portals (Workday, SuccessFactors, Oracle/custom portals), inspect `"Candidate Home / My Applications"` to catch prior submissions or `"Not Selected"` history.

### ATS Failure Modes & Coded Recoveries
1. **Dead / Expired Job Links (`precheck_live_jobs.js`):** Batched HTTP GET (`15` concurrent, `8s` timeout) flags `404`/`410` and expired text before wasting browser tabs.
2. **Blocked HTTP Scrapers (`step69_test_profesia_cdp.js`):** Portals returning `HTTP 403` to headless `fetch` (e.g., Profesia.sk) are probed inside the live Chrome CDP session.
3. **Greenhouse Wrapper Upload Failure (`step46`/`step47`):** When a company wrapper page blocks Playwright's file input, load `https://job-boards.greenhouse.io/embed/job_app?for=<board>&token=<id>` directly and use `page.waitForEvent('filechooser')`.
4. **React Debounced Typeahead Cache Bug (`step43`):** Cleanly `.reload()` the page to flush stale suggestion caches, then send a burst (`pressSequentially(cityPrefix, { delay: 15 })`) faster than debounce so the right city option populates cleanly.
5. **Workday `Use My Last Application` Overwrite (`wave4b_workday_all3.js`):** Detects collapsed single `workExperience-*` blocks and clicks section-scoped `"Add Another"` (`button[data-automation-id="add-button"]`) to split clean experience and education records.
6. **CAPTCHA / Human Verification Gate (`browser.detectHumanGate`):** Checks bounding boxes (`width > 50 && height > 50`) of `hCaptcha`, `reCAPTCHA`, and Cloudflare Turnstile iframes; halts cleanly without solving or retrying blindly.
7. **Tab & Session Cleanup (`step51`):** Closes processed tabs leaving a single `about:blank` tab between batches while preserving signed-in browser cookies in the CDP user data directory.
