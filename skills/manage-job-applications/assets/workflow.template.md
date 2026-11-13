# My job application workflow

Workspace {{WORKSPACE_REFERENCE}}

Profile {{PROFILE_REFERENCE}}

Rules {{RULES_REFERENCE}}

Execution mode {{EXECUTION_MODE}}

Active roles {{ACTIVE_ROLES}}

Coordinator {{COORDINATOR}}

Allowed actions {{ALLOWED_ACTIONS}}

Targets and priorities {{TARGETS}}

CV editor and output rules {{CV_RULES}}

## Working files

| Working record | Reference |
| --- | --- |
| Job tracker | {{TRACKER_REFERENCE}} |
| Candidate summary | {{CANDIDATE_SUMMARY_REFERENCE}} |
| Progress summary | {{DASHBOARD_REFERENCE}} |
| Confirmed answers | {{ANSWERS_REFERENCE}} |
| Research and vision | {{RESEARCH_REFERENCE}} |
| CV archive | {{CV_ARCHIVE_REFERENCE}} |
| CV audits | {{AUDITS_REFERENCE}} |
| Application evidence | {{APPLICATIONS_REFERENCE}} |
| Handoff index | {{HANDOFF_REFERENCE}} |

## Role order and assignments

| Stage | Input and completed output | Saved prompt |
| --- | --- | --- |
| Job Search | Current profile and sources → verified JD, fit, gaps and job identity | {{SEARCH_PROMPT_REFERENCE}} |
| CV Creation | Verified JD and candidate evidence → distinct exported CV and exact version | {{CREATION_PROMPT_REFERENCE}} |
| CV Audit | Exact export, JD and current rules → Pass, Revise or Blocked with findings | {{AUDIT_PROMPT_REFERENCE}} |
| Application | Passing exact CV, eligible role and current authority → saved draft or verified receipt | {{APPLICATION_PROMPT_REFERENCE}} |

An audit correction returns to CV Creation and then a fresh audit. Editing an approved export invalidates its pass. The coordinator owns shared tracker writes unless exclusive row ownership is assigned. Handoffs carry current job identity, exact artifact references, owner, blockers and next action. Separate chats read completed handoffs and use the configured notification method.

## Current readiness and next action

Account readiness {{ACCOUNT_READINESS}}

Missing inputs {{MISSING_INPUTS}}

Next action {{NEXT_ACTION}}

Execution trigger and notification method {{EXECUTION_TRIGGER}}

Last verified workflow update {{CHECKED_AT}}
