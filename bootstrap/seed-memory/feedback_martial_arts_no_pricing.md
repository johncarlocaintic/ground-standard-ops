---
name: Martial Arts Bot — No Pricing Rule
description: Universal rule for all GSA martial arts chatbots — bot never mentions specific pricing; always redirects to in-person/trial
type: feedback
originSessionId: 1783cd19-887c-4212-badf-91a15c5affe1
---
Bot content for any GSA martial arts gym client must never state specific pricing OR discount figures — no membership fees, sign-up fees, drop-in costs, private lesson rates, percentages (e.g. "15% military"), or any dollar amount. Applies to KB content, node prompts, persona rules, and all bot-facing copy. Pricing AND discount specifics both redirect to the coach.

**Why:** GSA's conversion pattern is deflect + redirect. Pricing varies based on program mix, frequency, and eligibility (military/first responder/student discount, Measure M funds, family plan). The free trial class is the entry point — leads meet in person, coaches assess needs, then discuss pricing AND discount details directly. Universal GSA sales motion, not per-gym. JC clarified 2026-04-22 after I mistakenly added a "15% military discount" exception: "any discount, any pricing defaults to the coach Nick script." No exceptions.

**How to apply:**
- Any KB must pass a `$`/percentage regex check before delivery (context.md grep validation rule #2)
- Persona must include BOTH a PRICING RESPONSE rule AND a DISCOUNT RESPONSE rule, both redirecting specifics to the human
- When a lead asks about pricing or any discount, bot deflects: "discussed during or after free trial with the coach"
- Test harness should flag "$X" dollar figures AND "X%" percentages as bot output violations
- Applies across all 48+ GSA gym clients in gym-portfolio.md
