---
name: CloseBot KDL Dedupe __zIndex Before Import
description: CloseBot exports duplicate __zIndex lines per block; the import endpoint now rejects them with HTTP 500 (empty body). Sanitize before POST /bot { importKdl }.
type: feedback
originSessionId: 05942f55-d547-4c0d-9dd1-ea00b1d5bf38
---
When duplicating a CloseBot bot via API (`POST /bot { name, importKdl }`), the exported KDL from `GET /bot/{id}/export` contains duplicate `__zIndex N` lines inside almost every block (Source, Method, Statement, ScenarioCustom, etc.). Confirmed 2026-05-04 on Vacaville v4.1 export — 9 duplicate lines across the file. Importing the raw export returns HTTP 500 with empty response body.

**Fix:** dedupe `__zIndex` per block before POSTing. After dedupe → 200 + bot created.

**Why:** the importer used to tolerate the dupe; CloseBot recently tightened validation. The export endpoint was never updated to match — so every export still contains the dupes. Fix is client-side until vendor patches export.

**How to apply:** any time we POST `/bot { importKdl: ... }`, run a per-block dedupe pass first. Reference dedupe logic: `shared/scripts/closebot/investigate_kdl_500.js` (function `stripDupeZIndex`). Same fix likely applies to PB and any other client doing API-driven duplication.

Also relevant: `DELETE /bot/{id}` returns 500 across the board — API delete is broken. Cleanup of legacy bots must be done in UI.
