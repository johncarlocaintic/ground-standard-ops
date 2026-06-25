---
name: closebot-agent-node-put-pattern
description: "Agent Node bot edits must use PUT /bot/{id} { importKdl } — POST /bot returns 500 for Agent Node bots"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

To edit an existing CloseBot Agent Node bot, the path is:

```
GET /bot/{id}/export → mutate KDL → PUT /bot/{id} { importKdl: newKdl } → POST /bot/{id}/publish
```

PUT preserves the bot_id, source attachments, and tag filter. No detach/re-attach needed.

**Do NOT** use POST /bot { name, importKdl } to "re-create" an existing Agent Node bot from its exported KDL. It returns 500 even with unmodified KDL — Agent Node bots cannot go through the create-by-import path the way classic bots can.

Discovered 2026-05-22 while applying bulk Jiu-Jitsu + handoff fix across 19 live GS bots. POST 500'd on all 19; PUT 200'd on all 19, sources still attached afterward.

Working reference: `shared/scripts/closebot/gs_jj_handoff_update.mjs`.

**CAVEAT (2026-06-24):** On two recent Agent Node test bots (another account), `PUT /bot/{id} { importKdl }` returned 200 but did NOT write, `modifiedAt` was unchanged and `/export` still showed the old KDL. Both bots lacked a persona, so they could not be published (`publish` 400s: "Bot must have persona attached when publishing"), which may be why the PUT change never surfaced. `POST /bot { name, importKdl }` created a fresh Agent Node bot cleanly (contradicting the "POST 500s" claim above, at least for create-new). The May success only checked `ur.ok` (status 200), never read back that the KDL content actually changed. So: when using the PUT path, ALWAYS read back the exported KDL (not just the 200) to confirm the edit landed; for a persona-less bot you're iterating on, POST-create is more reliable.

Related: [[closebot-library-blob-uri]] for the analogous read-current-then-mutate pattern on KB files.
