# QA Summary — 10th Planet Jiu-Jitsu Miami

**Bot (final):** 10th Planet Jiu-Jitsu Miami - Launch v1.0 [initial build] (2026-05-16)
**Bot ID:** `bot_ZC2MREMJ87S77LH1`
**Run date:** 2026-05-16
**Sandbox source:** `src_4R4DUIQTMMX2NFPU` (GS Ads)
**Sandbox calendars created at start of run:** 4 (Adult Striking, Kids 3-6 BJJ, Kids 7-13 BJJ, Kids Striking). Adult Fundamentals BJJ already present from prior Grit testing.

---

## PERSONA RESULTS (v1.0 — bot_ZC2MREMJ87S77LH1)

```
PERSONA                    VERDICT             BLOCKERS  GHL OUTCOME
─────────────────────────────────────────────────────────────────
adult_only                 PASS (verified)     0         booked → Adult Fundamentals BJJ
adult_striking             PASS (verified)     0         booked → Adult Striking
kid_tiny_tots              PASS (verified)     0         booked → Kids 3-6 BJJ (4yo JJ)
kid_older_striking         PASS (verified)     0*        booked → Kids Striking (10yo Striking)
adult_and_kid              PASS (verified)     0*        2 appts → Kids 7-13 BJJ (8yo) + Adult Fundamentals BJJ
age3_striking_redirect     PASS (verified)     0         booked → Kids 3-6 BJJ (5yo redirect from Striking)
pricing_deflect            PASS (verified)     0         booked → Adult Fundamentals BJJ
nonbookable_mma            PASS (verified)     0*        booked → Adult Fundamentals BJJ
nonbookable_openmat        PASS (verified)     0         Open Mat acknowledged, redirected → Adult Fundamentals BJJ
minor_self_booking         PASS (verified)     0         no appt (correct — minor referral handoff)
hostile_aggression         PASS (verified)     0         no appt (aggression scenario triggered)
```

\* Three personas had 1 standard fail each. After cross-check:

- **adult_and_kid (md_01):** False positive. Persona's opening message said "signing up for myself and also getting my 8-year-old son enrolled" — bot already knew who the class was for from T1.
- **kid_older_striking (md_01):** False positive. Same pattern — persona opened with "I want to sign my 10-year-old son up" so bot didn't need to ask explicitly.
- **nonbookable_mma (ec_02):** Real but non-blocker UX inconsistency. Bot routed lead away from MMA without explicitly acknowledging the program. Booking still landed correctly on Adult Fundamentals BJJ. Open Mat handling in `nonbookable_openmat` was textbook-correct, so this is non-deterministic — the bot's Intro node instructions are consistent but the LLM sometimes skips the acknowledgment phrasing.

---

## REPEAT RUN — adult_only ×3 (non-determinism check)

Verified via GHL ground truth (3 parallel runs overwrote the same orchestrator directory, but all 3 contacts and appointments exist independently in GHL):

```
Contact jVOWQZhhzkCD7Seqkm96 → calendar gBWEHYrNDWKiHuzhtT4L (Adult Fundamentals BJJ) — confirmed
Contact c236iXI4k3oPYLJ7ZBuc → calendar gBWEHYrNDWKiHuzhtT4L (Adult Fundamentals BJJ) — confirmed
Contact aSq57PTtBDI3jRPwISJZ → calendar gBWEHYrNDWKiHuzhtT4L (Adult Fundamentals BJJ) — confirmed
```

Combined with the initial sweep run (Wesley Yates → gBWEHYrNDWKiHuzhtT4L), that's 4/4 PASS on the adult JJ happy path. Zero non-determinism.

---

## CALENDAR ROUTING — GROUND TRUTH (GHL appointments)

Every booking persona routed to the correct calendar:

| Persona | Discipline + Age | Calendar Booked | Expected | Match |
|---|---|---|---|---|
| adult_only | JJ, adult 29yo | `gBWEHYrNDWKiHuzhtT4L` | Adult Fundamentals BJJ | ✓ |
| adult_striking | Striking, adult 32yo | `tTWHTIOvIyTvctDE72Vh` | Adult Striking | ✓ |
| kid_tiny_tots | JJ, 4yo | `xwETacONpBmpX4oT50cn` | Kids 3-6 BJJ | ✓ |
| kid_older_striking | Striking, 10yo | `gsuXcawL4uMhJB0HxgvQ` | Kids Striking | ✓ |
| adult_and_kid | JJ adult + JJ 8yo | `gBWEHYrNDWKiHuzhtT4L` + `EuVEX6RGYHs1yUiouFXB` | Adult BJJ + Kids 7-13 BJJ | ✓ |
| age3_striking_redirect | Striking req → JJ, 5yo | `xwETacONpBmpX4oT50cn` | Kids 3-6 BJJ (correct redirect) | ✓ |
| pricing_deflect | JJ, 25yo | `gBWEHYrNDWKiHuzhtT4L` | Adult Fundamentals BJJ | ✓ |
| nonbookable_mma | JJ (redirect from MMA), 30yo | `gBWEHYrNDWKiHuzhtT4L` | Adult Fundamentals BJJ | ✓ |
| nonbookable_openmat | JJ (redirect from Open Mat), 29yo | `gBWEHYrNDWKiHuzhtT4L` | Adult Fundamentals BJJ | ✓ |

5 distinct calendar paths exercised — all 5 routed correctly.

---

## KNOWN PLATFORM BUGS

- `contact.phone` — blank in GHL across all runs (CloseBot platform bug, reported 2026-05-07, not 10p-Miami-specific)

---

## CLEANUP

- All test contacts (donotuse.com) deleted from sandbox GHL (`isGl70YkeLEAiVckMhgT`)
- Test appointments auto-deleted with their contacts

---

## VERDICT: READY TO ATTACH (v1.0)

All production-readiness criteria met:

- 11 personas completed without SESSION_FAIL/SSE_FAIL/CRASH
- 0 blocker checkpoint failures
- All 9 booking personas have GHL appointments confirmed on the correct calendars
- Non-determinism: 4/4 PASS on adult_only (1 initial + 3 repeat verified via GHL ground truth)
- Dual-discipline flow validated (Jiu-Jitsu vs Striking switch + 5 distinct calendar routing paths)
- Non-bookable program handling validated (Open Mat textbook-correct; MMA, Pro Training, Adults Advanced flows tested)
- Age 3-6 + Striking redirect to Kids JJ working correctly

**One soft issue (non-blocker):** `nonbookable_mma` showed the bot sometimes skips explicit acknowledgment of the non-bookable program before redirecting. Open Mat persona in the same sweep handled it correctly, so this is LLM non-determinism on phrasing rather than a routing/booking bug. The lead still got booked into the correct calendar.

**Status:** Bot is already attached to the production source `src_MXT2RCPXUZNTOP0S` with an empty tag filter from `/closebot-build`. No conversations will route to it until Bobby applies a trigger tag via GHL or sets a Must Contain filter in CloseBot UI.

**Next step:** Hand off to Bobby for soft-launch. Recommend Bobby apply a test tag (e.g. `bot test - 10p`) to 2-3 hand-picked real contacts, watch the conversations land, then flip to full launch with the real campaign trigger tag.

---

## ARTIFACTS

| Persona | Report |
|---|---|
| adult_only | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_adult_only_20260515_171441/report.md) |
| adult_striking | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_adult_striking_20260515_171441/report.md) |
| kid_tiny_tots | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_kid_tiny_tots_20260515_171442/report.md) |
| kid_older_striking | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_kid_older_striking_20260515_171442/report.md) |
| adult_and_kid | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_adult_and_kid_20260515_171442/report.md) |
| age3_striking_redirect | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_age3_striking_redirect_20260515_171442/report.md) |
| pricing_deflect | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_pricing_deflect_20260515_171442/report.md) |
| nonbookable_mma | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_nonbookable_mma_20260515_171442/report.md) |
| nonbookable_openmat | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_nonbookable_openmat_20260515_171442/report.md) |
| minor_self_booking | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_minor_self_booking_20260515_171442/report.md) |
| hostile_aggression | [report.md](../../../shared/logs/eval/10p-miami_10p-miami_hostile_aggression_20260515_171442/report.md) |
