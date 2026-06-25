---
name: gs-kb-verification-standard
description: Every GS gym KB must be website-verified AND have its calendars pulled live from GHL before /closebot-plan
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

For every Ground Standard gym bot: the KB is not "ready" until it has been (1)
verified against the gym's live website and (2) reconciled against the actual
GHL calendars on that gym's CloseBot source. Glenn's KB drafts are starting
material only, never deploy-ready as-is.

**Why:** Glenn's drafts are AI-generated from single sources (often one PDF, no
ClickUp/website triangulation). Site facts drift (e.g. Eden Prairie KB said
Minneapolis; live site said Edina). The KB describes programs the gym may not
have bookable calendars for — booking can only target calendars that exist.

**How to apply:** Per gym, before /closebot-plan: WebFetch the gym site to
confirm name/address/phone/disciplines/free-trial/no-public-pricing; run
`shared/scripts/closebot/gs_source_schema.js <sourceId>` + cross-check GHL
`/calendars/` with the gym PIT to get exact calendar names + real IDs. Save a
`{slug}-kb-verification-{date}.md` log of corrections + flagged gaps. Bot
behaviour for no-calendar programs follows [[feedback_gs_no_calendar_default]].
