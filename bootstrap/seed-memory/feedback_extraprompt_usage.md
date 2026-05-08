---
name: CloseBot ExtraPrompt  -  three-gate decision framework
description: Framework for when to fill vs empty ExtraPrompt fields on any CloseBot node. Default is empty; fills are exceptions that must pass all three gates.
type: feedback
originSessionId: 50d7038a-cc6e-4c21-aa8b-71503b97ea77
---
ExtraPrompt exists as a field on most CloseBot node types (Objective/MultiObjective, Statement with UseAI, Booking, Conversation, etc.). The UI label is "Extra Prompt." In KDL it's `ExtraPrompt` on Conversation nodes and `Prompt` on Objective/Booking nodes  -  same conceptual field.

**The rule, stated directly:** blank by default on every node. Fill ONLY when the node needs specific handling that isn't already covered somewhere else.

## The three-gate decision framework

For every node that has an ExtraPrompt slot, run through these in order. If the field passes all three gates, fill it with a short targeted line. Otherwise leave it empty.

### Q1. Is the node's purpose already clear from its own fields?

- **Objective/MultiObjective:** Variable + Title + Description  -  if these make the ask self-evident ("Get Name" with Variable `contact.first_name` is obvious), ExtraPrompt adds nothing.
- **Statement (UseAI):** the Statement field itself IS the AI instruction  -  ExtraPrompt is redundant.
- **Booking:** the node type intrinsically invokes its configured calendar tool. CalendarName + FailedTag handle identity + failure.
- **Conversation:** **always fails Q1.** A Conversation node is a passive Q&A with no inherent scope  -  without ExtraPrompt the node has no rails and will wander, re-open intake, or go off-topic. This is the prime ExtraPrompt use case.

If purpose is clear from the node's own fields → **empty, stop.**

### Q2. Is there a specific behavior this node needs that isn't already covered by a higher tier?

Tiers to check first:
- `conversationReason`  -  bot-wide goal + voice + hard guardrails
- `businessInformation`  -  short factual blurb
- Knowledge Base + Smart FAQ  -  all business facts
- `prohibitedWords`  -  compliance-level vocabulary bans
- Scenarios  -  flow-level re-routing
- The node's intrinsic config (e.g., Booking's FailedTag)

If the "specific behavior" you were about to write is already covered by any of these → **empty.** Putting it in ExtraPrompt creates duplication, which lowers task salience and often degrades the bot (see `tasks/lessons.md` 2026-04-23  -  the v3.x landfill).

### Q3. Can the specific behavior fit in ≤2 sentences, KISS?

If no → you're over-prompting. Step back and ask whether the behavior really belongs in ExtraPrompt or in a different tier (scenario, KB, conversationReason, node's own config).

If yes → fill with the short line. No preamble, no examples-lists, no restating global rules.

## Defaults by node type (working priors, always audit case-by-case)

| Node type | Expected default | Exception conditions |
|---|---|---|
| MultiObjective (standard data collection) | empty | Only if the ask needs atypical phrasing the persona/KB can't convey |
| Booking | empty | Use FailedTag + downstream routing for failure cases, not ExtraPrompt |
| Statement with UseAI | empty | Statement field IS the instruction |
| Comparator | (no ExtraPrompt field; AIExpression is the field) | n/a |
| AISwitch | (no ExtraPrompt field; Description + CaseName are the fields) | n/a |
| **Conversation** | **FILL (short)** | Always needs scoping  -  passive Q&A has no rails otherwise |

## Anti-patterns to never put in ExtraPrompt

- Restating global rules (belongs in conversationReason)
- Listing banned words (belongs in prohibitedWords)
- Listing business facts (belongs in KB/Smart FAQ)
- Procedural step-by-step instructions ("STEP 1... STEP 2...")  -  signals over-prompting
- Example phrases the bot should say  -  usually duplicates persona voice
- Negative lists ("do not say X, Y, Z")  -  if prohibitedWords doesn't cover it, reconsider whether the rule is really needed

## Related discipline (also 2026-04-23/24)

After any deploy that's supposed to change bot config, read the deployed config back via API (`GET /bot/{id}/export`) and confirm the change actually landed. 200-OK on POST only proves the request was accepted  -  not that the resulting config matches intent.

## Origin

This framework was built after the Vacaville v3.16 / v3.16.1 iteration (2026-04-23 → 24) where blanket-emptying all ExtraPrompts missed the case that matters most: Conversation nodes specifically need ExtraPrompt because they're passive Q&A catch-alls. The rule isn't "blank uniformly"  -  it's "blank by default, and 'default' fails for Conversation nodes." See `tasks/projects/vacaville-extraprompt-audit.md` for the audit that produced this framework.
