# Per-user storage setup

Configure storage separately for every person who installs this skill. Installation does not connect accounts, copy another user's workspace, create schedules, or grant access.

1. Check whether the current user's Google Drive connector is available and authorized. If not, ask them to connect their own Google Drive through the AI host's account/connector settings. Never ask for a Google password or OAuth token in chat.
2. If connected, locate a workspace selected by that user. Reuse an existing AI Hub only after resolving its identity and ownership. Otherwise create `Job Automation` in their own Drive, with `CVs`, `Trackers`, and `Handover` folders. Use private sharing by default and preserve existing access settings.
3. Store the verified master profile and CV privately, role-specific PDFs under CVs, the job/application tracker and confirmed-answer register under Trackers, and dated checkpoints under Handover. Use native Sheets when available; otherwise use CSV/JSON files. Record returned file/folder IDs in that user's private configuration, never in this skill or a public repository.
4. If the user declines Drive, it is unavailable, or connection fails, offer a local workspace. Ask for a preferred folder when the host can access their filesystem; otherwise use an authorized accessible folder named `job-automation-data`. Record its exact absolute path. Create CVs, trackers and handover subfolders without overwriting existing files.
5. Explain that a cloud sandbox is not the user's computer's local drive and can be temporary. If only a sandbox is available, provide downloadable outputs and a checkpoint, and disclose that persistence and scheduled access are not guaranteed. Do not claim local saving to a device the AI cannot access.
6. Confirm the chosen storage mode and verify a permitted write before reporting setup complete. On later runs, check access and read current tracker contents before writing. If storage changes, reconcile identities and duplicate jobs before migration; do not silently create a second active tracker.

Keep private profile values, CVs, application answers, receipts, browser state, credentials and scheduler IDs out of public version control. Add private workspace paths to ignore rules. Keep credentials in the host's supported secret/account manager, not Drive or plaintext configuration.

Example private storage configuration:

```json
{"storage_mode":"drive-or-local","workspace_reference":null,"cv_archive_reference":null,"tracker_reference":null,"confirmed_answers_reference":null,"handover_reference":null}
```
