# First activation

Determine the requested mode before setup writes. In monitor mode, read existing sources and ask for missing source references without creating or changing files. For other modes, run this interview the first time the installed skill is invoked, or via a host-supported welcome hook. Installation alone cannot launch questions on every host. Show progress as “Step N of 7” and ask one group at a time. Save partial answers and resume the next unanswered group. Read existing confirmed records before asking again. If an answer is already supplied, confirm it briefly and continue. Mark irrelevant steps skipped with a reason instead of demanding unnecessary inputs.

## Step 1. Choose storage

Ask whether the user wants Google Drive or a local folder. Let them choose before connecting anything. For Drive open the host connection flow when needed, then select an existing folder or create `Job Applications`. For local storage ask for a location with `Job Applications` as the suggested name. Keep the workspace outside the skill repository. Verify a harmless write and readback. Disclose temporary storage when the host cannot access a persistent device folder.

Create or map these locations without overwriting existing files. Record actual paths or returned Drive IDs in private `setup.md`.

```text
Job Applications/
  setup.md
  profile.json
  rules.md
  confirmed-answers.md
  master-cv/
  research/
    vision/
    search-schengen/
    search-slovakia/
    search-india-western/
    cv-creation/
    cv-audit/
    application/
  jobs/
  cvs/
  audits/
  applications/
  trackers/
  handover/
  secrets/
    login.md
```

The research directories are upload destinations. Reuse any existing tracker and archive. Copy `assets/tracker.csv` only when no tracker exists. Start the private profile from `assets/profile.example.json`, replacing fictional facts with verified inputs.

## Step 2. Supply a CV or career history

Ask whether the user wants to provide a CV/link or build a profile through questions. Look for documents already supplied in their selected folder. Extract existing facts and ask only about gaps or conflicts. For guided intake collect name, contacts, actual location, employers/titles/dates, duties and evidenced results, education, projects/links, certifications, skills with examples and language levels. Ask in manageable groups. Preserve unknowns and show the factual summary for correction.

## Step 3. Set job preferences and allowed actions

Ask for roles, seniority, countries/cities and priority, remote/relocation preferences, country-specific work rights and sponsorship needs, salary with units, notice/availability, internships, exclusions, and fit threshold/exceptions. Confirm the example profile's threshold rather than silently adopting it. Ask for CV editor, format, page count, language, section order and project rules. Keep actual residence and target city distinct.

Ask where research and vision documents live. Map the three search tracks to Schengen, Slovakia and India/Western markets. Allow other markets through global search. Clarify the countries meant by Western when necessary. Record sources and dates for confirmed answers.

Ask which actions are authorized, including discover, prepare, audit and submission, with any regional/employer restrictions. Reuse authorization within scope. CV-only work remains CV-only even when the Application role is available.

## Step 4. Choose one chat or four separate chats

Ask “Would you like everything handled in this chat, or four separate chats for Job Search, CV Creation, CV Audit and Application?” Explain that one chat can coordinate native specialists when the host supports them. Separate chats can be on the same host or different hosts, provided each can access the shared workspace and skill instructions.

Also ask which roles are wanted now. Offer job search only, CV creation and audit, or the complete application workflow. Preserve the scope already recorded in Step 3. All four roles may be configured while only the selected roles run.

Record `execution_mode`, active roles and coordinator in private `setup.md`. For one chat use `team.md`. For separate chats read `separate-chats.md`, verify shared access and generate its four role prompts with the actual workspace and instruction references filled in. Mark inactive role prompts as available for later use. Give the prompts to the user to paste into their chosen chats. Create chats or send role assignments only when the user requests that action and the host supports it. If a host cannot access shared storage, provide a downloadable handoff packet and ask the user to transfer it before dependent work starts.

## Step 5. Set up relevant accounts

Ask which job boards, employer portals and CV editors the active roles need, and which are already signed in. Connect Drive only if selected. Explain any actual tool or sign-in requirement for those services. Search-only setup can skip login unless a chosen search source requires it. CV work can skip employer accounts. Ask which required sites need login assistance. Offer private `secrets/login.md`, a supported password manager or user sign-in. For file-based setup create an empty structured file at the selected private location and ask the user to enter their username and password directly there. Ask for its location and completion confirmation instead of passwords in chat.

Each entry has official HTTPS origin, employer/tenant where relevant, username, password or password-manager reference, permitted actions and authorization date. An existing authorized `login.md` or `log in.md` may be mapped instead. Application follows `execution.md` and reads only the needed site's entry through supported tools. Keep the populated file outside the distribution.

## Step 6. Add research and vision

Use the research locations chosen in Step 3. Ask whether the user has research/vision documents ready or wants to add them later. Inspect accessible supplied documents, record sources and dates, and map them to the folders above using `resources/README.md`. Missing optional research does not block supported work. Mark dedicated research gaps honestly.

## Step 7. Check setup and start

Save storage references, sources, rules, research routes, login-file reference without contents, authority and remaining questions in `setup.md`. Complete setup only when inputs needed for the requested mode exist. Pending login does not block discovery or CV work. Show a short setup summary with storage, profile source, active roles, execution mode, coordinator, allowed actions, account readiness and missing inputs. Confirm the selected folder and next task. For separate chats deliver the four filled prompts and explain how the next role finds completed handoffs. A setup interview alone does not launch those chats. Start the first authorized task that current tools can complete. Schedules require a separate user request and enabled scheduler.
