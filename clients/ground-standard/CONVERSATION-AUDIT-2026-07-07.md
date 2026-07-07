# Conversation Audit for Mark — 2026-07-07 (launch day)

The monitor on JC's side sees WHEN a conversation moves and when appointments appear, but it cannot judge conversation QUALITY. That part is yours. This doc lists the conversations flagged today that are either already booked or steering toward a booking, with the context you need to check each one. Work these between attachment batches.

## How to log what you find (do this for EVERY entry)

1. In your clone of this repo, create `clients/ground-standard/conversation-audit/2026-07-07-findings.md` via Claude Code.
2. One entry per conversation: school, contact name, verdict (CLEAN / ISSUE / NEEDS-BOBBY), 2-3 sentences on what you saw, and what you did.
3. Screenshot every conversation you review (the full thread, plus the appointment view if booked). Save to `clients/ground-standard/conversation-audit/screenshots/` with names like `killerb-erick-shi-1.png`. Commit and push everything together.
4. Anything marked ISSUE: also ping JC immediately, do not wait for the end-of-day push.

## How to spot these yourself going forward

- In each sub-account's GHL: Conversations, sort by most recent. A LONG thread = many SMS back-and-forth turns (5+ exchanges), especially where the lead is answering questions about age, program, or times. Those are booking conversations. Short blasts with no reply are campaign noise, skip them.
- Bot conversations (CloseBot) show the bot's messages as outbound SMS in the same thread. After a school is on the universal template, any long thread that ends in "you're all set for [day/time]" should have a matching appointment on the RIGHT calendar. Always open the calendar and confirm. That is the whole game: said time == calendar time == correct age-band calendar.
- If a thread shows the bot offering times, then confirming, but NO appointment exists on any calendar: screenshot it and ping JC immediately. That is the silent-booking defect (known at Killer B + Granite Bay) appearing at a new school.

## FLAGGED: check these today, highest priority first

### 1. Killer B / Erick Shi — ACTIVE booking conversation at the defect school (HIGH)
Adult lead, college boxing background, asked about kickboxing/jiu-jitsu. The old bot (fronting as Coach Brian) recommended kickboxing or BJJ and asked availability. At 14:51 the lead replied: available Wed + Fri after 5pm / before 8:30am, all day Saturday, and asked to book THIS WEEK. Killer B is one of the two schools where CloseBot offers slots GHL will not honor and reports success on bookings that never persist. Check: has the bot offered specific times since 14:51? If it "booked" him, open the Killer B calendars and confirm the appointment actually exists at the stated time. If the thread says booked and the calendar is empty, screenshot both, mark ISSUE, ping JC. This would be a real customer hitting the known defect.

### 2. Killer B / George LeGrande and Tony Rodriguez — fresh inbound (HIGH, same reason)
Two more inbound SMS threads at Killer B this afternoon. Same drill as Erick Shi: if either is being walked toward a booking, verify any claimed booking against the actual calendar.

### 3. Montgomery BJJ / Jorge Rosales — cancellation request buried in a review-ask thread (NEEDS-BOBBY)
Existing member (kid: Montse). The gym texted asking for a Google review; Jorge replied he ALSO emailed yesterday asking to cancel Montse's membership by end of month. Nobody has acknowledged the cancellation. Not a bot problem, but a service miss that will turn into a bad review if ignored. Log it, mark NEEDS-BOBBY so the gym follows up.

### 4. Ray Longo's / Tom Quadrino — booked, but the automation ignored his question (ISSUE, gym-side)
Old lead from January. At 14:37 he asked for the weekly class schedule for kickboxing/MMA. The nurture automation replied at 14:49 with a canned "almost out of free trial spots" blast that ignored his question. He still booked himself via the scheduling link at 14:53 (Adult Intro, Jul 10, 6 PM). Check: appointment on the right calendar (it should already be there), and log that the canned reply ignored a direct question. When Ray Longo's moved to the universal template today, the bot handles these instead; this entry becomes the before/after example.

### 5. Ray Longo's / Nate Healy and ethan lee — fresh inbound, state unknown
Two inbound SMS threads mid-afternoon. Check who answered (bot vs automation vs human), whether the lead's question got addressed, and whether either is steering to a booking. Ray Longo's is high-traffic; if the universal bot picks one of these up you may be looking at the fleet's first universal-template real booking. If a booking completes, screenshot it and confirm the calendar entry; JC wants to relay exactly that to Bobby.

### 6. Simple Man / Michael Tiburcio — no-show who rebooked for TONIGHT 6 PM (verify only)
No-show from Jun 30, hit with the reschedule drip, booked himself via link at 15:10 for today 6 PM (Fundamentals, adult calendar). Appointment already confirmed on the calendar via API. Just confirm the thread got the confirmation SMS (it did at 15:10, eyeball it) and log CLEAN unless something looks off.

### 7. Simple Man / Alejandro Castillo — fresh inbound, state unknown
Inbound around 15:20. Simple Man is LIVE on the universal template with the known constraint: the YOUTH calendar has zero open availability for 3+ weeks. If this lead asks about kids classes and the bot goes to offer times, it will find nothing. Check the thread: if a youth lead stalled with no bookable slots, screenshot it, mark NEEDS-BOBBY (open the youth calendar availability), and note the lead's name so the gym can call them manually.

### 8. Hamptons West / Taba Kashanian — cancelled, lukewarm, steering (watch)
Booked Jul 6, no-showed, called to cancel, then answered "Not sure yet" to "come in next week?" at 14:51. Human/automation thread, school still on its OLD bot until you swap it in Batch A. Nothing to verify on calendars; log the state so the gym knows this lead needs a personal touch, not more drip.

### 9. Hamptons South / Niko Siamas and Henry Burne — fresh inbound, state unknown
Both texted in this afternoon. School is in your Batch A swap list. Check whether the old bot or automation answered and whether either lead is being walked toward a booking. If a booking is claimed, verify it on the calendar before you swap the school, so we do not blame the new bot for an old bot's miss.

### 10. Bodega / sassisid Ell — opted out (log only)
Kids-class lead. Campaign messages went out, lead enabled DnD (opt-out) at 14:40. No action possible, log it so the count is right. Do NOT re-engage an opted-out contact.

### 11. Campaign wave, multiple schools (context, mostly skip)
Between 14:55 and 15:15 a scheduled GSPro nurture wave fired across most sub-accounts (Gracie x5, Ballantyne x4, OM x5, Inverted Gear x5, Rip Tide x6, All In x3, Bodega x3, and others). Those are outbound blasts, not conversations. Only check the ones where the lead actually REPLIED after the blast: any reply thread that develops 3+ exchanges, treat like item 5 (who answered, was the question addressed, booking verified on calendar).

## The verdict rubric

- **CLEAN**: lead's messages were addressed, any claimed booking exists on the correct calendar at the stated time.
- **ISSUE**: bot/automation claimed or implied a booking that is not on the calendar; or a direct question got a canned non-answer and the lead went cold; or wrong calendar/age band. Screenshot + ping JC same hour.
- **NEEDS-BOBBY**: gym-side action required (availability, cancellation follow-up, opted-out lead worth a manual call).

End of day: push your findings file + screenshots, then send JC the one-message summary from the launch-day instructions doc with a line like "conversation audit: N reviewed, X clean, Y issues, Z for Bobby."
