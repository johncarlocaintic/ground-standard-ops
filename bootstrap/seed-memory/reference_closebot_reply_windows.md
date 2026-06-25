---
name: reference-closebot-reply-windows
description: "CloseBot reply restrictions are channel-scoped and API-writable via PUT /agency/source/{id} botRespondWindows"
metadata: 
  node_type: memory
  type: reference
  originSessionId: cb5334b1-d510-48c6-8896-739ec13a210c
---

CloseBot "Reply Restrictions" (hours the bot may reply) live on the agency-source object as `botRespondWindows` and are fully API-controllable. Use this to give two bots on the same source different reply windows when they sit on different channels.

- Read: `GET /agency/source/{sourceId}` → `botRespondWindows`, `doNotRespondWindows`, `isBotRespondWindowsQuietHours`, and `bots[]` (each bot's `channels`/`tagFilterConfig`/`enabled`). `GET /source/{id}` is 404 — must use `/agency/source/`.
- `botRespondWindows` entry = `{ dayOfWeekUtc, startTimeUtc:"09:00", duration:"11:00:00", channel:"" }`. `isBotRespondWindowsQuietHours:false` → that window is the ALLOWED hours. `channel:""` = all channels; a channel name scopes the restriction to just that channel; a channel with NO entry = unrestricted 24/7 (proven on Rucker test source).
- Timezone gotcha: `*Utc` field names lie. Window is account-local; `/botMetric/messages` timestamps are UTC.
- Write: `PUT /agency/source/{sourceId}` accepts a partial body (`{botRespondWindows:[...]}` alone), leaves bots/tokens/toggles intact. Channel ids from `GET /agency/source/{id}/channels`.
- Applied 2026-06-24 on GSS (live) to free the during-webinar widget to 24/7 while keeping the after-webinar SMS bot at 9am-8pm. Always probe on the test source first. Full detail: tasks/lessons.md 2026-06-24. Related: [[reference_closebot_api_docs]], [[reference_closebot_rename_test_lead]].
