---
name: CloseBot Agent Node Exception (2026-04-25)
description: confirmed server-side exception in Agent Node Method processing path; concrete actionId/timestamps available; CloseBot devs notified
type: reference
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
CloseBot's Agent Node (Method type) throws a server-side exception when processing the entry node, captured 2026-04-25.

**Concrete error from SSE logs:**
```
severity: 4
message: "An exception occured while processing this node. Our team will look into this!"
frontendNodeId: n10_intro
actionId: act_JXBER78R71NFEERR
timestamp: 2026-04-25T22:51:21.6179243Z
botId: bot_8MQTN84B7VJL3WW8 (Vacaville v4.4)
```

**Pre-failure context (all worked):**
- Scenario evaluation: OpenAI gpt-4.1-mini returned scoring
- Aggression scenario: gpt-4.1-nano returned NO
- GHL contact created (201) and fetched (200)
- Location fetched (200)
- n01_source action fired

**Failure point:** entry into n10_intro Method (Agent Node). No bot message-sent event after this.

**Why it matters:** every newly-created Agent Node bot today is silent. Legacy bots created days ago partially work then degrade. CloseBot live support (Ihsan, 2026-04-25) confirmed "backend issue with AI provider, devs reviewing Monday."

**Diagnostic artifacts:**
- shared/scripts/closebot/gs_deep_diagnostic.js (captures full SSE event JSON)
- shared/logs/v4_4_deep_events.json (full event dump from the failing run)

**How to apply:** before reporting Agent Node bot silence as a config issue, run gs_deep_diagnostic.js and look for severity 4 exceptions. If present, it's CloseBot server-side. If absent, investigate KDL/persona/source/channel.

---

## Update 2026-04-26T00:34Z — narrowed failure point

Tested 4 isolation variants. Pattern locked: **Agent Node IS reached and STARTS executing every time. Exception fires during response generation.**

| Bot | Architecture | Result |
|---|---|---|
| `bot_W7ZC8X7DD98QMDA6` (v4.4) | Source → 3 Agent Nodes (full Vacaville) | Exception at turn 1 entry (Agent Node tries to generate immediately) |
| `bot_XCBBA2FRB26FFJ5P` (v5.2) | Source → Statement preamble (MoveOn) → 3 trimmed Agent Nodes | Exception at turn 2 (Agent Node entered fine, crashed when generating from lead's reply) |
| `bot_D36BVZIG5W4RIUY4` (v6.0) | Source → 1 minimal Agent Node | Exception at turn 1 entry |
| `bot_AGA56NVRWBASJ0CT` (v6.1) | Source → Statement preamble → 1 minimal Agent Node | Exception at turn 2 |

**Key signal logged just before exception:** `severity 2: "Running Agent node..."` — the executor starts, then immediately throws.

**Implication:** Statement preamble does not fix the bug. It only delays it by one turn. Whenever an Agent Node has to actually produce text (entry-as-first-node OR generation-from-content), it throws.

**Fresh actionIds for support escalation (2026-04-26):**
- `act_AX0WXV98F9I014DH` (v6.1, turn 2 exception, timestamp 2026-04-26T00:34:18.7488623Z)
- `act_9NNPR5HW27VMPYOP` (v5.2, turn 2 exception, timestamp 2026-04-25T23:54:34.4857862Z, but 2026-04-26 UTC equivalent)

**Workaround proven:** Statement nodes (UseAI=true) work fine. v3-style architecture (Statement + MultiObjective + Conversation, no Method nodes) is the unblocked path until CloseBot's Monday fix lands.

---

## Re-test 2026-04-26T19:31Z — bug still present (~21 hrs later)

Re-ran deep diagnostic on `bot_AGA56NVRWBASJ0CT` (v6.1, unchanged from prior day). Same exception, same signature:

```
severity 4: "An exception occured while processing this node. Our team will look into this!"
actionId: act_NLFX2UOW6SWQF8S8
timestamp: 2026-04-26T19:31:29.170927Z
```

Same trace order: Statement preamble fires turn 1 → n10_agent action fires (entry) → turn 2 lead reply triggers `Running Agent node...` → immediate exception. CloseBot Monday-review fix has NOT shipped as of this timestamp.

---

## Re-test 2026-04-27T03:48Z — bug still present (~29 hrs after first capture)

Same bot (`bot_AGA56NVRWBASJ0CT`). Identical signature:

```
severity 4: "An exception occured while processing this node."
actionId: act_1TTJOOVYKBM9MY29
timestamp: 2026-04-27T03:48:01.8274589Z
```

Three confirmed captures across ~29 hour window. Pattern stable. Fix not yet shipped.

---

## Re-test 2026-04-27T03:51Z — republish does not unstick the bug

User republished v6.1 (no KDL changes, just a republish action) at ~2026-04-27T03:50Z. Tested immediately after.

```
severity 4: "An exception occured while processing this node."
actionId: act_RV59MKNVRP92NP4B
timestamp: 2026-04-27T03:51:20.2808155Z
```

Same signature. Confirms: republishing a bot does NOT reset or trigger anything in CloseBot's Agent Node executor code path. The exception lives in their backend service, not in any published bot state. Republishing won't help; only a CloseBot-side code fix will.

---

## Re-test 2026-04-27T05:19Z — legacy bots still work, openai-first persona does NOT fix new bots

Two findings same session:

**Legacy bots still respond:**
- `bot_P3WU0IFASM9DDPWA` (v4.0 legacy, 2026-04-23) — full conversation via Agent Node `n10_intro`, Anthropic toolCallId `toolu_...`
- `bot_DR18GF3ZG7IH5QOM` (v4.1 legacy, 2026-04-24) — full conversation, same path
- `bot_8PWPJTCFSYBPRP06` (Agent Node TEST, older) — full conversation

**Pattern locked: bots created BEFORE 2026-04-25 work. Bots created ON OR AFTER 2026-04-25 throw.**

**Provider preference test (v6.2):** created `pers_LR6UXII19IBDVS5L` with `aiProviderPreferences: ["openai-legacy", "anthropic"]` and bound to fresh bot `bot_0VD66DNKNXALDDL8` via UI. Tested:

```
severity 4: "An exception occured while processing this node."
actionId: act_Z0T9YQB8OXR5G3N5 (turn 1)
actionId: act_QBW7OXZ0BX5NM482 (turn 2)
provider: null
model: null
timestamp: 2026-04-27T05:19:31Z
```

Critical detail: exception logs show `provider: null` and `model: null` — the bug fires BEFORE the LLM provider is invoked. Bug is in Agent Node executor's setup phase (tool registration / prompt assembly / persona loading), not in the LLM call.

**Implication:** provider switching (Anthropic ↔ OpenAI) cannot fix this. The bug is upstream of provider selection. Persona modification is not a viable workaround.

**API note:** persona binding to a bot is not exposed via REST API. POST/PUT/PATCH on `/bot/{id}` with `personaIds` field returns 200 but does nothing. Persona swap requires CloseBot UI action.

---

## Workaround applied 2026-04-27T05:52Z — promoted v4.1 legacy to production

Per the "older-bots-still-work" pattern, restored `bot_DR18GF3ZG7IH5QOM` (formerly v4.1 LEGACY) as production:

1. Detached `bot_0VD66DNKNXALDDL8` (v6.2) from `src_4R4DUIQTMMX2NFPU`
2. Renamed `bot_DR18GF3ZG7IH5QOM` → "Vacaville PROD - v4.1 reverted 2026-04-27"
3. Attached `bot_DR18GF3ZG7IH5QOM` to GS Ads / `Test Chat 12 [VACAVILLE ]` channel
4. **Skipped re-publish** to avoid triggering broken setup path
5. Verified working: 2-turn diagnostic, Agent Node `n10_intro` responded both turns via `Tool send_message`, no exceptions

**Production Vacaville bot back online without waiting for CloseBot fix.**

**Hard rules until CloseBot ships fix:**
- Do NOT republish `bot_DR18GF3ZG7IH5QOM` (might invalidate cached working state)
- Do NOT edit it in UI (same risk)
- Do NOT deploy new Agent Node bots **via `POST /bot { importKdl }`** (all hit broken code path)
- Statement / MultiObjective / Conversation node deploys are safe (proven via v5.0)

---

## 2026-04-27T07:55Z — REVISED ROOT CAUSE: import path is broken, duplicate path works

Earlier hypothesis ("bots created on/after 2026-04-25 are broken") was wrong. Real differentiator is **creation method**:

| Creation method | Today's result |
|---|---|
| `POST /bot { importKdl }` | ❌ exception in n10_intro |
| `POST /bot/{id}/duplicate` | ✅ works fully (Agent Node responds normally) |
| `POST /bot { sourceBotId }` | ✅ works (alternate clone endpoint) |

Test: duplicated `bot_DR18GF3ZG7IH5QOM` (v4.1 PROD) via `POST /bot/bot_DR18GF3ZG7IH5QOM/duplicate` → got `bot_J56AWZ5TYQI9HKJS`. Attached, ran deep diagnostic. Bot responded both turns via Agent Node `n10_intro` with Anthropic tool calls. Zero exception.

**Implication:** CloseBot's `importKdl` parser/setup code is broken. Bot CLONE endpoints use a different internal code path that bypasses the bug.

**Iteration workaround (untested for modifications):** duplicate v4.1 PROD → modify the duplicate. Untested whether modification (via UI or API) re-runs the broken setup or preserves working state.

**Architectural lesson:** future deploy scripts should prefer cloning a known-good template bot + applying delta modifications, rather than creating from scratch via importKdl. CloseBot's import path is the fragile component.

---

## 2026-04-27T08:36Z — `POST /bot { importKdl }` still returns 500

Re-tested the old workflow (export PROD KDL → modify → POST). Got `500 Internal Server Error` immediately at create. Same as every prior attempt today. CloseBot bug is unfixed ~33 hours after first capture. PROD attachment unaffected (failure occurred before any state change).

Side observation: PROD KDL does not literally contain the strings "free trial" or "first class is free". Those phrases are generated dynamically by the LLM from the persona's `howToRespond` field and the conversationReason. To suppress them via KDL-only changes would require adding explicit prohibitions to conversationReason — UI editing required.

---

## 2026-04-27T08:42Z — 3 retry attempts confirm import endpoint still broken

Built `vacaville_v6_3_fixes.kdl` with 3 fixes applied (free-trial prohibition, same-day calendar verification, retry-before-handoff). Tried `POST /bot { importKdl }` via Node 3 times in sequence. All 3 returned `500 Internal Server Error` with empty body. Bug remains unfixed.

Fixed KDL file ready at `shared/logs/vacaville_v6_3_fixes.kdl` for later deployment when import path recovers, OR for manual UI paste-in.
