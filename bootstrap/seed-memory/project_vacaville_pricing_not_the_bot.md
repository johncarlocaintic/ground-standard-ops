---
name: project-vacaville-pricing-not-the-bot
description: "2026-05-17 Vacaville 'bot quoting prices' incident traced to a Facebook Page auto-reply, NOT the CloseBot. Do not rebuild the bot for this."
metadata: 
  node_type: memory
  type: project
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

Incident: a lead (Ivan D. Dios, GHL contactId czYZJCZ5FkzxzpDoKgfw, allandedios.ad@gmail.com) got an exact-pricing reply ($153/mo 2x, $180/mo 4x, "no contracts, no sign up fees 🤘🏻") on 2026-05-17. Reported as "Vacaville bot answering with pricing."

Investigated 2026-05-19, verified from BOTH systems, conclusion: **it was NOT the CloseBot.**

- GHL message attribution: `source: "app"`, `messageType: TYPE_FACEBOOK`, `meta.fb.pageId 351821764670143`, NO `userId`, sent 68 min after the question (CloseBot replies in seconds). All other replies in that thread were `HUMAN(userId=...)` staff.
- CloseBot lead record for that contact: `lastMessageBotId: null`, `mostRecentFailureReason: "no_tag_route"`, `instances: []`. The bot was correctly filtered out by the source tag-route (no trigger tag on the contact), never entered the flow, sent zero messages.
- KB and Smart FAQ on the prod source were manually checked by Idriss: no pricing. `prohibitedWords` only blocks "waiver". The KDL has zero price lines.

Root cause: a **Facebook Page automation** on the Vacaville Page (Meta Business Suite Inbox automations / FAQ auto-reply, or a GHL FB-reply workflow), independent of CloseBot. Fix is Meta/GHL-UI side, not the bot.

Bonus finding: this proves the Vacaville source tag-route filter works as designed (it deliberately kept the bot off an untagged contact).

Diagnostic scripts (read-only): `shared/scripts/closebot/gs_ghl_ivan_check.js`, `gs_cb_ivan_verify.js`. The Vacaville GHL PIT (`GHL_VACAVILLE_API_TOKEN`) is scope-limited: contacts/conversations work, `/workflows` and `/locations` return 401. See [[project-vacaville-test-source-routing]], [[feedback-verify-before-diagnosing]], [[feedback-cross-examine-judge-output]].
