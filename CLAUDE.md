# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

# Claude Code Root Context — Ground Standard Operations
# Read this before doing anything in this directory.
# NOTE: All paths in this file are relative to repo root. Never hardcode machine-specific absolute paths here.

---

## BEFORE YOU START

Every new session, in this order:
1. Read `tasks/todo.md` — current state + immediate next action.
2. Read `clients/ground-standard/context.md` — operational rules, KB methodology, QA standards, persona facts.
3. Skim memory index (auto-loaded) — check for relevant feedback/project notes.
4. Only then pick up new work.

If behavior seems off mid-session, read `tasks/lessons.md`.

First-time setup: see `SETUP.md` at the repo root.

---

## COMMANDS (quick reference)

```bash
# Agency-scoped script (uses only root .env: Retell, n8n, OpenAI, Google)
node --env-file=.env shared/scripts/{platform}/{script}.js

# Client-scoped script: chain the client .env after root
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/{script}.js

# Diagnostics
node --env-file=.env shared/scripts/diagnostics/check_all_credentials.js

# Tail the per-platform log every script writes to
tail -f shared/logs/{platform}_test.log

# Bot testers (CloseBot — GS)
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_sse_test.js
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_multi_persona_test.js
```

### Env naming convention

`{PLATFORM}_{CLIENT-SLUG}_{PURPOSE}` where platform is a locked abbreviation: `CB`, `GHL`, `RETELL`, `OPENAI`, `GOOGLE`, `N8N`. Agency-level keys skip the slug (e.g. `RETELL_API_KEY`).

- **Root `.env`:** agency platform accounts only (Retell, n8n, OpenAI, Google).
- **`clients/ground-standard/.env`:** GS-scoped credentials. Examples: `CB_GS_API_KEY`, `GHL_GS_API_TOKEN`, `GHL_GS_LOCATION_ID`.

No `npm run` scripts — `package.json` is a dep holder only (Playwright). There is no build, lint, or test runner configured at repo root.

---

## WHO IS GLENN

Glenn is the operator of this workspace. He runs the Ground Standard (GSA) account end-to-end on behalf of the agency.

- Communicates with Bobby Freda (GSA founder) directly for client-side decisions.
- Uses JC's credentials (shared) when interacting with platform UIs (GHL, CloseBot, Retell, n8n). Logs on those platforms appear under "JC".
- Scope: AI chatbot automation for the GSA gym portfolio. Specifically CloseBot SMS bots and supporting GHL infrastructure. Voice agent work via Retell is in scope where applicable. No Meta ads work.

Communication rule: keep explanations simple, plain English, avoid unnecessary jargon.

## CLAUDE ACCOUNT

This workspace runs under the Ground Standard Claude Team account: `ads@groundstandard.com`. Log in with this account so usage is billed to Bobby's team.

To verify the active account:
```bash
curl -s -H "Authorization: Bearer $(jq -r .accessToken ~/.claude/.credentials.json)" \
  https://api.anthropic.com/api/oauth/profile
```

---

## TECH STACK

| Platform | Purpose | API |
|---|---|---|
| CloseBot V2 | SMS chatbots (primary work) | Full V2 API. Auth: X-CB-KEY header. See `references/closebot_docs_reference.md`. |
| GoHighLevel (GHL) | CRM | Full REST API V2. Auth: Private Integration Token. |
| Retell AI | Voice agents | Full REST API + TypeScript/Python SDKs |
| N8N | Workflow automation | Cloud instance (URL in client .env if applicable) |
| Sympana Connector | GHL ↔ Retell bridge | GHL marketplace app |

---

## CLIENT

**Ground Standard Agency (GSA)** — owned by Bobby Freda. Full-service marketing agency for martial arts gyms. ~48+ gym clients in the GSA roster (see `clients/ground-standard/gym-portfolio.md`). Glenn's primary work: CloseBot SMS bots driving trial-class bookings via GHL. The flagship/reference bot is **Vacaville Grappling Academy**.

Full operational context: `clients/ground-standard/context.md`. Read this first before making any client-facing changes.

---

## FOLDER STRUCTURE

```
{repo root}/
├── CLAUDE.md                         ← Claude Code context (this file)
├── SETUP.md                          ← First-time setup checklist
├── README.md                         ← Repo overview
├── tasks/
│   ├── lessons.md                    ← Persistent learning log — corrections, preferences, non-obvious patterns
│   └── todo.md                       ← Session-level task tracking
├── clients/
│   └── ground-standard/              ← GSA — Bobby's accounts, gym portfolio, KBs, exports, reports
├── shared/
│   ├── scripts/{closebot,ghl,n8n,retell,diagnostics,playwright,google,hooks,maintenance}/
│   ├── logs/                         ← generated log files (gitignored)
│   └── ...
├── references/                       ← CloseBot canon, stack reference, walkthroughs
├── bootstrap/                        ← One-time setup: seed memory + setup.sh
└── .claude/
    └── skills/                       ← installed skills
```

---

## ENVIRONMENT

- OS: Windows, Git Bash (also runs on macOS/Linux)
- Node.js: v24+
- API keys: stored in `.env` at repo root + `clients/ground-standard/.env` (never commit — both are gitignored)
- Scripts: `shared/scripts/{platform}/`
- Logs: `shared/logs/`

---

## RUNNING SCRIPTS

From the repo root:
```bash
node --env-file=.env shared/scripts/retell/test_create_agent.js
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/ghl/gs_test_auth.js
node --env-file=.env shared/scripts/n8n/test_create_workflow.js
```

---

## SCRIPT CONVENTIONS

All scripts follow these patterns:
- **ES modules** (`import`/`export`) — no CommonJS `require()`
- **`getEnv(key)`** helper — exits with a clear error if a required env var is missing
- **`log(message)`** helper — writes timestamped output to both console and `shared/logs/{platform}_test.log`
- **`fetch()`** native — no axios or node-fetch dependency
- **Fatal error handler** — `main().catch(...)` at the bottom logs to file and exits with code 1
- **Sandbox-first** — test scripts create clearly named artifacts (`TEST-`, `do-not-use` tags) and clean up after themselves
- **`__dirname`** — compute from `import.meta.url` since ES modules don't expose it natively
- **Text-then-JSON parsing** — `await response.text()` then `JSON.parse()` inside try/catch; never call `.json()` directly
- **Log dir auto-creation** — `fs.mkdirSync(logDir, { recursive: true })` at script start

---

## GROUND RULES

1. Do not start a phase until the previous one is confirmed working.
2. Do not assume API credentials are available — verify before writing scripts.
3. Every script must be tested against a sandbox/test account before touching live client data.
4. If a step is unclear or API behavior is uncertain, stop and ask. Do not guess.
5. All scripts go in `shared/scripts/{platform}/`. All logs go in `shared/logs/`.
6. **Problem flagging protocol:**
   - **Self-resolve:** cosmetic/preference issues that don't affect output — decide and move on silently.
   - **Flag + wait:** anything requiring you to go beyond what's explicitly stated — flag it, pause, wait for direction.
   - **Source material default:** when working from docs (especially AI-generated), stick strictly to what's explicitly stated. Flag gaps or slop; do not fill them in or extrapolate without permission.
   - **Mid-task high-urgency issue:** pause the entire task, flag the issue, wait before continuing.
   - **New problem type:** first time a novel ambiguity appears with no standing rule, flag it once — the decision becomes the rule going forward.
7. **Date-stamp dated facts automatically.** Any note about when something happened, changed, was verified, or was decided must include an ISO date (`YYYY-MM-DD`).

---

## CONTENT STANDARDS (non-negotiable, all bots)

Applies to every bot-facing artifact — CloseBot KBs, Retell prompts, voice agent system messages, any client-facing copy.

- **Knowledge bases = facts only.** No instructional language. No "you must", "always say", "respond with" — instructional phrasing causes execution failures in LLM-backed bots.
- **No pricing in any bot-facing content.** Redirect to human or booking. (See `clients/ground-standard/context.md` no-pricing rule.)
- **No booking language before the booking node.** In CloseBot, that's the GHL Booking node; in Retell, the booking tool call.
- **Validate every KB before delivery:** instructions, dollar signs, placeholder text, sensitive data, cross-client source bleed.
- **Sales flows use NEPQ methodology.**
- Verify before executing. Clarify before building. Flag concerns immediately.

---

## VERIFIED API CAPABILITIES

- **GHL API V2:** full CRUD on contacts, custom fields, calendars, sub-accounts. **Pipelines, pipeline stages, and workflow automations are UI-only** — pre-create in GHL UI, then fetch IDs via API. Every request requires `Version: 2021-07-28` header — omitting it causes silent failures.
- **Retell AI API:** full agent creation, LLM config, functions, post-call analysis. **Always create the LLM first** (`POST /create-retell-llm`), then the agent (`POST /create-agent`). To update a prompt, `PATCH /update-retell-llm/{llm_id}` — NOT the agent endpoint.
- **CloseBot API:** see `## CLOSEBOT` below.
- **N8N API:** workflow creation, activation, execution history via REST. **No direct execute endpoint** — `POST /rest/workflows/{id}/run` returns 401. Only external trigger method: add a Webhook trigger node and POST to its URL.

---

## CLOSEBOT

### Where to put new CloseBot knowledge (three tiers)
- **Tier 1 — rules (this section).** Hard limits, non-negotiables, pre-flight. One-liners only.
- **Tier 2 — architecture & methodology.** `references/closebot_architecture.md`. How flows are designed: node types, NEPQ mapping, archetypes, decision heuristics.
- **Tier 3 — vendor canon.** `references/closebot_docs_reference.md`. Full synthesis of docs.closebot.com.
- **Per-client deviations.** `clients/ground-standard/context.md` — only GS-specific rules that override or extend the tiers above (no-pricing specifics, multi-kid contact design, persona globality).

When adding new CloseBot knowledge: ask "is this a rule, a pattern, or vendor canon?" and file accordingly.

### Pre-flight
- **Consult `https://developers.closebot.com/` before any API call.** Do not reverse-engineer if docs cover it. Discovery scripts only when docs are silent.
- **Consult `developers.closebot.com` + `references/closebot_docs_reference.md` before any *novel* prompt/config approach.** "Novel" = a field, combination, or technique not already standardized.
- **Auth:** `X-CB-KEY` header.
- **Endpoint paths are camelCase** (`/bot/nodeDescriptors`, not `/bot/node-descriptors`).

### Publish-time hard limits
- **Max 5 `ScenarioCustom` nodes per bot.** Exceeding fails publish with "Too many custom scenarios attached to bot."
- **Scenario descriptions under 25 words.**
- **`Conversation` nodes route to EOC only.** `Next handle="..."` on a Conversation node fails publish. If AI-generated content must route onward, use `Statement` with `UseAI true`.
- **Scenarios are for ROUTE changes** (tag+stop, re-intro, knowledge-gap handoff). Different RESPONSE on a specific question? Answer is in the KB or Smart FAQ — not a new rule in `conversationReason`.
- **KDL node type names are case-sensitive.** "Stop Responding" UI → `End` in KDL, not `StopResponding`.
- **KDL imports must dedupe `__zIndex`** before `POST /bot { importKdl }`. Exports contain duplicate `__zIndex` per block; importer 500s on dupes.

### KB attach model
- **KBs attach to GHL sources, not bots.** `POST /library/files/{fileId}/source/{sourceId}`. When a bot is attached to a source, that source's KB is automatically available.
- **Debugging "missing KB info"?** First confirm the bot is on the correct production source.

### Bot creation & testing
- **Create:** `POST /bot { name, importKdl }` → `POST /bot/{id}/publish {}`. (Note: `importKdl` path has had server-side issues — see seed memory `reference_closebot_agent_node_exception.md`. Verify currency before relying on it; fall back to `POST /bot/{id}/duplicate` if the import path is broken.)
- **Test session:** SSE stream. **Must pass `mimicSourceId` on `POST /bot/{id}/testSession`** for Booking nodes to write real GHL appointments.
- **Vacaville source routing:** see `clients/ground-standard/context.md` "Vacaville Source Routing" — `src_4R4DUIQTMMX2NFPU` is the GS Ads sandbox (eval default), `src_GDKORXSW4Q8RQUQ8` is Vacaville production (NEVER as mimic without explicit `ALLOW_PROD_MIMIC=true`).

### Trigger patterns
- **Manual activation** = GHL **Contact Tag Added** trigger with a campaign-specific tag.
- **Date-based / interval** (annual, quarterly) = GHL **Date/Time trigger** + custom date field + offset.
- **External system events** = n8n webhook relay: external → n8n → GHL tag → workflow fires.
- **Source tag filters (standard):** every CloseBot job flow needs two filters on its GHL source:
  - **Must Contain:** bot-specific trigger tag
  - **Does Not Contain:** `ai off` — universal kill switch

---

## LEARNING SYSTEM

**Four-tier documentation structure:**
- `CLAUDE.md` — stable architecture and ground rules. Update only when something is proven fundamental.
- `tasks/todo.md` — session handoff. Fully rewritten at end of every session. ~40 lines max. Read this first on every new session.
- `tasks/lessons.md` — append-only log. New entries at TOP. Never edit old entries. Read when behavior seems off.
- Skills / sub-agents — graduation target for proven, repeatable procedures.

**Escalation path:** Failure → `tasks/lessons.md` entry → pattern repeats across 3+ cases → `CLAUDE.md` ground rule → complex multi-step procedure → skill → sub-agent.

---

## INSTALLED SKILLS

Skills live in `.claude/skills/` and are invoked as slash commands.

**Project-relevant skills:**

| Skill | Purpose |
|---|---|
| `retell-voice-agent-builder` | Build Retell AI voice agents end-to-end |
| `sympana-connector` | GHL ↔ Retell/Vapi bridge via Sympana Connector |
| `ai-knowledge-base-creator` | Build + validate client knowledge bases (80-question intake) |

Plus general-purpose skills: n8n-*, doc formats (docx, pdf, pptx, xlsx), skill-creator, transcript-analyzer, eod-report, mcp-builder.

---

## REFERENCE

- `tasks/todo.md` — session handoff (read first)
- `tasks/lessons.md` — append-only learning log
- `clients/ground-standard/context.md` — full GSA operational guide (KB methodology, QA standards, no-pricing rule, multi-kid contact design, persona globality, Vacaville source routing)
- `references/closebot_architecture.md` — CloseBot Tier 2: node types, flow architecture, NEPQ mapping, archetypes
- `references/closebot_docs_reference.md` — CloseBot Tier 3: vendor canon synthesis
- `references/closebot_agent_node.md` — Agent Node deep reference
- `references/closebot_walkthrough_bryce.md` — annotated Agent Node example
- `references/stack_api_reference.md` — stack API reference
- `references/kb_validator_rules.md` — KB validation rules
