---
name: CloseBot Statement node  -  GIVE information, don't branch
description: Statement nodes are monologues (give information to contact). Not if/else. Conditional behavior belongs upstream in True/False or Switch nodes. A Statement should just say what you want to say.
type: feedback
originSessionId: 50d7038a-cc6e-4c21-aa8b-71503b97ea77
---
Per docs §6.3:

> **Statement (legacy  -  give info to contact)**  -  *"Statements GIVE information to the contact."*
> - **With AI**  -  CloseBot paraphrases your input into conversational form.
> - **Without AI**  -  sends your message verbatim (use for exact URLs, legal language, etc.).

## The rule

A Statement is a single-purpose message. Write what you want said. **No if/else conditionals.** Branching belongs in True/False or Switch nodes upstream.

## Anti-pattern (what we had before in Vacaville confirm nodes)

```
"If the booking was successfully completed (the booking tool returned a confirmed slot), 
confirm the first class briefly  -  date, time, class name, what to wear... 
If the booking was NOT completed, do not confirm any class time. 
Say instead: 'We'll have someone from the team reach out to get you scheduled.' 
Do NOT invent a booking that did not happen."
```

This is a conditional masquerading as a statement. The AI has to evaluate the conditional state and pick a branch  -  that's True/False territory. When the conditional is embedded inside the Statement text, it leaks ambiguity, can pick the wrong branch, or produce contradictory output (confirmation + "team will reach out" in the same message, as seen in v3.16.2 t04 logs).

## Correct pattern

Single-purpose Statement. Write it assuming the happy path:

```
"Confirm {{contact.first_name}}'s first class  -  date, time, program name. 
Remind them to wear a rashguard or fitted shirt with pocketless shorts, 
bring water, and arrive a few minutes early."
```

Handle the failure path **elsewhere**:
- Native Booking `FailedTag` fires when booking can't complete
- A Scenario listens for that tag → routes to a dedicated failure Statement + handoff sub-flow

## Where branching goes

If you need "Do X if Y, else do Z" logic:
- **True/False (Comparator)**  -  2-way branch. See `feedback_closebot_truefalse_expression.md` for how to write the AIExpression.
- **Switch**  -  N-way branch with catch-all default (docs §6.11).
- **Custom Scenario**  -  always-listening trigger, can reference tags/variables/nodes (docs §6.6).

## Origin

Learned 2026-04-24 after Idriss identified the Vacaville confirm-booking Statements as conditionals that shouldn't be. Doc cite: §6.3. Related lesson: the tag-based failure Scenario we're building for v3.17 is exactly the "handle failure upstream, keep Statement clean" pattern.
