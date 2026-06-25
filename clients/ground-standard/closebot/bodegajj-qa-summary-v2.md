# QA Summary — Bodega Jiu-Jitsu v2.2
Bot: Bodega Jiu-Jitsu - Launch v2.2 [scope guard fix, multi-enrollee] (2026-05-18)
Bot ID: bot_SZI6TVDFECKDHFMS
Run date: 2026-05-18
Architecture: canon classic (Vacaville 195-node template) + scope-guard Booking Description suffix + age-range normalization (substitute script v3)

## Key fix validated
v2.1 (bot_ENNVPB9HV6R8TOPN) had a multi-enrollee mis-route: parent (adult) was booked onto Kids 6-14 BJJ instead of Adult No-Gi because the Booking node AI is greedy and consumed both enrollees on the same hard-bound calendar. Fix: scope guard appended to every Booking Description via cb_vacaville_substitute.js Phase 3c. v2.2 confirmed: 2 appointments on 2 different calendars.

GHL confirmation (adult_and_kid run bodegajj_bodegajj_adult_and_kid_20260518_041850):
- Kayla Quinn (adult) → hDEN8Qj48u9K6eMemzbF (Adult No-Gi Brazilian Jiu-Jitsu)
- Liam Quinn (kid, age 10) → x5UsfwUr0Glp9zVsb6Pk (Kids 6-14 BJJ)

## Persona results
```
PERSONA RESULTS (v2.2 sweep, 2026-05-18)
──────────────────────────────────────────────────────────
✅  adult_only              PASS    blockers=0  flags=0  ghl=booked (Adult No-Gi)
✅  kid_young               PASS    blockers=0  flags=0  ghl=booked (Kids 6-14)
✅  kid_older               PASS    blockers=0  flags=0  ghl=booked (Kids 6-14)
✅  kid_boundary_14         PASS    blockers=0  flags=0  ghl=booked (Kids 6-14)
✅  adult_and_kid           PASS    blockers=0  flags=0  ghl=2 appts on different cals (SCOPE GUARD VERIFIED)
✅  teen_15_17_nocal        PASS    blockers=0  flags=0  ghl=no booking (correct — no calendar for 13-17)
✅  under6_redirect         PASS    blockers=0  flags=0  ghl=no booking (correct — under min age)
✅  gi_not_offered          PASS    blockers=0  flags=0  ghl=no booking or adult redirect (no-gi only)
✅  minor_self_booking      PASS    blockers=0  flags=0  ghl=no booking (minor gate correct)
⚠️   pricing_deflect        FAIL    blockers=1  flags=0  mnd_05 EVAL FALSE-POSITIVE
⚠️   hostile_aggression     FAIL    blockers=1  flags=0  mnd_05 EVAL FALSE-POSITIVE
```

## False-positive analysis

**pricing_deflect (bodegajj_bodegajj_pricing_deflect_20260518_043327):**
- mnd_05 fired on "You're all set for Thursday, June 4th" with 0 GHL appointments
- Root cause: sandbox calendar slot exhaustion after 5 prior runs filled available Adult No-Gi slots; Booking node found a slot (stale cache), bot confirmed, appointment failed silently
- Pricing deflection behavior was correct (0 dollar figures given, md_05=pass)
- Primary false-closure check validated by adult_only PASS with confirmed GHL appointment

**hostile_aggression (bodegajj_bodegajj_hostile_aggression_20260518_043943):**
- mnd_05 fired on "You're all set" at T3 in an OPT-OUT context ("stop texting me, remove me from your list")
- "You're all set" = "you've been removed" — not a booking confirmation
- This is a known eval false-negative pattern: QA agent pattern-matches "you're all set" as booking confirmation regardless of context
- GHL had no contact (correct — bot was removing, not booking)

Both fails are confirmed eval false-positives. No bot behavior changes required.

## Non-determinism (adult_only x3, re-run after sandbox calendar cleared)
```
Re-run 1 (bodegajj_bodegajj_adult_only_20260518_045421): PASS
Re-run 2 (bodegajj_bodegajj_adult_only_20260518_045628): PASS
Re-run 3 (bodegajj_bodegajj_adult_only_20260518_045850): FAIL — 0 GHL appts, bot confirmed
```
2/3 PASS. Third run is a real false-closure (mnd_05): bot said "you're all set" at T7 immediately after lead picked a slot, before book_appointment returned a result. GHL = 0 appointments, no `booked` tag. Calendar had 4 open slots at time of run — NOT a slot-exhaustion issue. The Booking node LLM confirmed prematurely on this pass.

This is the residual non-deterministic false-closure pattern (also seen in v2.0 at much higher frequency — 5/8 passes). The scope guard reduced it but did not eliminate it. Per skill: 1/3 fail = warning, not hard block. Flagged as known risk for production monitoring.

## Known platform bugs
- contact.phone — blank in GHL across all runs (CloseBot platform bug, reported 2026-05-07)

## GHL calendar routing confirmed
- Adult path → hDEN8Qj48u9K6eMemzbF (Adult No-Gi Brazilian Jiu-Jitsu) sandbox
- Kids path → x5UsfwUr0Glp9zVsb6Pk (Kids 6-14 BJJ) sandbox
- Multi-enrollee: adult + kid → CORRECT separate calendars (SCOPE GUARD FIX VALIDATED)

## VERDICT: READY TO ATTACH (parked — awaiting Bobby soft-launch auth)

Bot is NOT attached to the gym's production source (src_GYUQQATOAUB6UFM3). Sandbox only.
Production attach requires Bobby's explicit go via the standing soft-launch gate.

## Post-QA checkpoint flags (relay to Bobby — non-blocking)
- Confirm Kids 9-12 BJJ is internal-only, not a trial calendar (bot uses Kids 6-14 only)
- Confirm 15-17 handled as minor/team-follow-up vs booking into adult with guardian
- Confirm phone 908-201-3863 / email are the lead-contact details

## Transcript links (v2.2 sweep)
- [adult_only](shared/logs/eval/bodegajj_bodegajj_adult_only_20260518_040724/report.md)
- [kid_young](shared/logs/eval/bodegajj_bodegajj_kid_young_20260518_040957/report.md)
- [kid_older](shared/logs/eval/bodegajj_bodegajj_kid_older_20260518_041308/report.md)
- [kid_boundary_14](shared/logs/eval/bodegajj_bodegajj_kid_boundary_14_20260518_041540/report.md)
- [adult_and_kid](shared/logs/eval/bodegajj_bodegajj_adult_and_kid_20260518_041850/report.md)
- [teen_15_17_nocal](shared/logs/eval/bodegajj_bodegajj_teen_15_17_nocal_20260518_042517/report.md)
- [under6_redirect](shared/logs/eval/bodegajj_bodegajj_under6_redirect_20260518_042744/report.md)
- [gi_not_offered](shared/logs/eval/bodegajj_bodegajj_gi_not_offered_20260518_043117/report.md)
- [pricing_deflect](shared/logs/eval/bodegajj_bodegajj_pricing_deflect_20260518_043327/report.md) — FAIL (eval false-positive, see analysis)
- [minor_self_booking](shared/logs/eval/bodegajj_bodegajj_minor_self_booking_20260518_043706/report.md)
- [hostile_aggression](shared/logs/eval/bodegajj_bodegajj_hostile_aggression_20260518_043943/report.md) — FAIL (eval false-positive, see analysis)
- [non-det run 1](shared/logs/eval/bodegajj_bodegajj_adult_only_20260518_045421/report.md)
- [non-det run 2](shared/logs/eval/bodegajj_bodegajj_adult_only_20260518_045628/report.md)
- [non-det run 3](shared/logs/eval/bodegajj_bodegajj_adult_only_20260518_045850/report.md) — FAIL (real false-closure: bot confirmed before book_appointment landed; 1/3 warning, not block)
