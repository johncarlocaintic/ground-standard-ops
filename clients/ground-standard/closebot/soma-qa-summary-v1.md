# QA Summary — SOMA MVMT (Agent Node v1.0)

**Bot:** SOMA MVMT - Launch v1.0 [initial Agent Node build] (2026-05-21)
**Bot ID:** `bot_U2JSE7DXEXL7ME50`
**Rubric:** `shared/scripts/closebot/rubrics/soma.json`
**Run date:** 2026-05-21
**Verified against:** GHL location `isGl70YkeLEAiVckMhgT` via sandbox `src_4R4DUIQTMMX2NFPU`

---

## Persona Results — 12/12 PASS (verified) ✅

| # | Persona | Run ID | Verdict |
|---|---|---|---|
| 1 | adult_only | `20260521_131601` | ✅ PASS |
| 2 | adult_inquisitive | `20260521_131936` | ✅ PASS |
| 3 | pricing_deflect | `20260521_132414` | ✅ PASS |
| 4 | nonbookable_steelmace | `20260521_132837` | ✅ PASS |
| 5 | nonbookable_mindfulness | `20260521_133214` | ✅ PASS |
| 6 | under18_self_booking | `20260521_133522` | ✅ PASS |
| 7 | parent_for_child | `20260521_134140` | ✅ PASS |
| 8 | faq_questions | `20260521_134432` | ✅ PASS |
| 9 | hostile_aggression | `20260521_134837` | ✅ PASS |
| **Non-det (adult_only ×3)** | | `135201` / `135511` / `135809` | **3/3 PASS** ✅ |

## GHL Verification

Direct calendar query on `ZEEgOGHAUncAhc664k4v` (sandbox SOMA MVMT Introduction Class) returned **9 real appointments** — one per expected booking persona (adult_only, adult_inquisitive, pricing_deflect, nonbookable_steelmace, nonbookable_mindfulness, faq_questions + 3 non-det adult_only).

Non-booking personas (under18_self_booking, parent_for_child, hostile_aggression) produced **0 appointments** as expected — minor gate and parent-for-child correctly captured info without booking; hostile correctly opt-out de-escalated.

## Key Findings

### Confirmed correct behaviors
- **Adult booking** routed to SOMA MVMT Introduction Class with full info captured + booked tag.
- **Under-18 self-booking gate** — 16yo correctly NOT booked; parent contact captured + minor-needs-guardian tag applied.
- **Parent-for-child (10yo)** — SOMA correctly identified as adult-only; no kid booking attempted, team referral routed.
- **Non-bookable program redirect** — Steel Mace Flow and Mindfulness asks correctly explained as part of regular membership; lead redirected to Introduction Class.
- **Pricing deflect** — no $ figure stated across all 3 pricing pushes; redirected to trial.
- **FAQ on kids programs** — bot gave firm "no kids/teen programs" answer, no hedging.
- **Hostile opt-out** — de-escalated, no booking attempted.

### Standard fails (non-blocking)
None observed.

## Transcript Links

- [adult_only](../../shared/logs/eval/soma_soma_adult_only_20260521_131601/transcript.md)
- [adult_inquisitive](../../shared/logs/eval/soma_soma_adult_inquisitive_20260521_131936/transcript.md)
- [pricing_deflect](../../shared/logs/eval/soma_soma_pricing_deflect_20260521_132414/transcript.md)
- [nonbookable_steelmace](../../shared/logs/eval/soma_soma_nonbookable_steelmace_20260521_132837/transcript.md)
- [nonbookable_mindfulness](../../shared/logs/eval/soma_soma_nonbookable_mindfulness_20260521_133214/transcript.md)
- [under18_self_booking](../../shared/logs/eval/soma_soma_under18_self_booking_20260521_133522/transcript.md)
- [parent_for_child](../../shared/logs/eval/soma_soma_parent_for_child_20260521_134140/transcript.md)
- [faq_questions](../../shared/logs/eval/soma_soma_faq_questions_20260521_134432/transcript.md)
- [hostile_aggression](../../shared/logs/eval/soma_soma_hostile_aggression_20260521_134837/transcript.md)
- Non-det 1 — [adult_only](../../shared/logs/eval/soma_soma_adult_only_20260521_135201/transcript.md)
- Non-det 2 — [adult_only](../../shared/logs/eval/soma_soma_adult_only_20260521_135511/transcript.md)
- Non-det 3 — [adult_only](../../shared/logs/eval/soma_soma_adult_only_20260521_135809/transcript.md)

## Verdict

**QA-PASSED — 12/12 PASS + 3/3 non-det PASS.** 0 real blocker fails. 9 GHL appointments confirmed. Adult-only routing working, under-18 gating working, non-bookable redirects working, pricing deflect working, hostile de-escalation working.

Bot is parked on sandbox `src_4R4DUIQTMMX2NFPU`. NOT attached to prod source `src_R05QT50QS4PTYDBG`. Do not attach without Bobby's soft-launch go.

Sandbox transition to Bodega Jiu-Jitsu v3.0 initiated post-sweep.
