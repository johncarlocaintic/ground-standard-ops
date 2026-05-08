---
name: CloseBot variable references  -  first-class across nearly every field, not just AI-evaluated text
description: Always use {{contact.X}}, {{nodes.X.result}}, {{variable}}, {{location.X}} to reference state deterministically. Works in almost every input field in the builder  -  not just Descriptions or AIExpressions.
type: feedback
originSessionId: 50d7038a-cc6e-4c21-aa8b-71503b97ea77
---
Variable references in CloseBot are **usable in almost any input field across the builder**  -  this is an explicit capability documented in `references/closebot_docs_reference.md` line 530. It is NOT limited to AI-evaluated text fields.

## Fields where `{{}}` references work (non-exhaustive  -  observed or documented)

- AISwitch `Description`
- Comparator `AIExpression`
- Booking `Description`, calendar ID, variables
- Objective / MultiObjective `Prompt` (ExtraPrompt)
- Conversation `ExtraPrompt`
- AILogic `AiDescription`
- Statement field (the primary AI instruction)
- Scenario `Description`
- ModifyTags  -  tag values
- Set Field  -  "Field Value"
- Webhook URL, body
- Node `Title`, `Description`
- Persona-name overrides per source

## Reference syntax

| Target | Syntax | Example |
|---|---|---|
| Contact standard field | `{{contact.FIELDNAME}}` | `{{contact.first_name}}`, `{{contact.tags}}` |
| Contact custom field | `{{contact.CUSTOM_FIELD_KEY}}` | `{{contact.concierge_conversation}}` |
| Flow variable | `{{variable_name}}` | `{{kid1_name}}`, `{{kid3_dob}}` |
| Prior node result | `{{nodes.NODE_ID.result[N]}}` | `{{nodes.n06_whofor_ask.result[0]}}` |
| Location data | `{{location.FIELD}}` | `{{location.name}}`, `{{location.timezone}}` |

## Builder autocomplete shortcuts (per docs)

- `@`  -  reference a variable
- `@@`  -  reference a tool
- `@@@`  -  reference an exit

## The principle

Whenever you're about to write a description in prose ("the contact said X", "the booking failed", "the tag is applied"), ask first: **can I point at the actual data with `{{}}` instead?** If yes, do that. Prose is interpreted; references are deterministic.

Applies especially to:
- **Scenario Descriptions**  -  reference `{{contact.tags}}` or `{{nodes.X.result}}` instead of describing the trigger in English
- **Comparator AIExpressions**  -  embed the actual node result, not a summary
- **Statement fields**  -  `{{contact.first_name}}` not "the contact's name"
- **Set Field values**  -  point at source data, not literals

## Origin

Learned 2026-04-24 during v3.17 planning after I under-specified scenarios as "conversation content matchers only." Idriss corrected: variable references are first-class across nearly every field, and should be used everywhere state can be pointed at rather than described. Saving as a core CloseBot-build discipline.

## Related

- ExtraPrompt framework (`feedback_extraprompt_usage.md`)  -  same spirit, different field: empty by default unless something specific is needed. When something IS needed, prefer variable references over prose descriptions of state.
- CloseBot docs reference: `references/closebot_docs_reference.md`  -  §6 per-node capabilities, §9 Job Flow Variables.
