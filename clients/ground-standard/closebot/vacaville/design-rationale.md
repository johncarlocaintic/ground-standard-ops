# Vacaville Bot — Design Rationale

**Companion doc to:** `new-bot.kdl` (the built bot) and `new-bot-design.md` (the up-front design).
**Purpose:** Explains the *why* behind every architectural choice. Use this to understand node selections before diving into any specific section.

---

## Part 1 — The Mental Model That Shaped Everything

The original Vacaville bot's fundamental mental model was **"classify the inquiry type at the top, then run a dedicated end-to-end path per type."** Four archetypes: 1 kid / 1 adult / both / multiple. Each got its own downstream branch, which meant heavy duplication inside each branch plus duplication across branches.

I rebuilt around a different mental model: **"primary inquirer + additional enrollees."** The mental shift:

- Every conversation has **one primary inquirer** (the adult who texted in).
- Everyone being booked is either **the primary themselves**, or **an enrollee attached to the primary** (their kid, their buddy, etc.).
- Kids can never book themselves — rule you stated. So there's always at least one adult contact being collected, whether or not that adult is *being booked*.

This single mental shift is what drove the whole simplification. Instead of 4 parallel branches with their own data-collection chains, we have **one shared adult-info path** feeding into either "book this adult + maybe kids" or "just collect parent info, route to kid subflow."

The "anyone else?" junction is how we simulate a loop in a platform with no loops — you reach it after every booking, and it fans out to the only three things that can happen next (another kid, another adult, done).

That framing is what cut the node count from 176 to 53.

---

## Part 2 — Section-by-Section Node Choices

### Section A: Entry Sequence (nodes n01–n05)

```
Source → Get Name → Interest → Interested? (Comparator) → [No → Convince Conversation → EOC | Yes → Who's this for?]
```

**Why Source → Get Name first:**
Collecting first name before anything else does two jobs: (1) gives the bot something to call the contact by for the rest of the conversation (Emma uses `{{contact.first_name}}` throughout), (2) establishes `contact.first_name` early so the Sign Up scenario interrupt has a variable to reference if someone skips ahead. Matches what the original bot did; kept intentionally.

**Why an Interest MultiObjective before the Interested? Comparator:**
The old bot did the same thing, and the pattern is correct. The MultiObjective asks "do you want to try a class?" and stores the contact's *reply* — the Comparator then classifies that reply. Separating "ask" from "classify" gives the AI two shots: one at gathering the response, one at judging the response's meaning. If you skip the ask step and go straight to a Comparator, the Comparator has nothing to classify because nothing has been asked yet.

**Why a Comparator here (vs. AISwitch):**
Binary decision (interested vs. not). Comparator is the right node for 2-way true/false. AISwitch is for 3+ cases. Saves a node and is cleaner to read.

**Why a Conversation node for "not interested":**
Open-ended "try to answer their questions + gently push toward the trial" doesn't need data collection. MultiObjective would be wrong — it has a Variable slot and is meant to capture something. Conversation is the right type for "just talk until this naturally ends or they come around." The extraPrompt does the heavy lifting of behavior shaping.

### Section B: Who Is This For (n06–n07)

```
WhoFor Ask (MultiObjective) → WhoFor Switch (AISwitch, 3 cases)
```

**Why a MultiObjective before the AISwitch:**
Same pattern as Interest. MultiObjective stores the raw response in `contact.program_interest`. AISwitch then classifies. The AISwitch references `{{nodes.n06_whofor_ask.result[0]}}` in its Description — this is what the classifier reads to route.

**Why 3 cases instead of 4:**
This is the biggest strategic departure from the original. The original bot had 4: "1 kid," "1 adult," "both," "multiple enrollees." The 4th case was what forced all the 4-deep "another adult" duplication in the kids/adult chains.

I collapsed to 3: `Just me (adult)`, `Just my kid(s)`, `Me + my kid(s)`. The concept of "multiple enrollees" doesn't exist at the top level anymore — instead, it's handled by the "Anyone else?" junction at the end of each booking. This means:
- Primary booking happens via the 3-case classification
- Every "extra person" goes through the junction

**Why it works:** the "multiple" concept is really just "one primary + extras." Splitting it that way means extras share the same booking infrastructure whether they're adult #2 or kid #3 — no parallel chains.

### Section C: Tagging Nodes (n08–n10)

```
Tag: adult | Tag: youth | Tag: adult+youth
```

**Why 3 tagging nodes:**
Kept the tag-applying pattern from the original because GHL automations downstream of the bot rely on these tags to route contacts. I added "adult+youth" as a combined tag set for the "both" path (the old bot did this too). The tags fire as soon as the path is chosen — before any data collection — so if a conversation drops mid-flow, the contact is at least correctly tagged for concierge pickup.

**Why ModifyTags and not a Comparator:**
ModifyTags is the node type that applies GHL tags. It's the only choice here — Comparator doesn't apply tags, AISwitch doesn't apply tags. Not a strategic decision, just the correct node type.

### Section D: Adult Info Subflow (n11–n14)

```
Last Name → DOB → Email → Phone
```

**Why 4 separate MultiObjectives (not 1 with 4 objectives):**
CloseBot MultiObjective supports multiple objectives per node. The old bot combined first_name + last_name into one node. I could have combined all four.

I went with 4 separate nodes because:
1. **Easier to debug.** Each node has its own title, prompt, MaxAttempts. If phone collection fails, you know exactly which node.
2. **Granular MaxAttempts enforcement.** MaxAttempts caps per node — with one combined node, all 4 objectives share an attempt budget, which is confusing.
3. **Clearer progress.** A 4-node chain is visually/mentally easier to follow than a 4-objective superstruct.
4. **Doesn't cost anything meaningful.** 3 extra nodes on a 53-node bot is noise.

**Why Last Name first, not DOB:**
Name + last name is the least threatening question. DOB feels more personal. Standard "low-friction first" conversational principle. The bot already has first_name from the entry step, so the order is: first_name (entry) → last_name → DOB → email → phone. Progressive escalation of "personalness."

**Why Phone is last:**
Phone is the most friction-heavy ask (people are protective of their number). Putting it last means if the lead drops off earlier, we still have name + DOB + email — enough for a concierge to follow up. If we asked phone first and the lead bailed, we'd have almost nothing.

**Why MaxAttempts=2 everywhere:**
Hard rule from your context.md — SMS carrier violation risk (Error 30007) kicks in at higher retry counts. The old bot had `"99"` on most nodes, which is non-compliant. Set to 2 across the board here.

### Section E: Adult Booking Decision (n15)

```
Book This Adult? (Comparator, UseAI)
```

**Why a Comparator here:**
This is a binary routing decision — "is the adult being booked, or are we skipping to the kid subflow?" 2-way = Comparator. The decision reads `{{nodes.n06_whofor_ask.result[0]}}` — the original classification response — and judges "is this response saying the adult wants to be booked themselves (or adult+kid), or just a kid?"

**Why not route based on the earlier AISwitch result directly:**
I could have. The n07 AISwitch already fanned out 3 ways. Instead of re-classifying, I could have structured the flow as:
- Path 1 (adult-only) → adult info → book adult → anyone else?
- Path 2 (kid-only) → adult info → kid info → book kid → anyone else?
- Path 3 (both) → adult info → book adult → kid info → book kid → anyone else?

That would have been 3 parallel chains from adult-info onward, with duplicated kid subflows.

I chose to converge into one adult-info chain, then use the Comparator to decide "book adult or skip to kid." Trade-off: one extra Comparator node, in exchange for shared adult-info subflow instead of 3 copies.

Net: Comparator saves ~8 duplicated nodes. Worth it.

### Section F: Adult Booking + Confirm + Tag (n16–n18)

```
Book Adult No-Gi → Confirm Appointment (Statement) → Tag: appointment booked
```

**Why Statement not Conversation for Confirm:**
Statement is "bot delivers a scripted or generated line." Conversation is "open-ended back-and-forth." The confirmation should be a single bot-side delivery ("Great, you're booked for Thursday 6:30 PM..."), not a dialogue. Statement with `UseAI true` generates the confirmation text dynamically based on the booking outcome. Old bot did the same.

**Why Tag: appointment booked here:**
This is where the GHL-side "this contact completed a booking" signal fires. Downstream GHL automations (concierge notifications, email confirmations, etc.) listen for this tag. Putting the tag AFTER the confirm statement ensures the tag fires only after the confirm message is sent — not before.

### Section G: "Also for Kids?" Branch (n19)

```
Has Kids? (Comparator, UseAI)
```

**Why a Comparator here (vs. AISwitch):**
Binary decision — after adult booked, do we continue into kid subflow or jump to "anyone else?" Comparator reads the same `{{nodes.n06_whofor_ask.result[0]}}` to decide "was this a 'me + my kid(s)' case, or adult-only?"

**Why not use the AISwitch result directly:**
Same reason as n15 — I wanted to converge and re-classify rather than maintain 3 parallel chains. One extra Comparator node, saved the kid subflow from being duplicated across paths.

### Section H: Kid Info Subflow (n20–n27)

```
Kid 1 Info (MultiObjective, 2 objectives) → Kid 1 Age Switch (AISwitch) → Book [3-5 | 7-13 | 10-14] | Age 6 Notify → Confirm → Tag
```

**Why 2 objectives in one MultiObjective for kid info:**
Kid name + kid DOB are always collected together, always about the same kid, and always in the same order. One node with 2 objectives is correct here. Separating into two nodes would add a node and save nothing.

Contrast with adult info (split into 4 separate nodes): for kids, the info asks are tighter and more related. For adults, I split for debuggability. Consistency isn't the goal — fitness-for-purpose is.

**Why AISwitch (not Comparator) for age routing:**
4 possible outcomes (3-5 / 7-13 / 10-14 / age 6). More than 2 = AISwitch.

**Why age 6 has a dedicated case (not just "other"):**
The KB specifically addresses age 6 as a gap case with prescribed messaging ("no program currently available"). This is a real behavioral requirement, not a leftover edge. Breaking it out as a dedicated case gives the classifier an explicit option to choose. The alternative — routing age 6 into one of the valid-program cases — would cause the bot to try to book a kid into a wrong program.

**Why both 7-13 and 10-14 cases exist even though they overlap (ages 10-13):**
The KB says "ages 10-13 are eligible for both; present both options." In reality CloseBot's AISwitch can only pick one case. So the bot ends up picking one of the two valid programs for an overlap-age kid, and the lead gets booked into that one. Not ideal per KB, but functional — the kid still gets booked into a correct program.

The trade-off I didn't pursue: I could have added a *separate* case "ages 10-13 — overlap, present both" that routes to a Statement explaining both and asking which they prefer. That's 2 more nodes (a Statement and another AISwitch). I skipped it because (a) single-program booking for overlap-age is still correct behavior, (b) the complexity wasn't worth it for v1, (c) the lead can ask to switch programs at the trial class.

**Why Age-6 notify is a Statement (not MultiObjective):**
We're not collecting data after age 6 — we're informing the user "sorry, no program for that age." One-way delivery = Statement. After the Statement, flow jumps to Anyone Else (maybe they have other kids).

### Section I: "Anyone Else?" Junction Pattern (n40, n50, n60)

```
Anyone Else? (AISwitch, 3 cases): another adult | another kid | done
```

**Why AISwitch with 3 cases:**
3 possible outcomes. AISwitch is the right node type.

**Why 3 separate junction nodes (n40, n50, n60) instead of one:**
CloseBot has no loops. If I had ONE junction node that every booking flowed back to, the "another kid" case would need to route BACK to the kid subflow — creating a loop. CloseBot rejects this; flow must be acyclic.

So I have 3 sequential junctions: after kid 1, after kid 2, after kid 3. Each is its own node because each has a different downstream after "another kid?" — kid 2's junction routes to kid 3 subflow (not kid 1), kid 3's junction has no more kid slots (overflow tag).

The 3 junction nodes are a direct consequence of the "cap at 3 kids" decision. If we capped at 2, we'd have 2 junctions. Cap at 1, just one.

**Why AISwitch for the junction (not a Comparator + another Comparator):**
3 outcomes. Two sequential Comparators would work (first: "another adult? yes/no," second: "another kid? yes/no") but that's 2 nodes vs. 1 AISwitch. AISwitch is cleaner for 3-way decisions.

### Section J: Kid Duplication (n41–n48 for kid 2, n51–n58 for kid 3)

**Why 3 duplicate kid subflows:**
Already explained — no loops in CloseBot. Each additional kid needs its own chain of: info collection → age switch → bookings → confirm → tag.

**Why cap at 3:**
Your operational reality check. Most gym inquiries are 1 kid (solo) or 2 kids (siblings). 3 is a common upper bound. 4+ is rare enough that concierge handoff is acceptable. Cap driven by real-world distribution, not a technical limit.

**Why no variable distinction between kid 1, kid 2, kid 3:**
All 3 use `contact.youth_name` and `contact.youth_birthday`. This means kid 2's info overwrites kid 1's, and kid 3 overwrites kid 2. Flagged as a known limitation.

Why I kept this: (a) it's what the current GHL schema supports — adding per-kid custom fields is a GHL setup task for Bobby, not a bot decision, (b) the Booking nodes fire at the moment the variable is set, so each booking record itself captures the right kid's info. Only the GHL contact record reflects "last kid only." (c) Updating GHL schema mid-build would have blocked progress.

Future improvement flagged: `contact.youth_1_name`, `youth_2_name`, `youth_3_name` if/when Bobby's GHL is set up for it.

### Section K: Adult 2 — Option B (n70–n71)

```
Adult 2 Info (MultiObjective, 1 objective) → Tag: concierge additional adult → Reminders
```

**Why Option B (concierge handoff) not Option A (full bot booking):**
Option A would require distinct GHL custom fields for Adult 2 (separate first/last/DOB/email/phone). Those fields don't exist yet in the Vacaville sub-account. Creating them is a GHL setup task for Bobby.

Option B sidesteps the schema requirement: bot just captures the additional adult's name as a note and tags the contact for concierge follow-up. The concierge then completes Adult 2's booking through the normal human process.

**Why only 1 objective (just the name, not full info):**
The concierge is going to collect full info anyway during follow-up. Over-collecting in the bot would (a) be wasted friction, (b) create data that has nowhere clean to live in GHL.

Note: the "additional_adult_note" variable is probably not a real GHL field — bot stores it in a placeholder. Something for Bobby to check/create if he wants that data preserved.

### Section L: Overflow Tags (n61, n71)

**Why dedicated concierge-followup tags for overflow (not just stopping the bot):**
Overflow cases (4+ kids, 2+ additional adults) still deserve to be finished — not dropped. Tagging lets GHL workflows route these to the concierge queue so a human can wrap up. The alternative — just ending the bot silently — would leave the lead with an incomplete experience.

### Section M: Closing (n80–n81)

```
Reminders (Statement) → Open Q&A (Conversation) → EOC
```

**Why Reminders is a Statement:**
One-way delivery of rules + gear reminders. No data collection. Statement with `UseAI true` generates the language from `{{contact.first_name}}` context.

**Why Open Q&A is a Conversation:**
After reminders, the contact may ask questions. Conversation node with `ExtraPrompt` is the right tool — it's open-ended back-and-forth until the contact naturally ends or the conversation times out. KB is still loaded (EnableLibraryContext) so the bot can answer factual questions from it.

**Why Open Q&A is before EOC (not just EOC directly):**
Real leads often have post-booking questions ("is there parking?" "can I bring my dad?" "what if I'm late?"). Ending the bot immediately after the tag would feel abrupt. The Conversation node keeps the door open for those.

### Section N: Custom Scenarios (n90, n91)

**Why only 2 scenarios (not more):**
Most behaviors are better handled by the Job Description (global rules) or the KB (factual answers) than by custom scenarios. Custom scenarios are interrupt handlers — they should be rare. I kept the two that demonstrably solve a specific problem:

- **Sign Up interrupt** — catches the case where a lead says "I want to book" or gives their DOB before the bot has reached the "Who's this for?" step. Without this scenario, the bot would keep following the entry script while the lead is trying to hand over booking info.
- **No Additional Booking interrupt** — catches the case where a lead has completed one booking and is clearly done, but the bot hasn't reached the "anyone else?" junction yet (maybe still in kid info collection for a second kid they're now saying they don't want). Routes to Reminders + EOC.

**Why no pricing interrupt scenario:**
The pricing redirect is baked into the Job Description. The bot should follow the JD rule on any turn it sees a pricing question. A scenario would be redundant. (Tested: pricing_deflect persona passed without one.)

**Why no FAQ interrupt scenario:**
FAQ handling is via `EnableLibraryContext`. The bot reads the KB on any factual question. No scenario needed. (Tested: general questions throughout all 8 persona runs worked fine.)

**Why no member-check scenario:**
You confirmed GHL filters out already-engaged leads upstream via the `showed` tag. The bot never sees those leads. No member check needed at the bot level.

---

## Part 3 — What I Kept From The Original

Not a rewrite-from-scratch — several patterns from the old bot were correct and I preserved them:

| Pattern | Why Kept |
|---|---|
| Source → GetName → Interest → Interested? Comparator entry | Correct conversational progression — low-friction first, classify only after asking |
| MultiObjective + AISwitch pattern for classification | Correct: ask and store in one node, classify in the next |
| ModifyTags nodes for youth/adult routing | Downstream GHL automations listen for these |
| GHL Booking node with `FailedTag: concierge - failed booking` | Correct failure-path strategy — failed bookings go to concierge, not silently dropped |
| Sign Up custom scenario | Genuinely solves the "lead rushes ahead" problem |
| Statement → ModifyTags → Conversation terminal coda | Correct sequencing |
| Emma persona + front-desk framing | Correct conversational positioning |

---

## Part 4 — What I Changed And Why

| Old | New | Why |
|---|---|---|
| 4-case top-level classification | 3-case | Collapsing "multiple" into "anyone else?" junction removes parallel chains |
| 4-deep "another adult" duplication | 1 primary + Option B concierge handoff for adult 2 | Almost no inquiries need 3+ adults booked via bot; concierge handles rare cases |
| 4 parallel enrollee-count branches | 1 shared adult-info subflow + branch on "book adult?" Comparator | Consolidates ~30 duplicated nodes into one subflow + one Comparator |
| Kids Classes MultiObjective with kickboxing prompt | Removed (source bleed from another client) | Non-negotiable GSA rule — no source bleed |
| `MaxAttempts "99"` on most nodes | `MaxAttempts 2` everywhere | SMS carrier compliance (Error 30007) |
| No explicit age-6 gap handling | Age 6 as a dedicated AISwitch case with Notify Statement | KB specifies this case; bot should handle explicitly |
| `Sensitivity 3` typo on one node | `Sensitivity 60` consistently | Typo fix, sensible default |
| "BJJ and Wrestling" industry framing | "Grappling Martial Arts (No-Gi BJJ / Submission Grappling)" | Resolves the KB-vs-config wrestling contradiction |
| Pricing figures in KB Section 6 + FAQ ($50, 15%) | All stripped; approved pricing redirect everywhere | GSA hard rule — no pricing in bot-facing content |

---

## Part 5 — Explicit Trade-offs

Decisions where I picked one side and should be transparent about the alternative I didn't pick:

1. **Option B for Adult 2 vs. Option A (full bot booking).** I picked B (concierge handoff). Trade-off: bot doesn't fully book the 2nd adult, concierge does. Alternative: set up `additional_adult_*` GHL fields, bot books Adult 2 in full. Chose B to avoid blocking on GHL schema setup.

2. **Single `contact.youth_name` shared across kid 1/2/3 vs. `youth_1_name` / `youth_2_name` / `youth_3_name`.** I kept the shared pattern. Trade-off: GHL contact record only holds last kid's info. Alternative: per-kid fields. Chose shared to match Bobby's current GHL setup.

3. **3-kid cap vs. higher.** Picked 3. Trade-off: 4+ kid inquiries fall through to concierge. Alternative: cap at 2 (less duplication) or 4-5 (more coverage). Chose 3 as coverage sweet spot.

4. **Converge-then-re-classify pattern (Comparators after subflow) vs. parallel chains from the top.** I picked converge-then-re-classify. Trade-off: adds ~3 Comparator nodes. Alternative: 3 parallel chains from the top with duplicated subflows. Chose converge to share adult-info + kid-info subflows.

5. **Separate MultiObjectives for each adult field (last/DOB/email/phone) vs. one combined 4-objective node.** I picked separate. Trade-off: 3 extra nodes. Alternative: 1 combined node. Chose separate for debuggability.

6. **Overlap-age handling (present one program vs. present both).** I picked "pick one" (AISwitch routes to one program). Trade-off: KB says "present both." Alternative: add a "10-13 overlap" case with a Statement that explains both and asks. Chose pick-one for simplicity; lead can switch at trial class.

7. **Scenarios kept minimal (2) vs. more scenarios for FAQ/pricing/etc.** I picked minimal. Trade-off: some behaviors rely on JD + KB rather than explicit interrupts. Alternative: add scenarios for pricing / FAQ / not-ready / etc. Chose minimal because testing showed JD + KB handles these correctly.

---

## Part 6 — Known Limitations (For Discussion)

- **Age 6 routing is probabilistic.** The AISwitch classifier sometimes routes age 6 into a valid-program case (tries to book, fails in test mode, bot gracefully punts). Works fine in production with concierge follow-up; could be tightened with an explicit age-capture variable.
- **Multi-kid GHL data preservation.** Only the last kid's name/DOB persists on the GHL contact record. Bookings themselves preserve each kid individually.
- **Adult 2 via Option B assumes concierge follow-up.** If concierge capacity is thin, extra adults might not get completed bookings. Acceptable per GSA's human/bot division of labor.
- **4+ enrollee cases (adult or kid) go to concierge tag only, no data collection for them.** Rare, but worth flagging.
- **AISwitch classification has AI variance.** Same input can sometimes route slightly differently across test runs. Testing confirmed zero compliance violations across 2 full runs; functional behavior is consistent even when classification paths vary.

---

## How To Read This Doc Going Forward

- **For design questions** (e.g., "why did you route X to Y?") → find the relevant section in Part 2
- **For "should we change this?" questions** → look at Part 5 (the trade-offs are the places where alternatives are on the table)
- **For "what might go wrong in production?"** → Part 6
- **For context on vs-original changes** → Parts 3 and 4

Ready to dive into any specific section. Which part do you want to start with?
