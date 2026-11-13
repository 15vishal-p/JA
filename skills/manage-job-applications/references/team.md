# Four specialist roles

| Role | Guide | Output |
| --- | --- | --- |
| Job Search | [job-search.md](roles/job-search.md) | Live JD, job key, evidenced fit and eligibility |
| CV Creation | [cv-creation.md](roles/cv-creation.md) | Exported tailored CV and source evidence |
| CV Audit | [cv-audit.md](roles/cv-audit.md) | Pass, Revise or Blocked for the exact export |
| Application | [application.md](roles/application.md) | Draft or verified submission and tracker update |

The coordinating host runs onboarding, routes research and owns shared tracker updates. When supported and authorized, use native delegation to launch specialists with these names, their role guide, selected research, current user rules and a minimal relevant job packet. Give each exclusive ownership of its outputs. These portable Markdown definitions require the host's delegation tools to become separate running agents. If unavailable, perform distinct role passes in the same session and disclose that execution mode. With limited worker slots schedule roles as capacity opens.

For each job follow Job Search → CV Creation → CV Audit → Application. Search for the next role may run while another CV is being prepared. Serialize edits to a single CV template, tracker row or employer application. Use atomic claims when supported. Plain file writes are not distributed locks, so use one coordinator writer otherwise. Reconcile stale ownership and live portal state before taking over.

## Separate chats

Read [separate-chats.md](separate-chats.md) when the user chooses four chats or tools. Generate a personalized prompt per role and share the same workspace, job identity and handoff contract. Shared files carry progress. Cross-chat notifications require actual supported messaging and authorization. Record waiting states without claiming the other chat has received a message.

## Private handoff

Specialists return proposed shared-tracker changes to the coordinator. A specialist writes directly only when explicitly assigned exclusive row ownership and a safe write mechanism. Instructions in role guides to update a tracker follow this ownership rule.

Use employer plus requisition as the key, or canonical URL when no requisition exists. Reuse existing keys. Carry JD reference and checked time, role family/country, hard requirements, fit breakdown/gaps, candidate evidence, current rules, exact CV path/link and version or checksum, audit reference/verdict, authority, owner, application state, confirmation and next action. Read current state at each handoff.

A CV Audit pass applies only to the exact export, JD and rule version reviewed. Any export/content change invalidates it. Return failures to CV Creation with concrete corrections and notify the user with job, issue and next action. Correct recoverable issues and re-audit. Ask only for facts actually needed. Application requires a current pass plus current authority. Preserve holds and explicit CV-only instructions.

Save interrupted handoffs under `handover/` with artifact references and blockers. Keep historical submitted CVs intact. See `scheduling.md` for continued work across hosts.
