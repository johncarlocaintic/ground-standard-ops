---
name: reference-closebot-rename-test-lead
description: Rename CloseBot test-session leads (Guest) via PUT /lead fields so API-test conversations are findable + screenshottable in the CloseBot UI
metadata: 
  node_type: memory
  type: reference
  originSessionId: cb5334b1-d510-48c6-8896-739ec13a210c
---

CloseBot API-driven test sessions (`POST /bot/{id}/testSession`) all show up in the Conversations UI named **"Guest"**, so many runs are indistinguishable. You CAN rename them. The lead `name` is derived from `fields`, not a top-level property.

- **`PUT /lead/{leadId}`** body `{ "fields": [{"field":"contact.first_name","value":"Test"},{"field":"contact.last_name","value":"Pamela tech"}] }` → conversation shows as "Test Pamela tech".
- **MERGE**, don't replace: `GET /lead/{id}` first, upsert `contact.first_name`/`contact.last_name` into the existing `fields`, then PUT the full array (a bare PUT can wipe email/phone/booking fields).
- **Map runs first:** `GET /bot/{botId}/testSession?maxCount=100` → `{leads:[{id,name,lastMessage,lastMessageTime,mimicSourceId,...}]}`; match each to a scenario by lastMessage + time.
- Auth `X-CB-KEY`. New capability (2026-06-22); used to label during-webinar test runs. Full detail: tasks/lessons.md 2026-06-22. Related: [[reference_closebot_api_docs]].
