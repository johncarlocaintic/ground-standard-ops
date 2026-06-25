# QA Summary — Academy of Jiu-Jitsu Scottsdale

**Bot:** Academy of Jiu-Jitsu Scottsdale - Launch v1.0 [initial build] (2026-05-17)
**Bot ID:** `bot_01MYV7I9IWMHYPCF`
**Run date:** 2026-05-17
**Sandbox:** `src_4R4DUIQTMMX2NFPU` (GS Ads) — only Scottsdale's 3 calendars mirrored, KB `file_1RJFHTXQC9VJOT5O` indexed + sole KB on sandbox
**Verdict: READY** — single pass, zero build iterations. Parked on sandbox, NOT attached to prod (awaits Bobby's soft-launch go, same gate as the other gyms).

Single-discipline (BJJ only). KDL adapted from the hardened Eden Prairie v1.2 base (explicit DOB age-computation, strict age→calendar, AM/PM guard, scripted no-calendar handling) — these carried over cleanly, no Scottsdale-specific bugs.

## Persona results (12 + 3 non-determinism)

| Persona | Verdict | Evidence |
|---|---|---|
| adult_only | ✅ PASS | adult → Adult Fundamentals BJJ, GHL appt confirmed |
| kid_young_bjj | ✅ PASS | age 6 → Kids 5-7 BJJ (`uBWK...`), appt confirmed |
| kid_older_bjj | ✅ PASS | age 10 → Kids 8-13 BJJ (`8OXw...`), appt confirmed |
| kid_boundary_13 | ✅ PASS | age 13 correctly in Kids 8-13 (boundary) |
| adult_and_kid | ✅ PASS* | *QA false-negative — see below. Ground truth: parent → Adult Fundamentals BJJ + Liam age 7 → Kids 5-7 BJJ, BOTH appts confirmed in GHL |
| teen_14_17_nocal | ✅ PASS | age 15 → no booking, minor-needs-guardian, team follows up |
| under5_redirect | ✅ PASS | age 4 → no booking, age-5 minimum + gym contact given |
| nonbookable_advanced | ✅ PASS | Adult BJJ Advanced → not bookable online, no coach-redirect |
| nonbookable_competition | ✅ PASS | Competition Class → not bookable online, no coach-redirect |
| pricing_deflect | ✅ PASS | no figure across 3 pushes |
| minor_self_booking | ✅ PASS | 16yo self-book → referral, 0 appts (correct) |
| hostile_aggression | ✅ PASS | graceful, no pricing |
| adult_only ×3 (non-determinism) | ✅ 3/3 PASS | all booked into Adult Fundamentals BJJ |

## adult_and_kid — QA false-negative (cross-examined, NOT a real fail)

Report verdict was FAIL on md_09. Ground-truth cross-examination (events.json + GHL):
- Parent (age 35) → `vTH1OQFqD19mPUIx9e4h` Adult Fundamentals BJJ ✅
- Liam (age 7, DOB 2018-06-20) → `uBWKSbJLlOKkGHREKpoU` Kids 5-7 BJJ ✅ (age 7 belongs in 5-7)
- **2 confirmed GHL appointments.** mnd_05 verifier-overridden to pass.
- md_09 evidence claimed "Liam booked for Kids 5-7 instead of Kids 8-13" — QA miscomputed Liam's age; 7 → Kids 5-7 is correct.
- judge "tool failed to book" — false; first Liam attempt hit AM/PM ambiguity ("04:30" → AM, failed), bot self-corrected to "16:30" and succeeded. Both appts landed.
- Only genuine nit: md_01 (standard, non-blocker) — bot didn't re-ask "who is this for" because the lead volunteered "me and my son" up front. Acceptable.

Per the cross-examine-judge-output rule, this run is a functional PASS.

## Known platform notes

- `contact.phone` blank in GHL across runs — known CloseBot platform bug (reported 2026-05-07), not blocking.
- Test-infra blips: 3 personas were cut mid-conversation by an unrelated session restart in the first sweep; all re-ran clean (PASS) in isolation per the crash rule. Not bot defects.

## Gym-confirm flags (carry to soft-launch handoff, non-blocking)

1. Adult BJJ Advanced + Fundamentals Live Training — no bookable calendar (progression classes). Bot says not available online; new students start with a Fundamentals trial. Confirm intended.
2. Website "Competition Class" — no KB/flyer or calendar basis; omitted, not mentioned by bot. Confirm whether it should be bookable.
3. Age 14-17 — no calendar (kids cap at 13, adult floor 18). Bot treats as minor needing guardian, no booking, team follows up. Confirm gym wants this.
4. Under age 5 — no calendar; bot gives gym contact (480) 270-6040. Confirm.

## VERDICT: READY — parked on sandbox, not attached to prod

All paths verified, real GHL bookings confirmed on Adult Fundamentals BJJ, Kids 5-7 BJJ, Kids 8-13 BJJ. 3/3 non-determinism. No prompt fix needed (hardened Eden v1.2 base held). No production attach until Bobby's explicit soft-launch go.

## Transcript / evidence links

- [adult_only](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_adult_only_20260517_093912/report.md)
- [kid_young_bjj](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_kid_young_bjj_20260517_103600/report.md) · [kid_older_bjj](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_kid_older_bjj_20260517_103918/report.md)
- [kid_boundary_13](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_kid_boundary_13_20260517_095711/report.md)
- [adult_and_kid (QA false-neg, cross-examined)](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_adult_and_kid_20260517_100319/report.md) · [transcript](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_adult_and_kid_20260517_100319/transcript.md)
- [teen_14_17_nocal](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_teen_14_17_nocal_20260517_100644/report.md) · [under5_redirect](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_under5_redirect_20260517_100958/report.md)
- [nonbookable_advanced](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_nonbookable_advanced_20260517_101307/report.md) · [nonbookable_competition](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_nonbookable_competition_20260517_101627/report.md)
- [pricing_deflect](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_pricing_deflect_20260517_101946/report.md) · [minor_self_booking](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_minor_self_booking_20260517_104222/report.md) · [hostile_aggression](../../../shared/logs/eval/academyjjscottsdale_academyjjscottsdale_hostile_aggression_20260517_102624/report.md)
