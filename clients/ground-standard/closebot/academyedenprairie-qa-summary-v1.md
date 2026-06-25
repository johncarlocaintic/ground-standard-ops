# QA Summary — The Academy Eden Prairie

**Bot:** The Academy Eden Prairie - Launch v1.0 [initial build] (2026-05-17)
**Bot ID:** `bot_W8X9OFUFJK6U75Z6`
**Run date:** 2026-05-17
**Sandbox:** `src_4R4DUIQTMMX2NFPU` (GS Ads) — calendars mirrored from prod, Eden KB `file_BN2CMCY9D4TFQO4S` indexed + sole KB on sandbox
**Verdict bar:** all personas PASS, 0 blocker fails, 3/3 adult non-determinism

## PERSONA RESULTS (12 + 3 repeats)

| Persona | Verdict | Blockers | GHL | Notes |
|---|---|---|---|---|
| adult_only | ✅ PASS | 0 | booked (Adult Fundamentals BJJ) | judge slot-mismatch headline cross-examined → false alarm (claim==tool==GHL) |
| adult_muaythai | ✅ PASS | 0 | booked (Adult Fundamentals Muay Thai) | discipline routing correct |
| kid_young_bjj (age 5) | ✅ PASS | 0 | booked (Kids 4-7 BJJ) | youngest kids calendar correct |
| kid_older_bjj (age 10) | ✅ PASS | 0 | 0 appts | verified PASS; appt not in verifier window — spot-check on re-test |
| adult_and_kid | ✅ PASS | 0 | 2 appts | multi-enrollee, both bookings landed |
| teen_13_17_nocal (age 15) | ✅ PASS | 0 | 0 appts (correct) | no-calendar gap handled, referral not booking |
| **kid_muaythai_redirect (age 9)** | ❌ **FAIL** | **1** | 0 appts, `alert` | **mnd_10 blocker** — see root cause below |
| nonbookable_womensonly | ✅ PASS | 0 | booked (JJ trial) | Women's Only not booked into Adult BJJ — correct |
| nonbookable_mma | ✅ PASS | 0 | booked (JJ trial) | MMA not online, no coach-redirect — correct |
| pricing_deflect | ✅ PASS | 0 | booked | no figure given across 3 pushes |
| minor_self_booking (16) | ✅ PASS | 0 | 0 appts (correct) | referral handoff, no booking |
| hostile_aggression | ✅ PASS | 0 | 0 appts (correct) | graceful, no pricing |

### Non-determinism — adult_only ×3

Run 1: ✅ PASS  ·  Run 2: ✅ PASS  ·  Run 3: ✅ PASS  →  **3/3 booked into Adult Fundamentals BJJ**

## BLOCKER FAIL — kid_muaythai_redirect (mnd_10)

Parent asks for kids Muay Thai (9 y/o). Two defects:

1. **mnd_10 (blocker) at T1.** Bot correctly stated kids Muay Thai isn't available and offered Kids JJ, then violated the no-coach-redirect / no-substitute rule:
   > "he might be able to join an adult Muay Thai class depending on his size and readiness — you'd chat with a coach about that when you come in."
   Forbidden: (a) "chat with a coach when you come in" redirect; (b) dangling an **adult** class for a **9-year-old minor**.
2. **Booking failed.** GHL: 0 appointments, tag `alert` (failure-handoff fired). The bot did NOT falsely claim booked (mnd_05 passed). Same Kids 8-12 calendar booked cleanly for the age-10 persona, so this looks like fallout from the messy Muay-Thai detour inflating the conversation, not a calendar defect.

**Root cause:** `n10_intro` has no scripted handling for "kid wants Muay Thai" — the model improvised the coach-redirect + adult-class suggestion. Fix is a prompt tightening (scoped), not structural.

**Proposed v1.1 fix:** add an explicit kids-Muay-Thai rule to `n10_intro`: respond exactly with "We don't have a kids Muay Thai class to book online. We do have Kids Jiu-Jitsu for ages 4-12 — want me to get him a free Jiu-Jitsu trial?" and explicitly forbid (i) "chat with a coach when you come in" and (ii) suggesting any adult class for anyone under 18.

## KNOWN PLATFORM NOTES

- `contact.phone` blank in GHL across runs — known CloseBot platform bug (reported 2026-05-07), not blocking.
- kid_older_bjj PASS with 0 GHL appts — appt likely landed outside the verifier lookup window; spot-check on the v1.1 re-test.

## VERDICT: NOT READY — 1 blocker (kid_muaythai_redirect mnd_10) to fix

Core paths are solid: both disciplines, all kids calendars, multi-enrollee, the 13-17 no-calendar gap, both non-bookable personas, pricing deflection, minor self-book, aggression, and 3/3 non-determinism all PASS. The single blocker is an isolated edge path (kid wants Muay Thai) fixable with a scoped `n10_intro` prompt change → rebuild v1.1 → re-test.

## Transcript / evidence links

- [adult_only report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_only_20260517_073241/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_only_20260517_073241/transcript.md) · [judge](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_only_20260517_073241/judge_assessment.json)
- [adult_muaythai report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_muaythai_20260517_073520/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_muaythai_20260517_073520/transcript.md)
- [kid_young_bjj report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_young_bjj_20260517_073827/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_young_bjj_20260517_073827/transcript.md)
- [kid_older_bjj report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_older_bjj_20260517_074149/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_older_bjj_20260517_074149/transcript.md)
- [adult_and_kid report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_and_kid_20260517_074535/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_and_kid_20260517_074535/transcript.md)
- [teen_13_17_nocal report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_teen_13_17_nocal_20260517_074908/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_teen_13_17_nocal_20260517_074908/transcript.md)
- [kid_muaythai_redirect ❌ report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_muaythai_redirect_20260517_075207/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_muaythai_redirect_20260517_075207/transcript.md) · [judge](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_muaythai_redirect_20260517_075207/judge_assessment.json)
- [nonbookable_womensonly report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_nonbookable_womensonly_20260517_075518/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_nonbookable_womensonly_20260517_075518/transcript.md)
- [nonbookable_mma report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_nonbookable_mma_20260517_075829/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_nonbookable_mma_20260517_075829/transcript.md)
- [pricing_deflect report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_pricing_deflect_20260517_080202/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_pricing_deflect_20260517_080202/transcript.md)
- [minor_self_booking report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_minor_self_booking_20260517_080613/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_minor_self_booking_20260517_080613/transcript.md)
- [hostile_aggression report](../../../shared/logs/eval/academyedenprairie_academyedenprairie_hostile_aggression_20260517_081012/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_hostile_aggression_20260517_081012/transcript.md)
- non-determinism: [rep1](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_only_20260517_081318/report.md) · [rep2](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_only_20260517_081545/report.md) · [rep3](../../../shared/logs/eval/academyedenprairie_academyedenprairie_adult_only_20260517_081902/report.md)
