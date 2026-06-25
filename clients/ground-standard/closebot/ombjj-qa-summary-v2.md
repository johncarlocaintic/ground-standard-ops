# QA Summary — OM Brazilian Jiu-Jitsu and Judo
**Architecture:** Agent Node v2.0 (scaffold-and-fill from agentnode-base-template)
**Bot:** OM Brazilian Jiu-Jitsu and Judo - Launch v2.0 [Agent Node rebuild] (2026-05-20)
**Bot ID:** bot_WKX9WYAUBNGC2RLO
**Run date:** 2026-05-20
**Sweep:** sweep_ombjj.sh (via chain_gyms_3_7_resume.sh) against sandbox src_4R4DUIQTMMX2NFPU

---

## PERSONA RESULTS

| # | Persona | Verdict | Blockers | GHL Appts | Notes |
|---|---------|---------|----------|-----------|-------|
| 1 | adult_gi_default | PASS | 0 | 1 | Adult BJJ & Judo booked (default path) |
| 2 | adult_nogi | PASS | 0 | 1 | Adult No-Gi BJJ booked on explicit request |
| 3 | kid_4_9 | PASS | 0 | 1 | Kids 4-9 BJJ booked with guardian |
| 4 | teen_10_15 | PASS | 0 | 1 | Teens 10-15 BJJ booked with guardian |
| 5 | adult_and_kid | PASS | 0 | 2 | Multi-enrollee: adult BJJ & Judo + Kids 4-9 BJJ both booked |
| 6 | teen_16_17_nocal | PASS | 0 | 0 | 16-17 correctly gated — team follow-up, no booking |
| 7 | minor_self_booking | PASS | 0 | 0 | Minor self-book blocked — no booking |
| 8 | under4_redirect | PASS | 0 | 0 | Under-4 correctly referred to academy phone |
| 9 | pricing_deflect | PASS | 0 | 1 | Pricing redirect firm, no figure given |
| 10 | nonbookable_program | PASS | 0 | 0 | JKD/Striking/private lesson acknowledged + redirected |
| 11 | hostile_aggression | PASS | 0 | 0 | Aggression path handled cleanly |

**NON-DETERMINISM: adult_gi_default x1**
| Run | Verdict |
|-----|---------|
| 1 | PASS |

---

## FALSE NEGATIVE CROSS-EXAMINATIONS

None. All 11 personas passed on first run with no cross-examination required.

---

## GHL ROUTING VERIFICATION

| Program | Sandbox Calendar ID | Appointment Title | Verified |
|---------|---------------------|-------------------|---------|
| Adult Brazilian Jiu-Jitsu & Judo | N75hepn0XGW7kKPXrLE4 | Free Trial Class - [Name] | ✓ |
| Adult No-Gi BJJ | X1mpa8jay7LuUnXMGbck | Adult NoGi BJJ Trial - [Name] | ✓ |
| Kids 4-9 BJJ | WyckOmLIHZgbP62okkov | [Kid Name] - Free Trial Class | ✓ |
| Teens 10-15 BJJ | EthQXSsKJVLD5A84psiD | [Name] - Trial Class | ✓ |

Multi-enrollee (adult_and_kid): both N75hepn0XGW7kKPXrLE4 (adult) and WyckOmLIHZgbP62okkov (Kids 4-9) confirmed in GHL.

---

## VERDICT: QA-PASSED

**Real blockers:** 0
**False negatives:** 0
**Non-det (adult_gi_default):** 1/1 PASS
**Booking personas verified:** All 5 booking personas GHL-confirmed (appointments exist in sub-account)
**Policy gates verified:** 16-17 no-cal gate PASS, minor self-booking gate PASS, under-4 redirect PASS
**Discipline routing:** Both adult disciplines verified (BJJ & Judo default, No-Gi explicit)
**Multi-enrollee:** PASS (2 GHL appointments for adult_and_kid persona)

**Status:** Parked on sandbox src_4R4DUIQTMMX2NFPU. NOT attached to production source src_VGIGZ52AQVQZKXS3.

---

## BOBBY FLAGS (relay when soft-launch auth requested)

From spec `postQaCheckpointFlags`:
- Confirm 2 adult disciplines: Adult BJJ & Judo (default) / Adult No-Gi BJJ (explicit request only)
- Confirm youth bands: Kids 4-9 BJJ / Teens 10-15 BJJ
- Confirm 16-17 handled as minor/team-follow-up (no online booking)
- Confirm under-4 phone referral (number in KB from academy)
- Verify ombjj.org website accuracy (unreachable at build time — KB built from ClickUp + legacy KB)

---

## TRANSCRIPT LINKS

| Persona | Run ID | Report |
|---------|--------|--------|
| adult_gi_default | ombjj_ombjj_adult_gi_default_20260519_191511 | [report.md](../../../shared/logs/eval/ombjj_ombjj_adult_gi_default_20260519_191511/report.md) |
| adult_nogi | ombjj_ombjj_adult_nogi_20260519_191910 | [report.md](../../../shared/logs/eval/ombjj_ombjj_adult_nogi_20260519_191910/report.md) |
| kid_4_9 | ombjj_ombjj_kid_4_9_20260519_192219 | [report.md](../../../shared/logs/eval/ombjj_ombjj_kid_4_9_20260519_192219/report.md) |
| teen_10_15 | ombjj_ombjj_teen_10_15_20260519_192548 | [report.md](../../../shared/logs/eval/ombjj_ombjj_teen_10_15_20260519_192548/report.md) |
| adult_and_kid | ombjj_ombjj_adult_and_kid_20260519_192953 | [report.md](../../../shared/logs/eval/ombjj_ombjj_adult_and_kid_20260519_192953/report.md) |
| teen_16_17_nocal | ombjj_ombjj_teen_16_17_nocal_20260519_193503 | [report.md](../../../shared/logs/eval/ombjj_ombjj_teen_16_17_nocal_20260519_193503/report.md) |
| minor_self_booking | ombjj_ombjj_minor_self_booking_20260519_193839 | [report.md](../../../shared/logs/eval/ombjj_ombjj_minor_self_booking_20260519_193839/report.md) |
| under4_redirect | ombjj_ombjj_under4_redirect_20260519_194209 | [report.md](../../../shared/logs/eval/ombjj_ombjj_under4_redirect_20260519_194209/report.md) |
| pricing_deflect | ombjj_ombjj_pricing_deflect_20260519_194415 | [report.md](../../../shared/logs/eval/ombjj_ombjj_pricing_deflect_20260519_194415/report.md) |
| nonbookable_program | ombjj_ombjj_nonbookable_program_20260519_194910 | [report.md](../../../shared/logs/eval/ombjj_ombjj_nonbookable_program_20260519_194910/report.md) |
| hostile_aggression | ombjj_ombjj_hostile_aggression_20260519_195344 | [report.md](../../../shared/logs/eval/ombjj_ombjj_hostile_aggression_20260519_195344/report.md) |
| adult_gi_default (non-det) | ombjj_ombjj_adult_gi_default_20260519_195621 | [report.md](../../../shared/logs/eval/ombjj_ombjj_adult_gi_default_20260519_195621/report.md) |
