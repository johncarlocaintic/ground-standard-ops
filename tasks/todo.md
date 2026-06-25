# tasks/todo.md

**Last updated:** 2026-06-26 (handoff: JC takes GS back over, Mark Cabel operating)

---

## Current state

JC has taken Ground Standard back over from Glenn and is running it through **Mark Cabel**.
JC owns the client relationship and fronts to Bobby as JC; Mark operates this repo. GS work
was paused mid-June and is now resuming.

**What's live:**
- **Vacaville Grappling Academy** bot `bot_F0VNPTPCIW88YI3J` (**v4.6, LIVE**) on the Vacaville
  production source `src_GDKORXSW4Q8RQUQ8`. Bookings land on Coach Nick's calendar. This is the
  only GS bot on production.
- ~28 Agent Node gym bots **QA-passed and parked** on the GS Ads sandbox source
  `src_4R4DUIQTMMX2NFPU`, awaiting per-gym cutover.
- Emma persona (`pers_*`) bound globally across all GS bots. Persona edits hit every bot.
- GHL GS Ads sub-account = test environment, location ID `isGl70YkeLEAiVckMhgT`.

**Verify currency before relying on any ID above.** Several are point-in-time observations from
May 2026. Confirm against the live CloseBot + GHL accounts before any cutover.

---

## Immediate next actions (for Mark)

1. **Read the CloseBot refresher in `CLAUDE.md` (start-here section), then the reading order at
   the bottom.** Get oriented before touching anything.
2. **Confirm the live fleet state.** Run a bot/source audit against CloseBot + GHL and reconcile
   against `clients/ground-standard/closebot/_GYM-STATUS-CHECKLIST-2026-05-20.md`. Which of the
   ~28 parked bots are still parked, which (if any) went live, which sources they sit on.
3. **Pick the cutover order with JC.** The parked bots are QA-passed but not on production. Do not
   attach any bot to a production source without JC's go-ahead per gym.
4. **Mason Dixon** — was mid-build (KB awaiting client confirmations). Re-check status before
   resuming; see the mason-dixon folder + the gym-status checklist.

---

## Standing rules (do not skip)
- **No pricing in any bot-facing content.** Redirect to the free trial / a human.
- **Vacaville production source `src_GDKORXSW4Q8RQUQ8` is NEVER a test `mimicSourceId`.** Sandbox
  evals use `src_4R4DUIQTMMX2NFPU`.
- **Persona is global.** Any persona edit affects every GS bot. Gym-specific rules go in the bot's
  instructions/Sections, never on the persona.
- **Agent Node bots edit via `PUT /bot/{id} { importKdl }`** (plain `POST` 500s for them).
- **Never touch real leads/contacts without explicit permission.** Verify what applies a GHL tag
  before using it as a bot trigger.

---

## Reading order on first session

1. `tasks/todo.md` (this file)
2. `CLAUDE.md` — purpose, operator, CloseBot refresher, ground rules, CloseBot tier map
3. `clients/ground-standard/context.md` — full GSA operational guide
4. `tasks/lessons.md` (top entries — the 2026-05/06 GS updates first)
5. `references/closebot_architecture.md`, then `references/closebot_agent_node.md`
6. `references/gsa_bot_build_playbook.md` — read before any bot build
7. `references/closebot_docs_reference.md` (skim, treat as reference)
