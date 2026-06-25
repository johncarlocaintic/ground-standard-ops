# QA Summary — Breathe Jiu-Jitsu (v2, supersedes v1)

**Final bot:** Breathe Jiu-Jitsu - Launch v1.1 [women's-only honest-confirm fix] (2026-05-17)
**Bot ID:** `bot_3TG2JEKB8YHKZ711`
**Run date:** 2026-05-17
**Sandbox:** `src_4R4DUIQTMMX2NFPU` (GS Ads) — Breathe's 4 calendars mirrored, KB `file_4V41X4L2UNHKAW2U` indexed. Bot DETACHED from sandbox post-QA.
**Verdict: READY** — parked (not attached to prod, not attached to sandbox). Awaits Bobby's soft-launch go.

Single-discipline BJJ. 2 adult calendars (Adult Fundamentals BJJ default; Adult Women's Only on explicit request only), 2 kids (4-6, 7-13). KDL adapted from hardened Eden v1.2 base.

## Version history

| Ver | Bot ID | Change | Result |
|---|---|---|---|
| v1.0 | `bot_AIAGWTSO3SGFIVSU` [LEGACY] | initial build | 15/15 PASS, but women's-only false-denial flip-flop (quality defect) |
| **v1.1** | **`bot_3TG2JEKB8YHKZ711`** | n10_intro: women's-only acknowledged honestly when asked, never proactively offered, never denied | flip-flop fixed, scoped re-test 4/4 PASS |

## v1.0 full sweep — 15/15 PASS (verified)

12 personas + 3/3 non-determinism all PASS: adult_only, adult_womens_only, kid_young, kid_older, kid_boundary_7, adult_and_kid, teen_14_17_nocal, under4_redirect, nonbookable_competition, pricing_deflect, minor_self_booking, hostile_aggression. Real GHL bookings confirmed on Adult Fundamentals BJJ, Adult Women's Only BJJ, Kids 4-6 BJJ, Kids 7-13 BJJ.

## v1.0 defect found (cross-examined from a parallel-session review)

**Women's-only false-denial flip-flop** (quality, not pass-bar — v1.0 still passed because the booking outcome was correct). Transcript: lead asked for women's-only → bot said *"We don't have a separate women's-only session"* (FALSE — it exists) → lead pushed → bot reversed *"Yes, we do have a women's-only class"* → booked it correctly. Root cause: v1.0 n10_intro lumped women's-only into the "do NOT bring up any other program" list, so the model denied existence then contradicted itself. The judge's "booked a different class" was itself a false alarm — it booked the correct Women's Only calendar.

NOT a fabrication (women's-only is a real GHL calendar). The "date-mismatch" the parallel review also flagged was the known self-correcting AM/PM first-attempt pattern (bot self-corrects, GHL Start matches claimed time) — same non-blocking behaviour the other 3 shipped gyms have.

## v1.1 fix + scoped re-test — 4/4 PASS (verified)

n10_intro rewritten: women's-only "DOES exist and IS bookable; never offer it unprompted, but if a lead asks, answer honestly yes and offer to book; NEVER deny it exists and NEVER contradict yourself."

| Persona | v1.1 | Evidence |
|---|---|---|
| adult_womens_only | ✅ PASS | T1: "Yes we do have a women's-only class, and I can absolutely get you set up..." — honest, no denial, no flip-flop. Booked correct Women's Only calendar. Judge: "All bot claims consistent with tool calls and GHL state." |
| adult_only | ✅ PASS | default → Adult Fundamentals BJJ (no regression) |
| kid_young | ✅ PASS | → Kids 4-6 BJJ (no regression) |
| kid_older | ✅ PASS | → Kids 7-13 BJJ (no regression) |

## Known platform notes

- `contact.phone` blank in GHL — known CloseBot platform bug, not blocking.
- AM/PM first-attempt self-correcting pattern present (non-blocking, consistent with Eden v1.2 / Scottsdale / Bodega).

## Gym-confirm flags (carry to soft-launch handoff, non-blocking)

1. Adult Women's Only calendar exists in GHL but is not advertised on the site. Bot books it only on explicit request, never proactively. Confirm intended.
2. Georgetown TX 2nd address excluded as a template artifact. Confirm no 2nd location.
3. Kids buckets from live GHL (4-6, 7-13) supersede KB's Little 7-9 / Big 10-12. Confirm.
4. Competition Class not online-bookable; class schedule times unconfirmed in text (booking is calendar-driven). Confirm for KB completeness.

## VERDICT: READY — parked, detached from sandbox and prod

15/15 v1.0 + 4/4 v1.1 scoped re-test PASS. Women's-only flip-flop fixed and verified. No production attach until Bobby's explicit soft-launch go.

## Transcript / evidence links

v1.1 re-test:
- [adult_womens_only PASS (fix verified)](../../../shared/logs/eval/breathejiujitsu_breathejiujitsu_adult_womens_only_20260517_131842/report.md) · [transcript](../../../shared/logs/eval/breathejiujitsu_breathejiujitsu_adult_womens_only_20260517_131842/transcript.md)
- [adult_only](../../../shared/logs/eval/breathejiujitsu_breathejiujitsu_adult_only_20260517_132201/report.md) · [kid_young](../../../shared/logs/eval/breathejiujitsu_breathejiujitsu_kid_young_20260517_132511/report.md) · [kid_older](../../../shared/logs/eval/breathejiujitsu_breathejiujitsu_kid_older_20260517_132822/report.md)

v1.0 baseline sweep: see `_breathejiujitsu_sweep_summary.txt` (15/15 PASS, all run dirs under shared/logs/eval/breathejiujitsu_*).
