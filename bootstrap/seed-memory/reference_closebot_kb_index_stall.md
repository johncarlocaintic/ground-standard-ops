---
name: closebot-kb-index-stall-fix
description: "A freshly POST-created CloseBot library file can stall at fileStatus \"uploaded\"; a PUT content-replace re-triggers indexing"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

When you create a CloseBot library file via `POST /library/files` (form field
`file`), it can get stuck at `fileStatus: "uploaded"` indefinitely (observed
~20+ min on Eden Prairie KB 2026-05-17 while 42 other library files were
`indexed`). The eval / Smart FAQ is KB-blind until the file is `indexed`.

**Fix:** re-trigger indexing with a content-replace PUT (the Vacaville deploy
path that reliably produces `indexed` files):

```
PUT /library/files/{fileId}   (multipart, form field "newFile" = the same KB blob)
```

Indexing then completes in ~3 min. Poll `GET /library/files` until that
fileId's `fileStatus === "indexed"` before running `/closebot-test`.

**How to apply:** in the per-gym KB swap, after create+attach, if status is
still `uploaded` after one poll cycle, fire the PUT re-trigger, then poll to
`indexed`. Never run the eval on an `uploaded` KB — results are KB-blind and
the verdict is untrustworthy. Pairs with
[[feedback_gs_ads_kb_swap_protocol]] and [[feedback_gs_kb_verification_standard]].
