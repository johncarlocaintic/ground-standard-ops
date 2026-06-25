# CloseBot API Bug Report — PUT /bot/{id} silently drops importKdl

**Account:** Bobby Freda — Ground Standard (`acct_GDRS6AVRNKGTM319`)
**Date observed:** 2026-05-21
**API base:** `https://api.closebot.com`
**Auth:** `X-CB-KEY` header
**Severity:** Blocks all programmatic bot KDL updates. Affects 19 live production bots.

---

## Summary

`PUT /bot/{id}` with body `{ importKdl: <kdl> }` returns **HTTP 200** but the KDL change does **not persist**. Subsequent `GET /bot/{id}/export` returns the unchanged KDL. No new version is created on `POST /bot/{id}/publish` afterward.

This silently fails for every bot tested, including a freshly-duplicated bot. Other PUT operations on the same endpoint (e.g. `name` update) DO persist correctly — only `importKdl` is being silently ignored.

This was working earlier today (script run at 2026-05-21T17:15–17:30 UTC) and stopped working sometime before 2026-05-21T19:30 UTC.

---

## Impact

- 19 live bots could not receive a planned KDL update (Jiu-Jitsu capitalization + handoff-instruction injection)
- Champion Martial Arts bot (`bot_GEGYNE5WQNOYH7UB`) needs karate program removal — currently blocked, must be edited manually in UI
- We falsely reported success on the earlier batch of 19 because we trusted HTTP 200 + 204 publish response; content was never actually changed

---

## Reproduction

### Setup
Bot: `bot_GEGYNE5WQNOYH7UB` (Champion Martial Arts)
Source attached: `src_EJODL02HM128RGZH`

### Test 1 — Confirm PUT works for non-importKdl fields

```
PUT https://api.closebot.com/bot/bot_GEGYNE5WQNOYH7UB
Content-Type: application/json
X-CB-KEY: <ours>

{ "name": "Champion Martial Arts - v1.2 [karate scrub + age bands] (2026-05-21)" }
```

**Result:** 200. Name change persisted (verified via subsequent GET).

### Test 2 — PUT importKdl silently drops

```
PUT https://api.closebot.com/bot/bot_GEGYNE5WQNOYH7UB
Content-Type: application/json
X-CB-KEY: <ours>

{ "importKdl": "<full KDL with single-word marker 'KARATE_MARKER_TEST' substituted>" }
```

**Result:** 200. But:

```
GET https://api.closebot.com/bot/bot_GEGYNE5WQNOYH7UB/export
```
returns the original KDL. Marker not present. No size change.

Polled `/export` every 5 seconds for 60 seconds — marker never appeared. Polled every 10 seconds for 2 minutes — still nothing.

### Test 3 — Same behavior on a freshly duplicated bot

```
POST https://api.closebot.com/bot/bot_GEGYNE5WQNOYH7UB/duplicate
```
→ 200, returns new bot `bot_JFGL49CQHFWVT85C`.

```
PUT https://api.closebot.com/bot/bot_JFGL49CQHFWVT85C
{ "importKdl": "<KDL with KARATE_TEST_MARKER>" }
```
→ 200. `/export` returns original KDL, marker absent.

Conclusion: not a per-bot lock state.

### Test 4 — Body shape variations all fail

| Method | Endpoint | Body | Status | Persisted? |
|---|---|---|---|---|
| PUT | `/bot/{id}` | `{ importKdl, version: "0.0.3" }` | 200 | No |
| PUT | `/bot/{id}` | `{ importKdl, draft: true }` | 200 | No |
| PUT | `/bot/{id}` | `{ name, importKdl }` | 200 | Name only |
| PUT | `/bot/{id}` | `{ kdl: ... }` (no `import` prefix) | 200 | No |
| POST | `/bot/{id}` | `{ importKdl }` | 405 | — |
| PATCH | `/bot/{id}` | `{ importKdl }` | 405 | — |
| PUT | `/bot/{id}` | multipart `{ importKdl: blob }` | 415 | — |
| PUT | `/bot/{id}` | multipart `{ newFile: blob }` | 415 | — |

### Test 5 — Probe related endpoints

| Endpoint | Status |
|---|---|
| `POST /bot/{id}/import` | 404 |
| `POST /bot/{id}/kdl` | 404 |
| `PUT /bot/{id}/kdl` | 404 |
| `POST /bot/{id}/draft` | 404 |
| `GET /bot/{id}/draft` | 404 |
| `POST /bot/{id}/versions` | 404 |
| `PUT /bot/{id}/version` | 404 |
| `PUT /bot/{id}/version/0.0.1` | **200** (silently drops) |
| `PUT /bot/{id}/version/0.0.2` | **504 Gateway Timeout** |
| `PUT /bot/{id}/version/0.0.3` | 404 |

The `504` on `/version/0.0.2` is interesting — suggests the import is *attempted* but the gateway times out before it completes. Even after waiting 2+ minutes and re-checking `/export?version=0.0.2`, the change is not persisted.

### Test 6 — Detaching the source first does not help

```
DELETE /bot/{id}/source/{srcId}  → 200
PUT /bot/{id} { importKdl }     → 200 (or sometimes 504)
```
Polled `/export` for 2 minutes — still not persisted.
Then re-attached source via `POST /bot/{id}/source/{srcId}` → 204, source attached cleanly.

### Test 7 — POST /bot { name, importKdl } cannot create new Agent Node bots

```
POST /bot { name: "TEST-...", importKdl: "<scrubbed KDL>" }
```
→ **500 Internal Server Error**, no body returned.

(This was a known limitation discovered earlier — but worth flagging if it's supposed to work.)

---

## Side-by-side: this morning vs now

Earlier today at 17:15–17:30 UTC, the same pattern apparently worked across 19 bots:
```
PUT /bot/{id} { importKdl: <fixed KDL> } → 200
POST /bot/{id}/publish {} → 200 or 204
```
Each bot's `versions[]` count went from 1 → 2.

However, **content comparison shows v0.0.1 and v0.0.2 KDL exports are byte-identical** for the bots we've checked (e.g. Champion: both 25876 chars, both contain unchanged karate references). The publish appears to have created an empty version snapshot, not actually imported the new KDL.

This means the "silently dropped" behavior was likely already present this morning — we just didn't catch it because we trusted the HTTP 200 + version-increment without doing a content read-back.

---

## What we'd expect to see

- `PUT /bot/{id} { importKdl }` returns 200 → next `GET /bot/{id}/export` returns the new KDL
- OR a non-2xx response with a clear error message if the import is rejected (e.g. malformed KDL, payload limit, permissions)
- OR an async job ID that we can poll for completion

What we're seeing instead: a silent 200 with no side effect.

---

## Account / API key context

- `CB_GS_API_KEY` (Bobby Freda's API key) — successfully used today for:
  - `GET /bot/{id}` — works
  - `GET /bot/{id}/export` — works
  - `PUT /bot/{id} { name }` — works
  - `POST /bot/{id}/duplicate` — works
  - `DELETE /bot/{id}` — works
  - `DELETE /bot/{id}/source/{srcId}` — works
  - `POST /bot/{id}/source/{srcId}` (attach) — works
  - `PUT /library/files/{id}` (KB update via FormData newFile) — works, re-indexes
  - `POST /bot/{id}/publish` — returns 204 (presumably no-op when no draft exists)

So the key has write scope; the issue is specifically with `importKdl` field handling on the bot PUT endpoint.

---

## Questions for support

1. Is `PUT /bot/{id} { importKdl }` still the supported way to update a bot's KDL, or has this moved to a different endpoint or shape?
2. Should we expect an async job pattern (PUT returns immediately, import processes in background)? If so, what's the poll endpoint?
3. Why does `PUT /bot/{id}/version/0.0.2 { importKdl }` return 504 — is that endpoint actually trying to process the import?
4. Any payload size limits or per-account daily import quotas we should be aware of?
5. Did anything change between 2026-05-21T17:30 UTC and 2026-05-21T19:30 UTC that would affect bot import behavior?

---

## Workaround we're using

Until this is resolved we're:
- Editing affected bots manually in the CloseBot UI
- KB updates (`PUT /library/files/{id}`) still work, so we route business-fact changes through KBs where possible
- Treating any HTTP 2xx from `PUT /bot/{id}` as unconfirmed until a follow-up `GET /export` content diff verifies the change

Any pointers appreciated. Happy to give you full request/response captures or test against a specific endpoint variant if you want me to.

— Bobby Freda / Ground Standard / johncarlocaintic@gmail.com
