# GS Universal Bot — Launch Status (for Mark)

**Updated 2026-07-07 afternoon: LAUNCH DAY.** Bobby's word this morning: keep launching, all schools up today, report anything that breaks right away.

**>>> Your full work order for today is in [LAUNCH-DAY-INSTRUCTIONS-2026-07-07.md](LAUNCH-DAY-INSTRUCTIONS-2026-07-07.md). Read that first; this file is the reference behind it. <<<**

## LAUNCH DAY STATE (as of this update)
**On the universal template now (12):** Gracie Farmington Valley, Montgomery BJJ, All In Jiu-Jitsu, Bodega, OM BJJ, Paragon Simi Valley, Ray Longo's MMA, Roberts Family MMA, Signature, Simple Man, Sugoi, Universal MMA. Every one verified server-side: template enabled, `concierge` trigger, full exclude set (booked/member/alumni/spam/staff/service/showed/alert/aggressive/`ai off`), old bot detached. No school has two bots enabled.

**Still on their OLD per-gym bot (18):** Ballantyne, Mason Dixon, 10th Planet Miami, Scottsdale, Inverted Gear, Grit, Hammer, Breathe, Killer B (hold), Eden Prairie, Artistry, Centerline, Champion, Gracie East San Jose, Hamptons South, Hamptons West, Royal Queens, SOMA, plus Vacaville (migrates last). These need the template attached today.

**Your part per school: just attach the template to the source and enable it.** I sweep behind you every few minutes and normalize the filter (trigger + excludes) and detach the old bot automatically, same as the 12 above. You do NOT need to build the tag filter by hand or detach anything.

**Holds (do NOT attach):** Killer B, Granite Bay, Infinity BJJ. Simple Man got attached anyway; leaving it, adult bookings work, but its youth calendar still has zero availability so youth leads will stall until the gym opens slots.

One more manual fix while you're in Ray Longo's GHL: contact **tester indigo**, field Youth Birthday, change 2020-02-20 to **2020-09-02** (my API token there can't write contacts).

## TEMPLATE: converted + proven (now v0.0.21)
The master template (`Martial Arts Studio - Template `) reads all four custom values (`academy_info`, `academy_info_calendar_adult`, `_youth`, `_multiple`) with **zero hardcoded calendar IDs**. Verified live: values resolve per source, the LLM tolerates loose formatting, **only the calendar IDs must be exact**. Published v0.0.21 today: the leftover Gracie business text is deleted, and both child paths (Child Only + Multiple) now convert the child's date of birth to YYYY-MM-DD before saving (the Ray Longo DOB fix, fleet-wide). No action needed from you; every attached school picks this up automatically.

## READY TO LAUNCH — tested + GHL-verified (11)
| School | Test contact (find in GHL) | Booked onto |
|---|---|---|
| Gracie Farmington Valley | Tester Redwood / Bluejay (Lily 5) / Maple (Oscar 8) | Adult Fund. BJJ / Kids 4-5 / Kids 8-13 |
| Ballantyne Martial Arts | Tester Cypress (Ellie 6) | Kids 6-8 BJJ |
| Mason Dixon Jiu-Jitsu | Tester Granite (Noah 9) | Kids 8-13 Martial Arts |
| 10th Planet Miami | Tester Harbor (Mia 10) | Kids 7-13 BJJ |
| Academy of JJ Scottsdale | Tester Sierra (Leo 6) | Kids 5-7 BJJ (Jul 13) |
| Montgomery BJJ | Tester Aspen (Eli 5) | Kids BJJ (3-6) |
| Inverted Gear Academy | Tester Onyx (Zoe 9) | Juniors 7-12 BJJ |
| Grit Jiu-Jitsu | Tester Prairie (Sam 10) | Kids 4-13 BJJ |
| Hammer Sports & Performance | Tester Falcon (Ivy 9) | Youth Martial Arts |
| Breathe Jiu-Jitsu | Tester Coral (Nina 5) | Kids 4-6 BJJ |

All 10 above + Gracie: child DOB saved on the Youth Birthday field, child name+DOB archived in contact notes. Conversation logs are linkable as `app.closebot.com/conversations?leadId=<id>` (test chats never show in the Conversations list). Lead IDs are in `eval-runs/2026-07-07-ten-schools/_results.json`.

## HOLD — do not launch yet (1)
- **Killer B Combat Sports Academy**: ROOT CAUSE FOUND (2026-07-07). CloseBot offered slots Jul 6-10 5 PM, but GHL's real free-slots start Jul 13 — the "Kids MMA & Fitness" round-robin calendar has ONE assigned member whose availability blocks week 1, GHL honors it, CloseBot's check_availability does not, and book_appointment returned "Success" on a write GHL never persisted. Fix either side: (a) in Killer B's GHL, fix the assigned member's availability on that calendar (or add members) so offered slots are real, then RE-TEST and confirm the appointment lands; or (b) CloseBot support fix (ticket being prepared). Until a re-test passes with a GHL-confirmed appointment, do not launch this school.
- **Fleet lesson:** this failure only appears where a staff member's availability diverges from the calendar's open hours. The per-school kid-booking test catches it — never skip the GHL-side appointment check when testing a school.


## READY TO LAUNCH — batch 2, tested + GHL-verified (10 more; launch list now 21)
| School | Test contact (find in GHL) | Booked onto |
|---|---|---|
| Academy Eden Prairie | Tester Slate (Owen 6) | Kids 4-7 BJJ |
| All In Jiu-Jitsu | Tester Birch (Ruby 8) | Kids 5-12 BJJ |
| Artistry BJJ | Tester Quartz (Theo 9) | Kids 5-13 BJJ |
| Bodega Jiu-Jitsu | Tester Ember (Nora 10) | Kids 9-12 BJJ * |
| Centerline Jiu-Jitsu | Tester Willow (Finn 6) | Kids 5-7 BJJ |
| Champion Martial Arts | Tester Flint (Iris 9) | Youth Jiu-Jitsu |
| Gracie JJ East San Jose | Tester Marina (Jude 9) | Kids 7-13 BJJ |
| Hamptons JJ South | Tester Cedar (Lena 5) | Kids 4-7 BJJ |
| Ray Longo's MMA | Tester Indigo (Rex 5) | Youth 4-6 Martial Arts ** |
| Roberts Family MMA | Tester Juniper (Skye 7) | Kids 5-10 BJJ |

All 10: appointment + Youth Birthday field + child-name note verified in GHL (Ray Longo DOB exception below).
* Bodega: booked the 9-12 band calendar; the old KB note said Kids 6-14 is the sole trial calendar (superset rule). Age-appropriate either way; confirm intent with Bobby.
** Ray Longo: booking + calendar correct, but the DOB was saved as the raw phrase "September 2, 2020" and got parsed to 2020-02-20 in the field (the note has the correct date). FIXED in template v0.0.21 (2026-07-07): both child paths now convert DOB to YYYY-MM-DD before saving. The one wrong field still needs the manual fix noted at the top.

## BATCH 2 STATUS: complete


## READY TO LAUNCH — batch 3, tested (19 GHL-verified + 3 pending UI check; launch list now 40+)
GHL-verified on the correct calendar, child DOB + note confirmed (kid tests):
10th Planet Orlando (Tester Vermilion, adult) · Cobrinha SW (Cobble/Ana 5 → Kids 3-6) · Hamptons West (Meadow/Cora 5 → Kids 4-7) · JJ Machado Fresno (Saffron/Elle 6 → Kids 4-8) · JitzLab (Timber/Gus 9 → Youth 8-12) · Jiu Jitsu Hub (Anchor/Hana 5 → Kids 4-6) · Lucky Cat (Beacon/Ian 8 → Kids 6-13) · Mythic (Clover, adult → Adult Foundations) · OM BJJ (Garnet/Jai 12 → Teens 10-15) · Range BJJ NYC (Ivory/Lia 6 → Kids 5-8) · Rip Tide (Jasper/Mo 7 → Kids 4-12) · Signature (Lagoon/Oli 9 → Kids 8-10) · Soulcraft (Pebble/Quinn 6 → Kids 4-7) · Speak Easy (Raven/Rio 5 → Kids 4-6) · Sugoi (Sequoia/Sia 6 → Kids 4-8) · Tetris (Tundra/Tao 4 → Kids 3-5, no note workflow on this sub-account — check) · Universal MMA (Wren/Uma 8 → Kids Martial Arts) · Verde Valley (Zephyr/Vic 6 → Kids 5-7) · Wisconsin Karate (Basalt/Wil 6 → Kids Beginner Karate 4-7)

**Booked but NOT GHL-verifiable (no working token) — eyeball in the UI via ads@ground before launching:**
Paragon Simi Valley (Heron/Kai 8, cal AFoWlffSZq18isEuVqwO, Wed 7/8 5 PM) · Royal JJ Queens (Kestrel/Nia 8) · SOMA MVMT (Opal, adult). Their custom values clearly hold REAL calendar IDs now (bookings ran against live calendars).

## HOLD — additions from batch 3
- **Granite Bay Jiu-Jitsu**: SECOND reproduction of the Killer B defect — book_appointment "Success" but the appointment persisted on NO calendar (Ben Larkspur, Kids 6-8, Wed 7/8 5 PM). Do not launch until re-test passes; added to the CloseBot support ticket.
- **Infinity BJJ**: CloseBot↔GHL connection broken (custom values unresolved, "no calendars for this source", token dead since ~Jul 5). Bobby must reconnect the sub-account in CloseBot, re-add the 4 custom values, and re-issue access. Then full re-test.
- **Simple Man Martial Arts**: bot + values fine, but the youth calendar has ZERO availability for 3+ weeks (checked 3 ranges). Open that calendar's availability in GHL, then re-test.

## NOT TESTED (3)
Vacaville (already live on its own v4.6 bot — migrate last) · Logica (no CloseBot source) · Connecticut Submission (dropped by Bobby).

## FLEET-WIDE, PENDING BOBBY
- **Youth Name field shows literal "Update"** on every tested school. A GHL workflow archives child name+bday to contact NOTES then stomps the field. Names are NOT lost (notes carry them). Bobby to confirm intentional vs the one workflow action to fix.

## CLEANUP (do in UI as you launch each school)
Search "**Tester**" in each tested school's GHL and cancel/delete the trial appointments (several dated Jul 6-13). Gracie also has "jc test" (Jul 9 x2) and earlier eval bookings (Quilo/Vomer). Delete the test contacts too if Bobby prefers a clean list.

## PER-SCHOOL LAUNCH CHECKLIST (repeat for every remaining school)
1. Custom values pasted from the packs doc (`GS-Custom-Values-Packs.docx` / `custom-values/<gym>.md`), calendar IDs exact.
2. One kid-booking test (age inside a real band) → confirm appointment lands on the right calendar in GHL. (Already done for all 45 tested schools; skip unless the values changed.)
3. Attach the template to the source and enable it. That's it: the sweep on my side adds the trigger + exclude filter and detaches the old bot within minutes. If you want to double-check, the filter should end up as require `concierge` plus 10 excludes.
4. Log the school in the tracker; cancel any leftover Tester appointment.
