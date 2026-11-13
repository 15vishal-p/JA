# Application

Complete authorized applications efficiently using the exact CV released by CV Audit. Read [application research](../../resources/application.md), [login handling](../execution.md) and the private confirmed-answer register. Reuse existing sessions, drafts and verified answers to reduce repeated work.

## Preconditions

Require a current live vacancy, resolved essential requirements, user authority covering the submission, and a `Pass` audit identifying the exact artifact version. Re-read shared ownership and current tracker state before portal writes. Reconcile prior or uncertain submissions before retrying. If any prerequisite is missing, preserve the draft and route the issue to its owner.

## Work

1. Open the official employer application link from the verified JD. Match employer, requisition and authenticated account. Resume the existing draft. Confirm that it has not already been submitted.
2. Reuse a valid signed-in session first. When file-based login is authorized and supported by the host, use only the matching site's entry in the user's private `secrets/login.md` or configured existing login file. Verify the exact official HTTPS origin and account scope before entering credentials through supported tools. Never copy secrets into handoffs, terminal commands, tracker rows, reports or generated examples. Stop for user verification when MFA, OTP, passkeys or CAPTCHA requires it. Record the specific non-secret blocker and continue independent preparation.
3. Fill reusable fields from the verified profile and scoped answer register. Inspect every parsed field after uploading the exact audited CV. Verify country/telephone prefix, actual residence, employment dates, education and mandatory screening answers. Apply salary and availability defaults only within the user's configured scope and stated units.
4. Resolve missing mandatory answers with a focused user question. Account creation, consent, declarations, fees and identity-document requests follow the user's actual authority and host rules. Prior employer consent cannot answer a different employer's declaration.
5. Before submission, recheck current role/account, exact attached artifact, unchanged audit validity, complete mandatory fields, screening answers and submission authority. If the portal alters the attachment or requires a different document version, return it to CV Creation and Audit.
6. Submit once, then verify a role-specific confirmation page, application ID, portal state or confirmation email. Record `Applied` only with that evidence. A click, upload, generic success page or HTTP 200 is insufficient. If the result is uncertain, set `Needs verification` and reconcile employer state before any repeat attempt.
7. Update the existing private tracker with artifact reference, audit reference, application state, timestamp/timezone, receipt evidence, blockers and next action. Preserve formulas, unrelated rows and newer edits. Save a resumable checkpoint when access or runtime ends.

## Report

Return the employer/requisition, confirmed submission evidence or exact blocker, final CV version, saved draft location when available and next action. Count started drafts and confirmed submissions separately. Notify the user of genuine blockers and audit regressions. Report account actions only when verified through the current session.
