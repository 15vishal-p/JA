# Evidence and tracker contract

## Candidate facts

Record each material fact with a source and confirmation date. Resolve conflicts using current authoritative sources and direct user clarification. Do not infer SAP configuration expertise, payroll ownership or language proficiency from a job description or an older AI-generated tracker. Treat immigration statements as country-specific personal inputs, not universal legal conclusions.

## State definitions

| Status | Required evidence |
| --- | --- |
| Discovered | Identified listing; availability may remain unchecked. |
| Review | Fit, eligibility or source information still needs assessment. |
| Ready to prepare | Live JD reviewed; candidate and role evidence sufficient for a draft. |
| CV exported | A local role-specific file exists. |
| CV verified | Extracted text and all rendered pages checked; provenance recorded. |
| CV archived | Upload confirmed with stable private archive link. |
| Application pending | Employer form started or saved; not submitted. |
| Blocked | Concrete access or missing-input blocker recorded. |
| Needs verification | Submission outcome uncertain; do not retry blindly. |
| Applied | Role-specific receipt, confirmation ID, portal state or email verified. |
| Already applied | An existing application for the same requisition verified. |
| Closed / skipped | Closure, essential requirement gap or user decision recorded. |

Keep CV state separate from application state. Retain the employer/requisition identity alongside confirmation evidence. Do not promote “Applied” based on HTTP 200: it can describe an upload, validation error or generic page.

## CV quality

Verify employer/role summary, correct contact details, source-supported achievements, exact dates, visible relevant sections and expected page count. Check every page for clipped or overlapping text, blank pages and broken glyphs. A short one-page CV can be valid when the user's template permits it; page count alone does not establish editor provenance or quality.

For required FlowCV output, retain direct export evidence and inspect PDF metadata as supporting evidence. Metadata can be absent or modified, so do not delete an uncertain file solely because its metadata lacks a brand. Confirm non-compliance before recoverable cleanup; never permanently delete without explicit authority.

## Shared tracker writes

Read sheet metadata, exact tab names, target cells, validation and current values before writes. Use row-level identity, not stale row numbers. Preserve formulas, chips, formatting and unrelated notes. Append new confirmed answers with scope and source. On conflicts, re-read and merge only the intended changes.

Store timestamps with timezone and salary with currency and period. Distinguish gross/net and monthly/annual values. Use publication minimums only if the user's rules authorize them and the JD states them.

## Public sharing

Export only generic instructions, fictional examples and reviewed code. Exclude secrets, OAuth tokens, cookies, user-data directories, personal CVs, live tracker IDs, application receipts and unredacted screenshots. Inspect actual file contents and staged changes; ignore rules alone do not remove already tracked secrets. If real credentials have been exposed, recommend rotation without repeating them.
