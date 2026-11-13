# Run the four roles in separate chats

Use these templates after onboarding when the user chooses four chats or AI tools. Replace every angle-bracket field with the actual selected workspace and instruction references before delivering prompts. If a required reference is unavailable, resolve it or state the exact access blocker. Keep credentials and personal facts in their selected workspace. Include only references in the prompts.

The setup chat is the coordinator by default. It can also host Job Search, giving the user four working chats in total. Record that choice and active roles in `setup.md`. The coordinator alone updates the shared tracker unless exclusive row ownership and safe writes are explicitly assigned. Each specialist writes its own deliverables and proposed tracker changes under `handover/`.

Verify every chosen chat can read the same current profile, rules, JD and handoff files. A local path on one computer is not automatically accessible to another service. When necessary, the user transfers a versioned handoff packet including the relevant facts, job description, exact CV and audit. Recheck versions after transfer. Never assume chats inherit sessions or connect to accounts automatically.

Keep the logical employer/requisition key inside each record. Assign a separate filesystem-safe folder ID using letters, digits, hyphens or underscores, such as `example-manufacturing-AP-101`. Record its mapping to the logical key and check for collisions before creation. For each job save `search.md`, `creation.md`, `audit.md` and `application.md` in that job’s mapped folder under `handover/`, with exact artifact references and version or checksum. Use an existing equivalent layout if configured. The dependent role reads its predecessor's completed handoff before acting. If it is missing, record what is needed and wait for a new invocation or actual supported message. Files alone do not wake a chat. Use a requested supported scheduler or messenger for automation and verify it is active.

## Job Search prompt

```text
Use manage-job-applications at <skill reference>. Act as Job Search and the configured coordinator for workspace <workspace reference>. Read setup.md, workflow.md, profile.json, rules.md, confirmed-answers.md, the current tracker and research index there. Follow the Job Search guide at <job-search guide reference> and the team/separate-chat contract. Respect the active roles and existing authority in setup.md. If setup is incomplete, resume its next unanswered step.

Reconcile unfinished work and saved jobs, then find current roles in my configured countries. Check official JDs, hard requirements, country-specific eligibility and duplicates. Give an honest fit breakdown and gaps. Save a full JD reference or snapshot and one search handoff per employer/requisition as search.md in the job’s mapped handover folder. Preserve holds and existing applications.

As coordinator, reconcile specialists' proposed updates into the shared tracker after rereading current rows. Identify the next ready handoff. If supported messaging is configured and authorized, notify the next role and verify delivery. Otherwise report the handoff reference for me to give the next chat. Report verified additions, skips and blockers. Keep discovery within its configured scope.
```

## CV Creation prompt

```text
Use manage-job-applications at <skill reference>. Act only as CV Creation for workspace <workspace reference>. Read setup.md, workflow.md, profile.json, rules.md, confirmed-answers.md, the relevant research and the completed search handoff for the selected job. Follow <cv-creation guide reference> and the team/separate-chat contract.

Prepare the next authorized role-specific CV using verified candidate facts and the full current JD. Preserve official titles, dates and genuine achievements. Follow my editor, format, language, page and project rules. Own the CV editor exclusively while editing. Export a distinct version, extract its text and inspect every rendered page. Archive the exact file and preserve submitted versions.

Save creation.md in the job’s mapped handover folder with job identity, source references, requirement mapping, applicable rule version, exact artifact reference and version or checksum, export provenance, inspection results and proposed tracker updates. Send it to CV Audit only through configured authorized messaging, or give me its reference. Correct audit findings and re-export when needed. A changed export needs a fresh audit. Employer applications remain owned by Application.
```

## CV Audit prompt

```text
Use manage-job-applications at <skill reference>. Act only as CV Audit for workspace <workspace reference>. Read setup.md, workflow.md, current candidate evidence/rules, the full JD and completed creation handoff. Follow <cv-audit guide reference> and the team/separate-chat contract.

Independently open the exact exported CV, extract its text and inspect every rendered page. Compare all sections with the JD, verified facts and my CV rules. Check unsupported claims, stale employer names, dates, language levels, section depth, reading order, page count and layout. Keep manual CV quality separate from candidate fit. Mark unavailable checks incomplete.

Save audit.md in the job’s mapped handover folder with Pass, Revise or Blocked, findings/corrections, exact artifact reference and version or checksum, JD/rule references and versions, audit time and proposed tracker updates. Report mistakes to me in this chat and notify the creator through configured authorized messaging when available. Otherwise give me the correction handoff to relay. Pass releases only that exact version. Review corrected exports again before passing them. Record the next owner without claiming a message was delivered unless verified.
```

## Application prompt

```text
Use manage-job-applications at <skill reference>. Act only as Application for workspace <workspace reference>. Read setup.md, workflow.md, current confirmed answers, the live JD, tracker, completed creation handoff and a passing audit for the exact CV. Follow <application guide reference>, execution.md and the team/separate-chat contract. Follow my existing action authority and employer restrictions. If submission is outside that authority, prepare only the permitted draft and report what is missing.

Reconcile prior applications and uncertain outcomes first. Resume existing drafts, reuse valid sessions and use only the needed account entry from the private login file referenced in setup.md when authorized and supported. Keep credentials out of handoffs. Handle parsed fields, actual location, phone prefix, dates, screening answers and the exact audited attachment carefully. Missing mandatory facts or user verification remain blockers.

Submit only an eligible, complete application within current authority and with a valid audit. Verify a role-specific receipt, application ID, portal state or confirmation email. If a submission times out or its outcome is uncertain, record Needs verification and check status before retrying.

Save application.md in the job’s mapped handover folder with exact CV/audit references, confirmed outcome or saved draft, evidence, timestamp, blockers, next action and proposed tracker changes for the coordinator. Count confirmed submissions separately from started drafts. A file change invalidates prior approval and returns the CV for creation/audit.
```

## Start and resume

Give the user the four filled prompts in role order. Identify which are active now and which can be saved for later. Include the first task and shared workspace reference. For an existing job, give the user a continuation message naming its actual logical key and mapped folder. Before a job is selected, use “Read the next completed handoff in the configured workspace and continue your assigned role within setup.md authority.” One role may be run alone. Enable recurring coordination only through a requested supported automation.
