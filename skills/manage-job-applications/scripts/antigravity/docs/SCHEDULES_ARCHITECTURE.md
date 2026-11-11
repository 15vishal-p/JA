# Scheduling, Logs, Checkpoints & Monitoring Architecture

## 1. Execution & Scheduling Model

This kit separates **interactive execution** (Chrome CDP multi-tab applying, CAPTCHA/OTP handling) from **unattended checks/reconciliation** (discovery APIs, HTTP link health checks, tracker summarization).

### Local Antigravity Scheduled Automations (`/schedule` Sidecar Format)
When running locally with Antigravity (`builtin: "schedule"`), recurring jobs store a `sidecar.json` configuration in the user's sidecar directory:

```json
{
  "builtin": "schedule",
  "args": {
    "schedule": "0 21 * * *",
    "timezone": "Asia/Kolkata",
    "prompt": "Run npm run doctor, execute step57_discover_open_roles.js and step73_verify_all_facts.js (read-only), and append a dated daily summary to Production_Tracker.md. Do not submit forms or solve CAPTCHAs autonomously."
  }
}
```

### Documented Daily & Weekly Consolidation Cadence
When coordinating via cloud assistants (e.g., ChatGPT / Gemini scheduled prompts where supported by the platform), the workflow defines:
- **Daily Consolidation Summary:** `21:00` local timezone (`Asia/Kolkata` / IST in original setup) — summarizes confirmed applications, pending drafts, blockers, and newly added tracker entries using HTML comment checkpoints (`<!-- daily-batch: YYYY-MM-DD verified -->`).
- **Automated Recovery Retry:** `01:00` next day — retries if the evening consolidation run failed or was missed.
- **Weekly Recap:** Every Sunday — rolls up weekly activity, deduplicated counts, and open blockers.

### Important Distinction: Configured vs Executed Runs
A scheduler configuration or timestamp alone **never** counts as proof that work completed or forms were submitted. Every scheduled consolidation batch must verify actual file/portal/email evidence and explicitly flag `"activity-visibility gaps"` when target sessions or emails are inaccessible.

---

## 2. Checkpoints & State Files

| Checkpoint Artifact | Location | Purpose |
|---|---|---|
| `top_actionable_jobs.json` | `CACHE_DIR` | Portal-classified actionable leads sorted by fit score (`filter_top_jobs.js`) |
| `eligible_jobs_queue.json` | `CACHE_DIR` | Deduplicated submission queue excluding Applied/Closed/Blocked (`build_eligible_queue.js`) |
| `live_jobs_verified.json` / `dead_jobs_verified.json` | `CACHE_DIR` | Split queue after batched HTTP GET liveness checks (`precheck_live_jobs.js`) |
| `job_cv_map.json` | `CACHE_DIR` | Maps exact normalized Job ID -> generated/verified tailored CV PDF path |
| `jobs_tracker.json` & `.csv` | `LOCAL_DATA_DIR` | Canonical local job state (`local` mode) |
| `activity_log.json` & `Production_Tracker.md` | `LOCAL_DATA_DIR` | Append-only task history (`PT-*` / `GT-*` / `TASK-*`) |
| `pre_<id>.png` & `confirmed_<id>.png` | `ARTIFACTS_DIR` | Visual audit trail before & after every form submission |

---

## 3. Monitoring & Reconciliation Utilities

- **Formula & Footer Integrity (`step74_inspect_tails.js`, `step64d_check_chrome_and_formulas.js`):** Inspects top KPI rows and bottom `SUMMARY` rows (`COUNTIF`/`COUNTA`/`AVERAGE`) whenever new rows are appended so inserted jobs never fall outside formula bounds.
- **Cross-Tracker Drift Check (`step65c_sync_all_submitted_statuses.js`, `step73_verify_all_facts.js`):** Verifies that region trackers, Master Production Tracker counts, and Assistant Sync counts match with zero duplicate-ID inflation.
- **Status Proof Audit (`step65_audit_status.js`):** Compares every row containing `Applied` against recorded confirmation screenshots/logs.
- **Ready-Queue Snapshot (`step74b_check_sch_ready_and_timeline.js`):** Prints remaining `Ready` / `Staged` rows alongside the latest activity log entries for quick manual or scheduled continuation.
