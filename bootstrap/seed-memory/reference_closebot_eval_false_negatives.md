---
name: closebot-eval-harness-false-negative-patterns
description: Known QA/judge false-negative patterns in the GS closebot eval — cross-examine these against GHL ground truth before trusting a FAIL
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

The Tester/QA/Judge eval models carry generic assumptions that misfire on
gym-specific configs and produce FAIL verdicts on correct bot behavior. Always
cross-examine a FAIL against events.json + ghl_facts before concluding
([[feedback_cross_examine_judge_output]]).

Recurring false-negative patterns (observed Scottsdale + Bodega, 2026-05-17):

1. **Kids age-cap assumption.** Judge/QA assume kids calendars cap at 12 or 13
   (the Eden/Scottsdale pattern). Gyms with a wider kids calendar (e.g. Bodega
   "Kids 6-14 BJJ") get a correct 14yo booking flagged as a routing fail.
   Ground truth: check the booked `calendar_id` against the spec's age→calendar
   map + the calendar's own GHL description range.

2. **"you're all set" = booking.** mnd_05 (no false closure) pattern-matches the
   phrase "you're all set" / "all set" as a booking confirmation. In opt-out /
   hostile / no-calendar conversations the bot uses that phrase with no booking
   intended; if the bot fired the real action (e.g. `do-not-contact` tag), it is
   correct. Check tool_use events for the backing action.

3. **adult_and_kid age miscompute.** QA occasionally miscomputes the kid's age
   in multi-enrollee runs and flags a correct kid-calendar booking.

4. **Judge "tool failed to book".** Judge sometimes sees the first failed
   booking attempt (AM/PM ambiguity self-corrected) and reports total failure
   even though the retry succeeded and GHL has the appointment. Trust the
   verifier's GHL appointment count + verified_score, not the judge headline.

**How to apply:** a FAIL is not final until the booked calendar_id, GHL
appointment count, and tool_use actions are checked against the gym spec. If
ground truth is correct, record it as a QA false-negative in the QA summary
(don't rebuild the bot). Rubric-prompt hardening to inject per-gym age ranges is
a possible future fix, non-blocking.
