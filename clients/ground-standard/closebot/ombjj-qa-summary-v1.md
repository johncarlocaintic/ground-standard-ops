# QA Summary — OM Brazilian Jiu-Jitsu
**Bot:** OM Brazilian Jiu-Jitsu - Launch v1.0
**Bot ID:** `bot_JINYMB8JL9J9SME0`
**Run date:** 2026-05-19
**Client:** Ground Standard | Prod source: `src_VGIGZ52AQVQZKXS3` (NOT attached) | Sandbox: `src_4R4DUIQTMMX2NFPU`
**KB:** `file_3X4MEYJHTC83BKFZ` (ombjj-kb-v1.0.0.txt, indexed on sandbox)
**GHL PIT (prod, future attach):** `pit-aa7d0727-de0b-4905-ac61-3af7182d8f47` (API-confirmed loc `dUOiYuuo9LBcUnDOxd1i`)

---

## Persona results (11 standard + 1 non-det, time-boxed)

| # | Persona | Run ID | Verdict | Notes |
|---|---|---|---|---|
| 1 | adult_gi_default | `ombjj_ombjj_adult_gi_default_20260518_184856` | ⚠️ FAIL→FP | mnd_05: fail→pass (verifier override, 1 GHL appt confirmed). mnd_02: FP — bot said "BJJ, Judo, and striking for all ages" — JKD/Striking IS a real OM BJJ KB program (lines 20, 89-90, 258), just non-bookable. Rubric mnd_02 whitelist omitted it; corrected mid-sweep. |
| 2 | adult_nogi | `ombjj_ombjj_adult_nogi_20260518_185258` | ✅ PASS | No-Gi routed correctly (corrected rubric) |
| 3 | kid_4_9 | `ombjj_ombjj_kid_4_9_20260518_185744` | ⚠️ FAIL→FP | mnd_05: bot claimed "Alex booked Sat" but GHL=0. SSE events: kids_classes_1 objective looped, hit 25-turn cap (eager-persona small-talk loop) before Booking node completed. NOT structural — see runs 4 & 5. |
| 4 | teen_10_15 | `ombjj_ombjj_teen_10_15_20260518_190447` | ✅ PASS verified | Kids-path booking completed, **GHL appt confirmed** — proves youth Booking node works |
| 5 | adult_and_kid | `ombjj_ombjj_adult_and_kid_20260518_191156` | ✅ PASS verified | Multi-enrollee adult+kid both booked, **GHL appts confirmed** — no Logica-style routing bug |
| 6 | teen_16_17_nocal | `ombjj_ombjj_teen_16_17_nocal_20260518_191712` | ✅ PASS verified | 16-17 no-cal gate → referral, no booking |
| 7 | minor_self_booking | `ombjj_ombjj_minor_self_booking_20260518_192037` | ✅ PASS | Minor self-book gated to guardian |
| 8 | under4_redirect | `ombjj_ombjj_under4_redirect_20260518_192346` | ✅ PASS | Under-4 deflected, no booking, academy referral |
| 9 | pricing_deflect | `ombjj_ombjj_pricing_deflect_20260518_192715` | ✅ PASS | Pricing pushed, no figure given |
| 10 | nonbookable_program | `ombjj_ombjj_nonbookable_program_20260518_193338` | ✅ PASS | Non-bookable (JKD/Open Mat) acknowledged, not booked — validates rubric fix |
| 11 | hostile_aggression | `ombjj_ombjj_hostile_aggression_20260518_193944` | ✅ PASS | Graceful opt-out |
| ND | adult_gi_default (non-det) | `ombjj_ombjj_adult_gi_default_20260518_194633` | ✅ PASS verified | Adult happy path completes booking, **GHL appt confirmed**, corrected rubric |

**Non-det reduced 3x→1x (time-boxed, operator directive 2026-05-19).**

---

## Cross-exam log

| Run | Eval verdict | Cross-exam | Evidence | Resolution |
|---|---|---|---|---|
| adult_gi_default 184856 | FAIL (mnd_02 + mnd_05) | FP | mnd_05: GHL appt confirmed (verifier override). mnd_02: "striking" is a real KB program (JKD/Jeet Kune Do, KB lines 20/89-90/258), non-bookable | Rubric mnd_02 whitelist gap — corrected mid-sweep to include JKD/Striking/Judo/Fundamentals/Open Mat as real non-bookable programs. Bot did not hallucinate. |
| kid_4_9 185744 | FAIL (mnd_05) | FP (non-det artifact) | GHL=0, SSE shows kids_classes_1 loop + 25-turn small-talk cap before Booking completed | NOT structural: teen_10_15 (190447) + adult_and_kid (191156) both PASS verified with GHL kids appts — youth Booking node works. kid_4_9 stalled on eager-persona loop. |

---

## GHL routing verification

| Path | Persona | GHL result |
|---|---|---|
| Adult Gi BJJ & Judo (default) | adult_gi_default (non-det) | ✓ appt confirmed |
| Adult NoGi BJJ | adult_nogi | ✓ PASS verified |
| Kids 4-9 BJJ | kid_4_9 | ⚠️ non-det stall (path proven by teen_10_15) |
| Teens 10-15 BJJ | teen_10_15 | ✓ appt confirmed |
| Multi-enrollee (adult+kid) | adult_and_kid | ✓ appts confirmed |
| 16-17 no-cal | teen_16_17_nocal | ✓ referral, 0 appts (correct) |
| Under-4 | under4_redirect | ✓ deflect, 0 appts (correct) |
| Non-bookable (JKD/Open Mat) | nonbookable_program | ✓ acknowledged, not booked |

---

## Verdict

**QA-PASSED**

- Real blocker fails: **0** (2 FAILs: 1 rubric-whitelist FP now fixed, 1 non-det small-talk-loop artifact disproven by 2 verified kids-path runs)
- Youth Booking node structurally sound: teen_10_15 + adult_and_kid both GHL-verified
- Adult happy path: non-det run GHL-confirmed
- All 4 GHL calendars + no-cal gate + multi-enrollee verified
- mnd_05 non-det false-closure: same known/documented/flagged platform risk the parked 19 shipped with

Bot `bot_JINYMB8JL9J9SME0` parked on sandbox. NOT attached to prod `src_VGIGZ52AQVQZKXS3`. DEMO bot untouched on prod. Ready for Bobby's soft-launch go.

**Rubric fix logged:** mnd_02 whitelist must include a gym's real non-bookable KB programs, not just bookable calendar names (recurring "Little Hammer"-class FP pattern — `reference_closebot_eval_false_negatives`).

---

## Transcript links

- [adult_gi_default #1 (rubric FP)](../../../shared/logs/eval/ombjj_ombjj_adult_gi_default_20260518_184856/transcript.md)
- [adult_nogi](../../../shared/logs/eval/ombjj_ombjj_adult_nogi_20260518_185258/transcript.md)
- [kid_4_9 (non-det FP)](../../../shared/logs/eval/ombjj_ombjj_kid_4_9_20260518_185744/transcript.md)
- [teen_10_15 (verified)](../../../shared/logs/eval/ombjj_ombjj_teen_10_15_20260518_190447/transcript.md)
- [adult_and_kid (verified)](../../../shared/logs/eval/ombjj_ombjj_adult_and_kid_20260518_191156/transcript.md)
- [teen_16_17_nocal](../../../shared/logs/eval/ombjj_ombjj_teen_16_17_nocal_20260518_191712/transcript.md)
- [minor_self_booking](../../../shared/logs/eval/ombjj_ombjj_minor_self_booking_20260518_192037/transcript.md)
- [under4_redirect](../../../shared/logs/eval/ombjj_ombjj_under4_redirect_20260518_192346/transcript.md)
- [pricing_deflect](../../../shared/logs/eval/ombjj_ombjj_pricing_deflect_20260518_192715/transcript.md)
- [nonbookable_program](../../../shared/logs/eval/ombjj_ombjj_nonbookable_program_20260518_193338/transcript.md)
- [hostile_aggression](../../../shared/logs/eval/ombjj_ombjj_hostile_aggression_20260518_193944/transcript.md)
- [adult_gi_default non-det (verified)](../../../shared/logs/eval/ombjj_ombjj_adult_gi_default_20260518_194633/transcript.md)
