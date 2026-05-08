---
name: CloseBot prompt-tier discipline — apply proven standards, consult docs only for novel work
description: Apply the proven prompt-tier map directly for standardized work. Only consult CloseBot docs first when doing something NOVEL — a field/combination/technique we haven't already standardized. Never cross-duplicate content across tiers.
type: feedback
originSessionId: 2dce8f2a-ba0d-4d4d-a47d-5c3cebea8867
---
**Two modes for CloseBot prompt/config work:**

1. **Proven, standardized work** — just apply the tier map. Don't re-consult docs each time.
2. **Novel work** (field, combination, or technique we haven't already standardized) — consult `developers.closebot.com` + `references/closebot_docs_reference.md` first, then propose. Don't iterate blind.

**Tier map (proven — apply directly):**
- Goal → `conversationReason` (short)
- Business facts → KB + Smart FAQ (facts only — no instructional language)
- Compliance vocabulary bans → Prohibited Words
- Node-specific interpretation nuance → that node's ExtraPrompt (one sentence)
- Tone one-liners → Persona "How to Respond" (SHARED across clients — never client-specific)
- Flow / algorithm behavior → a Scenario

Never cross-duplicate across tiers.

**Why:** On Vacaville v3.1 → v3.15 I iterated prompt fields by trial-and-error in territory the docs had already solved. Every adversarial-test regression got turned into a new rule in `conversationReason` or the n81 ExtraPrompt. Ended at ~900 words in `conversationReason` + ~150-word ExtraPrompt with the same content duplicated across KB, Smart FAQ, and Prohibited Words. Bryce's documented examples for every prompt field are one sentence — if I'd consulted docs before the first bloat, none of this happens. Symptom: bot defaults to compliance-shaped deflection ("I don't currently have that") on first turn of any policy-adjacent question. Full write-up: `tasks/lessons.md` 2026-04-23.

**How to apply:**
- If drafting a prompt field longer than a tweet — stop, I've probably confused tiers or encoded something the docs say belongs elsewhere.
- If the same rule appears in two tiers — stop, pick one and delete the others.
- If tempted to add a new rule to `conversationReason` because of a regression — first ask: KB gap (fix KB), wrong-tier content (move it), compliance vocabulary (Prohibited Words), flow problem (a Scenario)?
- When in doubt whether an approach is novel or proven, treat it as novel and look it up. Bias toward the quick doc check.
- Also mirrored in CLAUDE.md CLOSEBOT Pre-flight — surfaces naturally on CloseBot sessions.
