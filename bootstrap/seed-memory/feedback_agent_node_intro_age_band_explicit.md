---
name: feedback-agent-node-intro-age-band-explicit
description: "Agent Node n10_intro must state adult age band explicitly (e.g. \"18+\"); LLM infers wrong band from n30_book routing when intro is vague"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

When the Agent Node `n10_intro` "Push Toward Booking" Body lists adult disciplines without an explicit age qualifier (e.g. "for adults"), the LLM will infer the adult band by subtracting the kids and youth-no-cal bands from the n30_book routing. If kids cap below the teen-no-cal floor (kids 5-12 + no-cal 13-17 + adult unspecified), the LLM concludes adults start at 13 and will falsely tell parents of teens "Adult MMA starts at age 13, he's all set to join."

**Why:** Killer B v1.0 (2026-05-19) hallucinated exactly this for a 15-year-old. `n10_intro` Push Toward Booking said "MMA, Kickboxing, Boxing, and No-Gi Grappling for adults; Kids Martial Arts for ages 5-12" without specifying adults are 18+. `n30_book` correctly had "Adult MMA — ages 18+, default if no discipline preference stated" and "Age band 13-17: no calendar - minor, guardian capture, team follow-up, no booking" — but the n10 intro was already routing the LLM's framing before n30 ran. Two blocker fails (md_03 + md_04) on `teen_13_17_nocal`. v1.1 fix: added "(age 18+)" + instruction not to state age min when under-18 mentioned → PASS, correct no-cal gate routing with `youth no-cal gate` tag write-back.

**How to apply:** For any GS bot with a youth-no-cal band (kids cap < adult floor with gap):
1. `n10_intro` Push Toward Booking Body must include explicit age qualifier on every adult discipline listing (e.g. "MMA, Kickboxing, Boxing, and No-Gi Grappling for adults **(age 18+)**").
2. Add this clause: "If a lead mentions they or their child are under 18, do NOT state an age minimum or eligibility — simply proceed to booking (`@@@[Interested]` or `@@@[Parent for Child]`) and the booking step handles age verification."
3. The `n30_book` routing alone is not enough — the intro frames the LLM's response to age questions before n30 fires.

Related: [[feedback-closebot-youth-nocal-gate]] (canon template has no 14-17 no-cal branch), [[feedback-closebot-discipline-switch]] (N-way switch), [[feedback-closebot-prompt-discipline]] (tier-map discipline).
