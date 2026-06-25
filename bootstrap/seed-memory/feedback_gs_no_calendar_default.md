---
name: gs-no-calendar-program-default
description: "GS bots — if a program has no dedicated GHL calendar, do not mention it; if asked, say not available to book online (never redirect/substitute)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

For Ground Standard gym bots: a program is bookable ONLY if it has its own GHL
calendar on the source. For any program without a calendar (MMA, Women's Only,
Open Mat, advanced/invite classes, private lessons, kids-disciplines with no
kids calendar, website-only classes):

- Do NOT proactively bring it up.
- If a lead asks to book it, say that program is not available to book online.
- Do NOT use the "discuss with the coach at your free trial" redirect.
- Do NOT route it into a substitute calendar (e.g. never book Women's Only into
  Adult BJJ).
- If an age band has no calendar (e.g. 13-17 when kids cap at 12 and adult
  floors at 18), FLAG FOR GYM VERIFICATION; interim = treat as minor, capture
  guardian, do not book, team follows up.

**Why:** Idriss's explicit rule (2026-05-17, Eden Prairie build). Overrides the
/closebot-plan skill's default "we do offer that, discuss with the coach"
redirect language. Calendars are the single source of truth for bookability.

**How to apply:** Encode in the spec `rules[]` + `nonBookableHandling` +
minor-gate, not the KB (KB stays facts-only). Age is computed from DOB; under
18 = minor needing a parent/guardian. Pairs with
[[feedback_gs_kb_verification_standard]]. Reinforces
[[feedback_martial_arts_no_pricing]].
