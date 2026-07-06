# CloseBot Support — check_availability ignores round-robin member availability; book_appointment reports success on a failed write

**Date:** 2026-07-07
**Account:** Ground Standard agency (auth: X-CB-KEY)
**Bot:** `Martial Arts Studio - Template ` (`bot_QMH9HO6O5DM5NAN1`), Agent Node
**Source/sub-account:** Killer B Combat Sports Academy (`src_YJOFG6926ILNHH1R`, GHL location `uIW84chF6pVm03ifxxlB`)
**Calendar:** "Kids MMA & Fitness" (`p3Kq0qmqfAjIIYkxRYqm`), round_robin, 1 team member, active

## TL;DR
On a test-session conversation (mimicking the source above), `check_availability` offered slots that GoHighLevel does not actually have (the round-robin member's availability blocks them), and `book_appointment` then returned **"Successfully booked appointment!"** for a slot GHL never persisted. No appointment exists on any of the sub-account's 13 calendars. Same silent-success family as our May 6-7 ticket (update_contact phone field / add_tag).

## Reproduction (2026-07-06, test session lead `lead_test_U3FVCNE3AHUUV8I3`)
1. `check_availability` args: `{"calendar_id":"p3Kq0qmqfAjIIYkxRYqm","start_time":"07/07/2026 09:00","end_time":"07/10/2026 20:00"}`
   Tool returned: *"Available appointment slots (each slot is 60 minutes): Monday 2026-07-06 05:00 PM, Tuesday 2026-07-07 05:00 PM, Wednesday 2026-07-08 05:00 PM, Thursday 2026-07-09 05:00 PM, Friday 2026-07-10 05:00 PM"*
2. `book_appointment` args: `{"action":"book","calendar_id":"p3Kq0qmqfAjIIYkxRYqm","date_time":"07/07/2026 17:00","appointment_name":"Ava Cobalt - Free Trial Class"}`
   Tool returned: *"Successfully booked appointment! Title: Ava Cobalt - Free Trial Class, Start: Tuesday 2026-07-07 05:00 PM..."*
3. **GHL ground truth** (same minute, via the location's own token):
   - `GET /calendars/p3Kq0qmqfAjIIYkxRYqm/free-slots?startDate=<Jul 7>&endDate=<Jul 21>` → earliest available slot is **2026-07-13T17:00:00-04:00**. Nothing on Jul 6-12 (assigned member availability blocks week 1). Calendar settings allow booking 2 hours out, so it is not a notice rule.
   - `GET /calendars/events?...&calendarId=p3Kq0qmqfAjIIYkxRYqm` and a sweep of **all 13 calendars** in the location: **no "Ava Cobalt" appointment anywhere**.
   - The same conversation's `update_contact` writes DID persist (contact `Tester Cobalt` exists with fields + note), so the source↔location link is healthy.

## Expected
1. `check_availability` should return only slots GHL would actually accept for the calendar (i.e., respect round-robin team-member availability, like GHL's own free-slots endpoint).
2. If the GHL appointment write fails, `book_appointment` must return an error to the agent, not success. The agent told the lead "you're booked" for an appointment that does not exist.

## Impact
Any calendar whose assigned members' availability is narrower than the calendar's open hours produces confidently-wrong bookings: lead accepts a phantom slot, nothing lands in GHL, no error anywhere. We caught it only by verifying GHL after every test.

## Contrast case (works)
Identical flow, same bot, same day, Montgomery BJJ (`src_4VEFF108BZ7GDG4K`, calendar `5A25XDYECvtokbzfeaMT`): offered slots matched GHL free-slots, booking persisted and is visible in GHL. The defect tracks member-availability divergence, not our configuration of the bot.



## Reproduction case 2 (2026-07-07, different sub-account)
Granite Bay Jiu-Jitsu (GHL location `TAPUXHtsc2CGjmPYUKAm` per source key), calendar "Kids 6-8 BJJ" (`bGAmFzsVi4ourqDmFHjP`):
- `check_availability` returned real slot rules + Wed/Thu 5 PM slots.
- `book_appointment` `{"action":"book","calendar_id":"bGAmFzsVi4ourqDmFHjP","date_time":"07/08/2026 17:00","appointment_name":"Ben Larkspur - Free Trial"}` returned **"Successfully booked appointment!"**
- GHL: appointment exists on NONE of the location's calendars (swept all). The same conversation's contact + fields + note persisted fine.
Two different sub-accounts, same signature: booking success reported, nothing persisted.

Happy to provide the full SSE event logs (tool_use entries with timestamps) for the session above.
