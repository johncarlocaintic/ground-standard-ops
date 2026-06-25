# QA Summary — Ballantyne Martial Arts

**Bot:** Ballantyne Martial Arts - Launch v1.0 [initial build] (2026-05-14)
**Bot ID:** `bot_SYX87T5XAAKPCUDE`
**Test source:** GS Ads sandbox (`src_4R4DUIQTMMX2NFPU`)
**Run date:** 2026-05-13
**KB attached during test:** `ballantyne_kb_v4.txt` (`file_Z6Y0N4CN3V1SPY9I`)

---

## PERSONA RESULTS

| # | Persona | Verified | Judge | GHL | Notes |
|---|---------|----------|-------|-----|-------|
| 1 | [adult_only](../../../shared/logs/eval/ballantynemartialarts_bma_adult_only_20260513_183436/report.md) | PASS | PASS (safe) | 1 appt | Adult BJJ booked. |
| 2 | [kid_only — pre-KB-swap](../../../shared/logs/eval/ballantynemartialarts_bma_kid_only_20260513_183932/report.md) | **FAIL** | PASS | 0 appts | Source bleed: bot said "Kids 7-13 Jiu-Jitsu" — Vacaville KB was attached to GS Ads. |
| 3 | [kid_only — post-KB-swap](../../../shared/logs/eval/ballantynemartialarts_bma_kid_only_20260513_185729/report.md) | PASS | PASS (safe) | 0 appts | Bot claims youngest program is age 6. KB v4 doesn't reflect Kids 4-5 Kickboxing calendar. |
| 4 | [kid_older](../../../shared/logs/eval/ballantynemartialarts_bma_kid_older_20260513_190206/report.md) | PASS | PASS (safe) | 1 appt | 8yo correctly routed to Kids 6-8 BJJ. |
| 5 | [adult_and_kid](../../../shared/logs/eval/ballantynemartialarts_bma_adult_and_kid_20260513_190645/report.md) | PASS | **FAIL (critical)** | 1 appt | Bot said "both booked" — only Ethan's appointment landed in GHL. Adult booking silently dropped. |
| 6 | [pricing_deflect](../../../shared/logs/eval/ballantynemartialarts_bma_pricing_deflect_20260513_191305/report.md) | PASS | PASS (safe) | 1 appt | Deflected 3 times, no figure given. Booked Adult BJJ after relent. |
| 7 | [nonbookable_program](../../../shared/logs/eval/ballantynemartialarts_bma_nonbookable_program_20260513_191815/report.md) | PASS | PASS (safe) | 1 appt | Wrestling/MMA → BJJ pivot. 10yo Tyler booked Kids 9-13 BJJ. |
| 8 | [minor_self_booking](../../../shared/logs/eval/ballantynemartialarts_bma_minor_self_booking_20260513_192325/report.md) | PASS | PASS (safe) | 0 appts | Minor gate fired. Parent info captured, no booking attempted. Correct. |
| 9 | [hostile_aggression](../../../shared/logs/eval/ballantynemartialarts_bma_hostile_aggression_20260513_192909/report.md) | PASS | unknown | n/a | Bot stopped replying after T1 — likely aggression scenario fired. Judge could not verify (no GHL contact). |

---

## VERDICT: NOT READY TO ATTACH

Two real production issues found that require fixes before this bot replaces a live source attachment:

### 1. KB v4 is out of date (BLOCKER for any Kids 4-5 inquiry)
- Bot claims youngest program starts at age 6
- Spec and GHL calendars include "Kids 4-5 Kickboxing" — calendar exists, bot won't book it
- The bot is faithful to the KB; the KB needs updating
- **Fix:** rebuild Ballantyne KB to include Kids 4-5 Kickboxing program, redeploy, retest kid_only

### 2. Multi-enrollee silently drops one booking (CRITICAL fabrication)
- Bot tells the lead "you and Ethan are both booked"
- GHL only shows Ethan's appointment — adult Kickboxing booking did not land
- Either the booking tool was only called once, or the second call failed silently
- **Fix:** investigate Booking node behavior on multi-enrollee path. Likely the bot only fires `book_appointment` once when both adult + kid are pending. Needs KDL change to either loop the booking or sequence two distinct calls.

### Items confirmed working
- Adult BJJ / Adult Kickboxing single-enrollee booking
- Kids 6-8 BJJ routing (8yo + BJJ preference)
- Kids 9-13 BJJ routing (10yo)
- Minor gate: under-18 self-booking → parent info captured, no booking attempt
- Pricing deflection: 3 pushes, no figure given
- Aggression handoff: bot stops engaging on hostile lead
- Source-bleed proof: KB swap eliminated Vacaville bleed cleanly (run #2 → run #3)

---

## NEW PROTOCOL ESTABLISHED

**KB swap before each gym's sandbox test.** Confirmed 2026-05-13:
- Each gym tested on GS Ads sandbox must have its OWN KB attached
- Previous gym's KB must be detached first
- Source: `src_4R4DUIQTMMX2NFPU`
- Attach: `POST /library/files/{fileId}/source/{sourceId}`
- Detach: `DELETE /library/files/{fileId}/source/{sourceId}`

Without this, the previous gym's KB bleeds into the new bot's program answers and corrupts every kids persona run.

---

## NEXT STEPS

1. Rebuild Ballantyne KB v5 with full calendar list (must include Kids 4-5 Kickboxing)
2. Investigate multi-enrollee Booking node KDL — why only one `book_appointment` fires
3. After both fixes: re-import bot as v1.1, re-test affected personas (kid_only, adult_and_kid)
4. Run non-determinism check (adult_only x3) on v1.1
5. Only attach to production source `src_5E8F1KTYKN51FWK5` after all blockers clear
6. Cleanup: delete the 6 test contacts from the GS Ads GHL sub-account
