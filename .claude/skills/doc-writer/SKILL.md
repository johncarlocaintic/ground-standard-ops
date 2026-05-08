---
name: doc-writer
description: "This skill should be used when the user wants to document something they just built, configured, or completed. Triggers on: 'document this', 'write it up', 'log what I built', 'document what we just did', 'write up the bot', 'write up the workflow', 'document the integration'. Produces a correctly named, correctly formatted documentation file saved to the project's docs folder, following the project's own documentation guidelines. Also use when the user finishes building any bot, workflow, integration, or infrastructure component and documentation has not yet been created."
context: fork
category: documentation
tags: "[documentation, bot, workflow, integration, process, troubleshooting]"
---

# doc-writer

Produce correctly named, correctly formatted documentation files for anything the user just built. Read the project's documentation guidelines first — never assume a template. Write the file. Update the tracker.

---

## Step 1 — Find the Documentation Guidelines

Read `CLAUDE.md` to identify the active client from the ACTIVE CLIENTS section. Then look for the documentation guidelines file at:

```
clients/{client-folder}/docs/{client}-documentation-guidelines.md
```

Examples:
- AAI: `clients/ai-agency-institute/docs/aai-documentation-guidelines.md`
- Ground Standard: `clients/ground-standard/docs/ground-standard-documentation-guidelines.md`

Read the full guidelines file before proceeding. It contains:
- Template structures for each doc type
- Naming conventions
- Required fields per template
- Save location
- Submission rules

If no guidelines file exists for this client: stop and tell the user — "No documentation guidelines found for [client]. Create a guidelines file at [path] before I can document this."

---

## Step 2 — Identify the Doc Type

Determine which type of document is needed based on what was built:

| What was built | Doc type | Prefix tag |
|---|---|---|
| CloseBot bot (nodes, persona, job info) | Bot Doc | `[BOT]` |
| Retell AI voice agent | Bot Doc | `[BOT]` |
| GHL workflow / n8n workflow | Workflow Doc | `[WORKFLOW]` |
| API connection, webhook, platform bridge | Integration Doc | `[INTEGRATION]` |
| GHL sub-account, pipeline, calendars, tags, fields | Process Doc | `[WORKFLOW]` |
| Bug or issue resolution | Troubleshooting Log | `[TROUBLESHOOTING]` |

If the type is ambiguous, ask: "Is this a bot, a workflow, an integration, or infrastructure setup?"

---

## Step 3 — Determine the Naming Convention

Read the naming convention from the guidelines file. Apply it exactly.

For AAI, the conventions are:

| Doc type | Format | Example |
|---|---|---|
| Bot (CloseBot/Retell) | `{Niche}_{Platform}_{BotName}_v{N}` | `RoofingSolar_CloseBot_EnquiryResponder_v1` |
| GHL Workflow | `{ClientName}_{WorkflowName}_{Date}` | `RoofingSolar_LeadFollowUp_20260414` |
| n8n Workflow | `{ClientName}_n8n_{WorkflowName}_{Date}` | `RoofingSolar_n8n_MissedCallCB_20260414` |
| Integration | `{Platform1}_to_{Platform2}_{Purpose}` | `Retell_to_GHL_LeadBooking` |
| Process Doc | `{SystemName}_ProcessDoc_{Date}` | `GHL_PipelineSetup_ProcessDoc_20260414` |
| Troubleshooting | `{SystemName}_Issue_{BriefDesc}_{Date}` | `n8n_Issue_WebhookTimeout_20260415` |

Dates use YYYYMMDD format. No spaces — underscores only.

---

## Step 4 — Gather Required Information

Pull what is already available from the conversation, screenshots, and existing reference files. Check the following sources before asking the user for anything:

- Current conversation — screenshots, config details already shared
- `clients/{client}/docs/{client}-build-spec.md` — planned specifications
- `clients/{client}/docs/{client}-ghl-infrastructure.md` — GHL IDs, tags, fields
- `tasks/todo.md` — current build status

Then cross-check against the required fields for the doc type (from the guidelines). Flag only the fields that are genuinely missing.

### Required fields by doc type

**Bot Doc — must have:**
- Bot name (naming convention applied)
- Bot type (SMS/Voice/Hybrid) and platform
- Purpose (1-2 sentences)
- Persona details (name, description, traits, AI provider)
- Full job information text (verbatim from CloseBot/Retell — screenshot preferred)
- Conversation flow / node structure
- Source and tag filters
- Integration details (GHL sub-account, calendar, tags)
- Trigger and deployment config
- Fallback and escalation behaviour
- Testing notes
- Known limitations or remaining items

**Workflow Doc — must have:**
- Workflow name (naming convention applied)
- Purpose
- Trigger (what starts it)
- Full step-by-step flow (numbered)
- Platforms involved
- CloseBot config (if applicable)
- API/webhook details (endpoints, method, auth, payload)
- Tags and custom fields created or used
- Error handling
- Testing notes
- Known limitations

**Integration Doc — must have:**
- Source and destination platforms
- Endpoint URL and HTTP method
- Authentication method and where credentials are stored
- Request headers and payload structure (with sample)
- Expected response format and status codes
- Error handling (400, 401, 500, timeout)
- Rate limits

**Process Doc — must have:**
- System or platform documented
- Purpose of the setup
- Full list of items created (with exact names and IDs where applicable)
- Steps taken in order
- Testing / confirmation method
- Known limitations

**Troubleshooting Log — must have:**
- Date and author
- System or workflow affected
- Description of the issue
- Root cause
- Steps taken to resolve
- Outcome
- Preventative measures

If critical fields are missing and cannot be inferred: ask the user for only those specific fields. Do not ask for information that is already visible in the conversation.

---

## Step 5 — Write the File

Write the documentation file to:
```
clients/{client-folder}/docs/{filename}.md
```

Follow the template structure from the guidelines exactly. Include:
- Author: John Carlo Caintic
- Date created and last updated

Where information is genuinely unavailable (e.g. a config field not shown in any screenshot), write:
```
*(Not captured — re-check in [platform] to confirm)*
```

Never leave a field blank. Never invent values. If a field is unknown, say so explicitly.

---

## Step 6 — Update the Tracker

After writing the doc file, update `tasks/todo.md`:
- Find the row for the item just documented
- Change the Documented column from `⬜` to `✅`

---

## Step 7 — Confirm

Report back:
- File written: `[filename].md` at `[path]`
- Tracker updated: `tasks/todo.md` — [item] marked documented
- Any fields marked as not captured that the user should verify
- Any placeholders in the doc that need real values before the doc is final

---

## Quality Checks

Before finishing, verify:
- [ ] Naming convention applied correctly (no spaces, correct format for doc type)
- [ ] All required fields present — nothing blank, nothing invented
- [ ] Author (John Carlo Caintic) and date included
- [ ] Australian English used throughout (organise, colour, behaviour — not organize, color, behavior)
- [ ] No em dashes — use commas or full stops instead
- [ ] Placeholders flagged with `*(Not captured)*` rather than left empty or guessed
- [ ] `tasks/todo.md` updated
