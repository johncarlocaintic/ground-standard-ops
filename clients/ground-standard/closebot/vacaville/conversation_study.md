# Vacaville Grappling — Conversation Behavior Study

**Corpus:** 412 SMS transcripts pulled April 20, 2026. Scope-filtered to match the bot's actual engagement target.
**Source:** `clients/ground-standard/closebot/vacaville/transcripts_fresh_leads/`.
**Purpose:** Pattern-study for CloseBot design — how fresh inbound leads open, ask, object, and drop over SMS.

---

## ⚠️ SCOPE — read this first

**Bobby's bot is narrow on purpose.** It is only allowed to engage **fresh inbound leads** — contacts that carry **none** of these tags:

`booked` · `member` · `alumni` · `spam` · `staff` · `service` · `showed` · `unsubscribed` · `spam likely`

Any contact carrying one of those tags is **out of scope** and must be routed to a human (Kurt / Coach Nick) before the bot ever sees them. Bobby's concern: if the bot mishandles an existing member or staff-adjacent contact, it damages the school's relationship with real customers. The bot earns trust on fresh leads first, then scope expands later.

**What this means for every observation below:**
- Patterns about existing-member admin traffic (payment pauses, card swaps, schedule changes) are **not** the bot's problem — those contacts are filtered upstream.
- The bot's behavior is judged on the **first touch through intro-class booking** window only.
- Conversion signal = lead becomes tag-worthy (`booked`, `showed`, etc.), at which point a human takes over.

**Corpus stats (of 814 total Vacaville contacts):**
- 316 excluded by scope tags (39%)
- 498 eligible as fresh leads (61%)
- 412 of those had actual conversation threads
- ~226 of those had real lead-side SMS content (the rest were workflow-only with no reply)

---

## 1. How fresh leads OPEN conversations

Leads almost never initiate. Outbound workflow fires first; the lead replies. Replies cluster into 5 archetypes:

1. **Parent-on-behalf, full context** — the richest openers.
   > "My daughter, Kailee, is going to your Wed 5:15pm youth class and her program ends by end of March so I wanted to get information/pricing so she can continue her classes."
   > "Hi Kurt. I believe this was for my daughter Ariana. She won't be here for a few weeks and we just need to see financially if it'll fit in our plan..."
   Pattern: self-ID → child name → current state → ask. Often one long message.

2. **Ultra-terse info pings** — zero pleasantries.
   > "How much is your fee?"
   > "Price for the adult program?"
   > "What time are your classes?"
   > "Is this wrestling?"

3. **Soft-confirm to a reminder / reaction-only**
   > "Yes, thank you" / "Ok thanks" / Liked "[outbound]"

4. **Wrong-number / identity confusion** — they forgot they opted in.
   > "Who is this?"
   > "No, this was a mistake"

5. **Hard opt-out** — single word.
   > "Stop" / "No thank you" / "Pass."

**Design implication:** bot must handle (a) multi-sentence context dumps, (b) 3-word openers, and (c) leads who don't remember signing up. Never assume the opener has the lead's name or intent baked in.

---

## 2. Drop / loss patterns — why fresh leads die

Dominant exit categories, with real phrasing from the corpus:

| Exit reason | Voice / phrasing |
|---|---|
| **Location/distance** (big) | "Im very sorry I didnt realize how far vacavile is from my location I am 42 miles away", "I'm currently living in Modesto", "I'm coming from Napa", "your gym was on my FYP... didn't realize it was so far" |
| **Life event / scheduling collision** | "death in the family and the funeral was today", "daughter in the hospital", "having problems with teenagers", "work going longer than I thought" |
| **Competitor chosen** | "Hey sorry I actually enrolled in apex bjj", "found a closer gym to work at", "I am with another BJJ gym" |
| **Price-not-fit** | "I am just worried about price", "No it's just funding", "we just need to see financially if it'll fit" |
| **Age/program mismatch** | "I was looking for something for my 4 year old but it looks like you guys start at age 7", "I was looking for pricing for a soon to be 14 year old", "I was looking to have my daughter try Judo" |
| **Soft ghost** | "I will let you know", "Maybe. Next month", "He's not interested at moment", "Please send more information. Thx" |

**Design implications:**
- **Ask ZIP / city early.** Location is the #1 killable objection — asking up front prevents multi-message wasted cycles.
- **Ask age / program fit early.** 4-year-olds and 14-year-olds show up; the bot needs to know the youth-age floor and route out-of-range asks.
- **Soft-ghost ≠ hard-no.** "I'll let you know" should park the lead in a longer-interval nurture, not trigger an immediate retry.
- **Competitor mention = graceful exit.** No arguing.

---

## 3. Linguistic texture

**Two dominant voices:**

- **Parent-mom voice** — formal, "Hi Coach,", signatures, gratitude-heavy, multi-sentence. Volunteers child's name + context unprompted.
- **Young-adult male voice** — emoji-dense, 2–5 words, casual ("Let's do it!!", 🤘🏻 🫡 😅), reactions more than replies.

**Structural quirks the bot MUST handle:**

1. **SMS reactions are not replies.** `TYPE_SMS_REACTION` events ("Liked '...'", "Loved '...'", "❤️ to '...'") are everywhere. They are NOT answers. Treating a reaction as a content reply breaks flow. **Ignore them or acknowledge without advancing state.**
2. **Two-burst messages.** Users fire thought 1, then thought 2 within 15–60 seconds. Bot must debounce.
3. **Misspellings + shorthand** — "u", "rn", "Tankyou", "Goodmoring", "Vecaville", "imam 70" (=I am 70). Intent recognition must be tolerant.
4. **Late-arriving reactions** — leads like a message days later. Not a fresh-turn signal.
5. **Echo closers** — "TY", "Ty", "Awesome", "Got it". Not new intents; do not re-engage.

---

## 4. Edge cases fresh-lead bot must handle

1. **Multi-kid families.** Parents reference 2+ children in one message. Matches our existing design rule: pack kid names into a single field; don't split.
   > "Francisco and Fernando both got the scholarship"
   > "We definitely wanna try out the no gi classes for sure" (then later names two kids)

2. **Military / LE / first-responder discount cues.** Coach proactively offers 15% off when he hears mil/LE/FR. Bot should detect ("I'm CHP", "military", "law enforcement", "first responder") and **flag the contact for human handoff**, NOT quote the discount — per the standing no-pricing rule.

3. **Wrong-sport lead.** "I was looking to have my daughter try Judo" / "Is this wrestling?" — Meta ads pull in non-BJJ seekers. Bot should clarify what the school teaches and offer out-gracefully.

4. **Drop-in / traveling martial artists.**
   > "Hey Coach, sorry I train at Renzo Gracie in Warwick NY. I'm gonna be out in Vacaville to take the bar exam for the next week so I was trying to find if you guys do drop ins."
   These are experienced practitioners wanting a single session, not monthly members. Different path.

5. **Referrer / peer contact.**
   > "Hi coach nick! My name is noel san nicolas from apex bjj and I put my info to see if you had a morning class on Fridays."
   Competitor-school instructor checking schedule. Edge case — route to human.

6. **"Who is this?"** The lead forgot opting in from an Instagram ad or city parks program. Bot must **re-introduce with source context** ("You signed up on our Instagram ad for a free intro class...") not plow forward asking for a time slot.

7. **Age out-of-range.** "My 4 year old" / "soon to be 14 year old" — bot needs the youth age window (7–13 based on class tags seen) and must offer graceful redirect when outside it.

8. **Apology-for-no-show / reschedule.** Dense, multi-sentence, reason-heavy messages. Treat as reschedule request, not drop.
   > "Hi! Can we both reschedule?"
   > "I apologize, I just got out of work and will never make it anywhere close to time"

9. **Third-party content.** YouTube links, forwarded screenshots, "Sarge said...". Bot must gracefully ignore media URLs and extract intent from surrounding text.

10. **Template-merge failure in the wild.** The corpus contains `"Dear First_name,"` going out verbatim. **QA guard required:** reject any outbound containing literal `{{`, `First_name`, `Last_name`, or unreplaced tokens.

---

## 5. What does "booking" look like? (inferred from close patterns)

Bot's job ends when the lead is ready to book. Observed patterns right before Kurt/Nick manually tagged as `booking`:

1. Lead asks concrete logistical question (time, days, price range, age).
2. Coach answers specifically + adds soft qualifier.
3. Lead reacts positively (Liked / Loved) — a reaction, **not** a content reply.
4. Coach pivots to booking with a **specific slot offer**: "can I put you down for Wed 5:15?" — NOT "want to book?"
5. Lead confirms in ≤5 words ("Sounds good!", "Yes", "Let's do it!!").

**Copy implication for bot:** offer a specific slot, don't ask permission to book. Open-ended "ready to book?" is weaker than "Wed 5:15 works for you?"

---

## 6. Design rules the bot should absorb

**Derived from this corpus within scope:**

- **Ignore `TYPE_SMS_REACTION` as input.** Never advance state on a reaction alone.
- **Debounce multi-burst messages.** Wait 30–60s; concatenate bursts before replying.
- **Qualify early: city/ZIP + age/program fit.** These two questions kill the top two drop categories before they happen.
- **Offer a specific slot; don't ask permission.** Mirror the coach's closing move.
- **Detect mil/LE/FR mentions → flag for handoff, don't quote.** No pricing, ever.
- **Honor soft-ghost with a longer-interval nurture.** "I'll let you know" ≠ "no."
- **Re-introduce with source context on "Who is this?"** Single line about where they signed up.
- **Youth age gate.** If the ask is about a kid outside the youth-class age window, redirect out gracefully.
- **Merge-token guard on outbound.** Reject any send containing `{{`, `First_name`, `Last_name`, etc.
- **Hand off the moment a booking slot is agreed.** Don't continue chatting past the booking line — that's where scope ends.

---

## 7. Scope fit — what this bot is NOT

Because the bot is fresh-leads-only, these flows are **out of scope and should not be designed into CloseBot**:

- Payment changes (card swap, pause, refund, skip month)
- Schedule changes for existing members (drop to 2 classes, switch days)
- Kid-swap / family-plan admin
- Post-class logistics (lost items, parent pickup messages, attendance)
- Retention / re-engagement of alumni
- Tournament signup info for current competitors

All of the above exist heavily in the excluded slice — that's a separate bot (or human-only) project. Keep them off the fresh-lead bot's surface.

---

## 8. Gaps this corpus can't fill

- **Only one school.** Voice may be Vacaville-specific. Cross-check with 1–2 more GS gyms before hardening rules.
- **No call data.** Many rows are `TYPE_CALL` with empty body — phone half of funnel is invisible.
- **No ad-creative → tag mapping.** Can't tell which ads produce which opener-types. Worth asking Bobby if that's accessible.
- **Post-exclusion corpus has more silence than sound.** 412 transcripts but only ~226 contain real lead replies — 45% of fresh leads never respond at all. The "no-reply" population is itself a pattern worth mining (timing of first outbound, time-of-day, sequence count).

---

*Study generated from raw corpus. No redaction applied — PII preserved per JC instruction. Scope-limited to bot's actual engagement target per Bobby's requirement. Not for external sharing.*
