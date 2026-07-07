# Launch Day Instructions for Mark — 2026-07-07

Bobby's directive this morning: keep launching, all schools up today, report anything broken right away. This doc is your complete work order for the rest of the day. Work top to bottom. If anything here does not match what you see on screen, stop and ping JC before continuing.

## Where things stand right now

- **12 schools are LIVE on the universal template** (verified server-side, correct filter, old bot detached, sole bot on the source): Gracie Farmington Valley, Montgomery BJJ, All In Jiu-Jitsu, Bodega, OM BJJ, Paragon Simi Valley, Ray Longo's MMA, Roberts Family MMA, Signature, Simple Man, Sugoi, Universal MMA.
- Template is at **v0.0.21** (published today). It now converts every child date of birth to YYYY-MM-DD before saving, and the leftover Gracie text is gone. A fresh regression test booked correctly on Gracie about an hour ago (Tester Sorrel, kid Milo, appointment + field both verified in GHL). You do not need to touch the template.
- New leads DO get the `concierge` trigger tag at the new schools (checked 12 sub-accounts). The tagging comes from the GSPro snapshot, so the bot will fire on fresh leads everywhere. No workflow work needed on your side.
- An automated sweep runs on JC's side every 5 minutes. It watches for template attachments, builds the tag filter, and detaches the old bot. **Your job per school is ONE action: attach the template to the source and enable it.** Everything else is handled.

## How to attach (same steps every school)

1. In CloseBot, open the bot **`Martial Arts Studio - Template `** (the one master bot; do NOT clone it, do NOT create a copy per school).
2. Go to its source attachments and add the school's GHL source.
3. Enable the attachment. Done. Move to the next school.
4. Do NOT build the tag filter by hand. Do NOT detach the old bot yourself. The sweep does both within about 5 minutes.
5. If you look back 10+ minutes later and the filter does not read: require `concierge`, plus excludes `booked, member, alumni, spam, staff, service, showed, alert, aggressive, ai off`, and the old bot is still enabled, ping JC. Do not fix it by hand.

Before attaching any school, one glance: the 4 custom values (`academy_info`, `academy_info_calendar_adult`, `academy_info_calendar_youth`, `academy_info_calendar_multiple`) are pasted in that sub-account per the packs doc. Every school in the lists below already passed a live booking test against those values, so unless someone changed them since, they are good.

## Batch A: swap these 15 (they still run their OLD per-gym bot)

Attach the template to each. The sweep detaches the old bot automatically, that IS the swap. Order does not matter.

1. Ballantyne Martial Arts
2. Mason Dixon Jiu-Jitsu
3. 10th Planet Miami
4. Academy of JJ Scottsdale
5. Inverted Gear Academy
6. Grit Jiu-Jitsu
7. Hammer Sports & Performance
8. Breathe Jiu-Jitsu
9. Academy Eden Prairie
10. Artistry BJJ
11. Centerline Jiu-Jitsu
12. Champion Martial Arts
13. Gracie JJ East San Jose
14. Hamptons JJ South
15. Hamptons JJ West

## Batch B: fresh attach these 14 (no bot on them today)

1. 10th Planet Orlando
2. Cobrinha SW *
3. JJ Machado Fresno
4. JitzLab *
5. Jiu Jitsu Hub
6. Lucky Cat
7. Mythic
8. Range BJJ NYC
9. Rip Tide
10. Soulcraft
11. Speak Easy
12. Tetris
13. Verde Valley *
14. Wisconsin Karate

\* Cobrinha, JitzLab, Verde Valley: bookings work (calendar IDs are real and tested) but their `academy_info` is thin because Bobby never sent material. They can go live; the bot just has less business detail to talk from. Bobby owes us the content (ask list at the bottom).

## Batch C: eyeball first, then attach (2)

**Royal JJ Queens** and **SOMA MVMT**. Their test bookings ran against real calendar IDs but we have no working API token there, so nobody has independently confirmed the appointments landed. Before attaching:

1. Log into GHL via the ads@ground shared login.
2. Royal Queens: search contact **Tester Kestrel**, confirm an appointment exists on the youth calendar (booked Jul 7, slot within Jul 8-14).
3. SOMA: search contact **Tester Opal**, confirm an adult-calendar appointment exists.
4. If BOTH appointments are there: attach both schools like the others, then delete those test appointments.
5. If either appointment is MISSING: do NOT attach that school. Ping JC with a screenshot; that would be a third case of the silent-booking defect and Bobby needs to know same day.

## Do NOT touch (3 + 1)

- **Killer B**: silent-booking defect (CloseBot offers slots GHL rejects, then reports success on bookings that never persist). Ticket is with CloseBot. Old bot stays as is.
- **Granite Bay**: second confirmed case of the same defect. No bot changes.
- **Infinity BJJ**: CloseBot to GHL connection is dead (token expired ~Jul 5). Nothing works there until Bobby reconnects the sub-account inside CloseBot. Do not attach.
- **Vacaville**: stays on its own v4.6 bot for now. It migrates LAST, after the fleet has run stable for a few days. Do not attach the template there even though it is tested.

Also note: **Simple Man is already live** (attached earlier today) but its youth calendar has zero open availability for 3+ weeks. Adult bookings work. Youth leads will stall until the gym opens slots. That is a Bobby item, not yours.

## Cleanup as you go (UI work, per school you attach)

1. Search "**Tester**" in the school's GHL contacts. Cancel/delete their trial appointments (dated Jul 6-13) and delete the test contacts. Gracie also has "jc test" (Jul 9, x2) and older Quilo/Vomer bookings, plus today's regression pair: **Tester Sorrel** with appointment "Milo - Kids 6-7 BJJ Trial" on Jul 8 5 PM. Kill those too.
2. **One manual field fix at Ray Longo's**: contact **tester indigo**, custom field **Youth Birthday**, change `2020-02-20` to `2020-09-02`. My token there cannot write contact fields, so this has to be done in the UI. (Then delete the contact with the rest of the testers; the fix only matters if Bobby wants the contact kept as a reference.)

## What to report back (end of your run)

Send JC one message with:
1. The list of schools you attached, in order, with rough timestamps.
2. Royal Queens + SOMA eyeball result (appointment found yes/no, screenshot if no).
3. Any school where the CloseBot UI errored or the source was missing from the picker.
4. Which schools you finished Tester cleanup on.

JC's side is monitoring all schools continuously (bookings + live conversations, 10-minute cycle) and will spot-test a few swapped schools tonight. You do not need to run booking tests.

## Open asks for Bobby (JC handles, listed so you have context)

- academy_info material for Cobrinha SW, JitzLab, Verde Valley (ClickUp pages are image-only or missing).
- Reconnect Infinity BJJ inside CloseBot, then re-paste its 4 custom values and re-issue access; we re-test after.
- Killer B + Granite Bay: fix assigned-member availability on the affected calendars (or CloseBot ships the fix from the ticket); we re-test before launch.
- Open youth-calendar availability at Simple Man.
- Confirm whether the Youth Name field showing literal "Update" fleet-wide is intentional (the workflow archives name+DOB to notes, then stomps the field).
