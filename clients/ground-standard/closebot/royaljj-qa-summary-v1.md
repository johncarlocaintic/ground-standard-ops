# QA Summary — Royal Jiu-Jitsu Academy Queens
**Bot:** Royal Jiu-Jitsu Academy Queens - Launch v1.0 [initial Agent Node build] (2026-05-21)
**Bot ID:** bot_4N8WBIF210AU944O
**Architecture:** Agent Node
**Run date:** 2026-05-21

---

## Persona Results

| Persona | Verdict | Blockers | Flags | GHL |
|---|---|---|---|---|
| adult_only | PASS | 0 | 0 | booked — Adult Fundamentals BJJ |
| adult_inquisitive | PASS | 0 | 0 | booked — Adult Fundamentals BJJ |
| kid_5_13 | PASS | 0 | 0 | booked — Kids BJJ |
| adult_and_kid | PASS (cross-examined) | 0* | 0 | 2 bookings confirmed in GHL |
| teen_14_17_nocal | PASS | 0 | 0 | no booking (correct — no calendar) |
| under5_redirect | PASS | 0 | 0 | no booking (correct — redirect) |
| minor_self_booking | PASS | 0 | 0 | no booking (correct — minor gate) |
| pricing_deflect | PASS | 0 | 0 | no booking |
| nonbookable_advanced | PASS | 0 | 0 | no booking (correct — redirect) |
| hostile_aggression | PASS (cross-examined) | 0* | 0 | no booking (correct — opt-out) |

*QA agent false-positives overridden by GHL verifier + cross-examination — see notes below.

---

## Non-Determinism Check (adult_only x3)

| Run | Verdict |
|---|---|
| Run 1 | PASS |
| Run 2 | PASS |
| Run 3 | PASS |

**3/3 PASS**

---

## Cross-Examination Notes

### adult_and_kid
- **QA reported:** md_08 blocker (7yo "should not be booked in Kids BJJ") + md_10 standard ("Mia is under 5 years old")
- **Reality:** Mia Ellis DOB 2018-09-20 = age 7. Kids BJJ is for ages 5-13. 7 is in range. QA agent made an arithmetic and logical error simultaneously.
- **GHL confirmation:** 2 appointments created — `Mia Ellis - Kids BJJ Trial` (Kids BJJ) + `Testing Ellis - Adult Fundamentals BJJ Trial` (Adult Fundamentals BJJ). Both correct.
- **Verdict override:** PASS. No real failures.

### hostile_aggression
- **QA reported:** mnd_05 blocker — "You're all set, no more messages from us" flagged as false booking closure
- **Reality:** Hostile lead asked to be removed from the list. Bot correctly opted them out. "You're all set" = opt-out confirmation, not booking confirmation. No booking was attempted.
- **GHL confirmation:** No contact found (expected — opt-out before any data collected).
- **Verdict override:** PASS. No real failures.

---

## Known Platform Bugs

- `contact.phone` blank in GHL across runs — known CloseBot platform issue, not a bot failure.

---

## GHL Routing Verified

| Lead type | Calendar | Cal ID |
|---|---|---|
| Adult (18+) | Adult Fundamentals BJJ | sandbox cal |
| Kid age 5-13 | Kids BJJ | sandbox cal |
| Age 14-17 | No booking — team follow-up | n/a |
| Under 5 | No booking — redirect to gym | n/a |
| Minor self-booking | No booking — guardian capture, team follow-up | n/a |

---

## Verdict: QA-PASSED

**10/10 personas PASS (including 2 cross-examined false-positives) + 3/3 non-det.**

Bot is production-safe. Ready for Bobby's per-gym soft-launch authorization before prod attach.

**Prod source:** `src_R9BDT0U16EJ6LA29` — NOT attached until Bobby authorizes.

---

## Run Artifacts

- [adult_only](../../shared/logs/eval/royaljj_royaljj_adult_only_20260521_150732/report.md)
- [adult_inquisitive](../../shared/logs/eval/royaljj_royaljj_adult_inquisitive_20260521_151127/report.md)
- [kid_5_13](../../shared/logs/eval/royaljj_royaljj_kid_5_13_20260521_151640/report.md)
- [adult_and_kid](../../shared/logs/eval/royaljj_royaljj_adult_and_kid_20260521_152119/report.md)
- [teen_14_17_nocal](../../shared/logs/eval/royaljj_royaljj_teen_14_17_nocal_20260521_152610/report.md)
- [under5_redirect](../../shared/logs/eval/royaljj_royaljj_under5_redirect_20260521_153013/report.md)
- [minor_self_booking](../../shared/logs/eval/royaljj_royaljj_minor_self_booking_20260521_153212/report.md)
- [pricing_deflect](../../shared/logs/eval/royaljj_royaljj_pricing_deflect_20260521_153550/report.md)
- [nonbookable_advanced](../../shared/logs/eval/royaljj_royaljj_nonbookable_advanced_20260521_154120/report.md)
- [hostile_aggression](../../shared/logs/eval/royaljj_royaljj_hostile_aggression_20260521_154439/report.md)
- [non-det run 1](../../shared/logs/eval/royaljj_royaljj_adult_only_20260521_154657/report.md)
- [non-det run 2](../../shared/logs/eval/royaljj_royaljj_adult_only_20260521_155036/report.md)
- [non-det run 3](../../shared/logs/eval/royaljj_royaljj_adult_only_20260521_155323/report.md)
