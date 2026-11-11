# Scheduling and multi-agent cooperation

Separate discovery from application execution. A scheduled discovery prompt does not authorize applications. A skill file is not a scheduler and cannot run after the chat ends without a supported enabled automation.

## Discovery prompt

“Read my verified private profile and job tracker. Find current vacancies in my target regions. Verify official descriptions, essential requirements and existing employer/requisition keys. Score evidenced fit using my configured rubric. Append only genuinely new jobs, with sources and an honest status. Do not create accounts or submit applications. Report additions, closures, uncertainties and blockers.”

## CV preparation prompt

“Reconcile missing CVs against the archive. Prepare the next role-specific CV under my editor and page-count rules. Use only verified facts. Check extracted text and every rendered page; archive the exact PDF and record its stable link. Do not submit applications.”

## Monitor prompt

“Read the current tracker and archive. Report new verified outputs, missing files, duplicates, status/evidence conflicts and blockers. Do not create, edit, delete, upload or submit. Distinguish another agent's reported completion from independently verified evidence.”

## Application prompt

“Resume the next eligible saved draft within my explicit application authority. Recheck the live role, existing application, correct verified CV and mandatory answers. Stop for unavailable facts, authentication and required host-policy handoffs. Verify the role-specific result and update the tracker. Never retry an uncertain submission until reconciled.”

Choose the cadence and timezone from the user's request. Create or update the actual scheduler, inspect its result, and record its ID privately. Preserve prior stopped or monitor-only instructions. Do not create duplicate schedules. Never claim the task is active from a prompt draft alone.

## Several agents

Use one shared tracker and one writer per employer/requisition. Claim a job with agent name, start time, expiry and intended action when the tracker supports it. Recheck the claim before writes; an expired claim does not prove the previous attempt failed. Reconcile employer state before taking over an uncertain submission.

Give a single active CV template one editor at a time. Export and archive the current role before another agent retargets it. Re-read current values to detect concurrent edits.

Handoff record: task mode, completed roles, exact artifact links, validation state, confirmed submission evidence, open drafts, blockers, unresolved answers, ownership and next action. Leave passwords, tokens, verification codes and session-bound URLs out. Do not assume another AI sees local Windows paths or inherits browser sessions.

## Regional discovery variants

Two inspected Gemini tasks used a five-hour discovery cadence as a source pattern; cadence is configurable and must be verified per imported task. The regional tracker task searched current English-language vacancies, deduplicated requisitions and links, applied the 100-point rubric and appended verified new rows. Example routing: Ready at 90 or above, Review at 75–89, subject to the user's own policy and essential requirements.

The second task had a broad regional title but a Germany-only current prompt. Preserve actual prompt scope. Start with the user's sponsor-employer directory, then secondary employers; verify that jobs are active and language-compatible. Do not submit applications from a discovery task.

For sponsorship-oriented searches, record country and city, actual residence separately from relocation target, salary and units, estimated sponsorship likelihood with supporting evidence, and relevant visa route. A sponsorship score is an estimate, not a guaranteed outcome. Verify current legal requirements and salary thresholds from official sources before relying on them; do not reuse dated numbers from an imported prompt.

Append only genuinely new jobs. Preserve existing data and refresh KPI cards and summary formulas across the full intended range. Report additions, duplicate skips, closed roles, high-fit opportunities and unresolved eligibility or sponsorship questions. Use references/source-import.md when migrating original scripts or account schedules.

## Expired-listing audit

Use this portable prompt for a listing directory: “Read the configured job directory and follow each relevant listing to its external employer or ATS destination. Identify explicit closure or expiry evidence. Append newly confirmed expired listings to my private audit tracker with employer, requisition, directory URL, destination URL, observed message and checked timestamp. Deduplicate existing findings. Treat login walls, bot checks, timeouts and network failures as unverified, not expired. Do not delete directory entries or submit applications.”

An inspected source task was active with a five-hour interval. Treat this as an example, not a new enabled schedule for an installer. Its ‘last check’ badge is not proof that every listing was audited successfully.

## CV and score reconciliation

Use this portable prompt: “Read my active regional job trackers and cross-reference each employer/requisition against my tailored CV archive. Re-evaluate score mismatches using the current role, verified profile and configured 100-point rubric. Record the evidence and correction reason; do not change a score merely to match an old CV. For eligible unhandled roles, prepare a distinct CV under my current editor, page-count and inclusion/exclusion rules. Verify dates and claims, inspect every exported page and archive the exact PDF. Summarize score corrections, verified new CVs, unresolved conflicts and blockers. Do not submit applications.”

An inspected source task was paused and configured for a 40-minute interval. Preserve paused state; do not reactivate during migration. Replace source-specific employers, private folder names and excluded projects with each installer's own confirmed preferences. Treat job city as target or relocation preference when different from actual residence. Keep internal fit assessments in tracker metadata unless the user requests them in a CV; do not imply an employer-issued ATS score.
