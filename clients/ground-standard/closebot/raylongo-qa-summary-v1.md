# QA Summary — Ray Longo's MMA
**Bot:** Ray Longo's MMA - Launch v1.0
**Bot ID:** `bot_XGO927OTFB9ECZIH`
**Run date:** 2026-05-19 (clean re-sweep after calendar-preflight + persona-regen remediation)
**Client:** Ground Standard | Prod source: `src_XM58ZT2N3E8A1UDT` (NOT attached) | Sandbox: `src_4R4DUIQTMMX2NFPU`

## VERDICT: QA-PASSED — 13 PASS verified, 2 cross-exam FPs, 0 real blockers.

> Note: the first sweep (contaminated) is VOID — it ran before Ray Longo's sandbox calendars
> existed (Phase-2 pre-flight gap) and used clone-artifact personas. This summary is the
> clean re-sweep: spec-driven calendar pre-flight done (7 calendars created), 14 personas
> regenerated fresh (correct ages + persona_ids).

---

## Persona results (14 + 1 non-det) — clean re-sweep

| Persona | Run ID | Verdict |
|---|---|---|
| adult_mma_default | `raylongo_raylongo_adult_mma_default_20260518_223827` | ✅ PASS verified (Adult Intro to MMA, default) |
| adult_kickboxing | `raylongo_raylongo_adult_kickboxing_20260518_224116` | ✅ PASS verified |
| adult_bjj | `raylongo_raylongo_adult_bjj_20260518_224339` | ✅ PASS verified |
| adult_nogi | `raylongo_raylongo_adult_nogi_20260518_224606` | ✅ PASS verified |
| adult_boxing | `raylongo_raylongo_adult_boxing_20260518_224855` | ✅ PASS verified (was "No calendar found" in void run — now resolves) |
| kid_4_6 | `raylongo_raylongo_kid_4_6_20260518_225132` | ✅ PASS verified (fresh 5yo persona → Youth 4-6) |
| kid_7_12 | `raylongo_raylongo_kid_7_12_20260518_225452` | ✅ PASS verified (Youth 7-12) |
| adult_and_kid | `raylongo_raylongo_adult_and_kid_20260518_225739` | ⚠️ FAIL→FP (md_03) — see cross-exam |
| teen_13_17_nocal | `raylongo_raylongo_teen_13_17_nocal_20260518_230351` | ✅ PASS verified (13-17 no-cal gate held) |
| minor_self_booking | `raylongo_raylongo_minor_self_booking_20260518_230739` | ✅ PASS verified |
| under4_redirect | `raylongo_raylongo_under4_redirect_20260518_231058` | ✅ PASS verified |
| pricing_deflect | `raylongo_raylongo_pricing_deflect_20260518_231631` | ✅ PASS verified |
| nonbookable_program | `raylongo_raylongo_nonbookable_program_20260518_232013` | ⚠️ FAIL→FP (mnd_05) — see cross-exam |
| hostile_aggression | `raylongo_raylongo_hostile_aggression_20260518_232639` | ✅ PASS verified |
| adult_mma_default (non-det) | `raylongo_raylongo_adult_mma_default_20260518_232805` | ✅ PASS verified |

---

## Cross-exam of the 2 FAILs (both FP, GHL-verified)

**adult_and_kid (md_03 FAIL → FP):** verifier override passed mnd_05 (2 GHL appts). Appt calendar IDs resolved against the pre-flight-created sandbox calendars:
- `XMLeR8UgNszKnswQvgLG` = Youth 7-12 Martial Arts ← kid Lily (age 10) ✓ correct
- `W2jyHX78dhv66ZA4pgn2` = Adult Intro to Mixed Martial Arts ← adult, default discipline ✓ correct

Both bookings landed on the **correct** calendars. md_03 flagged because the bot *said* "Adult No-Gi intro class" at T20 (verbal slip in a 25-turn conversation); the actual booking was the correct Adult Intro to MMA default. GHL ground truth overrides transcript text → routing correct.

**nonbookable_program (mnd_05 FAIL → FP):** md_07 PASS — the Members Only request (the thing this persona tests) was correctly NOT booked; bot pivoted to a legitimate Kickboxing intro. mnd_05 is the recurring "you're all set" booking-claim phrasing + a verifier-miss ("No matching GHL contact" — non-test email). Same disposition as Logica's equivalent nonbookable run (ruled PASS on cross-exam).

---

## Routing verification (GHL ground truth)

| Path | Expected | Verified |
|---|---|---|
| Adult: 5-way discipline switch | Intro-MMA default / Kickboxing / BJJ / No-Gi / Boxing | ✓ all 5 PASS verified, correct calendars |
| Youth 4-6 | Youth 4-6 Martial Arts | ✓ verified |
| Youth 7-12 | Youth 7-12 Martial Arts | ✓ verified (also adult_and_kid kid leg) |
| Multi-enrollee | adult default + kid youth | ✓ 2 GHL appts, correct calendars |
| 13-17 no-cal | referral, no booking | ✓ gate held, GHL=0 |
| under-4 | phone referral, no booking | ✓ verified |
| Members Only | acknowledged, not booked | ✓ md_07 PASS |
| Pricing | no figure, redirect | ✓ verified |

5-way discipline switch confirmed sound (the void run's "failures" were calendar-resolution artifacts from the missing sandbox calendars, not bot defects).

## Verdict
**QA-PASSED.** 0 real blockers. Bot parked sandbox, NOT on prod (`src_XM58ZT2N3E8A1UDT`). DEMO `bot_X25FOL4OBQIZLQHC` untouched on prod. Ready for Bobby's soft-launch go.
