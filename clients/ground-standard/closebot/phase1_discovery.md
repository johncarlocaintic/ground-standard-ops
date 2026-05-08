# CloseBot Phase 1 Discovery — Ground Standard
**Date:** April 2026  
**Account:** Bobby Freda (Ground Standard)  
**Scripts:** `shared/scripts/closebot/gs_discovery.js`, `gs_test_bot_create.js`

## Final Endpoint Status

| Endpoint | Result | Notes |
|---|---|---|
| `GET /persona` | ✅ PASS | 2 personas: "Emma" (default) + 1 other |
| `GET /bot` | ✅ PASS | 46 bots in Bobby's account |
| `GET /bot/{id}/export` | ✅ PASS | Returns `{id, version, kdl}` — KDL format fully decoded |
| `POST /bot` (shell) | ✅ PASS | Creates bot with default persona assigned |
| `POST /bot` with `importKdl` | ✅ PASS | **Nodes imported correctly** — verified by re-exporting |
| `POST /bot/{id}/publish` | ✅ PASS | Empty body `{}` — confirmed `published: true` on re-fetch |
| `POST /bot/{id}/save` | ❌ FAIL | HTTP 500 with all payload shapes — cannot update nodes after creation |
| `POST /bot/ai-create` | ❌ FAIL | HTTP 405 — endpoint does not accept POST |
| `DELETE /bot/{id}` | ❌ FAIL | HTTP 500 consistently — use UI to delete bots |
| `GET /bot/node-descriptors` | ❌ FAIL | HTTP 200 but body is `null` |
| `GET /bot/{id}/versions` | ❌ FAIL | HTTP 404 — endpoint doesn't exist |
| `GET /bot/{id}/versions/{v}/steps` | ❌ FAIL | HTTP 404 — endpoint doesn't exist |

## Key Finding: Programmatic Bot Creation Works via KDL Import

`POST /bot` with `importKdl` field accepts a KDL string and imports nodes correctly.  
Verified: created a test bot, re-exported it, confirmed all nodes (CONFIG, Source, MultiObjective, Conversation) were present.

⚠️ **Manual cleanup needed:** Two test bots remain in Bobby's account (`TEST-KDL-IMPORT-DO-NOT-USE`, `TEST-SHELL-DO-NOT-USE`) — delete via UI since `DELETE /bot/{id}` returns 500.

## KDL Quirks Discovered During Import

- `activeAiNodeId` and `__dynamicVariables` fields are **stripped on import** (CloseBot manages these internally)
- `__position` accepts `x y` format but CloseBot reformats it on export (cosmetic only)
- `globalAgentTools` block formatting is simplified on re-export
- All node logic (`Objectives`, `AiCases`, `Next` handles) imports cleanly

## Node Types Confirmed in Bobby's Bots

`__CONFIG__`, `Source`, `MultiObjective`, `AISwitch`, `ModifyTags`, `Booking`, `Statement`, `Conversation`

Full schemas for each in `stack_api_reference.md`.

## Confirmed Creation Workflow

```
1. POST /bot  { name, importKdl }  → get bot ID
2. POST /bot/{id}/publish  {}      → bot is live
```

⚠️ **3 test bots still in Bobby's account** — delete manually in UI:
- `TEST-KDL-IMPORT-DO-NOT-USE`
- `TEST-SHELL-DO-NOT-USE`  
- `TEST-PUBLISH-SAVE-DO-NOT-USE`

## Next Steps

1. Build KDL generator function for Ground Standard bot templates
2. Wire persona assignment — test passing `personaIds` in `POST /bot` payload
3. Test KB attachment to a bot after creation
