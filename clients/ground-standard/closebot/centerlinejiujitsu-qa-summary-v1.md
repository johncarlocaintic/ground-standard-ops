# QA Summary — Centerline Jiu-Jitsu

**Bot:** Centerline Jiu-Jitsu - Launch v1.0 [initial build] (2026-05-17)
**Bot ID:** `bot_F2IMVLSJ61TQ4R8X`
**Run date:** 2026-05-17
**Sandbox:** `src_4R4DUIQTMMX2NFPU` (GS Ads) — Centerline's 5 calendars mirrored, KB `file_N533GY084XRMDHQP` indexed. Bot DETACHED from sandbox post-QA.
**Verdict: READY** — single pass, zero bot iterations. Parked (not attached to prod or sandbox). Awaits Bobby's soft-launch go.

Single-discipline BJJ. 2 adult calendars (Adult Fundamentals BJJ default; Adult Women's Only Jiu-Jitsu on explicit request only — Breathe v1.1 honest-confirm pattern), 3 kids buckets (3-4, 5-7, 8-13). KDL adapted from Breathe v1.1 base (hardened age-computation + AM/PM guard + women's-only honest-confirm all carried over).

## Persona results (13 + 3 non-determinism)

| Persona | Verdict | Notes |
|---|---|---|
| adult_only | ✅ PASS | → Adult Fundamentals BJJ |
| adult_womens_only | ✅ PASS | honest confirm (no denial/flip-flop), booked Adult Women's Only Jiu-Jitsu |
| kid_preschool (3) | ✅ PASS | → Kids 3-4 BJJ |
| kid_5_7 (6) | ✅ PASS | → Kids 5-7 BJJ |
| kid_8_13 (11) | ✅ PASS | → Kids 8-13 BJJ |
| kid_boundary_13 (13) | ✅ PASS* | *original FAIL was bad test data (persona DOB computed to 14, contradicting the "13yo" brief). Re-run with corrected genuine-13 DOB → booked Kids 8-13 BJJ correctly, md_11d PASS. |
| adult_and_kid | ✅ PASS | parent → Adult Fundamentals + kid 5 → Kids 5-7 |
| teen_14_17_nocal (15) | ✅ PASS | no booking, minor-needs-guardian, team follows up |
| under3_redirect (2) | ✅ PASS | no booking, age-3 minimum + gym contact (480) 756-2323 |
| nonbookable_competition | ✅ PASS | Competition Class → not bookable online, no coach-redirect |
| pricing_deflect | ✅ PASS | no figure across 3 pushes |
| minor_self_booking (16) | ✅ PASS | referral, 0 appts |
| hostile_aggression | ✅ PASS | graceful, no pricing |
| adult_only ×3 (non-determinism) | ✅ 3/3 PASS | all → Adult Fundamentals BJJ |

## kid_boundary_13 — test-data error (NOT a bot defect)

Original persona brief said "your 13-year-old daughter" but the DOB I authored (`2012-02-20`) computed to age 14 as of 2026-05-17 — an internally contradictory persona. The bot booked Kids 8-13; flagged because a true 14yo is the no-calendar/referral band. The clean 14-17 case (teen_14_17_nocal, age 15) PASSED, proving the no-cal logic works. Corrected the persona DOB to `2012-06-20` (genuine 13), re-ran: bot correctly routed to Kids 8-13 BJJ, md_11d PASS, verified PASS. Eval-harness/test-data issue, fixed; no bot change needed.

## Known platform notes

- `contact.phone` blank in GHL — known CloseBot platform bug, not blocking.
- AM/PM first-attempt self-correcting pattern present (non-blocking, consistent with the other shipped gyms).

## Gym-confirm flags (carry to soft-launch handoff, non-blocking)

1. Adult Women's Only exists in GHL, not advertised on site. Booked only on explicit request, never proactively, never denied. Confirm intended.
2. KB Youth says ages 8-14; GHL Kids calendar caps at 8-13. 14-17 = no-calendar minor band. Confirm.
3. Phone (480) 756-2323 from ClickUp (not on website). Confirm lead-contact number.
4. Competition Class + Black Belt Club + advanced adult tracks not online-bookable; Fri/Sun open-closed unconfirmed (booking is calendar-driven). Confirm for KB completeness.

## VERDICT: READY — parked, detached from sandbox and prod

13 personas + 3/3 non-determinism PASS (kid_boundary_13 cleared after a test-data correction). Real GHL bookings confirmed on Adult Fundamentals BJJ, Adult Women's Only Jiu-Jitsu, Kids 3-4 BJJ, Kids 5-7 BJJ, Kids 8-13 BJJ. No prompt fix needed (Breathe v1.1 base held). No production attach until Bobby's explicit soft-launch go.

## Transcript / evidence links

- [adult_only](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_adult_only_20260517_134517/report.md) · [adult_womens_only](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_adult_womens_only_20260517_140504/report.md)
- [kid_preschool](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_kid_preschool_20260517_140816/report.md) · [kid_5_7](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_kid_5_7_20260517_141124/report.md) · [kid_8_13](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_kid_8_13_20260517_141430/report.md)
- [kid_boundary_13 (corrected re-run, PASS)](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_kid_boundary_13_20260517_144511/report.md) · [transcript](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_kid_boundary_13_20260517_144511/transcript.md)
- [adult_and_kid](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_adult_and_kid_20260517_141134/report.md) · [teen_14_17_nocal](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_teen_14_17_nocal_20260517_142127/report.md) · [under3_redirect](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_under3_redirect_20260517_142440/report.md)
- [nonbookable_competition](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_nonbookable_competition_20260517_142751/report.md) · [pricing_deflect](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_pricing_deflect_20260517_143103/report.md) · [minor_self_booking](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_minor_self_booking_20260517_143415/report.md) · [hostile_aggression](../../../shared/logs/eval/centerlinejiujitsu_centerlinejiujitsu_hostile_aggression_20260517_143727/report.md)
