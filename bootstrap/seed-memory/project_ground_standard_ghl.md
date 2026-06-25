---
name: Ground Standard GHL Testing Account
description: Bobby's GS Ads GHL sub-account used for bot automation testing via Claude Code
type: project
originSessionId: c4ebca2d-14eb-4457-8a0c-377bc1110c1c
---
GS Ads GHL sub-account (Bobby / Ground Standard) is the designated test environment for bot automations.

Credentials stored in `.env` as:
- `GHL_GS_API_TOKEN` — Private Integration Token
- `GHL_GS_LOCATION_ID` — Location ID: isGl70YkeLEAiVckMhgT

**Why:** Using this account as a safe testing ground before touching live client data.
**How to apply:** Use `GHL_GS_API_TOKEN` and `GHL_GS_LOCATION_ID` env vars when scripting against Ground Standard's GHL account. Do not confuse with the default `GHL_API_TOKEN`/`GHL_LOCATION_ID` vars.
