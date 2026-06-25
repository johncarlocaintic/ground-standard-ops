# QA Summary — Mason Dixon Jiu-Jitsu

**Bot:** Mason Dixon Jiu-Jitsu - Launch v1.1 [discipline ask node] (2026-05-16)
**Bot ID:** `bot_3P1NY57E1LMYV52X`
**Run date:** 2026-05-16
**Sandbox source:** `src_4R4DUIQTMMX2NFPU` (GS Ads)
**KB attached to sandbox:** `file_K8E6900W9STUOHBZ` (mason_dixon_kb_v2.0.0.txt) — attached at start of this run (was missing from sandbox, only on prod source)

---

## PERSONA RESULTS

```
PERSONA                        VERDICT             BLOCKERS  GHL OUTCOME
──────────────────────────────────────────────────────────────────────────────
adult_bjj                      PASS (QA false+)*   0         booked → Adult Fundamentals BJJ
adult_striking                 PASS (verified)      0         booked → Adult Striking
kid_5                          PASS (verified)      0         booked → Kids 4-7 Martial Arts
kid_10                         FAIL                 1         0 appts — false closure
adult_and_kid                  FAIL                 2         1 appt (kid only) — adult missing
pricing_deflect                FAIL                 1         0 appts — false closure
minor_self_booking             PASS (verified)      0         no appt (correct)
nonbookable_private            PASS (verified)      0         no appt (correct)
```

\* adult_bjj: QA agent flagged 3 blockers (mnd_02 "No-Gi" naming, md_02 discipline ask, md_04 routing). GHL ground truth overrides all three — 1 appointment confirmed on Adult Fundamentals BJJ (correct calendar). Repeat runs 3/3 confirmed same correct routing. Classified as QA false positive.

---

## REPEAT RUN (adult_bjj ×3)

```
Run 1 (021009): GHL appointment on Adult Fundamentals BJJ ✓
Run 2 (021245): GHL appointment on Adult Fundamentals BJJ ✓
Run 3 (021509): GHL appointment on Adult Fundamentals BJJ ✓
```

3/3 correct calendar. QA agent failed all 3 on same false positives. Booking path is stable.

---

## REAL BLOCKERS

### 1. adult_and_kid — Multi-enrollee adult booking missing (md_04, md_05)

Bot said "You and Jake are both booked Monday, May 18th at 10am" but GHL shows only 1 appointment — Jake's on Kids 4-7 Martial Arts. Wesley's adult BJJ booking was never created.

The multi-enrollee path books the kid but silently skips the adult booking. This is a real production bug — parents enrolling themselves alongside their child would get only the kid's appointment.

**Fix needed:** Investigate the multi-enrollee KDL path. The adult booking node is not firing after the youth booking completes. May need to verify the `Next handle` connection between the Kids Booking node and the Adult Booking node.

### 2. kid_10 — False closure on failed booking (mnd_05)

Lead (parent) asked for evenings/weekends for a 10-year-old. Bot tried to pull kids schedule, said "I don't currently have the specific kids class schedule in front of me," bailed to instructor-will-call handoff, then confirmed "You're all set, Hayden! Ryan or someone from the team will give you a call." 0 GHL appointments.

Root cause: sandbox Kids 8-13 Martial Arts calendar had no evening/weekend slots available. Bot took the "no slots match preference" branch and handed off — but the handoff branch ends with closing language that implies the booking happened.

**Production concern:** If Mason Dixon's real Kids 8-13 calendar has evening/weekend slots, this would not occur. But if a lead requests an unavailable time, the bot should NOT close with "You're all set" — it should close with "someone will reach out to schedule." The current handoff path language is ambiguous enough to create a false expectation.

### 3. pricing_deflect — False closure on failed booking (mnd_05)

Same pattern as kid_10. Lead requested Saturday afternoon. Bot said "I don't have the exact Saturday afternoon class times in front of me right now. Let me have one of the instructors reach out." Then closed with "See you Saturday!" — 0 GHL appointments.

---

## STANDARD FAILS (non-blockers, consistent across all runs)

**mnd_04 + md_12 (hardcoded schedule):** Bot is quoting specific class times from the booking tool's availability output rather than silently offering the slot picker. Example: "We run Adult Fundamentals classes at 9:00 AM, 10:30 AM, 4:00 PM, and 5:30 PM Monday through Friday." This is technically violating the spec rule ("let the booking tool show live slots") but is not a booking failure — the bot IS using the booking tool, it's just reciting the times it found. Standard fail, not a blocker.

---

## PRE-FLIGHT NOTES

**KB missing from sandbox at run start:** The Mason Dixon KB (v2.0.0) was only attached to the production source (`src_WEF7GLL3UCZIR97M`), not the sandbox (`src_4R4DUIQTMMX2NFPU`). First 3 runs (before KB was attached) failed with hallucinated programs (Karate, Judo, Conditioning from sandbox contamination). KB was attached mid-session; all 8 official personas ran with KB present. Spec updated: `kbReady: true`.

**QA false positive — adult_bjj mnd_02:** The Mason Dixon KB uses "No-Gi Jiu-Jitsu" terminology. Bot says "We offer No-Gi Jiu-Jitsu" in its intro. QA agent flags this as a hallucinated program. GHL truth: booking always lands on Adult Fundamentals BJJ (correct calendar). Not a real issue — the KB terminology and the calendar name are slightly different but refer to the same program.

**QA false positive — adult_bjj md_02:** Rubric requires bot to explicitly ask "BJJ or Striking?" before booking. When the lead opens with "I want jiu-jitsu," bot correctly infers discipline and routes to BJJ without asking. GHL confirms correct calendar. Rubric is too strict for cases where the lead has already stated their program.

---

## KNOWN PLATFORM BUGS

- `contact.phone` — blank in GHL across all runs (CloseBot platform bug, reported 2026-05-07)

---

## CALENDAR ROUTING — GROUND TRUTH

| Persona | Program | Calendar Booked | Expected | Match |
|---|---|---|---|---|
| adult_bjj | BJJ, adult | Adult Fundamentals BJJ | Adult Fundamentals BJJ | ✓ |
| adult_striking | Striking, adult | Adult Striking | Adult Striking | ✓ |
| kid_5 | Kids MA, 5yo | Kids 4-7 Martial Arts | Kids 4-7 Martial Arts | ✓ |
| kid_10 | Kids MA, 10yo | — | Kids 8-13 Martial Arts | ✗ (0 appts) |
| adult_and_kid | BJJ+Kids, adult+7yo | Kids 4-7 Martial Arts only | Both adult + kids | ✗ (adult missing) |
| pricing_deflect | BJJ, adult | — | Adult Fundamentals BJJ | ✗ (0 appts) |

---

## VERDICT: NOT READY — 3 issues to fix

**Blockers:**
1. Multi-enrollee adult booking not firing — only kid gets booked
2. False closure on slot-not-available path — bot closes with "see you [day]!" when no appointment was created (kid_10, pricing_deflect)

**Before re-test:**
1. Fix multi-enrollee KDL — ensure adult booking node fires after youth booking completes
2. Fix handoff path closing language — "someone will reach out" not "see you [day]!"
3. Rebuild as v1.2 via `/closebot-build`

---

## ARTIFACTS

| Persona | Report |
|---|---|
| adult_bjj | [report.md](../../../shared/logs/eval/masondixon_masondixon_adult_bjj_20260516_014045/report.md) |
| adult_striking | [report.md](../../../shared/logs/eval/masondixon_masondixon_adult_striking_20260516_014348/report.md) |
| kid_5 | [report.md](../../../shared/logs/eval/masondixon_masondixon_kid_5_20260516_014652/report.md) |
| kid_10 | [report.md](../../../shared/logs/eval/masondixon_masondixon_kid_10_20260516_015209/report.md) |
| adult_and_kid | [report.md](../../../shared/logs/eval/masondixon_masondixon_adult_and_kid_20260516_015518/report.md) |
| pricing_deflect | [report.md](../../../shared/logs/eval/masondixon_masondixon_pricing_deflect_20260516_015901/report.md) |
| minor_self_booking | [report.md](../../../shared/logs/eval/masondixon_masondixon_minor_self_booking_20260516_020204/report.md) |
| nonbookable_private | [report.md](../../../shared/logs/eval/masondixon_masondixon_nonbookable_private_20260516_020459/report.md) |

### Repeat runs (adult_bjj ×3)

| Run | Report |
|---|---|
| Repeat 1 | [report.md](../../../shared/logs/eval/masondixon_masondixon_adult_bjj_20260516_021009/report.md) |
| Repeat 2 | [report.md](../../../shared/logs/eval/masondixon_masondixon_adult_bjj_20260516_021245/report.md) |
| Repeat 3 | [report.md](../../../shared/logs/eval/masondixon_masondixon_adult_bjj_20260516_021509/report.md) |
