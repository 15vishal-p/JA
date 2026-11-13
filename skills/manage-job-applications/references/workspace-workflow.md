# Create the user's working workflow

During onboarding Step 7, create this workflow automatically from saved answers using the host's supported file and connector tools. The user supplies preferences and account access. The AI creates the documents, tracker structure and filled prompts. Read the current workspace before writing and resume incomplete setup. Monitor-only mode remains read-only.

The reusable tracker structure follows the supplied *Automated Job Tracker Workflow Prompt.md*, inspected on 13 November 2026, extended with the four specialist roles and audit gate. Its example schedule and candidate settings become each user’s own choices.

## Build and personalize

1. Resolve the chosen workspace, current profile, rules, active roles, execution mode, authority, CV editor and research references. Reuse existing trackers and documents. Keep their stable IDs or paths in setup.md. Fill unknown optional values as pending with a next action. Missing mandatory inputs block only the stage that needs them.
2. Use [the workflow template](../assets/workflow.template.md) to create private `workflow.md` or an equivalent readable Drive document. Replace all `{{...}}` fields with actual workspace references and saved settings. Include the four-stage flow, active/inactive roles, correction loop, next action and links to the actual working files. Write a draft once the workspace exists and finalize it after the interview.
3. Generate all four personalized prompts from `separate-chats.md` and save them under `prompts/` as `job-search.md`, `cv-creation.md`, `cv-audit.md` and `application.md`, or equivalent Drive files. Resolve the guide references each target host can access. Mark inactive roles in the workflow. In one-chat mode the coordinator can use the same saved assignments. In four-chat mode also give the user the prompts or links to paste. Creating files alone does not launch chats.
4. Initialize or map the tracker using the storage-specific instructions below. Preserve existing job history, answers, formulas and validated CV references. Record one logical employer/requisition key per job and a separate filesystem-safe folder ID. Initialize an empty handoff index under `handover/` that records job key, folder reference, current stage/owner, completed handoff, blocker and next action. Add rows only when actual jobs exist.
5. Include links to the candidate summary, research, CV archive, audits, application evidence, confirmed answers and handoff index in the generated workflow. Describe pending account access without copying login contents. Keep the selected login file reference in setup.md.
6. Read back every newly created file or sheet and verify returned IDs/paths, prompt substitutions, expected headers and empty initial job counts. Confirm all links resolve within the intended workspace. Only then record workflow creation complete in setup.md and give the user its actual link or path. On partial failure, save completed references and retry only missing steps. Never claim that merely displaying a template created the workflow.

## Drive workspace

Use the selected Drive folder and connected file/Sheets tools. For a new native spreadsheet follow the host's supported spreadsheet creation/import procedure. Create a tracker named for the user's target market and candidate, or reuse their existing tracker. Use these views or mapped existing equivalents.

- **Candidate Profile Summary** contains verified career facts, target roles/countries, language and work-rights sources, availability, editor/output rules, fit rubric and configured threshold. Record last successful discovery check separately from a scheduled-run timestamp.
- **Active Jobs** contains the existing tracker schema, including job identity, country/city, direct source/application URL, fit and gaps, CV state/link and application status/evidence. Also retain category, published salary with units, explanation of fit and audit reference using additional columns or an existing related record. Keep CV readiness distinct from application readiness. A fit score alone never marks a role ready to submit.
- A summary area shows unique opportunities, roles meeting the user's fit threshold, average assessed fit, confirmed applications and active pipeline. Use formulas over the full table, deduplicate by logical job key and handle an empty table without errors. Holds, rejected/closed jobs and uncertain submissions have explicit statuses. A blocked page does not prove expiry.

Use the existing confirmed-answer register and audit/handoff records rather than creating parallel copies. Create their missing containers automatically. Link their actual references from the workflow. Preserve sharing settings. Record file IDs privately. If native Sheets is unavailable, use the local-style CSV and Markdown records in the selected Drive folder when supported, state the actual format and verify uploads.

## Local workspace

Create or reuse `trackers/jobs.csv` from `assets/tracker.csv`, a `trackers/candidate-summary.md` populated from verified profile facts and a `trackers/dashboard.md` with initial zero counts or totals recomputed from existing rows. Record category, salary/units, fit explanation and audit reference in the job's detailed record when the CSV has no matching column. Keep the original CSV header compatible with existing callers.

CSV dashboards are refreshed snapshots. On each completed coordinator update recompute unique job totals, count above the configured threshold, assessed-fit average, confirmed submissions and active pipeline. Show the checked time. An empty tracker has zero counts and an unassessed average. Never imply a Markdown snapshot has live spreadsheet formulas.

## Maintain and resume

Before resuming a job, reconcile its detailed record, tracker row and handoff against verified artifact/audit/receipt evidence. Report material conflicts and retain history. The coordinator updates the detailed job record, tracker, handoff index, workflow's next-action section and dashboard consistently after meaningful role completions. If interrupted between writes, record which updates remain and reconcile them on resume instead of restarting an application. Failed audits route to CV Creation, and revised exports require a fresh audit before Application. Uncertain submissions route to verification before retry. Retain history and completed artifacts.

On rerun discover the previously saved IDs/paths before creating anything. Fill missing documents and merge only setup changes the user requested. Preserve manual additions and existing authority. Avoid duplicate trackers, prompts, schedules and job rows. If the user requests recurring work, use `scheduling.md` to create or reuse an actual scheduler and record the confirmed schedule privately. Otherwise the workflow runs during active sessions.
