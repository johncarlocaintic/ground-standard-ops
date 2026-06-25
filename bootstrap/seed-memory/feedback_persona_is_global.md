---
name: Persona Settings Are Global Across Ground Standard
description: the Emma persona (pers_CB1LLPENDKDRB5S2) is shared across ALL Ground Standard gym bots; persona-level settings affect every bot using it, not just one workflow
type: feedback
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
The persona `pers_CB1LLPENDKDRB5S2` ("Emma") is bound to every Ground Standard gym bot in the agency (~50 bots: every "(DEMO)" gym, Vacaville PROD, every test/duplicate). Settings stored on the persona itself are **global** and propagate to all those bots simultaneously.

**Persona-level fields (global — affect all GS bots):**
- `howToRespond`
- `voiceStyles`
- `aiProviderPreferences`
- `typoPercent`, `breakupLargeMessagePercent`, `responseTime`, `responseDelay`
- The persona's name, description, image

**Workflow-specific fields (per-bot — only affect that bot):**
- `conversationReason` (in __CONFIG__)
- `businessInformation` (in __CONFIG__)
- `prohibitedWords` (in __CONFIG__)
- Method node Sections + Instructions
- Statement node bodies
- ScenarioCustom descriptions
- Calendar IDs, tag names, custom field bindings

**Why:** Idriss flagged 2026-04-27 that the persona is shared. Any time I propose adding a rule, I must place it correctly:
- Universal rule across all GS gyms (e.g. "always be respectful", "never quote prices") → persona's howToRespond
- Vacaville-specific rule (e.g. "Kids 7-13 only runs Mon-Thu", "first class is on us") → Vacaville bot's conversationReason or Sections

**How to apply:**
- Before suggesting a persona edit, ask: would this rule apply to EVERY GS gym? If no, put it in the bot's __CONFIG__ or a Section instead.
- The new "Emma OpenAI Test" persona (`pers_LR6UXII19IBDVS5L`) created during the openai-test experiment is bot-specific (only on v6.2). General persona changes should still go on the agency default.
- When testing prohibited-word fixes or behavior tweaks, decide upfront whether the fix belongs at the persona level (one edit, many bots) or workflow level (per-bot edit, isolated).
