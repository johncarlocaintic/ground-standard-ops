# GS Universal Bot — Launch Status (for Mark)

**Updated 2026-07-07 (batch 2 verified).** Live test results per school. Bot-side AND GHL-verified. Test method: one real kid-booking conversation per school through the template bot (mimicking that school's source), then the appointment, Youth Birthday field, and contact note verified in that school's GHL via API.

## TEMPLATE: converted + proven
The master template (`Martial Arts Studio - Template `) now reads all four custom values (`academy_info`, `academy_info_calendar_adult`, `_youth`, `_multiple`) with **zero hardcoded calendar IDs**. Verified live: values resolve per source, the LLM tolerates loose formatting, **only the calendar IDs must be exact**. One cosmetic leftover: old Gracie business text still sits in the business-info section under the academy_info tag; delete on next template touch.

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
** Ray Longo: booking + calendar correct, but the DOB was saved as the raw phrase "September 2, 2020" and got parsed to 2020-02-20 in the field (the note has the correct date). TEMPLATE TWEAK RECOMMENDED: the child-info section should say "convert date of birth to MM/DD/YYYY before saving" like the adult path does. One edit fixes all schools; fix the one field manually.

## BATCH 2 STATUS: complete

## FLEET-WIDE, PENDING BOBBY
- **Youth Name field shows literal "Update"** on every tested school. A GHL workflow archives child name+bday to contact NOTES then stomps the field. Names are NOT lost (notes carry them). Bobby to confirm intentional vs the one workflow action to fix.

## CLEANUP (do in UI as you launch each school)
Search "**Tester**" in each tested school's GHL and cancel/delete the trial appointments (several dated Jul 6-13). Gracie also has "jc test" (Jul 9 x2) and earlier eval bookings (Quilo/Vomer). Delete the test contacts too if Bobby prefers a clean list.

## PER-SCHOOL LAUNCH CHECKLIST (repeat for every remaining school)
1. Custom values pasted from the packs doc (`GS-Custom-Values-Packs.docx` / `custom-values/<gym>.md`), calendar IDs exact.
2. One kid-booking test (age inside a real band) → confirm appointment lands on the right calendar in GHL.
3. Attach template to the source with the trigger tag + `ai off` exclude; detach any old bot.
4. Log the school + test contact name in the tracker; cancel the test appointment.
