# QA Summary — All In Jiu-Jitsu (v2.2 scope guard)

**Bot:** All In Jiu-Jitsu - Launch v2.2 [scope guard fix, multi-enrollee] (2026-05-18)
**Bot ID:** `bot_D4H6ZU35D7Z2LICH`
**Run date:** 2026-05-18
**Sweep script:** `shared/scripts/closebot/eval/sweep_allinjujitsu.sh`

---

## Context — why v2.2

v2.0 had systemic false-closure (mnd_05) + minor-gate mismatch. v2.1 passed QA for single-enrollee paths but multi-enrollee scope was untested. v2.2 applies the scope guard suffix to every Booking Description node (`. Book one trial only - additional enrollees are handled in a separate step`), preventing the AI from consuming a second enrollee within the same Booking node's 15-iteration budget. All In is a single-kids-cal gym (1 adult + 1 kids calendar), same risk profile as Bodega Jiu-Jitsu v2.2.

---

## Persona Results

| Persona | Run ID | Verdict | Blockers | Flags | GHL |
|---|---|---|---|---|---|
| adult_only | allinjujitsu_allinjujitsu_adult_only_20260518_050432 | PASS | 0 | 0 | booked |
| kid_young | allinjujitsu_allinjujitsu_kid_young_20260518_050657 | PASS | 0 | 0 | booked |
| kid_older | allinjujitsu_allinjujitsu_kid_older_20260518_051010 | PASS | 0 | 0 | booked |
| kid_boundary_12 | allinjujitsu_allinjujitsu_kid_boundary_12_20260518_051247 | PASS | 0 | 0 | booked |
| adult_and_kid | allinjujitsu_allinjujitsu_adult_and_kid_20260518_051556 | PASS | 0 | 0 | 2 booked |
| teen_13_17_nocal | allinjujitsu_allinjujitsu_teen_13_17_nocal_20260518_052148 | PASS | 0 | 0 | no booking (correct) |
| under5_redirect | allinjujitsu_allinjujitsu_under5_redirect_20260518_052506 | PASS | 0 | 0 | no booking (correct) |
| nonbookable_alllevels | allinjujitsu_allinjujitsu_nonbookable_alllevels_20260518_052830 | PASS | 0 | 0 | n/a |
| pricing_deflect | allinjujitsu_allinjujitsu_pricing_deflect_20260518_053029 | PASS | 0 | 0 | n/a |
| minor_self_booking | allinjujitsu_allinjujitsu_minor_self_booking_20260518_053235 | PASS | 0 | 0 | no booking (correct) |
| hostile_aggression | allinjujitsu_allinjujitsu_hostile_aggression_20260518_053502 | FAIL* | 1* | 0 | 0 appts (correct) |

* Eval false-positive — not a real bot bug. See analysis below.

---

## Non-Determinism (adult_only x3)

| Run | Run ID | Verdict |
|---|---|---|
| Run 1 | allinjujitsu_allinjujitsu_adult_only_20260518_054025 | PASS |
| Run 2 | allinjujitsu_allinjujitsu_adult_only_20260518_054254 | PASS |
| Run 3 | allinjujitsu_allinjujitsu_adult_only_20260518_054512 | PASS |

3/3 PASS -- clean.

---

## Scope Guard Validation (adult_and_kid)

GHL confirmed 2 separate appointments on 2 different sandbox calendars:

- Appt `pWZIYslL4XhSkaVbjRgz` -> sandbox Adult Fundamentals BJJ calendar
- Appt `7Eg7lnfs4uiCRhzfn6tq` -> sandbox Kids 5-12 BJJ calendar

Contact tags: `youth`, `booked`, `adult` -- all three present, both enrollee paths completed. QA agent initially fired mnd_05 but GHL Verifier overrode to PASS (2 real appointments confirmed).

---

## hostile_aggression FAIL -- False-Positive Analysis

What fired: `mnd_05` (No false closure) -- QA agent flagged "You're all set" at T4/T7.

What actually happened: Lead opened with "stop texting me, i never signed up for this." Bot correctly acknowledged the opt-out, said it would remove the lead, and closed with "You're all set. Take care." No booking attempted. No booking tool fired. GHL contact has 0 appointments -- correct behavior.

Why it fires: QA agent pattern-matches "You're all set" as a booking confirmation. In an opt-out context, it is a removal acknowledgment. The mnd_05 checkpoint is not scoped to exclude non-booking closures. Same false-positive confirmed on Bodega v2.2.

Verdict: Not a bot bug. Not blocking.

---

## Known Platform Bugs

- contact.phone blank in GHL across all runs (CloseBot platform bug, reported 2026-05-07). Not blocking.

---

## Transcript Links

- [adult_only](../../shared/logs/eval/allinjujitsu_allinjujitsu_adult_only_20260518_050432/report.md)
- [kid_young](../../shared/logs/eval/allinjujitsu_allinjujitsu_kid_young_20260518_050657/report.md)
- [kid_older](../../shared/logs/eval/allinjujitsu_allinjujitsu_kid_older_20260518_051010/report.md)
- [kid_boundary_12](../../shared/logs/eval/allinjujitsu_allinjujitsu_kid_boundary_12_20260518_051247/report.md)
- [adult_and_kid](../../shared/logs/eval/allinjujitsu_allinjujitsu_adult_and_kid_20260518_051556/report.md)
- [teen_13_17_nocal](../../shared/logs/eval/allinjujitsu_allinjujitsu_teen_13_17_nocal_20260518_052148/report.md)
- [under5_redirect](../../shared/logs/eval/allinjujitsu_allinjujitsu_under5_redirect_20260518_052506/report.md)
- [nonbookable_alllevels](../../shared/logs/eval/allinjujitsu_allinjujitsu_nonbookable_alllevels_20260518_052830/report.md)
- [pricing_deflect](../../shared/logs/eval/allinjujitsu_allinjujitsu_pricing_deflect_20260518_053029/report.md)
- [minor_self_booking](../../shared/logs/eval/allinjujitsu_allinjujitsu_minor_self_booking_20260518_053235/report.md)
- [hostile_aggression](../../shared/logs/eval/allinjujitsu_allinjujitsu_hostile_aggression_20260518_053502/report.md) (false-positive)
- [non-det run 1](../../shared/logs/eval/allinjujitsu_allinjujitsu_adult_only_20260518_054025/report.md)
- [non-det run 2](../../shared/logs/eval/allinjujitsu_allinjujitsu_adult_only_20260518_054254/report.md)
- [non-det run 3](../../shared/logs/eval/allinjujitsu_allinjujitsu_adult_only_20260518_054512/report.md)

---

## VERDICT: READY TO ATTACH

Parked on sandbox (src_4R4DUIQTMMX2NFPU). Do NOT attach to production source (src_PQQCANSMZ8CS09UA) without Bobby's explicit soft-launch authorization.

- 10/11 personas PASS, 0 real blocker fails
- 1 FAIL (hostile_aggression) is a confirmed eval false-positive
- 3/3 non-determinism on adult happy path
- Multi-enrollee scope guard validated: 2 GHL appointments on 2 distinct calendars
- GHL Verifier confirmed appointments on all booking personas
