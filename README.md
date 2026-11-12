# Job Automation

A portable AI skill for discovering jobs, assessing fit, preparing truthful tailored CVs, completing authorized applications and maintaining evidence-backed trackers.

This is an instruction-based workflow, not a standalone auto-apply bot. It requires an AI host with the appropriate browser, file, connector and scheduling tools. Login, verification and some declarations can require user participation. The sanitized Antigravity source toolkit is bundled under `skills/manage-job-applications/scripts/antigravity`. Browser adapters require portal-specific verification and explicit enablement; account sessions are never bundled.

## Use

1. Download or clone this repository.
2. Install `skills/manage-job-applications` with your AI host's supported skill mechanism. For hosts without native skills, attach SKILL.md and the relevant references to a project or chat and ask the AI to follow them.
3. Ask: “Use manage-job-applications. Set up my own Drive workspace, or a local folder if Drive is unavailable. Read my verified CV and prepare the next suitable job application.”
4. Connect your own Google Drive when asked, or choose local storage. Supply private candidate facts and choose discover, prepare, apply, audit or monitor mode.
5. Configure any schedule through your host's scheduler. Installing the skill does not activate recurring work.

## Included

- 100-point fit rubric: skills 30, experience 25, education 15, location/eligibility 15, seniority 15.
- Distinct CV exports, page inspection and archive provenance.
- Employer/requisition deduplication, portal-result verification and confirmed-answer records.
- Drive-first onboarding with a local-workspace fallback.
- Separate discovery, CV preparation, application and monitoring prompts.
- Cooperation and handoff rules for several AI agents.
- Fictional profile configuration and a blank tracker schema.

Use only accurate candidate facts. A successful upload or HTTP 200 is not proof of application submission. Follow the host's policies and each site's safeguards.

## Privacy

Keep your real profile, CVs, tracker data, credentials, OAuth tokens, browser state and receipts private. Do not commit them. This repository contains generic instructions and fictional examples only.

## Coverage limits

This workflow was distilled from an Antigravity work report and four inspected Gemini schedules across two accounts (regional discovery, sponsorship discovery, expired-listing auditing and paused CV preparation). It includes the supplied 47-file sanitized Antigravity export with review amendments, not an unmodified historical snapshot. It does not assert that schedules outside the two inspected accounts were audited. Live portal selectors, logins and submissions were not tested during this review. Google storage helpers are partial; connected Drive tools handle verified CV archiving.
