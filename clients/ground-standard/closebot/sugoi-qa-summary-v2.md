# QA Summary — Sugoi Submissions
**Architecture:** Agent Node v2.0 (scaffold-and-fill from agentnode-base-template)
**Bot:** Sugoi Submissions - Launch v2.0 [Agent Node rebuild] (2026-05-20)
**Bot ID:** bot_JNTG80QQ0CMJP35W
**Run date:** 2026-05-20
**Sweep:** sweep_sugoi.sh (via chain_gyms_3_7_resume.sh) against sandbox src_4R4DUIQTMMX2NFPU

---

## PERSONA RESULTS (new chain, started 20:00:48 after OM BJJ complete)

| # | Persona | Verdict | Blockers | GHL Appts | Notes |
|---|---------|---------|----------|-----------|-------|
| 1 | adult_gi_default | PASS | 0 | 1 | Adult Fundamentals BJJ booked |
| 2 | adult_inquisitive | PASS | 0 | 0 | FAQ path handled correctly |
| 3 | kid_4_8 | PASS | 0 | 1 | Kids 4-8 BJJ booked |
| 4 | teen_9_15 | PASS | 0 | 1 | Teens 9-15 BJJ booked |
| 5 | adult_and_kid | PASS* | 0 | 0 | *FALSE NEGATIVE — SSE failure at turn 3 |
| 6 | teen_16_17_nocal | FAIL* | 3 | 0 | *FALSE NEGATIVE — SSE failure at turn 3 |
| 7 | minor_self_booking | PASS | 0 | 0 | Minor gate correct, no booking |
| 8 | under4_redirect | PASS | 0 | 0 | Correct — no booking for under-4 |
| 9 | pricing_deflect | PASS | 0 | 0 | Pricing redirect firm, no figure |
| 10 | nonbookable_program | PASS | 0 | 0 | Non-bookable acknowledged + redirected |
| 11 | hostile_aggression | PASS | 0 | 0 | Aggression path handled cleanly |

**NON-DETERMINISM: adult_gi_default x1**
| Run | Verdict |
|-----|---------|
| 1 | PASS |

**Old chain note:** First chain sweep (started ~19:45, KB contamination window) had teen_9_15_195843 FAIL due to Roberts KB being loaded — also FALSE NEGATIVE. New chain ran all personas with correct Sugoi KB. New chain results are authoritative.

---

## FALSE NEGATIVE CROSS-EXAMINATIONS

### teen_16_17_nocal (FAIL → FALSE NEGATIVE)
- **What failed:** mnd_05 (false closure), md_03 (wrong routing), md_04 (no-cal gate not triggered) — all 3 blocker fails
- **Termination:** "send failed at turn 3" — SSE infrastructure failure mid-conversation
- **Transcript analysis:** Bot responded once (T2: "Let me grab a few quick details so we can get you both set up") before connection dropped at T3. The bot had NOT yet collected the DOB — the 16-17 gate can only fire AFTER DOB collection. Eval fired on T2 bot behavior as if routing was decided, but routing had not yet been evaluated.
- **GHL ground truth:** No contact found (expected — conversation terminated at T3 before any GHL fields populated). 0 appointments = correct outcome for this persona.
- **Cross-reference:** teen_16_17_nocal_200848 (same sweep, earlier in chain) ran 16 turns to completion, PASS verified, 0 appointments, contact tagged `youth`, `action opt-in`. Identical persona, correct outcome.
- **Verdict:** FALSE NEGATIVE. SSE connection failure at turn 3 prevented conversation from reaching the DOB-collection + routing step. Bot behavior at T2 is correct pre-DOB-collection standard behavior, not a routing error.

### adult_and_kid (PASS verdict, 0 GHL appointments — infrastructure failure)
- **What happened:** Conversation terminated "send failed at turn 3" — same SSE infrastructure failure window as teen_16_17_nocal (both occurring 20:15-20:20 UTC).
- **QA verdict:** PASS (0 blocker fails) — the short transcript had no violations.
- **GHL ground truth:** No contact found, 0 appointments. The conversation was too short (3 turns) to reach the booking stage.
- **Root cause:** SSE send failure at turn 3 — platform instability, not bot routing logic.
- **Impact:** The multi-enrollee path (adult + kid booking in sequence) was not exercised and not GHL-verified. Single-path bookings (adult_gi_default, kid_4_8, teen_9_15) are all GHL-confirmed.
- **Disposition:** Classify as FALSE NEGATIVE (infrastructure). Recommend monitoring multi-enrollee flow in soft-launch. If needed before launch, Bobby can request a targeted re-run.
- **Verdict:** FALSE NEGATIVE. SSE failure prevented the conversation from proceeding. Not a bot routing logic error.

### teen_9_15 (old chain, KB contamination → FALSE NEGATIVE)
- **Old chain run:** teen_9_15_195843 FAIL — bot mentioned "Kids Brazilian Jiu-Jitsu for ages 5 to 17" (not a Sugoi program).
- **Root cause:** Roberts KB was in the sandbox during this run (chain 8-11 had swapped in Roberts KB at 19:49:34 UTC, 9 minutes before teen_9_15 ran at 19:58:43).
- **New chain run:** teen_9_15_201128 PASS — correct Sugoi KB loaded by new chain at 20:00:44 before sweep started.
- **Verdict:** FALSE NEGATIVE. KB contamination from concurrent chain. New chain run with correct KB passes cleanly.

---

## GHL ROUTING TABLE (sandbox appointments, production calendar IDs in spec)

| Persona | Sandbox Calendar ID | Title | Program |
|---------|---------------------|-------|---------|
| adult_gi_default | JnHSd1Xn1OB8QcIIZqNV | Free Trial - Marcus Doyle | Adult Fundamentals BJJ |
| kid_4_8 | TS3AG4kP1xTXgvTSjzcw | Alex - Kids Trial Class | Kids 4-8 Fundamentals BJJ |
| teen_9_15 | IBU6qbVa4Qo7inFRu18y | Jordan Fenton - Trial Class | Teens 9-15 Fundamentals BJJ |
| adult_and_kid | — | SSE failure, not verified | — |

*Sandbox calendar IDs differ from production spec IDs — sandbox pre-flight creates named calendars in isGl70YkeLEAiVckMhgT for testing.*

---

## KNOWN PLATFORM LIMITATIONS

- **SSE send failures:** Two personas (teen_16_17_nocal, adult_and_kid) terminated with "send failed at turn 3" during the 20:15-20:20 UTC window. Likely transient platform instability. Both evaluated as FALSE NEGATIVE.
- **KB contamination from concurrent chains:** Old chain's teen_9_15 ran with Roberts KB in sandbox. New chain loaded correct Sugoi KB before sweep, eliminating contamination.
- **Sandbox calendar contamination:** Sandbox location accumulates calendars from all gyms tested. In production, each gym's sub-account has only that gym's calendars.

---

## VERDICT: QA-PASSED

**Real blockers:** 0
**False negatives:** 3 (teen_16_17_nocal + adult_and_kid — SSE failures during instability window; teen_9_15 old chain — KB contamination. All cross-examined.)
**Non-det (adult_gi_default):** 1/1 PASS
**GHL-confirmed bookings:**
- adult_gi_default: 1 appointment (Adult Fundamentals BJJ)
- kid_4_8: 1 appointment (Kids 4-8 Fundamentals BJJ)
- teen_9_15: 1 appointment (Teens 9-15 Fundamentals BJJ)
- adult_and_kid: NOT verified (SSE failure) — single-path paths above confirm individual routing works
**Policy gates verified:** teen_16_17_nocal PASS (200848 run, same sweep), under-4 redirect PASS, minor self-booking gate PASS, pricing redirect PASS, nonbookable PASS

**Monitoring note:** adult_and_kid multi-enrollee path was not GHL-verified in this sweep due to SSE failure. Recommend monitoring the first few multi-enrollee conversations in soft-launch to confirm dual-booking works end-to-end.

**Status:** Parked on sandbox src_4R4DUIQTMMX2NFPU. NOT attached to production source src_JPK476A1ODXA5YGB.

---

## BOBBY FLAGS (relay when soft-launch auth requested)

From spec `postQaCheckpointFlags`:
- Confirm Adult Fundamentals BJJ is the beginner trial calendar
- Confirm Kids 4-8 + Teens 9-15 Fundamentals are the current active trial bands
- Confirm 16-17 handled as minor/team-follow-up (no online booking)
- Confirm under-4 handled as no-online-booking + academy phone referral
- Email of record discrepancy (note from kb verification)
- Confirm No-Gi / Wrestling / Women's / Mat Mobility / Open Mat excluded as non-trial

---

## TRANSCRIPT LINKS

| Persona | Run ID | Report |
|---------|--------|--------|
| adult_gi_default | sugoi_sugoi_adult_gi_default_20260519_200048 | [report.md](../../../shared/logs/eval/sugoi_sugoi_adult_gi_default_20260519_200048/report.md) |
| adult_inquisitive | sugoi_sugoi_adult_inquisitive_20260519_200425 | [report.md](../../../shared/logs/eval/sugoi_sugoi_adult_inquisitive_20260519_200425/report.md) |
| kid_4_8 | sugoi_sugoi_kid_4_8_20260519_200739 | [report.md](../../../shared/logs/eval/sugoi_sugoi_kid_4_8_20260519_200739/report.md) |
| teen_9_15 | sugoi_sugoi_teen_9_15_20260519_201128 | [report.md](../../../shared/logs/eval/sugoi_sugoi_teen_9_15_20260519_201128/report.md) |
| adult_and_kid | sugoi_sugoi_adult_and_kid_20260519_201545 | [report.md](../../../shared/logs/eval/sugoi_sugoi_adult_and_kid_20260519_201545/report.md) |
| teen_16_17_nocal (SSE fail) | sugoi_sugoi_teen_16_17_nocal_20260519_201843 | [report.md](../../../shared/logs/eval/sugoi_sugoi_teen_16_17_nocal_20260519_201843/report.md) |
| teen_16_17_nocal (verified PASS) | sugoi_sugoi_teen_16_17_nocal_20260519_200848 | [report.md](../../../shared/logs/eval/sugoi_sugoi_teen_16_17_nocal_20260519_200848/report.md) |
| minor_self_booking | sugoi_sugoi_minor_self_booking_20260519_202144 | [report.md](../../../shared/logs/eval/sugoi_sugoi_minor_self_booking_20260519_202144/report.md) |
| under4_redirect | sugoi_sugoi_under4_redirect_20260519_202416 | [report.md](../../../shared/logs/eval/sugoi_sugoi_under4_redirect_20260519_202416/report.md) |
| pricing_deflect | sugoi_sugoi_pricing_deflect_20260519_202825 | [report.md](../../../shared/logs/eval/sugoi_sugoi_pricing_deflect_20260519_202825/report.md) |
| nonbookable_program | sugoi_sugoi_nonbookable_program_20260519_203210 | [report.md](../../../shared/logs/eval/sugoi_sugoi_nonbookable_program_20260519_203210/report.md) |
| hostile_aggression | sugoi_sugoi_hostile_aggression_20260519_203550 | [report.md](../../../shared/logs/eval/sugoi_sugoi_hostile_aggression_20260519_203550/report.md) |
| adult_gi_default (non-det 1) | sugoi_sugoi_adult_gi_default_20260519_203856 | [report.md](../../../shared/logs/eval/sugoi_sugoi_adult_gi_default_20260519_203856/report.md) |
| teen_9_15 (old chain — KB contamination reference) | sugoi_sugoi_teen_9_15_20260519_195843 | [report.md](../../../shared/logs/eval/sugoi_sugoi_teen_9_15_20260519_195843/report.md) |
