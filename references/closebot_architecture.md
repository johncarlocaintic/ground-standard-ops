# CloseBot workflow engineering reference

CloseBot is an AI SMS agent platform that sits on top of GoHighLevel (and HubSpot) to qualify leads, answer questions, and book appointments conversationally. This reference is built for practitioners shipping bots in production — it maps CloseBot's actual node vocabulary, documents the sharp edges, and gives copy-ready patterns for the most common flow archetypes. Throughout, **[CONFIRMED]** means the fact was found in official CloseBot docs/blog, a documented NEPQ source, or a primary GHL source; **[INFERRED]** means it's extrapolated from documented primitives, general SMS chatbot practice, or practitioner conventions.

**Three framing facts to internalize before reading the rest.** First, CloseBot has two generations — **V1 (Classic)** used a GHL "Customer Replied" workflow + webhook; **V2 (current, Apr 2025+)** triggers natively via Source Filters inside CloseBot and no longer needs that workflow [CONFIRMED]. Second, CloseBot's real node names differ from this document's task brief — what the brief calls "AISwitch" is the Switch node with the "Use AI to power the decision" toggle; "Comparator" is the same Switch node without that toggle; "GHL Action" is distributed across Booking, Modify Tags, and Set Field [CONFIRMED]. Third, an **Agent Node** (announced for April 22, 2026) is rolling out that collapses many chained nodes into a single prompt-driven node with per-tool toggles [CONFIRMED]; existing nodes continue to work alongside it, so everything below remains valid.

---

## 1. Node types and when to use each

CloseBot's flow builder ("Job Flow") is composed of **Actions** (draggable nodes) plus a few ambient constructs. The full inventory, using CloseBot's actual vocabulary:

### Objective — the data-collection workhorse [CONFIRMED]

**What it does.** Conversationally gathers one or more pieces of information from the contact and optionally writes each to a field on the connected source (GHL custom field or HubSpot property). A single Objective can contain multiple "parts" so the bot asks for several items in one breath ("Mind if I grab your first name and email?").

**Use when** the AI must *get* information. **Do not use** to deliver information (use Statement) or to sit in open Q&A (use Conversation).

**Key configuration fields.** Title (internal); **Short Description** (the most important field — tells the AI *what to collect*); Output Variable (optional field to auto-update); and advanced per-part settings for Extra Prompt, Max Attempts, Sensitivity, and Skip if Not Blank.

**Common mistakes.** Writing the Short Description as an imperative ("Ask what their name is") — the AI satisfies it by merely asking. **Do this instead**: `determine the contact's name`. Another frequent trap: `see if they are interested` — the bot won't mark the objective complete on a "no," so it loops. **Do this instead**: `see whether or not they are interested`, which completes on both yes and no. Packing multiple goals into one short description is also an anti-pattern — split into parts. Finally, remember that fields only write when the objective hits the green checkmark; debug via the PARSE and LOG tabs on individual messages.

### Statement — the bot's mouthpiece [CONFIRMED]

**What it does.** Makes the agent say something. Can be AI-rephrased or sent verbatim.

**Use when** you need to give info, send a URL, deliver a disclaimer, or make a transition. **Do not use** for data collection or open Q&A.

**Critical toggle: "Use AI to generate a response."** ON means the AI rewrites using the Persona's voice. OFF sends the text literally — **mandatory for URLs, legal disclaimers, coupon codes, or any payload where paraphrasing would break it**. The canonical pattern for a booking link: two statements back-to-back — an AI-rephrased "Here's the link I mentioned" followed by a verbatim `https://…?name={{first_name}}`.

Other flags: "Move on without a response" (default ON) auto-advances; turn OFF to require acknowledgment. An optional image URL can be attached.

### Conversation — open Q&A state [CONFIRMED]

**What it does.** Parks the agent in an open-ended state, answering freely from the knowledge base and tools. Typically used at the start or end of a flow, paired with Custom Scenarios that detect intent and jump into specific sub-flows.

**Critical constraint: follow-ups do not schedule while a contact sits on a Conversation action** — only on Objective or Booking nodes. If you need nag cadence, route users back through those node types.

### Switch — covers both the brief's "AISwitch" and "Comparator" [CONFIRMED]

**What it does.** Routes the conversation down one of N branches. Produces no message. Configure a Left Value, Right Value, Operator (equal, not equal, contains, greater-than, less-than, etc.), and one branch per expected value plus an automatic fallback.

The **"Use AI to power the decision"** toggle is the entire difference between the brief's two node concepts. **OFF = deterministic comparator** — use when the value is stored in a field, when you need testable predictable routing, and when you want numeric or boolean comparisons. **ON = AI-judged** — use when the criterion was discussed but never saved, when you want fuzzy semantic categorization, or when you need a "none of the above" safety branch.

**Do this, not that.** Use `contains` instead of `equal` on user-supplied strings (whitespace and casing will bite you). Always wire up the fallback branch, even if just to a clarifying re-ask. Don't use AI mode when a deterministic branch would do — it costs tokens and is less predictable.

### True/False — binary branch [CONFIRMED referenced]

A simpler yes/no node. Use for explicit boolean checks (has tag? field filled?). Use Switch when you need 3+ branches or complex operators. Exact configuration details weren't retrieved in full — [INFERRED] it takes either a condition expression or an AI-evaluated yes/no prompt, mirroring Switch.

### Custom Scenario — the always-on listener [CONFIRMED]

**What it does.** Continuously monitors the conversation from anywhere in the flow and jumps to a sub-flow when a described condition is detected. After the sub-flow completes, CloseBot auto-returns to where the main flow left off — unless the scenario's last node doesn't connect, in which case it ends.

**Use when** a condition could occur at any point (booking intent, not-interested, human-handoff request). This is the mechanism that makes CloseBot bots feel human — it's why the official recommended architecture is: Conversation action + multiple Custom Scenarios rather than a rigid linear chain.

**Configuration fields.** **Description** (what to watch for, phrased naturally: "The contact wants to book a demo"). **Threshold** (1–10; 1 is hypersensitive, 10 is strict — **start at 5–7**). **Priority** (when multiple could fire on one message, highest priority wins). **Allow Re-Entry** (critical for legitimate repeat triggers like rebooking).

**Re-trigger rules.** If the scenario connects back to main flow, it locks out for **the next 5 messages** after firing [CONFIRMED]. If it ends in a terminal/unconnected node, it can't trigger again until the main flow re-enters.

**Common mistakes.** Threshold set too low → scenarios fire on casual mentions. Forgetting Allow Re-Entry on repeat-use cases. Overlapping descriptions creating priority conflicts.

### Booking — inline calendar booking [CONFIRMED]

**What it does.** Books an appointment conversationally on a connected calendar. Discusses times in natural language, checks real availability via API, and **creates the actual GHL appointment** — no external slot picker, no calendar link. This is a major differentiator from most SMS bots.

**Key configuration.** Pick a calendar by name from the dropdown, or choose "Other – Use Calendar ID" and paste the **Permanent ID** (random letters+numbers in GHL calendar settings, NOT the custom slug). For dynamic routing, store the Permanent ID in a Job Flow Variable or GHL Custom Value and reference it via the `+` picker. **Keep Short Description short** — appointment type + duration only.

**Hard requirements.** Contact must have a phone or email on record or the GHL appointment API rejects the booking. If contacts span timezones, **always add a Timezone objective before the Booking node** — otherwise "2pm" is ambiguous.

**Rescheduling** is disabled by default. Enable it under Job Flow Settings → Important Business Information → Conversational Rescheduling. Once on, the agent can reschedule any appointment on the contact's record, even ones it didn't originally book — so turn this on deliberately.

### Custom Webhook — external API calls [CONFIRMED]

**What it does.** Makes an HTTP request mid-conversation and parses the response into variables available to downstream nodes.

**Critical gotcha.** You must click **Test Webhook** and see a response in the box BEFORE saving. If you later modify the URL or body, you must re-test before saving or the output variables go stale. The docs are explicit: "You cannot come back and modify the webhook later without again running a Test Result once again, otherwise you will not have access to those variables later."

**"Wait for response"** defaults ON (flow pauses). Turn OFF for fire-and-forget events (analytics beacons, Zapier triggers). Documented use cases include Stripe cancellation lookups, Zillow comp pulls, Google Solar API savings estimates, and ServiceTitan availability checks.

### Delay (time) and Delay (variable) [CONFIRMED]

Two distinct nodes. **Delay (time)** waits a duration, with an "Allow responses during delay" toggle that determines whether the agent still replies to incoming messages while the timer runs. **Delay (variable)** waits until a specified source field becomes non-blank — the canonical pattern for "wait for an external quote-generation workflow to write back before continuing."

### Stop Responding — the soft stop [CONFIRMED]

**What it does.** Halts agent responses but keeps the contact eligible for Custom Scenario triggers and Conversational Rescheduling. Does NOT modify fields or add tags by default.

**Use Stop Responding vs the `ai off` tag.** Stop Responding is a **soft stop** — re-engageable via scenarios; use when a lead might come back. The **`ai off` tag** (or `cb_ai_off=true` field on HubSpot) is a **hard stop across ALL CloseBot Job Flows** — use for permanent opt-outs only.

### Modify Tags, Set Field, and Save Conversation [CONFIRMED]

**Modify Tags** adds or removes tags in the connected source — the primary bridge from bot state to GHL workflows. **Set Field** writes a deterministic value (constant, variable, or webhook output) to a source field without needing an Objective to complete — use when the value is computed rather than conversational. **Save Conversation** writes either a full transcript or an AI-generated summary to a chosen contact field; drop it late in a flow (pre-Stop Responding, post-booking) so human handlers get context on hand-off.

### Aggression Detected / Bot Detected [CONFIRMED referenced]

Pre-built classifier nodes that apply `ai aggression detected` or `ai bot detected` tags. Used with Source Filters to exclude flagged contacts from future Job Flow entry. Detailed config wasn't retrieved, but they're referenced in the Agent Node announcement as existing nodes being supplanted.

### Agent Node (launching April 22, 2026) [CONFIRMED, not yet GA]

A single natural-language node organized into sections, with per-node tool toggles (book appointment, check availability, reschedule, update tags, update contact, reference docs) and "exits" that define when to advance. Global tools apply across all Agent Nodes in a flow. **It does not replace existing nodes** — CloseBot recommends a hybrid approach for maximum reliability plus flexibility.

---

## 2. Conversation flow architecture

**Linear vs branching vs hybrid.** Pure linear flows (Objective → Objective → Booking → Stop Responding) are highest-reliability and appropriate for single-service businesses with one lead path [CONFIRMED]. Branching (Switch, True/False, Custom Scenario) is required when leads split by category, service, or geography. **CloseBot's own recommended architecture is hybrid**: start with a Conversation action plus Custom Scenarios for each identifiable "job" (book, not interested, human handoff). This mimics a real sales conversation — soft upfront, focused once intent is detected.

**The canonical multi-stage journey [CONFIRMED pattern].** Entry → Modify Tags (`ai responded`) → Conversation (with subtle steer instruction) → Custom Scenarios for Book Demo / Not Interested / Aggression. The Book Demo scenario typically runs: Objective (name+email) → Objective (timezone) → Booking → Statement (confirmation) → Save Conversation → back to Conversation for post-booking Q&A. The Not Interested and Aggression scenarios end in Modify Tags + Stop Responding.

**Entry points.** Contacts enter based on **Source Filters** (channel filter + tag filter). Green tags are required-to-enter (contact must have ALL); red tags are disallow (contact with ANY is blocked). `ai off` is in every Source Filter's red list by default [CONFIRMED]. Channel filters restrict by SMS, Live Chat, FB Messenger, IG, Email, WhatsApp, or GBP — and one agent can span multiple channels with context carried across them.

**Re-entry logic.** A contact who already completed a flow can re-enter if they still match filters. Custom Scenarios can pull contacts out of a Stop Responding state (the primary re-engagement mechanism). `ai off` blocks re-entry across the entire account until removed. Follow-ups only fire while the contact is on an Objective or Booking action and hasn't responded — when they reply, the cadence resets.

**Connection best practices.** Every Switch branch must terminate in Stop Responding, a Conversation, or a loop back — no dangling nodes. **Always end disqualification branches with Stop Responding**, because otherwise the default "return to main flow after scenario completes" behavior will re-engage a lead you just disqualified. Place Modify Tags early (first node after entry) so GHL workflows react immediately; place Save Conversation late so the summary captures full context.

---

## 3. Data collection best practices

### Sensitivity [CONFIRMED]

A 0–100 scale controlling how strict the AI is about accepting an answer as valid. **Default is 50.** 100 demands an extremely clear, explicit answer; 0 accepts almost anything.

**Tuning guide** (some values [CONFIRMED], most [INFERRED] from practitioner conventions):
- **Names, email: 60–70.** Want accuracy, tolerant of typos.
- **Soft qualification** (reason for interest, goals): **30–45.** Accept vague but meaningful answers.
- **Hard qualification** (homeowner y/n, has existing policy): **70–85.** Want a clean yes/no.
- **Timezone before booking: 70+.** Must be unambiguous.

### Max Attempts [CONFIRMED]

The number of times the bot tries before giving up and advancing. **Default is effectively unlimited** — not a numeric default in docs; behavior is described as persistent until completion unless capped [INFERRED from documentation phrasing].

**Recommended caps.** Mandatory data (name, email, phone): unlimited or very high. Optional qualification: 2–3. Sensitive questions (budget, income): 2 — if they dodge twice, stop asking and move on. Hitting the cap skips the part entirely; no green check, no field write. Design the downstream node to handle the incomplete data (e.g., a Switch that routes blank fields to a human handoff).

### Skip If Not Blank [CONFIRMED]

**Default ON.** If the mapped output variable already has a value on the contact record, the Objective part is skipped. This is what makes form-prefill work — the bot won't re-ask for a first name that was captured on the opt-in form.

**Turn OFF when** you specifically want to overwrite (data refresh, "correct your email" flows).

### Variable naming [PARTIAL / INFERRED]

Two variable sources: **source variables** (GHL custom fields, HubSpot properties — follow the source's convention) and **Job Flow Variables** (template variables defined per-flow, filled in per-source). Official docs show examples like `Calendar ID`, `Business Information`, `Services` — free-form Title Case is fine. Webhook output variables are named during response mapping (`count`, `age`, `name`).

**Reserved system values** [CONFIRMED]: tags `ai off`, `ai responded`, `ai objectives complete`, `ai booking error`, `ai aggression detected`, `ai bot detected`; HubSpot field `cb_ai_off`. **Convention [INFERRED]**: prefix bot-managed tags with `ai ` or `bot-` to keep them separate from client tag hygiene; use lowercase, boolean-style (present/absent).

### Partial or unclear answers [CONFIRMED]

Multi-part Objectives accept partial credit — if the lead gives first name but not email, the AI re-asks only for the missing piece. Phrase Short Descriptions as "see whether or not…" so both yes and no satisfy completion (prevents infinite loops on negatives). Use **Extra Prompt** for inline interpretation guidance: *"Accept approximate timeframes (e.g., 'sometime next month') as valid."* Lower Sensitivity for subjective questions.

**Validation options are limited.** CloseBot relies on AI judgment + Sensitivity rather than regex validators. For hard validation (ZIP pattern, SSN shape), use a Custom Webhook to an external validator, or branch a Switch on the output variable with a `contains` check. GHL field-type validation (email shape) catches shape errors at save time and surfaces as orange/red API logs.

---

## 4. Logic and branching design

**Switch (AI mode) vs Switch (deterministic) vs Custom Scenario.** Structured decision at a known point, value already in a field → deterministic Switch. Numeric comparison → deterministic Switch. Decision criterion discussed conversationally but not saved → AI-mode Switch. Condition that could occur *anywhere* in the flow → Custom Scenario. Simple yes/no → True/False. **>3 branches** → Switch.

Switch is **positional** (fires only at its place in the flow). Custom Scenario is **ambient** (listens continuously). The distinction is the single most important branching decision in CloseBot architecture.

**Exact match vs fuzzy logic.** Deterministic Switch `equal` is case- and whitespace-sensitive; prefer `contains` for user-supplied strings. AI-mode Switch and Custom Scenario use semantic matching; tune strictness via the scenario Threshold (1–10) or implicitly via how the decision prompt is phrased.

**Multi-condition stacking.** A single Switch compares one pair. For AND logic, **chain Switches** or pre-compute a flag via Set Field / Webhook and branch on that. For OR logic, add multiple branches with different Right Values that lead to the same downstream node. Custom Scenarios each evaluate independently — if two could fire on the same message, Priority wins.

**Ambiguous responses.** Lower Sensitivity. Use Extra Prompt to specify how to treat edge cases (*"Treat 'maybe' as 'not interested' for this objective"*). In AI-mode Switches, **always wire the fallback branch** to a clarifying Statement + re-ask rather than leaving it dead.

**Fallback path design.** Every AI-powered Switch gets a fallback branch — wire it somewhere. Every Custom Scenario should launch at Threshold 5 and be tuned up or down from production data. Max Attempts on Objectives acts as an implicit fallback — ensure the *next* node handles blank fields gracefully. **Always terminate disqualification and hostile-lead branches with Stop Responding** to prevent the auto-return-to-main-flow behavior from re-engaging them.

---

## 5. Edge case handling

**Opt-out detection.** SMS carrier-level STOP/UNSUBSCRIBE is handled at the GHL/Twilio layer — those messages auto-opt-out the contact and CloseBot inherits the downstream effect. For softer opt-outs ("please stop", "leave me alone"), build a **Custom Scenario** with description like *"The contact is telling us to stop contacting them"* → Modify Tags add `ai off` → Stop Responding [CONFIRMED pattern]. The `ai off` tag is the universal kill switch — in every Source Filter's red list by default, blocks all future Job Flow entry until removed.

**Unresponsive leads.** CloseBot's native **Follow-ups** (Job Flow Settings → Follow-ups) configure cadence (e.g., +1 day, +5 days). Critical constraint: **follow-ups only schedule while the contact is on an Objective or Booking action** [CONFIRMED] — not on Conversation. The "Repeat final follow-up" toggle loops the last interval indefinitely. Cadence resets on any contact reply and respects the source's business hours / timezone.

**Wrong or off-topic answers.** Max Attempts acts as the release valve — after N tries the Objective advances, field blank. Persona-level instruction to handle off-topic gracefully plus Custom Scenarios for common tangents (common questions, pricing objections) keep the bot from getting stuck. Smart FAQ tool can answer tangents without derailing the active objective.

**Aggression detection.** CloseBot has a pre-built detection mechanism that applies the `ai aggression detected` tag [CONFIRMED]. Canonical pattern: Custom Scenario "contact is aggressive/hostile" → Modify Tags (`ai aggression detected` + `ai off`) → Stop Responding. A secondary de-escalation Job Flow can be filtered on `ai aggression detected` as a green tag to deploy a specialized calm-tone persona [CONFIRMED pattern].

**Goodbye detection.** Not a pre-built node — use a **Custom Scenario** with description *"The contact is saying goodbye or ending the conversation"* → optional Statement acknowledging → Stop Responding [INFERRED from scenario patterns].

**Bot detection.** Applies the `ai bot detected` tag when it suspects it's talking to another automated system (spam) [CONFIRMED referenced]. Use as a Source Filter disallow to exclude flagged contacts going forward.

**Default vs custom behavior.** Out of the box, CloseBot handles STOP via the carrier, has `ai off` baked into every red list, and ships aggression/bot-detection classifiers. Everything else — soft opt-out, goodbye, "call me tomorrow", "send me an email instead" — requires a Custom Scenario.

---

## 6. NEPQ methodology in SMS context

### The framework [CONFIRMED]

**NEPQ = Neuro-Emotional Persuasion Questioning**, developed by Jeremy Miner (7th Level, ~2016). The canonical structure has 5 high-level stages with Engagement containing five sub-types:

1. **Connecting** — puts focus on them, off you
2. **Engagement** — Situation → Problem Awareness → Solution Awareness → Consequence → Qualifying
3. **Transition** — "Based on what you told me…" bridge
4. **Presentation** — demo solution against stated problems
5. **Commitment** — next-step question

The method's signature moves are (a) explicit tonality (**curious, calm, concerned, skeptical, empathetic**), (b) a **Two Truths** detour for prospects who say "things are fine" (*"is there anything you would change if you could?"*), and (c) commitment questions phrased as *"Do you feel like this could be the answer for you?"* so the prospect asserts the fit.

**Versus alternatives.** SPIN (Rackham) drives logical problem discovery — better for complex B2B. Sandler focuses on pain-funnel plus early disqualification via up-front contracts. Hormozi's **CLOSER** (Clarify, Label, Overview, Sell, Explain, Reinforce) overlaps heavily with NEPQ and its Value Equation (Dream Outcome × Perceived Likelihood ÷ Time Delay × Effort) is more relevant to the offer/CTA than the qualification conversation.

### Adapting NEPQ to SMS [INFERRED — no canonical guide exists from 7th Level or CloseBot]

The core problem: NEPQ was built for voice, where tonality does half the work and a single question unpacks 60+ seconds of speech. SMS strips tonality and turns a continuous conversation into turn-taking with possibly hours between messages. Adaptation principles:

1. **One question per message. Never stack two.** A NEPQ "probe then clarify" becomes a multi-turn dance.
2. **Under ~160 characters where possible** (single SMS segment), hard ceiling ~320.
3. **Replace vocal softeners with written ones.** "Just curious —", "Out of curiosity,", "Quick q —", "If you don't mind me asking,".
4. **Lowercase and contractions.** "dont" not "do not." Avoid exclamation points and emojis at the qualification stage — they read as bot/marketer.
5. **Compress stages, don't skip them.** Aim for 1–2 questions per stage (voice-call NEPQ would run 3–4). Total bot messages Connecting → Commitment: ~8–12.
6. **Echo-back before each new stage.** SMS can't paraphrase vocally, so mirror in one sentence: *"Got it — so leads are coming in but not converting. How long's that been going on?"*
7. **Two Truths is essential for SMS** — cold lead default is "just curious, things are fine."
8. **Consequence is the riskiest question on SMS.** Over-amplifying pain by text reads manipulative faster than on voice. Use ONE soft consequence question, not two or three. For hot leads, skip Consequence entirely and go straight to Qualifying.

### NEPQ-in-CloseBot mapping

| NEPQ stage | CloseBot construct | Notes |
|---|---|---|
| Connecting | Objective (collect reason for reaching out) | Reference `{{contact.ad_source}}` to personalize |
| Situation | Objective + GHL field write | One fact per turn |
| Problem Awareness | Objective, 2–3 turn loop | Longest-dwelling; capture problem AND impact before advancing |
| Solution Awareness | Objective | Single turn: "What have you tried?" |
| Consequence | Objective, gentle tone instruction | Skip if lead is already hot |
| Qualifying | Switch (AI mode) | Routes: book now / nurture / disqualify |
| Transition | Statement (AI-rephrased) with mirror template | *"Based on what you told me, you want X without Y — here's what we do…"* |
| Commitment | Booking node | Native GHL calendar integration |

### Ready-to-paste SMS prompts — home services example [INFERRED]

- **Connecting**: "Hey {{first_name}}, this is Jamie with {{company}} — saw you reached out about {{service}}. Mind if I ask a couple quick questions so I can point you in the right direction?"
- **Situation**: "Out of curiosity — what's the current situation with your {{service}}? (is it old, broken, or are you just pricing options?)"
- **Problem Awareness**: "Gotcha. And what's been the biggest headache with it so far?" → probe: "Yeah that's frustrating — how's that been affecting you day to day?"
- **Solution Awareness**: "Have you had any other companies out to look at it, or is this the first quote you're getting?"
- **Consequence**: "Makes sense. If you held off another 6–12 months, what do you think that'd look like?"
- **Qualifying**: "On a scale of 1–10, how important is getting this handled in the next 30 days?"
- **Transition**: "Based on what you shared — sounds like {{echo pain}} and you want it handled before {{timeframe}}. We specialize in exactly that. Want me to grab a slot for a free 15-min on-site assessment?"
- **Commitment**: "Cool — here's the calendar: {{booking_link}}. Any day this week work better for you, or next?"

### When NEPQ vs direct CTA

**Direct "book now"** wins for high-intent leads (completed quote form, clicked "book a demo"), self-explanatory low-ticket offers (<$500), and warm traffic (existing customers, referrals). **NEPQ discovery** wins for top-of-funnel opt-ins, tickets >$1K, offers requiring emotional shift (fitness, coaching, insurance), and cold database reactivation. **Hybrid is usually right**: 2–3 NEPQ questions, then if answers indicate intent+budget+urgency → book; else → continue discovery. CloseBot's Switch node handles this branching natively.

---

## 7. GHL integration patterns

### Connection setup [CONFIRMED]

Install as a HighLevel Marketplace app (or via LeadConnector — same OAuth flow). Sub-account-level connection. Sources → Add → HighLevel LeadConnector → OAuth → pick sub-account → **check "Allow CloseBot to create/update fields"** (required for custom field writes) → Add Source. Must be agency admin in GHL for OAuth to succeed — this is the most common install failure. Optional: paste your own OpenAI API key on higher plans to save credits.

### Trigger design — V2 does NOT use GHL workflows [CONFIRMED]

This is the single biggest gotcha when migrating from V1 guides. **V2 triggers via Source Filters inside CloseBot, not a "Customer Replied" GHL workflow.** Channel filter picks SMS / Live Chat / Email / FB / IG / WhatsApp / GBP; tag filters gate entry (green = required, red = disallow). The bot kicks in when a message is received on a listened channel from a contact that passes filters.

**First touch is still GHL.** Outbound first-touch (drip SMS, cold outreach) lives in GHL workflows; CloseBot takes over when the contact replies. For form-triggered flows, build a GHL workflow with Form Submitted trigger that sends the first SMS using form variables, then remove the contact from the workflow on reply so the drip stops when CloseBot engages. For tag-triggered outbound (DBR/reactivation), GHL workflow: tag `dbr` added → drip limit → wait for business hours → tag `attempting contact` → create opportunity in Attempting Contact stage → send SMS #1 → wait 1 day → SMS #2 → etc. [CONFIRMED, documented in CloseBot's own DBR playbook].

**Multiple bots in one sub-account.** Route via tag-based Source Filters — one agent filters on required tag `solar`, another on `roofing`.

### Tag strategy [CONFIRMED]

Tags are the primary currency between CloseBot and GHL. **Reserved/built-in tags**: `ai off` (universal kill switch, in every red list by default), `ai responded` (first bot reply), `ai objectives complete` / `all objectives completed` (every objective green-checked — the canonical "bot-qualified" trigger), `ai booking error` (booking failed — alert client to fix calendar), `ai aggression detected`, `ai bot detected`.

**Common custom tag conventions** seen in documented builds: `dbr`, `attempting contact`, `not interested`, `demo booked` / `bot-booked`, `ready-to-book`, `buyer` / `seller` (real estate).

**Naming convention [INFERRED best practice]**: prefix bot-managed tags with `ai ` or `bot-` so client tag hygiene stays separate; lowercase with spaces or hyphens; boolean (present/absent) rather than categorical values encoded in tag names.

### Custom field mapping [CONFIRMED]

**Reading GHL data.** Any GHL custom field is available via the `+` variable picker throughout the Job Flow — in Statements, Objective prompts, URLs, webhook bodies. Resolves at runtime; blank if unfilled. Objectives **Skip If Not Blank** by default, so pre-populated form data is respected automatically.

**Writing to GHL.** Objectives are the primary write mechanism via the **Auto Update** dropdown on each part. **Fields only write when the Objective completes (green checkmark).** Failed/skipped objectives don't write — critical for disqualification flows where you want a reason captured. Design the Short Description so the objective completes on both positive and negative answers. Multi-source bots writing to the same field key update all connected sources simultaneously.

**Special built-in writes**: Chat Summary tool writes a rolling AI-generated summary to a chosen field; Chat Transcript tool writes the raw back-and-forth.

**Setup steps**: create GHL custom fields → drag Objective → add a part per field → use Auto Update dropdown → map each to its GHL field → verify with Testing Portal (creates real ghost contacts in GHL so field writes are visible live).

### Pipeline stage updates [CONFIRMED indirectly]

**CloseBot has no native "move opportunity to stage X" action.** The pattern is: bot applies a tag via Modify Tags → GHL workflow with a Contact Tag trigger runs the native **Update Opportunity Stage** action. Canonical mapping from CloseBot's DBR playbook:

| CloseBot tag | GHL opportunity stage |
|---|---|
| `attempting contact` (set by outbound workflow) | Attempting Contact |
| `ai responded` | Engaged |
| `demo booked` / booking event | Demo Booked |
| `not interested` / `ai aggression detected` | Not Interested |

Alternative: GHL's native **Appointment Booked** trigger fires when CloseBot books on a GHL calendar — drives the stage update without needing a tag intermediary.

### Webhook usage [CONFIRMED]

Three concepts: (1) **Custom Webhook action** inside a Job Flow — mid-conversation HTTP calls with response parsing; (2) **Variable Delay** — pause until a GHL field changes value, for offloaded computation; (3) **Public API** at `https://api.closebot.com` with `X-CB-KEY` header for programmatic pushes into CloseBot from external systems.

### Phone number / SMS infrastructure [INFERRED]

CloseBot doesn't provide phone numbers — it uses whatever messaging channels GHL has configured (LC Phone, direct Twilio). A2P 10DLC registration, trust bundles, and number provisioning are all GHL-side. CloseBot has a native "hold until business hours" behavior that respects source timezone — if a follow-up is due at 2 AM, it waits [CONFIRMED].

### Human handoff tiers [CONFIRMED]

Three levels. **Soft pause** — Stop Responding action, re-engageable via scenarios and Conversational Rescheduling. **Hard handoff** — `ai off` tag, excludes from all Job Flows until removed. **Notify + stop** — custom tag like `human handoff requested` → GHL workflow sends Slack/email notification, creates task, assigns owner, optionally also adds `ai off`. The canonical documented example is the "All Objectives Completed" pattern: `ai objectives complete` tag → GHL workflow → internal notification + summary email with chat transcript field content.

---

## 8. Common flow archetypes

### Lead qualification — martial arts / trial offer [INFERRED structure; CloseBot docs reference gym-joining examples]

1. Modify Tags → `ai responded`
2. Objective (name + email) → auto-update `first_name`, `email`
3. Objective → student age → `student_age`
4. Switch on age: under 18 → Objective (parent name + goals for child); 18+ → Objective (adult goals)
5. Objective → timeline + preferred class type
6. Ambient Custom Scenario: disqualification (too far, wrong age bracket, unresolvable cost objection) → Modify Tags `not interested` → Stop Responding
7. Booking → Trial Class calendar
8. Statement → confirmation + address + what to bring
9. Modify Tags → `bot-booked`
10. Conversation → open Q&A until class

### Solar lead qualification [INFERRED from CloseBot's documented solar API example]

Follows the same skeleton but includes a homeowner gate (disqualifies non-owners early) and a **Custom Webhook to Google Solar API** between qualification and booking to pull estimated savings, which then feeds into a Statement that shares the number conversationally before the Booking node.

### Mortgage lead [INFERRED]

Add a purpose-of-loan Switch (purchase / refi / cash-out), self-reported credit range, and target price/balance. Disqualify on credit range below threshold or loan amount below minimum. **Use Statement with AI rewriting OFF for any regulated disclosure text** so the AI can't reword compliance language.

### Appointment-booking-only flow [CONFIRMED pattern]

The canonical "Call Requested" scenario pattern. Main flow: Modify Tags (`ai responded`) → Conversation (Q&A with knowledge base). Custom Scenario "Contact wants to book": Objective (name + email + **timezone**) → Booking (calendar by name or by Calendar ID variable) → Statement (confirmation + incentive) → Modify Tags (`demo booked`) → back to Conversation. Conversational Rescheduling (if enabled) handles reschedule/cancel requests from the Conversation state.

### Database reactivation — CloseBot's own published playbook [CONFIRMED]

**GHL outreach workflow**: trigger tag `dbr` → daily drip limit → wait for business hours → space 1/2 min → tag `attempting contact` → create opportunity (Attempting Contact stage) → SMS #1 (opener with question) → wait 1 day → SMS #2 → wait 1 day → SMS #3. Setting "Remove from workflow on reply = true."

**CloseBot Job Flow (fires on any reply)**: Modify Tags `ai responded` → Conversation (with instruction: "subtly steer toward a demo call") → Scenario A (wants to book) → Objective (timezone + product qs) → Booking → Statement (mention incentive); Scenario B (aggression) → Modify Tags `ai off` + `not interested` → Stop Responding.

**GHL opportunity workflows**: `ai responded` → stage Engaged; Appointment Booked (or `demo booked`) → stage Demo Booked; `not interested` or STOP → stage Not Interested.

**Real campaign results from CloseBot's published case**: 1,486 contacts → 41 booked over 9 days, avg 8 AI replies per booker, 25% of bookers needed at least one follow-up, 29% no-show rate (of which ⅔ reschedule-handled conversationally).

### Post-appointment and post-no-show follow-up [CONFIRMED partial]

Post-appointment: GHL workflow on Appointment Booked → add tag `post-booking` → wait until appointment time → branch on appointment status (showed → follow-up bot for review request; no-show → tag `no show` → trigger re-engagement Job Flow). The re-engagement flow is filtered by required tag `no show` + disallow `ai off`; starts with Statement ("We missed you — want to reschedule?") → Objective (confirm intent) → Booking (Conversational Rescheduling handles the actual move).

### Archetype selection [INFERRED]

**One-shot qualification** (linear, no Conversation, no scenarios) for paid-ad high-intent leads on narrow services. **Multi-step nurture** (Conversation + 2–3 scenarios + follow-ups) for cold outbound, DBR, long sales cycles. **Hybrid** (short Objective chain → Conversation → scenarios) is CloseBot's recommended default for most agency builds. Official guidance: **start simple and ship fast** — iterators outperform architects.

---

## 9. Bot persona and tone design

### The Persona system [CONFIRMED]

CloseBot deliberately separates **Persona** (identity/tone) from **Job Flow** (task logic) so personas can be swapped into the same flow for A/B testing. A Persona has:

- **Identity fields**: image (shown in agent screen and conversation), name (the bot will think of itself as this), color, description.
- **Response behavior settings**: response delay, typo frequency, message splitting, tone-shaping fields.
- **Debugging tool**: clicking any message reveals the exact prompting that generated it — use this to diagnose persona drift.

### Typo frequency [CONFIRMED]

CloseBot has an explicit **typo frequency** setting — the persona intentionally makes typos and sends a correction message right after, mimicking a real human texting. Tuning [INFERRED]: low (5–10%) for professional/B2B contexts; medium (15–25%) for consumer service (home services, fitness, real estate); rarely useful above 30%. Turn OFF for compliance-sensitive industries (insurance, legal, medical intake) where typos in recorded messages create liability.

### Response delay [CONFIRMED]

A **Response Delay** slider adds extra latency before replies. Best practice [INFERRED from general chatbot literature]: 2–6 seconds to simulate typing. Too fast (<1s) reads robotic; too slow (>15s) frustrates. The delay combines with **Message Splitting** (breaking longer replies into multiple SMS) to produce a realistic texting rhythm.

### Persona prompt best practices [INFERRED from general best practice; CloseBot doesn't publish strict templates]

Standard template: *"You are a [tone] [role] who is [trait1], [trait2], and [trait3]. You prefer to [tendencies]. You avoid [out-of-character behavior]. You [do/don't] use [slang, emoji, contractions]."*

Keep the system prompt under ~500 words for LLM consistency. Anchor on **personality traits**, not just tone — tone alone produces a shapeshifter that sounds different in every message. Use a **personality matrix** (formal↔casual, serious↔humorous, reserved↔expressive, brief↔detailed) rather than single labels, and specify *contextual* shifts: "Casual in greetings, neutral during qualification, serious about pricing."

### Industry tone calibration [INFERRED]

| Industry | Persona type | Tone |
|---|---|---|
| Banking, healthcare, legal intake, insurance | Expert (Morgan, Justice) | Formal, precise, cites limits, never gives medical/legal advice |
| Martial arts, fitness, gyms | Coach (Alex, Jamie) | Upbeat, motivational, contractions, 1 exclamation point max per message |
| Home services (HVAC, roofing, solar) | Competent neighbor (Pat, Sam) | Casual-to-neutral, problem-solver framing, no pressure |
| Real estate | Helpful agent (Taylor) | Warm, curious, empathetic to urgency |
| B2B sales / coaching | Professional-but-human rep | Lightly empathetic, curious, lowercase softeners |

### Persona consistency [INFERRED]

CloseBot's prompt-inspection tool on individual messages lets you diagnose where a persona drifted mid-conversation — usually caused by an Objective's Extra Prompt overriding the Persona's tone (Extra Prompts are injected only for that part, but a heavy-handed one will dominate). Mitigations: keep Extra Prompts behavioral ("accept approximate timeframes"), not tonal; put tone rules at Persona level, not Objective level; A/B different personas against the same Job Flow to isolate whether inconsistency is persona or flow.

---

## 10. Known pitfalls and anti-patterns

**Objective short descriptions written as imperatives** — "Ask for their name" satisfies the objective by merely asking. Use "determine…" or "find out whether or not…" Phrase to complete on BOTH yes and no answers or you'll loop on negatives.

**Packed Objectives.** One Short Description trying to capture multiple unrelated goals. Split into parts or separate Objectives.

**Extra Prompt overuse.** Injecting Extra Prompts into every part dilutes persona tone and creates inconsistency. Start without them; add only where a specific interpretation nuance is needed.

**Prompt-tier sprawl (the landfill pattern).** The single most damaging anti-pattern I've seen in my own work: every regression becomes a new rule in `conversationReason` or a Conversation-node ExtraPrompt. Over ~15 iterations on a single bot, those fields bloat to hundreds of words and the same rule ends up duplicated in `conversationReason` + ExtraPrompt + KB + Smart FAQ simultaneously. The symptom: on the first turn of any policy-adjacent question, the bot defaults to compliance-shaped deflection ("I don't currently have that"), then "recovers" on turn 2 when KB retrieval finally outweighs the guardrail weight. The cause: negative rules ("never / don't / avoid") dominate the positive task, and duplication raises rule-salience above task-salience. The fix is separation of concerns — each type of content goes in exactly ONE tier:

| Content type | Correct tier | Stay out of |
|---|---|---|
| Goal of the conversation | `conversationReason` (short — a few sentences) | Everywhere else |
| Business facts | KB + Smart FAQ | `conversationReason`, ExtraPrompt |
| Compliance vocabulary bans | Prohibited Words | ExtraPrompt, persona |
| Node-specific interpretation nuance | ExtraPrompt on THAT node (one sentence) | Not a second global-policy slot |
| Tone / voice one-liners | Persona "How to Respond" — BUT shared across clients so never client-specific | Client-specific voice stays in `conversationReason` |
| Flow / algorithm ("when X happens, do Y") | A Scenario | Prose in the persona |

**When to consult docs vs. just apply the tier map.** The tier map above is the standardized practice — apply it directly. Only re-read docs when doing something NOVEL: a field or node type I haven't used before, a combination I haven't composed before, an unfamiliar setting, or anything where I can't confidently predict the behavior. For novel territory: `references/closebot_docs_reference.md` §4 (Persona), §5.2 (Job Flow Settings), §6.2/6.4 (Objective and Conversation node Extra Prompt semantics). Bryce's documented examples for every prompt field are **one sentence** — if my draft is longer than a tweet, I've probably confused tiers.

**Webhook drift.** Modifying a Custom Webhook's URL or body without re-running the Test and seeing the response before saving silently breaks downstream variable references. Rule: test before every save.

**Disqualification without Stop Responding.** If a scenario's disqualification branch doesn't end in Stop Responding, the default auto-return-to-main-flow behavior re-engages the lead you just dropped. Every dead-end branch must terminate explicitly.

**Using `equal` on user strings.** Whitespace and casing will bite you. Use `contains`.

**Forgetting the Switch fallback branch.** Contacts whose AI-classified response didn't match any configured value get dropped into nowhere. Always wire the fallback, even if just to a clarifying re-ask.

**Over-branching.** Pre-building branches for edge cases that rarely occur inflates flow complexity and creates maintenance burden. Custom Scenarios are usually the right tool for rare events — let the main flow stay simple and let scenarios handle the edges.

**Under-branching.** Running every lead through the same linear flow when they obviously split by category (buyer vs seller, homeowner vs renter) forces the bot to ask nonsensical questions. Use a Switch immediately after the relevant Objective.

**Too-low scenario thresholds.** Firing scenarios at Threshold 1–3 makes them trigger on casual mentions ("I was thinking about booking a trip once, but anyway…" → fires the Book Demo scenario). Start at 5–7 and tighten with production data.

**Missing timezone Objective before Booking.** "2pm" is ambiguous across timezones; the Booking node interprets using contact timezone if set, else source timezone — which is often wrong. **Always collect timezone before booking** when leads span regions.

**Wrong calendar ID format.** Using GHL's custom slug instead of the Permanent ID breaks the booking silently. Always use the random letters+numbers Permanent ID.

**`ai off` applied too aggressively.** Using `ai off` for temporary pauses (lunch, human reviewing) locks the bot out permanently until removed. Use Stop Responding for soft pauses; `ai off` is for real kills.

**AI hallucination risks** [INFERRED]. CloseBot mitigates hallucination via structured Objectives with Sensitivity thresholds and Extra Prompt guardrails, plus Smart FAQ tool for knowledge-base answers. Hallucination risk is highest in (a) Statement nodes with "Use AI to generate a response" ON when the Statement refers to specific facts not in the knowledge base, (b) Conversation actions without tight knowledge-base tooling, and (c) when custom Job Flow Variables aren't filled in for a new source — unfilled variables render blank and the AI confabulates around them. Mitigation: verify all Job Flow Variables are filled per-source before launch; use verbatim Statements for URLs, disclaimers, and payloads; keep knowledge base tight and concise.

**GHL integration failure modes.** Install fails when connecting user isn't a GHL agency admin. Field writes fail when "Allow CloseBot to create/update fields" wasn't checked at source setup. Following old (V1) tutorials that create a "Customer Replied" workflow — this is deprecated and conflicts with V2. Bookings fail when the contact has no phone/email or when the calendar Permanent ID was wrong. Follow-ups silently don't fire because the contact is on a Conversation node (they only schedule on Objective or Booking). Pipeline stage updates fail because CloseBot has no native stage action — the missing piece is a GHL workflow that listens for the CloseBot-applied tag.

---

## Conclusion — the three rules that matter most

After mapping the full platform, three things matter more than any specific node configuration. **First, use the hybrid architecture CloseBot's own docs recommend** — a short Objective chain for baseline data, then a Conversation action, with Custom Scenarios handling every "job" (book, not interested, handoff, reschedule). Rigid linear flows misread as robotic; pure Conversation nodes without scenarios drift and never book. Second, **tags are the integration currency** — CloseBot has no native pipeline-stage action, so every state transition you want reflected in GHL must be a Modify Tags action inside CloseBot paired with a tag-triggered GHL workflow. Naming tags boolean-style with `ai ` or `bot-` prefixes is the difference between a maintainable build and a client tag hygiene disaster at month six. Third, **test everything against the Testing Portal with real ghost contacts** — Job Flow Variables that weren't filled in, calendar IDs that were the slug instead of the Permanent ID, and field-write permissions that weren't checked at source setup all manifest as silent failures that only surface in production with real leads dropping. Ship simple, watch the Parse and Log tabs on actual conversations, and iterate — CloseBot's explicit guidance is that builders who launch a basic bot first and refine it outperform those who architect elaborately upfront.