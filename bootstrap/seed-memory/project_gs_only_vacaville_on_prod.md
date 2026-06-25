---
name: project-gs-only-vacaville-on-prod
description: "GS account: only Vacaville is on a real prod source; masondixon is NOT soft-launched (verified 2026-05-19)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

Verified 2026-05-19 via `shared/scripts/closebot/gs_bot_source_audit.js` (read-only,
enumerates all bots + their sources):

- The ONLY bot on a real production source is `Vacaville PROD v4.6` on `src_GDKORXSW4Q8RQUQ8`.
- **masondixon is NOT soft-launched and NOT attached to any source.** Every Mason Dixon bot reads `(no sources)`. A stale inherited plan file claimed it was "soft-launch attached to a real source, never touch its attachment" — that was false. Do not re-inherit it.
- Launch v1.x canon bots are detached; eval'd by attaching to GS Ads sandbox `src_4R4DUIQTMMX2NFPU` one at a time.
- Old `Membership Qualification (DEMO)` bots are parked on the gyms' own GHL sources, which carry no real lead traffic.

Implication: no live-lead interception risk for the GS widget directory work; only Vacaville has live leads and it is out of scope. Re-run the audit script to re-verify before trusting this (state can change). See [[reference-closebot-api-docs]], [[feedback-verify-before-diagnosing]].
