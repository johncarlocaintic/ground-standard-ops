---
name: reference_closebot_widget_ui_only
description: CloseBot chat widget is UI-only — no API endpoints; embed snippet must be copied from the UI; Live_Chat is the widget channel id
metadata: 
  node_type: memory
  type: reference
  originSessionId: c2af69f3-e76c-4ab0-ba82-3d7a37879a3c
---

Verified against developers.closebot.com + live API 2026-05-20:

- **CloseBot chat widget is UI-only.** There are ZERO widget endpoints in the API. Cannot create/list/get a widget or its embed snippet via the API. docs.closebot.com §16 ("Creating + Ordering Widgets") is a UI-only feature.
- **`GET /source/{id}` (SourceDto) has no widget/token/embed field.** Its `accessToken` is the GHL source token, not a widget token. The widget embed snippet can only be copied from the CloseBot UI when the widget is created in a source. Its exact shape stays unknown until one is actually created.
- **Per-source channel scoping = `bot.sources[].channelList`** (array). For widget-only testing the safe target is exactly `["Live_Chat"]` and nothing else. Any of WhatsApp/GMB/SMS/FB/IG present alongside = bleed risk.
- Source channels list comes from `GET /agency/source/{id}/channels` (the plain `/source/{id}` path returned empty for GS). Full set seen: WhatsApp, GMB, **Live_Chat**, SMS, Email, FB, IG, Custom.
- Read-only safety verifier: `shared/scripts/closebot/cb_widget_attach_verify.js` (Work repo) — asserts one canon bot on the source, enabled, `channelList === ["Live_Chat"]`, Vacaville-prod guardrail. Use before trusting any live widget page.

Widget test pages are hosted on the Vercel widget directory — see [[gs-bot-builds-vercel-project-source]]. The "proof-of-one" plan is `clients/ground-standard/closebot/GLENN-widget-proof-of-one.md`; as of 2026-05-20 it is blocked because no correct-architecture (Agent Node) canon All In Jiu-Jitsu bot exists.
