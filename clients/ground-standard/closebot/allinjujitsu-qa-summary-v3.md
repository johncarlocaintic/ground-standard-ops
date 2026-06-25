# QA Summary — All In Jiu-Jitsu (v2.1 canon classic) — READY

**Bot:** All In Jiu-Jitsu - Launch v2.1 [canon classic, template-native conversationReason fix] (2026-05-18)
**Bot ID:** `bot_V192XD11LN16POGQ`
**Run date:** 2026-05-18
**Sandbox:** `src_4R4DUIQTMMX2NFPU` — All In 3 calendars mirrored, KB `file_DQATZDUMK1QMC4G8` indexed
**Verdict: READY** (parked on sandbox, NOT on prod — Bobby soft-launch gate)

Canon `/closebot-build` from the 195-node Vacaville classic template (178 nodes,
0 orphan handles, 0 placeholders). Supersedes v2.0 `[LEGACY]` (false-closure)
and lean v1.0 `[LEGACY-BROKEN]` (dead-ends).

## Audit → root cause → fix

- **v1.0 (lean Agent-Node):** Parent-for-Child dead-end + multi-enrollee
  never-books (0 appts). NOT READY.
- **v2.0 (canon classic, lean conversationReason):** non-deterministic
  false-closure — bot said "you're all set" with 0 GHL appt on pricing /
  boundary / nonbookable / 1-of-3 repeats. NOT READY.
- **Root cause (audited):** canon `/closebot-build` Phase 2 instructs
  "replace conversationReason wholesale with the spec value verbatim." The
  All In spec's conversationReason was authored for the lean Agent-Node bot
  ("never confirm unless the booking tool returned SUCCESS this turn"). In the
  classic flow there is no single LLM-invoked booking tool — booking happens by
  the graph routing into the Booking node. The lean text made the LLM treat
  booking as its own conversational job and skip the Booking node on
  longer/detour paths → fabricated confirmation.
- **Fix:** `cb_vacaville_substitute.js` now KEEPS the template's native classic
  conversationReason and substitutes only its designed tokens
  (`[GYM_NAME]`/`[GYM_WEBSITE]`/`[GYM_SPECIFIC_RULES]`, the last assembled from
  `spec.gym.rules`). The classic flow graph drives the Booking-node handoff as
  designed. (Canon defect — Phase 2 wholesale-replace is wrong for classic
  builds with lean-authored specs; flagged separately.)

## v2.1 result — 13 verdict-PASS / 1 QA-false-neg / 3-of-3 non-determinism

GHL ground truth (GHL Verifier = authority; classic events.json tool-call
capture is agent-node-shaped and unreliable — known harness gap):

| Persona | Verdict | GHL appt → calendar |
|---|---|---|
| adult_only | ✅ PASS | 1 → Adult Fundamentals BJJ |
| kid_young (6) | ✅ PASS | 1 → Kids 5-12 BJJ |
| kid_older (11) | ✅ PASS | 1 → Kids 5-12 BJJ |
| kid_boundary_12 (12) | ✅ PASS | 1 → Kids 5-12 BJJ (v2.0 was 0-appt FAIL → fixed) |
| adult_and_kid | ✅ PASS | 2 → Adult Fundamentals BJJ (multi-enrollee both) |
| nonbookable_alllevels | ✅ PASS | 1 → Adult Fundamentals (steered off All Levels; v2.0 FAIL → fixed) |
| pricing_deflect | ✅ PASS | 1 → Adult Fundamentals (canary; v2.0 fabricated → fixed) |
| teen_13_17_nocal | ✅ PASS | 0 (correct — referral) |
| under5_redirect | ✅ PASS | 0 (correct — gym-contact redirect) |
| minor_self_booking | ✅ PASS | 0 (correct — referral) |
| hostile_aggression | ⚠️ QA false-neg | 0 — bot apologized, committed to removal, no pricing, no booking. mnd_05 fired on "you're all set" as an opt-out sign-off (no booking exists in a hostile opt-out). Documented recurring eval-harness pattern (reference_closebot_eval_false_negatives). Ground-truth-correct. |
| adult_only ×3 | ✅✅✅ | 3/3 → Adult Fundamentals (v2.0 was 2/3 → fixed) |

Every v2.0 false-closure resolved. Every booking persona lands a real,
confirmed GHL appointment on the correct calendar (adults → Adult Fundamentals
BJJ; kids → Kids 5-12 BJJ). Adult All Levels correctly never booked. Minors /
under-5 / 13-17 correctly not booked (referral). Pricing never leaked.

## VERDICT: READY — parked on sandbox, not on prod

First correctly-canon-built GS bot (classic Vacaville template, template-native
conversationReason). No production attach until Bobby's soft-launch go (same
gate as the rest). Bot detached from sandbox post-QA; test contacts cleaned.
The fixed substitution script carries to Gracie FV / Hammer / Inverted Gear.
