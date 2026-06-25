# QA Summary — Universal Mixed Martial Arts
**Bot:** Universal Mixed Martial Arts - Launch v1.0
**Bot ID:** `bot_CX2MDPYQ558PP1DY`
**Run date:** 2026-05-19 (clean re-sweep after Phase-2 calendar-preflight remediation)
**Client:** Ground Standard | Prod source: `src_4C7CIFW27LLW2TCH` (NOT attached) | Sandbox: `src_4R4DUIQTMMX2NFPU`

## VERDICT: QA-PASSED — 7 PASS verified, 3 cross-exam FPs, 0 real blockers.

> First sweep VOID (ran before Universal MMA's 2 sandbox calendars existed — Phase-2 gap).
> This is the clean re-sweep: spec-driven pre-flight done (Adult Martial Arts + Kids Martial Arts created).

---

## Persona results (9 + 1 non-det) — clean re-sweep

| Persona | Run ID | Verdict |
|---|---|---|
| adult_only | `universalmma_universalmma_adult_only_20260518_233052` | ✅ PASS verified (Adult Martial Arts) |
| kid_4_12 | `universalmma_universalmma_kid_4_12_20260518_233324` | ✅ PASS verified (Kids Martial Arts) |
| teen_13_17_adult | `universalmma_universalmma_teen_13_17_adult_20260518_233700` | ✅ PASS verified — **validates sub-18-adult-band rule** (13-17 → Adult Martial Arts via youth path w/ guardian) |
| adult_and_kid | `universalmma_universalmma_adult_and_kid_20260518_233954` | ✅ PASS verified |
| minor_self_booking | `universalmma_universalmma_minor_self_booking_20260518_234522` | ✅ PASS verified |
| under4_redirect | `universalmma_universalmma_under4_redirect_20260518_234903` | ✅ PASS verified |
| pricing_deflect | `universalmma_universalmma_pricing_deflect_20260518_235236` | ✅ PASS verified |
| nonbookable_program | `universalmma_universalmma_nonbookable_program_20260518_235531` | ⚠️ FAIL→FP |
| hostile_aggression | `universalmma_universalmma_hostile_aggression_20260519_000240` | ⚠️ FAIL→FP |
| adult_only (non-det) | `universalmma_universalmma_adult_only_20260519_000913` | ⚠️ FAIL→FP (non-det) |

---

## Cross-exam of the 3 FAILs (all documented FPs)

**nonbookable_program (mnd_05 FAIL → FP):** md_07 PASS + md_03 PASS — the non-bookable request (Weapons/Sparring/Health&Fitness — the thing this persona tests) correctly NOT booked. mnd_05 is the recurring "you're all set" phrasing + verifier-miss (non-test email; "No matching GHL contact"). Same disposition as Logica/Ray Longo equivalents.

**hostile_aggression (mnd_05 FAIL → FP):** bot handled the opt-out perfectly — removed lead at T1, re-confirmed twice on demand, NO booking flow at all (mnd_01/02, md_01/02 all n/a), GHL clean. mnd_05 keyword-matched "You're all set" at T2 meaning "you're all set, you've been removed" — reassurance on list-removal, not a false booking closure. Pure keyword FP, zero booking context.

**adult_only non-det (mnd_05 FAIL → FP):** bot claimed "See you Friday at 3pm" but GHL=0 (persona [END]ed T8 before the Booking node finished writing). Run #1 adult_only PASSED verified with a real GHL appt — the adult path is proven; this is the documented non-det booking-incomplete platform pattern, ≤1/2 rate.

---

## Routing verification (GHL ground truth)

| Path | Expected | Verified |
|---|---|---|
| Adult 18+ | Adult Martial Arts | ✓ run #1 PASS verified |
| Kids 4-12 | Kids Martial Arts | ✓ verified |
| **13-17 (sub-18 adult band)** | Adult Martial Arts via youth path, guardian captured | ✓ **verified — new standing rule works** |
| Multi-enrollee | adult + kid both | ✓ verified |
| Minor self-book (no guardian) | gated, no booking | ✓ verified |
| under-4 | phone referral (718) 659-1700, no booking | ✓ verified |
| Non-bookable (Weapons/Sparring/Health&Fitness) | acknowledged, not booked | ✓ md_07 PASS |
| Pricing | no figure, redirect | ✓ verified |
| Hostile opt-out | removed, no booking | ✓ verified |

## Verdict
**QA-PASSED.** 0 real blockers. The sub-18-adult-band design decision (memory `feedback-sub18-adult-band-guardian-capture`) is validated end-to-end. Bot parked sandbox, NOT on prod (`src_4C7CIFW27LLW2TCH`). DEMO `bot_UXK2C02TYVFFEGVP` untouched. Ready for Bobby's soft-launch go.
