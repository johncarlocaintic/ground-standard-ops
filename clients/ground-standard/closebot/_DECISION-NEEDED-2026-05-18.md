# ✅ RESOLVED 2026-05-18 — audit-and-fix complete

All In v2.1 (canon classic, template-native conversationReason) = READY: every
v2.0 false-closure fixed, real GHL appts on correct calendars, 3/3 non-det.
Root cause was canon /closebot-build Phase 2 wholesale-replacing
conversationReason with a lean-authored spec value. Fixed in
cb_vacaville_substitute.js + closebot-build SKILL.md Phase 2. Evidence:
allinjujitsu-qa-summary-v3.md. Proceeding: Gracie FV / Hammer / Inverted Gear
on the fixed canon pipeline.

--- original decision doc below (historical) ---

# DECISION NEEDED — All In + remaining 3 gyms (2026-05-18)

## What happened while you napped

Followed the proper canon pipeline on All In as instructed:
1. Detached + `[LEGACY-BROKEN]` the lean v1.0 (`bot_W7SALTJ86VFW8LA0`).
2. Canon `/closebot-build` from the 195-node Vacaville classic template →
   v2.0 `bot_IAHRWLP8HI2X82V1` (178 nodes, 0 orphan handles, 0 placeholders).
3. Canon `/closebot-test` full sweep with the 0-appt-hard-fail rigor.

**Result: All In v2.0 (canon classic) is NOT READY.** Full evidence in
`allinjujitsu-qa-summary-v2.md`. Detached from sandbox, test contacts cleaned.

## The core problem (needs your call — I stopped rather than compound it)

**Both architectures fail All In, differently:**

| | Lean Agent-Node v1.0 | Canon Classic v2.0 |
|---|---|---|
| kid_young / multi-enrollee | dead-end / never books (0 appts) | **FIXED** — both book real appts |
| adult / kid paths | book OK | book OK |
| pricing / boundary / nonbookable / edge | passed | **non-deterministic false closure** — "you're all set", 0 GHL appt, judge: critical fabrication |
| minor 16 | referral OK | says "you'd be in our adult program" — contradicts spec |
| non-determinism | 3/3 | **2/3 (1 false-closure)** |

So canon classic fixed the lean build's dead-ends but introduced a
non-deterministic false-closure blocker (the most dangerous class — tells real
leads they are booked when they are not). Neither has produced a clean All In.

## Why I did NOT build Gracie FV / Hammer / Inverted Gear

The canon classic template just produced a NOT-READY bot with a systemic
false-closure on a single-adult-calendar gym. Gracie FV / Hammer / Inverted
Gear would be built from the same template and would very likely reproduce the
same blocker ×3. Building them now = compounding a known failure (the exact
anti-pattern from the earlier lean drift, just in the other direction). Per the
guardrails I committed to: stop and flag a genuinely blocking issue rather than
guess or mass-produce broken bots.

## Open questions only you / JC / Bobby can resolve

1. **Is the false-closure a template defect or my substitution?** The Vacaville
   template assumes 3 youth bands + multi adult; All In is 1 adult + 1 kids
   (I duplicate-routed all youth bands to the one kids calendar — canon-blessed,
   zero orphan). The non-deterministic confirm-without-book may be a
   template-level issue for single-calendar collapses, OR a real Vacaville
   template flaw, OR something in the conversationReason swap. Needs a decision
   on whether to (a) debug the classic template for single-calendar gyms,
   (b) accept lean architecture and fix ITS dead-end bug instead, or
   (c) something else.
2. **Architecture of record** (still unresolved from the earlier audit): the
   8 prior shipped bots split classic vs lean; canon skill says classic; the
   recent fleet is lean. This run shows neither is clean for single-calendar
   gyms without further work.
3. **Test-harness gap (real, should fix regardless):** the orchestrator's
   `events.json` tool_use capture is agent-node-shaped — it logs "NO TOOL_USE"
   for classic bots even when GHL confirms real bookings. Verdicts on classic
   builds must rely on the GHL Verifier appt-count, not the event log. The
   orchestrator should be made architecture-aware before classic builds can be
   trusted by the eval alone.

## State of everything (clean, nothing on prod, nothing occupying sandbox)

- 5 lean bots (Eden v1.2, Scottsdale v1.0, Bodega v1.0, Breathe v1.1,
  Centerline v1.0): QA-passed, parked, detached. Architecture-of-record
  question still open for these.
- All In: lean v1.0 `[LEGACY-BROKEN]`; canon v2.0 NOT READY, detached.
- Gracie FV / Hammer / Inverted Gear: NOT built (intentionally held). Gracie FV
  discovery done (website + calendars + source `src_LGA6WCCJSAEE8X6R` reconciled).
- Nothing attached to any production source. Sandbox empty. Test contacts cleaned.
- Nothing committed to git.

## My recommendation (yours to accept/override)

Do not mass-build the last 3 until #1 is decided. Cheapest next diagnostic:
take ONE clean failing transcript (e.g. pricing_deflect) and have a human read
where the classic template confirms without booking — that tells us if it's the
single-calendar collapse or a template flaw, and whether classic is salvageable
for these gyms or lean+fix is the better path. That's a ~15-min human review,
not more autonomous building.
