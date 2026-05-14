# tasks/todo.md

**Last updated:** 2026-05-14

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

## KB pipeline — DRAFT builds (all pending client gap confirmations)

All KBs below are v1.0.0-DRAFT. None are cleared for deploy. Files are at
`clients/ground-standard/closebot/{gym-slug}/`. All committed and pushed to
`idriss/kb-builds` branch on `idrizz28/gs-bot-builds` (2026-05-14).

| Gym | File | Critical gaps |
|---|---|---|
| Academy Eden Prairie | `academy_eden_prairie_kb_v1.1.0_DRAFT.txt` | Trial process, instructor names, email |
| Academy of JJ Scottsdale | `academy_of_jiu_jitsu_scottsdale_kb_v1.2.0_DRAFT.txt` | Competition class schedule, Gi loaner |
| Centerline Jiu-Jitsu | `centerline_jiu_jitsu_kb_v1.0.0_DRAFT.txt` | See Section 11 |
| Champion Martial Arts | `champion_martial_arts_kb_v1.0.0_DRAFT.txt` | See Section 11 |
| Gracie Farmington Valley | `gracie_farmington_valley_kb_v1.0.0_DRAFT.txt` | Schedule transition, Wed booking scope |
| Gracie JJ East San Jose | `gracie_jj_san_jose_kb_v1.0.0_DRAFT.txt` | Kids program name + age (Jr. Grapplers 7–12 vs Bullyproof 5–12); Cardio Kickboxing status |
| Grit JJ & Muay Thai | `grit_jiu_jitsu_muay_thai_kb_v1.0.0_DRAFT.txt` | 4 internal Muay Thai schedule conflicts; minimum age (4 vs 5) |
| Hammer Sports & Performance | `hammer_sports_performance_kb_v1.0.0_DRAFT.txt` | Mon/Fri kids class type; Mon 8 AM class name |
| Hamptons Jiu-Jitsu | `hamptons_jiu_jitsu_kb_v1.0.0_DRAFT.txt` | Westhampton address (different street number); email domain typo; bot scope (1 vs 2 locations); all live schedule links 404 |
| Inverted Gear Academy | `inverted_gear_academy_kb_v1.0.0_DRAFT.txt` | Address conflict — different cities (Bethlehem vs Allentown); trial duration (1-day vs 7-day); Nelson Puentes rank (2nd vs 3rd degree) |
| All In Jiu-Jitsu | `all_in_jiu_jitsu_kb_v1.0.0_DRAFT.txt` | Website inaccessible (bteamnj.com down); phone, email, instructors, all policies unknown |
| Artistry BJJ | `artistry_bjj_kb_v1.0.0_DRAFT.txt` | Second location (Georgetown TX) — website only, not in ClickUp; confirm active/inactive |
| Bodega Jiu-Jitsu | `bodega_jiu_jitsu_kb_v1.0.0_DRAFT.txt` | Adult class schedule completely missing from ClickUp |
| Breathe Jiu-Jitsu | `breathe_jiu_jitsu_kb_v1.0.0_DRAFT.txt` | Georgetown TX phantom address (same as Artistry — likely GSA template artifact); confirm |

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
