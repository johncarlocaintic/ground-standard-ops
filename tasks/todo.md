# tasks/todo.md

**Last updated:** 2026-05-08

---

## Current state

Glenn has taken over GSA operations from JC. Handoff repo integrated — active workspace is byte-for-byte identical to handoff (1,510/1,511 files; only diff is EOD skill version).

**What's live:**
- Vacaville Grappling Academy bot (`bot_DR18GF3ZG7IH5QOM` — v4.1 reverted, last known production state per `tasks/lessons.md` 2026-04-27)
- ~50 GS gym bots in CloseBot, Emma persona (`pers_CB1LLPENDKDRB5S2`) globally bound
- GHL GS Ads sub-account = test environment, location ID `isGl70YkeLEAiVckMhgT`
- Vacaville production bookings land on `JFnXPPTB9Rkgyi0KOUv8` (Coach Nick's calendar)

**Verify currency before relying on the above.** Some IDs in seed memory and lessons are point-in-time observations from April 2026.

---

## Active build — Mason Dixon Jiu-Jitsu (gym #37)

**Phase:** KB build — awaiting client confirmation before drafting v2.0.0

**Artifacts on disk:**
- Source: `clients/ground-standard/closebot/mason-dixon/source/clickup_master.md`
- Existing bot: `clients/ground-standard/closebot/mason-dixon/existing/` (bot JSON, KDL, KB)
- Build playbook: `references/gsa_bot_build_playbook.md`

**CloseBot IDs:**
- Bot: `bot_QN6JIZE313IIQQHP` — Emma bound, no source wired, not deployed
- KB: `file_K8E6900W9STUOHBZ`

**Immediate next actions (in order):**

1. **Get client confirmation on B-type gaps** (send message to Ryan Chadwick / Bobby):
   - Kids program structure — combined Youth Martial Arts or separate Jiu-Jitsu + Striking enrollment?
   - Trial offer — free class, web special, or both? Any terms?
   - Wednesday schedule — confirm full lineup (KB has it, ClickUp screenshot was clipped)
   - Adult striking name — Muay Thai, Striking, or Adult Striking (Muay Thai)?
   - Instructor credentials / lineage for Ryan Chadwick
   - Gear requirements for new students (especially kids)
   - Private training — offered? How to inquire?
   - Weekend hours — open Saturday/Sunday?
   - Phone routing — which number for new leads: 402-8999 or 251-2908?

2. **Draft KB v2.0.0** once client confirmations arrive (autonomous A-type fixes are clear — strip metadata header, update contact info, add private training, remove PropertyBots.AI footer)

3. **Inspect bot KDL** — understand why 16 Booking nodes; plan simplification to ≤5 ScenarioCustom

4. **GHL prep** — confirm calendars, custom fields, tags for Mason Dixon

5. **Bot rebuild** — rename, wire calendars, attach KB to source, attach source, publish

6. **Test infra** — rubric + 6 personas for Mason Dixon

7. **QA gate** — 10 consecutive clean conversations

8. **Cutover** — production source attach + smoke test

---

## Open threads (carry-overs from handoff)

- **CloseBot agent-node `importKdl` path.** Per seed memory, broken as of 2026-04-27. Fallback: `POST /bot/{id}/duplicate`. Verify currency before relying.
- **Vacaville bot stress-test confidence.** Last lesson 2026-05-04: `/duplicate` failed under N=5 stress test. Verify before declaring any API path "works."
- **Persona is global.** Any persona-level edit affects every GS bot simultaneously. Workflow-specific rules belong in `__CONFIG__` or Sections only.

---

## Reading order on first session

1. `tasks/todo.md` (this file)
2. `CLAUDE.md`
3. `clients/ground-standard/context.md`
4. `tasks/lessons.md` (last 10 entries minimum)
5. `references/closebot_architecture.md`
6. `references/closebot_docs_reference.md` (skim, treat as reference)
7. `references/gsa_bot_build_playbook.md` (new — read before any bot build)
