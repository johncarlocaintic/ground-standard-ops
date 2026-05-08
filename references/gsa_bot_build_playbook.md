---
title: GSA Bot Build Playbook
version: 1.0.1
date: 2026-05-08
status: DRAFT — pending battle-test on Mason Dixon (gym #2)
reference_implementation: Vacaville Grappling Academy (bot_DR18GF3ZG7IH5QOM, v4.1)
---

# GSA Bot Build Playbook

The end-to-end procedure for cloning the Vacaville reference implementation into a new GSA gym bot. Follow it in order. Each phase has a hard gate — do not advance until the gate passes.

This playbook distills JC's methodology from the Vacaville overhaul (2026-04-29 → 2026-05-01) and the operational rules in [context.md](../clients/ground-standard/context.md) and [CLAUDE.md](../CLAUDE.md). When in doubt, those documents are authoritative; this playbook is the operating sequence.

---

## How to use this playbook

- **Read top-to-bottom on first build.** Every phase has a "why" annotation tied to a real failure from the Vacaville log.
- **On subsequent builds, treat each phase header as a checklist gate.** Skip the prose, run the checklist, advance when it passes.
- **Update this playbook after every gym build.** If a step turned out wrong, missing, or surprised you — append a `## Build N — what changed` section at the bottom. Do not edit prior text. The first 3-4 builds are the real spec; v1.0 is a hypothesis.

---

## Phase 0 — Pre-flight

**Goal:** confirm everything you need exists before writing a single line.

### 0.1 Confirm session basics
- [ ] Read `tasks/todo.md` (current state) and the top 10 entries of `tasks/lessons.md`
- [ ] Read [context.md](../clients/ground-standard/context.md) sections 7, 9, 10, 11, 12 if not already read this session
- [ ] Confirm Claude Code is logged in as `ads@groundstandard.com` (Bobby's GS Team account)
- [ ] Run `node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/diagnostics/check_all_credentials.js` — must pass

### 0.2 Confirm agency-level invariants are still true
These were true as of the Vacaville overhaul. Verify before relying on each:

| Invariant | How to verify | Fallback if false |
|---|---|---|
| Persona `pers_CB1LLPENDKDRB5S2` ("Emma") is bound to all GS bots | `GET /persona` via CloseBot API; check it's still Emma | Stop and ask the user — persona changes affect ~50 bots |
| GS Ads sandbox source `src_4R4DUIQTMMX2NFPU` is the eval target | `GET /sources` — confirm GS Ads sub-account binding | Stop and ask the user before using anything else |
| `ALLOW_PROD_MIMIC=true` guardrail exists in `shared/scripts/closebot/eval/orchestrator.js` | grep for the string | Re-add it before running anything against a prod source |
| Vacaville reference bot `bot_DR18GF3ZG7IH5QOM` v4.1 is healthy | `GET /bot/{id}` — confirm it has personaIds and a botSteps array | If broken, escalate; do not use a degraded reference |
| `importKdl` may be broken on CloseBot's backend (per 2026-04-27) | Try a minimal import; check for `Agent Node Exception` | Fall back to `/duplicate`, but only after stress-testing — see seed memory |
| `/duplicate` does NOT reliably inherit persona under stress (per 2026-05-04) | Stress-test N≥5 if you intend to use it | Build via UI or import-KDL fallback |

> **Note on the bot-creation method.** As of 2026-05-08, neither `importKdl` nor `/duplicate` is fully trusted. The safest path is **UI-clone the Vacaville bot in CloseBot, then API-edit per-gym fields**. Re-test the API paths each build — when one becomes reliable, update this playbook.

### 0.3 Pull the gym's intake material

For Mason Dixon (and every subsequent gym), the **single source of truth** is the ClickUp master reference. No facts come from anywhere else — not the gym's website, not assumptions, not other gyms' KBs.

- [ ] Pull the ClickUp master reference for the gym → save to `clients/ground-standard/closebot/{gym-slug}/source/clickup_master.md` (or `.pdf`)
- [ ] Check CloseBot for an existing KB or workflow under the gym's name. If found, export it as a starting point — but treat it as input to validate, not as truth.
- [ ] Confirm with the user: which CloseBot bot ID (if any) corresponds to this gym, OR confirm we're starting from a fresh duplicate of Vacaville.

### 0.4 Identify the GHL artifacts the gym needs

This is the silent-failure surface. Booking nodes return empty if calendars aren't wired; field writes fail silently if custom fields don't exist.

- [ ] Locate the gym's GHL sub-account (or confirm it shares GS Ads for testing initially — most gyms do)
- [ ] Confirm calendars exist with **Permanent IDs** (random letters+numbers, not custom slugs):
  - Adult / primary class calendar
  - Kids / youth class calendar (if applicable)
  - Any other program-specific calendars
- [ ] Confirm custom fields exist (these are the GSA standard — Bobby's templated snapshot):
  - `first_name`, `last_name`, `email`, `phone`, `date_of_birth` (standard GHL fields)
  - `youth_name` (TEXT, single field — multi-kid gets comma-packed)
  - `youth_birthday` (DATE, single field — same)
- [ ] Confirm tags exist:
  - The gym-specific **trigger tag** (e.g. `mason-dixon-jiujitsu-trial-bot`)
  - `ai off` (universal kill switch — must exist on the source)
  - Any handoff tags (`concierge - booking handoff`, `aggression`, `minor - needs guardian`, `member`)

> **Why this matters.** Every Vacaville debug story that started with "the booking node returns nothing" or "the contact name is wrong" traced back to a missing GHL artifact. Verify here, save hours later.

### Phase 0 gate
✅ Credentials pass • intake material in `source/` folder • all GHL artifacts inventoried • Vacaville reference confirmed healthy

---

## Phase 1 — Knowledge Base build

**Goal:** ship a KB file that passes all four grep validations and contains zero instruction language.

### 1.1 Source ingestion + gap analysis
- [ ] Read the entire ClickUp master reference. Note inconsistencies (two prices for same program, schedule that's already passed, ambiguous policy text).
- [ ] Map source content to the standard 10-section schema (see [context.md §7](../clients/ground-standard/context.md))
- [ ] Compile an `[INTERNAL FLAGS]` appendix listing every gap, inconsistency, and ambiguity. **Do not fill gaps from outside sources.** Flag and ask the user.

### 1.2 Draft the KB
File path: `clients/ground-standard/closebot/{gym-slug}/{gym-slug}_kb_v0.1.0.txt`

Use the 10-section schema (full version in [context.md §7](../clients/ground-standard/context.md)):
1. Business Information
2. Contact & Location
3. Facility
4. Class Schedule
5. Programs Offered
6. Trial / Intro Class Information
7. Membership & Fees *(structure only — no $ figures unless explicitly approved)*
8. Policies
9. FAQ Section *(15-25 questions)*
10. Pricing Response & Friction Handling Reference *(declarative facts, no commands)*

**Hard rules — every one of these has a documented Vacaville incident behind it:**
- **No instruction language.** No "you must", "always", "never", "respond with", "tell the user". Use [Ballantyne](../clients/ground-standard/closebot/) FAQ structure as the *response pattern* template — never copy its facts.
- **No `$` figures or `X%` figures** unless the source explicitly provides them AND the user approves inclusion. Default = redirect to coach.
- **No booking confirmation language anywhere.** No "you're booked", "see you Monday", "confirmed for 5pm". Booking lives only in the GHL Booking node.
- **No cross-client bleed.** No Charlotte, no Sensei Sparks, no Vacaville-specific details, no Coach Nick.

### 1.3 Refine with kb_refiner.js (optional but recommended)
```bash
node --env-file=.env shared/scripts/closebot/kb_refiner.js --file clients/ground-standard/closebot/{gym-slug}/{gym-slug}_kb_v0.1.0.txt
```
Reads the file, surfaces structural issues. Don't blindly accept changes — review each.

### 1.4 Validate with kb_validator.js (mandatory gate)
```bash
node --env-file=.env shared/scripts/closebot/kb_validator.js --file clients/ground-standard/closebot/{gym-slug}/{gym-slug}_kb_v0.1.0.txt --bleed "Vacaville,Coach Nick,Ballantyne,Charlotte,Sensei Sparks"
```
The script enforces five rule groups (full reference: [kb_validator_rules.md](kb_validator_rules.md)):
- **Group A — Instructional language**: must = 0 hits
- **Group B — Pricing**: must = 0 hits (unless approved)
- **Group C — Booking language**: must = 0 hits
- **Group D — Placeholders / draft tokens**: must = 0 hits
- **Group E — Cross-client bleed**: must = 0 hits

Any FAIL → fix and re-run. No exceptions. A failing validator = the KB does not ship.

### 1.5 Version and rename to DEPLOY
Once all five groups pass:
- [ ] Add a changelog entry at the bottom of the KB file
- [ ] Rename to `{gym-slug}_kb_v1.0.0_DEPLOY.txt`
- [ ] Save to the gym's closebot folder

### Phase 1 gate
✅ All five validator groups = 0 hits • file renamed `_DEPLOY.txt` • changelog entry added

---

## Phase 2 — GHL infrastructure prep

**Goal:** every artifact the bot will read or write to exists in GHL with the correct ID.

### 2.1 Source filter setup
On the gym's CloseBot source, configure the source filter:
- **Must contain**: gym-specific trigger tag (e.g. `mason-dixon-jiujitsu-trial-bot`)
- **Does not contain**: `ai off` (universal kill switch — every GS bot has this)

### 2.2 Trigger pattern selection
Most GSA gyms use one of these triggers (see [CLAUDE.md "Trigger patterns"](../CLAUDE.md)):
- **Manual / inbound reply** — GHL Contact Tag Added trigger with the bot-specific tag
- **Date-based / annual** — GHL Date/Time trigger + custom date field + offset (birthday campaigns, etc.)
- **External event relay** — n8n webhook → adds GHL tag → workflow fires CloseBot

For most new gym builds, default to manual/inbound.

### 2.3 Calendar wiring inventory

Document the calendar IDs you'll wire into the bot's Booking nodes:

| Calendar | Permanent ID | Notes |
|---|---|---|
| Adult / primary | `???` | Use Permanent ID, not slug |
| Kids / youth | `???` | (if applicable) |
| Other program | `???` | (if applicable) |

**Verify calendars before wiring:** for each calendar, run `verify_calendar_ids.js` or check availability with `check_kids_availability.js` adapted to the gym. A calendar with no schedule attached returns empty slots → silent booking failure.

### 2.4 Custom field + tag inventory

| Artifact | Confirmed exists in GHL |
|---|---|
| `first_name` (built-in) | ☐ |
| `last_name` (built-in) | ☐ |
| `email` (built-in) | ☐ |
| `phone` (built-in) | ☐ |
| `date_of_birth` (custom) | ☐ |
| `youth_name` (custom, TEXT) | ☐ |
| `youth_birthday` (custom, DATE) | ☐ |
| Trigger tag | ☐ |
| `ai off` | ☐ |
| `concierge - booking handoff` | ☐ |
| `minor - needs guardian` (if 14-17 self-booking gate is in scope) | ☐ |
| `member` (existing-member exclusion) | ☐ |

### Phase 2 gate
✅ Source filter configured • all calendars verified with Permanent IDs • all custom fields exist • all tags exist

---

## Phase 3 — CloseBot bot build

**Goal:** a published bot with the correct source, persona, calendars, and per-gym configuration.

### 3.1 Choose the bot-creation method

**Recommended (as of 2026-05-08): UI-clone Vacaville, then API-edit per-gym fields.**

Rationale: `importKdl` had Agent Node exceptions on CloseBot's backend as of 2026-04-27, and `/duplicate` failed N=5 stress test on 2026-05-04 (0/5 inherited persona). Re-test these each build — when one becomes reliable, this playbook gets updated.

Alternative paths to try after the UI clone is healthy:
```bash
# Option A — POST /bot { importKdl } from a Vacaville export
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_import_vacaville_v2.js
# (verify: GET the new bot, confirm personaIds + botSteps populated)

# Option B — POST /bot/{id}/duplicate
# (verify: stress-test N≥5 before relying on it)
```

### 3.2 Bind the persona — HARD RULE: NEVER EDIT PER ITERATION

> **HARD RULE.** The persona is **never** edited per gym, per build, or per iteration. The persona is bound to ALL GS bots and changes propagate globally. Any persona edit is an agency-wide change that requires explicit user approval — it is not a per-gym customization tool.

The persona `pers_CB1LLPENDKDRB5S2` (Emma) is bound to all ~50 GS bots. Settings on the persona are **global by design**. The voice/tone/identity is one shared brand across the entire GSA portfolio. Per-gym personalization happens ENTIRELY in `__CONFIG__`, Sections, and KB content — never on the persona.

**If a build seems to need a persona edit, stop.** It almost certainly means a per-gym rule is being mis-filed. Re-route the change to `__CONFIG__`, a Section, or the KB. Only escalate to a real persona edit if the change applies to every GS bot AND the user explicitly approves it.

What lives on the persona (do NOT touch — global, agency-wide):
- `howToRespond` (universal voice rules — "always respectful", "no pricing")
- `voiceStyles`, `aiProviderPreferences`
- `typoPercent`, `breakupLargeMessagePercent`, `responseTime`, `responseDelay`
- Persona name, description, image

What lives per-bot in `__CONFIG__` (edit freely — only this bot is affected):
- `conversationReason` (this gym's goal — keep short, a few sentences)
- `businessInformation` (gym name, schedule snippets, program list)
- `prohibitedWords` (per-gym vocabulary bans, if any)
- Method-node Sections + Instructions, Statement bodies, ScenarioCustom descriptions
- Calendar IDs, tag names, custom field bindings

> **Anti-pattern alert (architecture §10).** Do NOT pile every regression rule into `conversationReason` or ExtraPrompts — the bot will compliance-deflect on turn 1, then "recover" on turn 2 when KB retrieval finally outweighs the guardrail. Each rule type has exactly one home (see the tier map in `closebot_architecture.md` §10).

### 3.3 Wire the booking nodes
For each Booking node:
- [ ] Set the calendar via **Permanent ID** (random letters+numbers — never the custom slug)
- [ ] Confirm a Timezone Objective runs *before* the Booking node (otherwise "2pm" is ambiguous)
- [ ] Verify the contact has phone OR email captured before reaching the Booking node (GHL rejects bookings without one)

### 3.4 Per-gym customization checklist
Edit per the gym's ClickUp master reference:
- [ ] `__CONFIG__.businessInformation`: gym name, address, instructor name
- [ ] `__CONFIG__.conversationReason`: this gym's goal (keep tight)
- [ ] Schedule references (in Sections, not in KB — facts go in KB, flow logic stays in nodes)
- [ ] Booking node descriptions: short — "Book free trial intro class, 60 min" type
- [ ] Modify Tags actions: gym-specific trigger tag, success/failure tags
- [ ] Statement bodies: gym name, address, what-to-bring details

### 3.5 Hard limits (publish will fail otherwise)
- **≤ 5 ScenarioCustom nodes per bot.** "Too many custom scenarios attached to bot" = exceeded.
- **Scenario descriptions < 25 words.** Per CloseBot vendor docs.
- **Conversation nodes route to EOC only** — `Next handle="..."` on Conversation = publish failure. If AI content needs to route onward, use Statement with `UseAI true`.
- **KDL imports must dedupe `__zIndex` per block.** Exports contain duplicates; importer 500s on dupes.
- **Node type names are case-sensitive.** "Stop Responding" UI → `End` in KDL, not `StopResponding`.

### 3.6 Attach the KB to the source
KBs attach to GHL **sources**, not bots. When a bot is on a source, that source's KB is what the bot uses.
```bash
# POST /library/files/{fileId}/source/{sourceId}
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/attach_persona_smartfaq.js
```
- [ ] Upload the `_DEPLOY.txt` KB file to CloseBot's Knowledge Library
- [ ] Attach to the gym's source (sandbox source for now — production attach happens at Phase 6)

### 3.7 Publish the bot
```bash
# POST /bot/{id}/publish {}
```
If publish fails, the error message is usually exact about the cause (max scenarios, conversation routing, etc.). Re-read this section's hard limits.

### Phase 3 gate
✅ Bot published • persona bound (Emma) • KB attached to source • all calendars wired • Phase 2 GHL artifacts referenced correctly

---

## Phase 4 — Test infrastructure setup

**Goal:** the same evaluation rigor used on Vacaville, applied to this gym.

### 4.1 Build the rubric
File: `shared/scripts/closebot/rubrics/{gym-slug}.json`

Use `rubrics/vacaville.json` as the template. The rubric defines what counts as a "pass" for each persona — booking landed, correct calendar, correct contact name, etc.

### 4.2 Define personas
Folder: `shared/scripts/closebot/personas/{gym-slug}/`

At minimum, replicate the six Vacaville personas (each surfaces a different bug class):
- `cooperative_scheduler` — gives info step-by-step
- `kid_only` — minor referral edge case
- `multi_kid_family` — multiple enrollees, tests booking-hallucination + multi-kid contact design
- `adult_only` — single adult booking
- `hostile_aggression` — aggression handoff (gradual escalation across 3-4 turns, not first-turn)
- `comprehensive_happy_path` — bulk-info delivery, tests booking-hallucination on the "everything at once" pattern

Customize per gym (Mason Dixon may have different program age brackets, different schedule, different objection patterns).

### 4.3 Configure the orchestrator

Test runs MUST default to `mimicSourceId=src_4R4DUIQTMMX2NFPU` (GS Ads sandbox). The orchestrator has a hard guardrail:
```javascript
// Will exit code 2 if MIMIC_SOURCE_ID is set to anything but the sandbox without ALLOW_PROD_MIMIC=true
```
Verify this guardrail before running any test — if it's been weakened, restore it before proceeding.

### Phase 4 gate
✅ Rubric created • personas defined • orchestrator pointed at GS Ads sandbox • guardrail verified

---

## Phase 5 — QA gate (10 clean conversations)

**Goal:** 10 consecutive clean conversations with no failures. The streak resets on any failure — this is GSA's hard activation standard.

### 5.1 Run the persona sweep
```bash
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_multi_persona_test.js
```
~22 minutes for the full 6-persona sweep. Each persona produces a transcript, an SSE event log, and a GHL ground-truth check.

### 5.2 Cross-reference every conversation across three sources
**Never diagnose from a single source. The disagreement IS the bug.**
- **Transcript** (what the customer saw)
- **CloseBot SSE event stream** (which nodes fired, which tools were called)
- **GHL ground-truth** (what actually persisted)

When all three agree, the diagnosis is solid. When they disagree, that's the bug. The most common pattern that this catches: the bot says "you're all set!" while SSE shows zero booking-tool calls and GHL has zero appointments — three sources telling three different stories.

### 5.3 Clean-conversation criteria (all must pass)
A conversation is "clean" only if every one of these holds:
- [ ] Bot greets correctly and collects missing contact data without errors or loops
- [ ] Adult/youth routing branches correctly
- [ ] FAQ responses draw accurately from the KB — no hallucinated facts, no source bleed
- [ ] Pricing questions produce the correct redirect, no quoted figures
- [ ] Booking node triggers at the right point in the flow
- [ ] A real GHL appointment is created in the correct calendar
- [ ] No double-booking behavior (booking language never appears before the Booking node)
- [ ] Conversation ends on the correct path (booked → success; not-ready → nurture; aggression → handoff + Stop)
- [ ] No Error 30007 SMS carrier violations triggered
- [ ] The contact's name in GHL is the real first_name from conversation (NOT "Testing")
- [ ] Phone is captured (not stored as `undefined`)
- [ ] First/last name persistence calls were made (not skipped because the field had a placeholder)

### 5.4 Common failure modes to actively check for
Each of these has a Vacaville incident behind it. Run a search across the test outputs:

| Symptom | Root cause | Where it usually lives |
|---|---|---|
| Bot claims "you're all set" but no GHL appointment | Booking hallucination from intro/qualification node | Tighten that node: "DO NOT DISCUSS BOOKING OR AVAILABLE SLOTS IN THIS NODE" |
| Day-switching (agreed Wed, booked Thu) | LLM picking different slot than confirmed | Verify timezone Objective + check calendar slot resolution |
| Phone stored as `undefined` in GHL | LLM dropping phone from Update Contact tool calls | Add MUST clause to the data capture node |
| First name = "Testing" in GHL | Bot skipping persistence because field had placeholder | MUST clause: overwrite even if value already exists |
| Scenario hijacks unrelated conversation | Description not anchored on the contact's specific variable | Use `field {{contact.X}}` syntax explicitly |
| Test runs landing in production GHL | mimicSourceId pointing at prod source | Verify orchestrator guardrail |

### 5.5 Stress-test before declaring "works"
Single-sample success ≠ working. Per the 2026-05-04 lesson, every API path or feature claim needs **all four** of:
1. Direct content equality (e.g. botSteps diff, not just "personaIds is non-empty")
2. End-to-end functional run (multi-turn conversation, real booking, real GHL artifact verified)
3. Repeatability across N≥5 samples in varied conditions (sequential AND parallel, different times of day)
4. Active search for contradicting historical data BEFORE making the claim

A "200 OK + one reply" is a **hint**, not validation. Be honest about what you tested.

### 5.6 Iterate until 10 consecutive clean
Update the bot, re-run, repeat. Each fix should target one root cause; don't pile fixes blindly.

Track each test run in the GSA Launch Tracker spreadsheet (per [context.md §9](../clients/ground-standard/context.md)).

### Phase 5 gate
✅ 10 consecutive clean conversations • all six personas pass • Launch Tracker updated • status changed from `Testing` → ready for cutover

---

## Phase 6 — Production cutover

**Goal:** flip the bot from sandbox to the gym's production GHL source without leaking test contacts onto the real calendar.

### 6.1 Re-attach the KB to the production source
The KB is attached to the GHL source, not the bot. To go live, attach the same `_DEPLOY.txt` KB to the gym's production source (or GS Ads' production-routed source if the gym shares it).

### 6.2 Update the bot's source binding
Use `gs_attach_source.js` (or the v2/v3 variants — pick the one that worked for the most recent build).

### 6.3 Run ONE deliberate production smoke test
```bash
ALLOW_PROD_MIMIC=true node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_sse_test.js --persona cooperative_scheduler --mimic <prod-source-id>
```
- [ ] Use `cooperative_scheduler` (most boring, safest)
- [ ] Verify the booking lands on the production calendar
- [ ] Verify the contact has the right name, email, phone in production GHL
- [ ] **Immediately clean up** the test contact + appointment via the GHL UI (production PIT may be read-only — UI cleanup only)

### 6.4 Update the launch tracker
- [ ] Status: `Testing` → `Active`
- [ ] Note the bot ID, KB version, source ID, calendar IDs in the gym's portfolio entry

### 6.5 Tag the gym in the portfolio
Update `clients/ground-standard/gym-portfolio.md` with: location (if not already), KB version, status, notes.

### Phase 6 gate
✅ Bot live on production source • smoke test booking landed correctly + cleaned up • Launch Tracker = Active • portfolio entry updated

---

## Phase 7 — Post-launch monitoring

**Goal:** catch real-world failures in the first 24-48 hours, before they accumulate.

### 7.1 First-day watch
- [ ] Check GHL for the first inbound bot conversation within 24 hours
- [ ] Verify the bot greeted, qualified, and routed correctly
- [ ] Verify the booking landed (or the nurture path triggered)
- [ ] No Error 30007 in carrier logs

### 7.2 First-week monitoring
- [ ] Pull conversation logs daily for the first 7 days
- [ ] Watch for: hallucinated bookings, day-switching, scenario misfires on real leads
- [ ] If a real-world failure happens that the test sweep missed → add a new persona to the rubric covering that pattern, before fixing

### 7.3 Append a build retrospective
After the first week:
- [ ] Append a `## Build N — what changed` section to the bottom of this playbook
- [ ] Note: any step that was unclear, any step that was wrong, any new failure mode the sweep missed
- [ ] Update the gym's Launch Tracker entry

---

## Common Gotchas Quick Reference

Pulled from `tasks/lessons.md` — these have all bitten before, do not skip:

| Gotcha | Where to look |
|---|---|
| Bot replies in 5s and looks fine, but no GHL appointment | SSE event stream — was the booking tool actually called? |
| `personaIds` empty after `/duplicate` | Stress-test N≥5; the "works" hint from one sample is a lie |
| `importKdl` returns 500 | De-dupe `__zIndex` per block; verify Agent Node exception isn't current |
| Scenario fires on wrong context | Description must reference the LEAD's specific contact variable (`{{contact.youth_name}}`, `{{contact.date_of_birth}}`) — not generic "minor involved" language |
| Field write missing | Did the Objective hit green checkmark? Skip-if-not-blank trapping a placeholder? |
| Booking node returns empty slots | Calendar Date Range too narrow OR calendar isn't linked to a schedule (GHL-side fix) |
| Bot engages an existing member | `member` tag check missing in flow OR GHL workflow not applying the tag |
| "ai off" got applied during a soft pause and locks the bot out | Use Stop Responding for soft pauses; `ai off` is for permanent kills only |

---

## Reference: Vacaville artifact map (the gold-standard implementation)

Use these as the reference whenever the playbook is ambiguous. Verify currency before quoting any specific ID — these are point-in-time as of 2026-05-05.

| Artifact | ID / location |
|---|---|
| Live Vacaville bot (v4.1) | `bot_DR18GF3ZG7IH5QOM` |
| Test-bench bot (v0.0.32) | `bot_J56AWZ5TYQI9HKJS` |
| Persona (Emma — global) | `pers_CB1LLPENDKDRB5S2` |
| GS Ads sandbox source | `src_4R4DUIQTMMX2NFPU` |
| Vacaville production source | `src_GDKORXSW4Q8RQUQ8` (NEVER mimic without `ALLOW_PROD_MIMIC=true`) |
| GS Ads GHL location | `isGl70YkeLEAiVckMhgT` |
| Vacaville prod GHL location | `JFnXPPTB9Rkgyi0KOUv8` (Coach Nick's calendar) |
| Adult No-Gi calendar | `KKR9rxFq16DS0fykxXMa` |
| Kids 7-13 calendar | `GWdabDvAgRFHZGsBN9Fq` |
| Reference KB | `clients/ground-standard/closebot/vacaville_kb_v2.2.0_calendar_aligned.txt` |
| Reference bot export (KDL) | `clients/ground-standard/closebot/vacaville/bot-export.kdl` |
| Overhaul retrospective | `clients/ground-standard/vacaville_bot_overhaul_report.md` |

---

## Document changelog

| Version | Date | Change |
|---|---|---|
| 1.0.1 | 2026-05-08 | Hardened persona rule in Phase 3.2 — persona is NEVER edited per iteration; changes are agency-wide and require explicit user approval. |
| 1.0.0 | 2026-05-08 | Initial draft. Distilled from context.md, vacaville_bot_overhaul_report.md, closebot_architecture.md, kb_validator_rules.md, and lessons.md (top entries through 2026-05-04). DRAFT until battle-tested on Mason Dixon (gym #2). |
