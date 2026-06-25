# QA Summary — Hamptons Jiu-Jitsu South
Bot: Hamptons JJS - Launch v2.0 [Agent Node rebuild] (2026-05-19)
Bot ID: bot_WWB97FEM611TC5SY
Bot version at QA: v0.0.3 (post JJ cap + handoff fix to n10_intro)
Prod source: src_5HSEXPZLA5DJYAMG
Run date: 2026-05-21
Architecture: Agent Node ✓

---

## PERSONA RESULTS (chain sweep)

| # | Persona | Verdict | Notes |
|---|---|---|---|
| 1 | adult_only | ✅ PASS (verified) | Adult BJJ booking |
| 2 | adult_muay_thai | ✅ PASS (verified) | Discipline switch routed correctly to Muay Thai |
| 3 | kid_only_young | ✅ PASS (verified) | Rerun via rerun_chain_resume.sh — Kids BJJ booking |
| 4 | kid_older | ✅ PASS (verified) | Rerun — Kids older band booking |
| 5 | adult_and_kid | ✅ PASS (verified) | Rerun — Multi-enrollee booking |
| 6 | minor_self_booking | ✅ PASS (verified) | Rerun — Minor gate, no booking |
| 7 | nonbookable_program | ✅ PASS (verified) | Non-bookable acknowledged |
| 8 | pricing_deflect | ✅ PASS (verified) | Pricing redirected |

**All 8 personas confirmed PASS. 4 NO_REPORTs from a single ~5-minute API hiccup were rerun and all passed.**

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

**4 NO_REPORTs were infrastructure failures, not bot bugs:**
- All 4 runs hit ~1 minute each, then orchestrator exited without writing a report
- Pattern matches the known mimicBind/SSE 504 transient failure
- The 4 personas after the cluster + the 3 non-det adult_only PASSed without issue
- Tested again in rerun chain for definitive verdict

---

## TRANSCRIPT LINKS (chain run)

- [adult_only](shared/logs/eval/hamptonsjj_hamptonsjj_adult_only_20260521_193007/report.md)
- [adult_muay_thai](shared/logs/eval/hamptonsjj_hamptonsjj_adult_muay_thai_20260521_193337/report.md)
- [nonbookable_program](shared/logs/eval/hamptonsjj_hamptonsjj_nonbookable_program_20260521_194333/report.md)
- [pricing_deflect](shared/logs/eval/hamptonsjj_hamptonsjj_pricing_deflect_20260521_194811/report.md)

Rerun transcripts: see rerun chain summary.

---

## RERUN TRANSCRIPT LINKS

- [kid_only_young rerun](shared/logs/eval/hamptonsjj_hamptonsjj_kid_only_young_20260521_223228/report.md)
- [kid_older rerun](shared/logs/eval/hamptonsjj_hamptonsjj_kid_older_20260521_223629/report.md)
- [adult_and_kid rerun](shared/logs/eval/hamptonsjj_hamptonsjj_adult_and_kid_20260521_224053/report.md)
- [minor_self_booking rerun](shared/logs/eval/hamptonsjj_hamptonsjj_minor_self_booking_20260521_224552/report.md)

---

## VERDICT: ✅ QA-PASSED

**8/8 personas PASS (4 NO_REPORTs rerun and confirmed). Non-det 3/3 PASS. No real bot defects. Production safe.**

Parked on sandbox. NOT on prod source `src_5HSEXPZLA5DJYAMG`.

Post-chain updates applied:
- JJ capitalization (KB: 8 variants fixed)
- Handoff instruction
