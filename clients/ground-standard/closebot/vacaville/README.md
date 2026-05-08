# Vacaville Grappling Academy — CloseBot

Working folder for the Vacaville Grappling Academy bot (Ground Standard client).
Git-tracked so any Claude Code session on any machine can read it.

---

## Quick facts

| | |
|---|---|
| Client | Ground Standard (Bobby) |
| Gym | Vacaville Grappling Academy |
| Bot name | `Vacaville Grappling Academy Membership Qualification (DEMO)` |
| Bot ID | `bot_9SWB45KI6PAJMX4Y` |
| Bot persona | Emma — front desk of Vacaville Grappling Academy |
| Website referenced | `www.vacavillegrappling.com` |
| Primary goal | Qualify lead + book them into a free trial class |
| Total nodes | 176 (see `bot-structure.md` for breakdown) |
| Extracted on | 2026-04-20 |

---

## Files in this folder

| File | What it is |
|---|---|
| `bot-export.kdl` | Full bot flow in KDL (source of truth — 2,389 lines). Every node, prompt, variable, and connection. |
| `bot-export.json` | Raw API response wrapping the KDL + metadata. |
| `bot-structure.md` | Human-readable analysis — node counts, top-level branching, complexity observations, open questions for redesign. |
| `../vacaville_kb_working.txt` | Current working knowledge base (corrected v2.0.0). |

---

## How to re-pull the bot

From repo root:

```bash
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_inspect_vacaville.js
```

Script will write fresh exports to `shared/logs/vacaville_export.kdl` and `vacaville_export.json`. Copy into this folder to replace the snapshots here. Bump the "Extracted on" date above.

**Script location:** `shared/scripts/closebot/gs_inspect_vacaville.js`
**Auth:** `CB_GS_API_KEY` in `clients/ground-standard/.env`

---

## Known issues / open questions

See `bot-structure.md` → "Complexity observations" and "Open questions for redesign".

Summary:
- Bot is over-duplicated — 4 parallel enrollee-count branches (1 kid, 1 adult, both, multiple) with hand-copied question chains. CloseBot has no loops, so duplication is forced, but the current depth may be unnecessary.
- Bot lacks testing. Use the SSE tester (`shared/scripts/closebot/run_sse_test.js`) once we've decided on the target shape.
- Free trial question returned no response in April 18 Playwright test — likely a gap in scenario handling.

---

## Conversation history — what's retrievable

### CloseBot API — structured answers only, NO transcripts
Confirmed 2026-04-20 via endpoint probing:
- `GET /lead` + `GET /lead/{id}` expose: `lastMessage` (single string), `fields[]` (captured answers per node), `instances[]`, `tags[]`.
- `/lead/{id}/messages`, `/transcript`, `/conversation`, `/history`, etc. all return 404.
- SSE endpoint `/bot/{id}/testSession/messages/{leadId}` is test-session only, not historical.

So CloseBot gives us **which nodes a lead traversed, what answers they gave, whether the node succeeded** — but not the full message-by-message thread.

Vacaville production stats (from 1,400 leads scanned): 21 Vacaville leads, 0 with `lastMessageBotId`, only 1 with populated `instances`. Bot has near-zero real traffic = near-zero field data.

Reusable script: `shared/scripts/closebot/gs_find_instance_lead.js`

### GHL — BLOCKED on missing Private Integration Token
Full threaded conversations (bot messages AND Bobby's team's manual messages) live in GHL. Retrievable via `GET /conversations/search` + `GET /conversations/{id}/messages` **if** we have a PIT for the Vacaville sub-account.

**Current block:** JC's GHL role on Bobby's agency does not allow creating PITs in client sub-accounts. Only Bobby (sub-account admin) can create one.

**Why this matters strategically:** Bobby's team's real conversations with leads are ground-truth sales behavior — tone, objection handling, booking cadence. That's the source material for redesigning the bot to behave like a real human who actually books trials.

**To unblock:** Bobby creates a Private Integration Token in the Vacaville Grappling Academy GHL sub-account with scopes `conversations/readonly` + `contacts/readonly`, hands it to JC. Drop into `clients/ground-standard/.env` as:
```
GHL_VACAVILLE_API_TOKEN=pit-...
GHL_VACAVILLE_LOCATION_ID=...
```
Then run the pre-built puller:
```bash
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/ghl/pull_vacaville_conversations.js
```
Script: [shared/scripts/ghl/pull_vacaville_conversations.js](../../../../shared/scripts/ghl/pull_vacaville_conversations.js)
Writes one `.md` file per conversation into `transcripts/` (alongside this README).

---

## Cross-session handoff

Any future session working on Vacaville should:
1. Read this README first.
2. Read `bot-structure.md` for the current mental model.
3. Check `tasks/todo.md` for current active task.
4. If working with the live bot, re-pull before editing to make sure the snapshot is current.
