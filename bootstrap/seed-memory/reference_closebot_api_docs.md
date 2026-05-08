---
name: CloseBot API Developer Docs
description: Official CloseBot V2 API documentation site — must be consulted before any CloseBot API call.
type: reference
originSessionId: 396aeb9e-0407-4000-a594-ee2ea4f8d569
---
**URL:** `https://developers.closebot.com/`

**What's there:** Official CloseBot V2 API reference — endpoints, auth, request/response schemas.

**Why it matters:** JC flagged (2026-04-21) that we've been reverse-engineering CloseBot via trial-and-error test scripts instead of reading the docs first. He wants this site to be integral to every CloseBot API interaction — consult first, test only to fill gaps.

**How to apply:** Before writing or running ANY CloseBot API call, WebFetch this URL (or the relevant sub-page) first. Only fall back to discovery/test scripts when the docs are genuinely silent — the known gap is `botSteps` payload schemas, which require reverse-engineering. Everything else should be verified against the docs before executing.

**Also referenced in:** `CLAUDE.md` CRITICAL BUILD STANDARDS section, and `references/stack_api_reference.md:126`.
