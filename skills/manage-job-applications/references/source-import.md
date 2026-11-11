# Import original automation sources

Inspect source code and scheduler definitions before claiming complete migration. A work report is evidence of reported behavior, not the original implementation.

## Antigravity source intake

Request an export of the original application scripts, CV generator, spreadsheet helpers, status reconciliation and fact-verification utilities, plus dependency manifests and a configuration template. Exclude browser profiles, session cookies, OAuth credentials, real CVs, screenshots, receipts and personal tracker data. Keep the raw export private while reviewing it.

Inventory each file, its purpose, dependencies, input/output, supported ATS, external writes and authentication mechanism. Replace hardcoded personal paths, folder IDs, account addresses and candidate answers with private configuration. Replace embedded secrets with supported secret storage; do not retain secret history in the public repository. Review consent and submission behavior against current host policy. Do not run imported scripts against live employers during validation.

Test pure helpers with fictional fixtures. Test browser adapters in a sandbox or mock form, including iframe controls, selects, international phone fields, autofill, exact CV attachment, interrupted submissions and duplicate prevention. Keep uncertain outcomes pending verification. Publish only inspected code that the user is authorized to share, with its actual dependency and test requirements. Do not invent replacement code and label it original Antigravity code.

## Gemini schedule intake

Inspect every requested signed-in account separately. Record task title, enabled state, exact cadence, timezone if exposed, full current prompt, sources, output destination and recent result evidence in a private inventory. Do not infer account access from another signed-in account, task execution from an enabled setting, or a task's region from its title.

Convert personal prompts into configurable templates. Remove real candidate data, account emails, private links, folder IDs and dated eligibility claims. Keep discovery separate from application authority. Recreate schedules only when requested through an actual supported scheduler; importing text does not install a schedule. Report unread or inaccessible accounts explicitly.
