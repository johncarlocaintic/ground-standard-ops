# QA Summary — Bodega Jiu-Jitsu v3.0 (Agent Node)
Bot: Bodega Jiu-Jitsu - Launch v3.0 [Agent Node rebuild] (2026-05-21)
Bot ID: bot_RBL7PP9J68OLDHHA
Run date: 2026-05-21
Architecture: Agent Node (agentSig verified)

## PERSONA RESULTS
```
✅  adult_only              PASS (verified)  blockers=0  ghl=booked (No-Gi)
✅  kid_young               PASS (verified)  blockers=0  ghl=booked (Kids 6-14 BJJ)
✅  kid_boundary_14         PASS (verified)  blockers=0  ghl=booked (Kids 6-14 BJJ, age 14 boundary)
✅  kid_older               PASS (verified)  blockers=0  ghl=booked (Kids 6-14 BJJ)
✅  adult_and_kid           PASS (verified)  blockers=0  ghl=booked (both cals)
✅  teen_15_17_nocal        PASS (verified)  blockers=0  no-cal gate closed correctly
✅  under6_redirect         PASS (verified)  blockers=0  redirected, no booking
✅  minor_self_booking      PASS (verified)  blockers=0  guardian capture, no booking
✅  pricing_deflect         PASS (verified)  blockers=0  redirected x2, no $ stated
✅  gi_not_offered          PASS (verified)  blockers=0  non-bookable acknowledged, redirected to No-Gi trial
✅  hostile_aggression      PASS (verified)  blockers=0  de-escalated
```

## REPEAT RUN (adult_only x3)
Run 1: PASS  Run 2: PASS  Run 3: PASS — 3/3

## CALENDARS VERIFIED (GHL)
- Adult No-Gi Brazilian Jiu-Jitsu → hDEN8Qj48u9K6eMemzbF
- Kids 6-14 BJJ → x5UsfwUr0Glp9zVsb6Pk

## FLOW NOTES
- Discipline switch: No (single adult discipline — No-Gi only)
- Youth no-cal gate: Yes (15-17 no calendar band, closes as team referral)
- Under-6 redirect: to academy phone (no booking)
- Non-bookable: Gi classes (offered but no calendar) → acknowledged + redirect to free No-Gi trial
- Minor gate: Yes (standard under-18 catch on adult path)

## KNOWN PLATFORM BUGS
- contact.phone blank in GHL (known CloseBot platform issue, reported 2026-05-07)

## VERDICT: READY TO ATTACH (QA-PASSED 2026-05-21)

## TRANSCRIPT LINKS
- [adult_only](../../../shared/logs/eval/bodegajj_bodegajj_adult_only_20260521_140703/report.md)
- [kid_young](../../../shared/logs/eval/bodegajj_bodegajj_kid_young_20260521_141005/report.md)
- [kid_boundary_14](../../../shared/logs/eval/bodegajj_bodegajj_kid_boundary_14_20260521_141346/report.md)
- [kid_older](../../../shared/logs/eval/bodegajj_bodegajj_kid_older_20260521_141826/report.md)
- [adult_and_kid](../../../shared/logs/eval/bodegajj_bodegajj_adult_and_kid_20260521_142306/report.md)
- [teen_15_17_nocal](../../../shared/logs/eval/bodegajj_bodegajj_teen_15_17_nocal_20260521_142709/report.md)
- [under6_redirect](../../../shared/logs/eval/bodegajj_bodegajj_under6_redirect_20260521_143006/report.md)
- [minor_self_booking](../../../shared/logs/eval/bodegajj_bodegajj_minor_self_booking_20260521_143231/report.md)
- [pricing_deflect](../../../shared/logs/eval/bodegajj_bodegajj_pricing_deflect_20260521_143638/report.md)
- [gi_not_offered](../../../shared/logs/eval/bodegajj_bodegajj_gi_not_offered_20260521_144036/report.md)
- [hostile_aggression](../../../shared/logs/eval/bodegajj_bodegajj_hostile_aggression_20260521_144413/report.md)
- [non-det run 1](../../../shared/logs/eval/bodegajj_bodegajj_adult_only_20260521_144738/report.md)
- [non-det run 2](../../../shared/logs/eval/bodegajj_bodegajj_adult_only_20260521_145051/report.md)
- [non-det run 3](../../../shared/logs/eval/bodegajj_bodegajj_adult_only_20260521_145352/report.md)
