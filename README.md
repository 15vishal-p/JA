# Job Automation Skill

One portable skill with Job Search, CV Creation, CV Audit and Application roles for Codex, Claude, Antigravity and other capable AI hosts. The project owner reports smooth career-portal login workflows in Antigravity; this is user-reported experience, not a guarantee for every portal.

A portable AI skill for discovering jobs, assessing fit, preparing truthful tailored CVs, completing authorized applications and maintaining evidence-backed trackers.

This is an instruction-based workflow, not a standalone auto-apply bot. It requires an AI host with the appropriate browser, file, connector and scheduling tools. Login, verification and some declarations can require user participation. The sanitized Antigravity source toolkit is bundled under `skills/manage-job-applications/scripts/antigravity`. Browser adapters require portal-specific verification and explicit enablement; account sessions are never bundled.

## Install and start

1. Download or clone [Job Automation Skill](https://github.com/15vishal-p/job-automation-skill).
2. Install the complete `skills/manage-job-applications` folder using your AI tool's supported skill mechanism. Keep its references, resources and assets together. For a tool that accepts project instructions or attachments, provide `SKILL.md` and the referenced files there.
3. Start a chat and paste the prompt below. The AI begins the numbered setup interview on first use. A host-supported welcome hook may start it earlier.

```text
Use manage-job-applications. Start its seven-step setup and show Step 1 of 7. Ask one group of questions at a time, reuse answers and documents I already supplied, and save progress. Ask whether I want one chat or four separate chats and which roles I want now. If I choose separate chats, give me a personalized prompt for Job Search, CV Creation, CV Audit and Application using my chosen shared workspace. Continue only within the actions I authorize.
```

## The seven setup steps

The AI follows [the onboarding guide](skills/manage-job-applications/references/onboarding.md) and shows progress as Step N of 7. It resumes saved answers after interruptions.

1. **Choose storage.** Select your Google Drive folder or a local folder. The AI creates or maps a `Job Applications` workspace and checks that it can save there.
2. **Supply your career history.** Give an existing CV or answer guided questions about work, education, projects, skills, languages and contact information. Confirm missing or conflicting facts.
3. **Set preferences and allowed actions.** Choose roles, countries, remote/relocation preferences, eligibility, availability, salary expectations and CV requirements. Choose job search only, CV preparation/audit, or applications, and set any restrictions.
4. **Choose one chat or four separate chats.** Keep the workflow together, or use separate Job Search, CV Creation, CV Audit and Application chats. The AI gives four personalized prompts for the separate-chat choice. Choose which roles run now.
5. **Set up relevant accounts.** Tell the AI which job boards, employer portals and CV editors you use and which are already signed in. Use an existing session, supported password manager, manual sign-in or your private `secrets/login.md`. Enter credentials directly into your selected private file. Search-only work can skip accounts it does not need.
6. **Add research and vision.** Point to your documents or add them later. Research folders cover Schengen, Slovakia, India/Western markets, CV creation, CV auditing and applications.
7. **Create the workflow and start.** The AI automatically creates your personalized workflow document, four saved role prompts, candidate summary, job tracker, progress summary and handoff index in your chosen workspace. It fills these from your setup answers and verifies the saved files. Review its setup summary and missing inputs. The AI starts the first permitted task or gives you the filled prompts and handoff instructions for your chosen chats.

Installing files does not itself create chats, connect accounts or start schedules. Each AI tool needs suitable file, browser and connector access for the tasks you select. Configure any recurring work through that tool's scheduler.

## What setup creates automatically

Your saved workflow links your profile, rules, research, tracker, CV archive, audit reports, application evidence and role handoffs. It records which roles are active, what each role produces and the next action. Your AI creates and fills it during first-use setup, then keeps it current as work progresses. You supply your preferences and account access.

For Drive, setup creates or reuses a tracker with Candidate Profile Summary, Active Jobs and progress totals. Local setup creates CSV and Markdown equivalents. Existing trackers and history are preserved. The four filled prompts are saved so you can reuse them in one chat or separate chats. The workflow uses the same discovery/scoring/tracking structure as the supplied Drive workflow, extended with CV creation, audit and verified application handoffs.

## Choose how the four roles work

| Role | What it does | Guide |
| --- | --- | --- |
| Job Search | Finds current roles, checks requirements and duplicates, records evidenced fit | [Job Search](skills/manage-job-applications/references/roles/job-search.md) |
| CV Creation | Tailors and exports a distinct CV from verified facts | [CV Creation](skills/manage-job-applications/references/roles/cv-creation.md) |
| CV Audit | Checks the exact export against the JD and user rules, reports mistakes and requests correction | [CV Audit](skills/manage-job-applications/references/roles/cv-audit.md) |
| Application | Uses a passing CV, completes authorized applications and verifies receipts | [Application](skills/manage-job-applications/references/roles/application.md) |

With one chat, the AI coordinates these roles and uses separate specialists when its tools support delegation. With four chats, each reads the same workspace and its predecessor's completed handoff. The setup chat can also serve as Job Search and coordinator. Roles wait for their required inputs, and every changed CV needs another audit.

Use [the separate-chat prompts and handoff instructions](skills/manage-job-applications/references/separate-chats.md). Setup fills their workspace and guide references for you. Chats across different tools need access to the same files or an explicitly transferred handoff packet. Saved files carry progress, while automatic notifications require a configured messenger or scheduler.

## Find the right guide

| Need | Read |
| --- | --- |
| Setup questions and private folder layout | [Onboarding](skills/manage-job-applications/references/onboarding.md) |
| Automatic workflow creation and tracker views | [Workspace workflow](skills/manage-job-applications/references/workspace-workflow.md) |
| Role order, ownership and audit gate | [Team coordination](skills/manage-job-applications/references/team.md) |
| Four ready-to-personalize chat prompts | [Separate chats](skills/manage-job-applications/references/separate-chats.md) |
| Add research and check source coverage | [Research library](skills/manage-job-applications/resources/README.md) |
| Login, form handling, CV exports and checkpoints | [Execution](skills/manage-job-applications/references/execution.md) |
| Status meanings and tracker evidence | [Workflow](skills/manage-job-applications/references/workflow.md) |
| Drive or local storage | [Storage](skills/manage-job-applications/references/storage.md) |
| Use another AI host | [Portability](skills/manage-job-applications/references/portability.md) |
| Recurring work and multi-agent coordination | [Scheduling](skills/manage-job-applications/references/scheduling.md) |
| Optional existing Node integrations | [Antigravity toolkit](skills/manage-job-applications/scripts/antigravity/README.md) |

## Included

- 100-point fit rubric: skills 30, experience 25, education 15, location/eligibility 15, seniority 15.
- Distinct CV exports, page inspection and archive provenance.
- Employer/requisition deduplication, portal-result verification and confirmed-answer records.
- User-selected Drive or local onboarding and private login.md setup.
- Four role guides with an exported-CV audit gate before application.
- Research upload routes for Schengen, Slovakia, India/Western search, CV creation, audit and applications.
- Native delegation where supported and sequential role passes elsewhere.
- Separate discovery, CV preparation, application and monitoring prompts.
- Cooperation and handoff rules for several AI agents.
- Fictional profile configuration and a blank tracker schema.

Use only accurate candidate facts. A successful upload or HTTP 200 is not proof of application submission. Follow the host's policies and each site's safeguards.

## Privacy

Keep your real profile, CVs, tracker data, credentials, OAuth tokens, browser state and receipts private. Do not commit them. This repository contains generic instructions and fictional examples only.

## Coverage limits

This workflow was distilled from an Antigravity work report and four inspected Gemini schedules across two accounts (regional discovery, sponsorship discovery, expired-listing auditing and paused CV preparation). It includes the supplied 47-file sanitized Antigravity export with review amendments, not an unmodified historical snapshot. It does not assert that schedules outside the two inspected accounts were audited. Live portal selectors, logins and submissions were not tested during this review. Google storage helpers are partial; connected Drive tools handle verified CV archiving.

## Checks for this update

The existing offline toolkit checks passed, including JavaScript syntax, sanitization and nine tests. A fictional four-role simulation exercised local setup, duplicate discovery, hard-requirement rejection, an actual one-page PDF, an intentionally wrong employer caught by Audit, corrected export/re-audit, and a mock timeout reconciled with exactly one simulated submission. The four-chat setup templates also receive a bounded instruction review. These checks do not establish live compatibility across every host or employer portal.

Dedicated Schengen, Slovakia and application-process research is pending and marked in the resources. The optional legacy `xlsx` dependency in the Antigravity toolkit has a known high-severity advisory. Live accounts, FlowCV, Drive writes and employer submissions were outside this simulation.
