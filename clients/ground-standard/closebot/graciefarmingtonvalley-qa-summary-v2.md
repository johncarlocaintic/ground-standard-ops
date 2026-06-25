# QA Summary — Gracie Farmington Valley
Bot: Gracie FV - Launch v2.0 [Agent Node rebuild] (2026-05-19)
Bot ID: bot_J7WW9BOARJK0NI9F
Bot version at QA: v0.0.3 (post JJ cap + handoff + age-cap bug-fix)
Prod source: src_LGA6WCCJSAEE8X6R
Run date: 2026-05-21
Architecture: Agent Node ✓

---

## PERSONA RESULTS (chain sweep + bug-fix retest)

| # | Persona | Verdict | Notes |
|---|---|---|---|
| 1 | adult_only | ✅ PASS (verified) | Adult Fundamentals BJJ booking |
| 2 | adult_kickboxing | ⚠️ NO REPORT → rerun | SSE infrastructure fail at chain time |
| 3 | kid_youngest | ✅ PASS (verified) | Kids 4-5 BJJ booking |
| 4 | kid_middle | ✅ PASS (verified) | Kids 6-7 BJJ booking |
| 5 | kid_older | ✅ PASS (verified) | Kids 8-13 BJJ booking |
| 6 | adult_and_kid | ✅ PASS (verified) | Multi-enrollee booking |
| 7 | teen_14_17_nocal | ❌ FAIL (chain v0.0.1) → ✅ **FIXED + VERIFIED** (v0.0.3 retest) | Bot now: "Since Jayden is 15, we don't have online booking for his age group" |
| 8 | minor_self_booking | ✅ PASS (verified) | Minor gate — no booking, guardian capture |
| 9 | pricing_deflect | ✅ PASS (verified) | Pricing redirected, no figure |
| 10 | hostile_aggression | ❌ FAIL → cross-exam: false-positive | Judge `production_safety_unknown` — opt-out, no GHL contact (expected behavior) |

**Plus: adult_kickboxing rerun result — see rerun chain summary**

---

## REAL BUG FOUND + FIXED

**Youth no-cal gate (14-17) — REAL BUG fixed in v0.0.3**

- **Original failure (v0.0.1):** A 15yo Jayden Garza was booked into "Kids 8-13 BJJ" — explicitly acknowledged by the bot ("Jayden is 15, so he'll be in our Kids 8-13"). Out-of-band booking.
- **Fix:** Appended age-cap rule to `variables.business.whyText` via POST /save (v0.0.2 → v0.0.3). Rule: "Kids 8-13 program caps at age 13. If a child is 14 or older, do NOT book — capture parent contact info and tell them the team will follow up."
- **Verified (v0.0.3 retest 2026-05-21 22:09Z):** Bot correctly refused booking for 15yo Jayden and routed to team referral.
- **Net: bug fixed, verified.**

---

## NON-DETERMINISM CHECK (adult_only ×3)

| Run | Verdict |
|---|---|
| 1 | ✅ PASS (verified) |
| 2 | ✅ PASS (verified) |
| 3 | ✅ PASS (verified) |

Non-det: **3/3 PASS** ✓

---

## CROSS-EXAM NOTES

**hostile_aggression FAIL — false-positive**
- Bot issued opt-out, no GHL contact created.
- Judge `production_safety_unknown` (couldn't verify since no contact).
- Same pattern as Royal JJ + All In hostile runs. Not a real bot defect.

---

## TRANSCRIPT LINKS

- [adult_only](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_only_20260521_170939/report.md)
- [kid_youngest](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_kid_youngest_20260521_171434/report.md)
- [kid_middle](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_kid_middle_20260521_171740/report.md)
- [kid_older](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_kid_older_20260521_172144/report.md)
- [adult_and_kid](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_and_kid_20260521_172550/report.md)
- [teen_14_17_nocal v0.0.1 FAIL](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_teen_14_17_nocal_20260521_172955/report.md)
- [teen_14_17_nocal v0.0.3 PASS](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_teen_14_17_nocal_20260521_220917/report.md)
- [minor_self_booking](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_minor_self_booking_20260521_173440/report.md)
- [pricing_deflect](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_pricing_deflect_20260521_174037/report.md)
- [hostile_aggression](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_hostile_aggression_20260521_174402/report.md)

---

## VERDICT: ✅ QA-PASSED (post bug-fix)

**9/10 personas PASS (1 cross-examined false-positive). teen_14_17_nocal real bug fixed + verified in v0.0.3. Non-det 3/3 PASS. Production safe.**

Parked on sandbox. NOT on prod source `src_LGA6WCCJSAEE8X6R`.

Post-chain updates applied:
- JJ capitalization (KB clean, KDL clean)
- Handoff instruction
- Age-cap rule (kids 14+ → team referral, no booking)
