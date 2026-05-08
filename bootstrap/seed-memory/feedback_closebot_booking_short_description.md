---
name: CloseBot Booking Short Description  -  appointment type + duration only
description: The Short Description on a Booking node is literally meant to be short. Docs §6.5 example is one sentence. No procedural STEP 1/2/3 instructions  -  that's over-prompting that breaks booking behavior.
type: feedback
originSessionId: 50d7038a-cc6e-4c21-aa8b-71503b97ea77
---
Per docs §6.5 (verbatim):

> **Short Description**  -  **keep it tight: appointment type + duration only.** E.g., "Book a 30 minute in-person appointment."

## The rule

Booking Short Description = **one sentence stating appointment type + duration (or participant + program)**. Nothing else.

## Anti-pattern (what we had before in Vacaville)

```
"Book a first class for {{contact.first_name}} {{contact.last_name}} in the Adult No-Gi 
Submission Grappling program. STEP 1: Check the calendar using the booking tool BEFORE 
saying anything about times. STEP 2: Lead with EXACTLY ONE slot  -  the earliest available 
opening. Offer it directly in a short sentence [example: I have Tuesday Apr 22 at 5:15 PM 
open  -  does that work?]. Do NOT list multiple times. Do NOT present a menu of options. 
STEP 3: If they decline, ASK for their day or time preference. STEP 4: Check the calendar 
again... STEP 5: Never name or confirm..."
```

~650 chars of procedural steps. The AI tries to follow these literally during the booking conversation, which introduces confusion, hallucinated dates, and inconsistent offers.

## Correct pattern

```
"Book a first class in the Adult No-Gi Submission Grappling program for 
{{contact.first_name}} {{contact.last_name}}."
```

One sentence. Identity + program. Nothing else.

Variable references per `feedback_closebot_variable_refs.md`  -  point at data, don't describe.

## Where the procedural behavior belongs instead

- "Don't confirm unless tool returns SUCCESS" → `conversationReason` (bot-wide rule)
- "Lead with one slot, don't list a menu" → `conversationReason` if it's a universal booking rule
- Handling booking failure → native `FailedTag` + a Scenario listening for the tag

Booking nodes invoke the calendar tool intrinsically. The Short Description is just identity context for the tool call.

## Origin

Learned 2026-04-24 after Idriss observed booking confusion in Vacaville v3.16.2 live-chat testing (inconsistent date offers, possibly from the AI trying to execute the 5-step Description prose). Doc cite: §6.5.
