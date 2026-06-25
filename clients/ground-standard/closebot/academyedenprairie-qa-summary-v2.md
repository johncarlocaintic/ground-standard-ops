# QA Summary — The Academy Eden Prairie (v2, supersedes v1)

**Final bot:** The Academy Eden Prairie - Launch v1.2 [n30 age-bucket + time guard] (2026-05-17)
**Bot ID:** `bot_20P7NZ6ZMRY37GC4`
**Run date:** 2026-05-17
**Sandbox:** `src_4R4DUIQTMMX2NFPU` (GS Ads) — Eden calendars mirrored from prod, KB `file_BN2CMCY9D4TFQO4S` indexed + sole KB on sandbox
**Verdict: READY** (parked on sandbox — NOT attached to prod; awaits Bobby's soft-launch go, same gate as the other 8 gyms)

## Version history

| Ver | Bot ID | Change | Result |
|---|---|---|---|
| v1.0 | `bot_W8X9OFUFJK6U75Z6` [LEGACY] | initial build | 14/15 PASS, 3/3 non-determinism, 1 blocker (mnd_10) |
| v1.1 | `bot_2QTGMA0A5H7NUHVU` [LEGACY] | n10_intro: scripted kids-Muay-Thai line, no coach-redirect | mnd_10 fixed; exposed md_09 age-bucket blocker |
| **v1.2** | **`bot_20P7NZ6ZMRY37GC4`** | n30_book: explicit age computation + strict age→calendar + AM/PM guard | **all blockers cleared** |

## v1.0 full sweep (15 runs) — baseline

12 personas + 3 non-determinism. 14 PASS, 3/3 adult non-determinism. Only fail: kid_muaythai_redirect (mnd_10 blocker — coach-redirect + adult-class-for-minor at T1). Core paths all PASS: both disciplines, all kids calendars, multi-enrollee, 13-17 no-calendar gap, both non-bookable personas (Women's Only not booked into Adult BJJ, MMA no coach-redirect), pricing deflect, minor self-book, hostile.

## v1.2 scoped re-test (4 runs) — all PASS (verified)

| Persona | Verdict | Evidence |
|---|---|---|
| kid_muaythai_redirect | ✅ PASS | mnd_10 pass (exact scripted line), md_09/md_10/md_12 pass; SSE: 9yo correctly selected Kids 8-12 BJJ ("Eli turned 9, so he's all set for the Kids 8-12 Jiu-Jitsu program") |
| kid_young_bjj | ✅ PASS | age 5 → Kids 4-7 BJJ |
| kid_older_bjj | ✅ PASS | age 10 → Kids 8-12 BJJ, **1 GHL appt booked** (`SaAX6WFOYhSxl9b2F86U`, "04:30 PM" — AM/PM guard working) |
| adult_only | ✅ PASS | Adult Fundamentals BJJ |

## Blockers found + fixed

1. **mnd_10 (v1.0)** — bot offered "chat with a coach when you come in" + dangled adult Muay Thai for a 9yo. Fixed v1.1: scripted exact response in n10_intro, explicit forbiddances.
2. **md_09 (v1.1)** — on the Muay-Thai-redirect path the bot mis-bucketed age 9 into Kids 4-7. Root-caused via SSE (prompt-reasoning, not tool/calendar). Fixed v1.2: n30_book forces explicit age computation from `{{contact.youth_birthday}}`, strict age→calendar selection, ignore prior-chat age hints, + AM/PM booking-time guard.

## Test-environment note (not a bot/prod defect)

The sandbox calendar-mirror created a Kids 8-12 twin that didn't generate slots (60-min slotDuration vs 45-min windows on a freshly-created GHL calendar). **Prod Kids 8-12 is healthy** (verified: real slots, e.g. 2026-05-18T17:30). Fixed the sandbox calendar (slotDuration→30) and the mirror script now forces 30/30 so the next 5 gyms won't hit this. Real Kids 8-12 booking then confirmed (kid_older_bjj v1.2, 1 appt).

## Known platform note

- `contact.phone` blank in GHL across runs — known CloseBot platform bug (reported 2026-05-07), not blocking.

## Gym-confirm flags (carry to soft-launch handoff, non-blocking)

1. Website "Competition Class" — no KB/calendar basis, omitted (not invented).
2. Women's Only No-Gi — no calendar; bot says not bookable online (NOT booked into Adult BJJ). Confirm intended.
3. 13-17 age band — no calendar; bot treats as minor needing guardian, no booking, team follows up. Confirm gym wants this.
4. KB was single-source (May 2026 PDF); website-verified what was checkable; city corrected Minneapolis→Edina.

## VERDICT: READY — parked on sandbox, not attached to prod

All blockers resolved, core + edge paths verified, real GHL bookings confirmed on Adult, Kids 4-7, and Kids 8-12 calendars, graceful no-availability handling, 3/3 non-determinism (v1.0). No production attach until Bobby's explicit soft-launch go (same posture as the other 8 ready gyms).

## Transcript / evidence links (v1.2 + v1.0 baseline)

v1.2 re-test:
- [kid_muaythai_redirect PASS](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_muaythai_redirect_20260517_085637/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_muaythai_redirect_20260517_085637/transcript.md)
- [kid_older_bjj PASS + Kids8-12 booking](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_older_bjj_20260517_091521/report.md) · [transcript](../../../shared/logs/eval/academyedenprairie_academyedenprairie_kid_older_bjj_20260517_091521/transcript.md)

v1.0 baseline sweep (full 12+3): see [academyedenprairie-qa-summary-v1.md](academyedenprairie-qa-summary-v1.md) for the complete per-persona link table.
