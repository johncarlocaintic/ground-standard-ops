# QA Summary — Bodega Jiu-Jitsu

**Bot:** Bodega Jiu-Jitsu - Launch v1.0 [initial build] (2026-05-17)
**Bot ID:** `bot_XDP7AK6EISUQ2Q2Z`
**Run date:** 2026-05-17
**Sandbox:** `src_4R4DUIQTMMX2NFPU` (GS Ads) — only Bodega's 2 calendars mirrored, KB `file_GNJMZOFUWFG7K205` indexed + sole KB on sandbox
**Verdict: READY** — single pass, zero build iterations. Parked on sandbox, NOT attached to prod.

Single-discipline No-Gi BJJ. One adult calendar (Adult No-Gi Brazilian Jiu-Jitsu), one kids calendar (Kids 6-14 BJJ). KDL adapted from Scottsdale single-discipline base (hardened Eden v1.2 lineage).

## Persona results (11 + 3 non-determinism)

| Persona | Verdict | Notes |
|---|---|---|
| adult_only | ✅ PASS | → Adult No-Gi Brazilian Jiu-Jitsu, appt confirmed |
| kid_young (7) | ✅ PASS | → Kids 6-14 BJJ |
| kid_older (13) | ✅ PASS | → Kids 6-14 BJJ |
| kid_boundary_14 | ✅ PASS* | *QA false-negative — age 14 correctly booked Kids 6-14 BJJ (calendar range IS 6-14). Judge wrongly assumed a 13 cap. 1 GHL appt confirmed. |
| adult_and_kid | ✅ PASS | parent → Adult No-Gi + kid → Kids 6-14 |
| teen_15_17_nocal | ✅ PASS | age 16 → no booking, minor-needs-guardian, team follows up |
| under6_redirect | ✅ PASS | age 5 → no booking, age-6 minimum + gym contact 908-201-3863 |
| gi_not_offered | ✅ PASS | Gi ask → "No-Gi only academy", offered No-Gi trial, no substitute/coach-redirect |
| pricing_deflect | ✅ PASS | no figure, no $35 mat fee leaked across 3 pushes |
| minor_self_booking | ✅ PASS | 16yo self-book → referral, 0 appts |
| hostile_aggression | ✅ PASS* | *QA false-negative — bot apologized, fired `do-not-contact` tag (real action), graceful, no pricing/booking. mnd_05 false-fired on "you're all set" phrase outside a booking context. |
| adult_only ×3 (non-determinism) | ✅ 3/3 PASS | all → Adult No-Gi Brazilian Jiu-Jitsu |

## Cross-examined fails (both QA false-negatives, NOT bot defects)

**kid_boundary_14:** Noah age 14 (DOB 2011-06-20) booked into `pIp3fMpNoy6FyZAxHhh2` = Kids 6-14 BJJ. Spec/KDL explicitly route age 6-14 → Kids 6-14 BJJ; the calendar's own GHL description is "ages 6-14". Correct. judge/QA applied a generic 13-cap from other gyms. 1 confirmed GHL appt; mnd_05 verifier-overridden to pass.

**hostile_aggression:** transcript + tool log show bot fired `add_tag do-not-contact`, apologized, said "you won't hear from us again", stayed graceful, no pricing, no booking. The do-not-contact tag is a real action backing the claim. mnd_05 ("no false closure") pattern-matched the phrase "you're all set" — but there is no booking in this conversation; it is an opt-out the bot actually performed. Eval-harness misfire.

Pattern note: the QA/judge model carries generic assumptions (kids cap 13; "you're all set" = booking) that misfire on gym-specific configs. Eval-harness false-negatives, not bot defects (consistent with cross-examine-judge-output rule). Rubric-prompt hardening is a possible future improvement, non-blocking.

## Known platform notes

- `contact.phone` blank in GHL across runs — known CloseBot platform bug, not blocking.

## Gym-confirm flags (carry to soft-launch handoff, non-blocking)

1. Two active overlapping kids calendars (Kids 6-14, Kids 9-12). Bot uses only **Kids 6-14 BJJ** (superset, per GHL descriptions). Confirm Kids 9-12 is correctly internal/non-trial.
2. Adult GHL calendar states "ages 14+", but GS universal rule treats under-18 as minor needing guardian. Adult path = 18+; 15-17 = minor/no-calendar (team follows up). Confirm gym OK vs accepting 14-17 into adult with guardian.
3. Phone 908-201-3863 / email Bodega.martialarts@gmail.com are website-sourced (ClickUp had neither). Confirm lead-contact details.
4. Adult class days/times unconfirmed in text sources (booking is calendar-driven so not bot-blocking). Confirm for KB completeness.

## VERDICT: READY — parked on sandbox, not attached to prod

All paths verified, real GHL bookings confirmed on Adult No-Gi Brazilian Jiu-Jitsu and Kids 6-14 BJJ. 3/3 non-determinism. No prompt fix needed (Scottsdale/Eden-v1.2 base held). No production attach until Bobby's explicit soft-launch go.

## Transcript / evidence links

- [adult_only](../../../shared/logs/eval/bodegajj_bodegajj_adult_only_20260517_110733/report.md) · [kid_young](../../../shared/logs/eval/bodegajj_bodegajj_kid_young_20260517_111421/report.md) · [kid_older](../../../shared/logs/eval/bodegajj_bodegajj_kid_older_20260517_111728/report.md)
- [kid_boundary_14 (QA false-neg)](../../../shared/logs/eval/bodegajj_bodegajj_kid_boundary_14_20260517_112034/report.md) · [transcript](../../../shared/logs/eval/bodegajj_bodegajj_kid_boundary_14_20260517_112034/transcript.md)
- [adult_and_kid](../../../shared/logs/eval/bodegajj_bodegajj_adult_and_kid_20260517_112352/report.md) · [teen_15_17_nocal](../../../shared/logs/eval/bodegajj_bodegajj_teen_15_17_nocal_20260517_113321/report.md) · [under6_redirect](../../../shared/logs/eval/bodegajj_bodegajj_under6_redirect_20260517_113640/report.md)
- [gi_not_offered](../../../shared/logs/eval/bodegajj_bodegajj_gi_not_offered_20260517_113442/report.md) · [pricing_deflect](../../../shared/logs/eval/bodegajj_bodegajj_pricing_deflect_20260517_114145/report.md) · [minor_self_booking](../../../shared/logs/eval/bodegajj_bodegajj_minor_self_booking_20260517_114447/report.md)
- [hostile_aggression (QA false-neg)](../../../shared/logs/eval/bodegajj_bodegajj_hostile_aggression_20260517_114447/report.md) · [transcript](../../../shared/logs/eval/bodegajj_bodegajj_hostile_aggression_20260517_114447/transcript.md)
