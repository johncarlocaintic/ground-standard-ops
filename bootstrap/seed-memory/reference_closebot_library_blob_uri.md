---
name: closebot-library-blob-uri
description: CloseBot library files expose an Azure blob URI for direct content read — use it to pull current CB state before mutating
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

`GET /library/files` and `GET /library/files/{fileId}` return a `uri` field pointing at:

```
https://closebotsaprod.blob.core.windows.net/documents/{hash}.txt
```

That URL is publicly fetchable (no auth header) and returns the raw current file content. This makes "what's in CloseBot right now" readable, not just writable.

**Caveat:** `uri` is `null` for very-recently-uploaded files (probably async population, ~minutes). When null, fall back to the local file as the source of truth.

**Why it matters:** Local files can drift from CB content (e.g. ballantyne local was `v4` but CB had `v5`). For any in-place KB edit, pull from the blob URI first, mutate, push back via `PUT /library/files/{id}` with FormData `newFile`. Pushing a stale local file overwrites the live KB.

Discovered 2026-05-22 during the Jiu-Jitsu KB update. Scripts using this pattern: `gs_kb_jj_update.mjs`, `gs_kb_contact_strip.mjs`.

Related: [[closebot-agent-node-put-pattern]] for the analogous read-current-then-mutate pattern on bot KDLs.
