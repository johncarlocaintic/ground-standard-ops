# Message for CloseBot support

Hey team. Quick update on the Vacaville `update_contact` ticket.

Ran a clean test on the live bot this morning and the dev fix is mostly working. 4 of 5 fields are writing through to GHL now. But two issues are still live and look like the same family of bug:

1. **Phone field is still silently dropped.** `update_contact` returns "Successfully updated contact.phone to '925 485 5443'" but the GHL contact ends up with phone blank. Same exact symptom as the original ticket, just on a fresh contact today.

2. **`add_tag` for "action opt-in" is doing the same thing.** Tool says "Successfully added tag", but the tag is missing on the GHL record. In the same conversation, three other tags (`interested`, `adult`, `booked`) all wrote through fine. The only one that failed is the one with a space in the name. Might be related to spaces in tag values.

Repro evidence from today:
- Bot ID: `bot_GBIF5HQVM8FPQ0XJ`
- Test lead ID: `lead_test_HF10VERDLBATFMG9`
- GHL contact: `3BHmztEuln3zSBopgLI1` (Kennedy Hayes)
- Test session created: 2026-05-07T14:34:57.232Z
- Phone tool call ID: `toolu_012f2XBuGuCJQkxShQgAWsgj`
- "action opt-in" tool call ID: `toolu_01QhGoTS7MDywwyMtEx6muhd`

Three things I need from you:
1. Can the dev team confirm they can repro both from those IDs?
2. Any timeline on the phone fix? Bobby's gym is live and every new lead is landing in GHL with no phone, which kills his SMS follow-ups.
3. Is the "action opt-in" tag miss the same root cause or a separate issue worth tracking on its own?

Happy to give more diagnostic data or coordinate a live repro window if that helps. Thanks.
