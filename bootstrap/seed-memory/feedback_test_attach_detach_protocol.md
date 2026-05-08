---
name: Test Source Attach/Detach Protocol
description: when testing CloseBot bots, attach source BEFORE the test and detach AFTER, before moving to the next bot. one bot attached at a time per source.
type: feedback
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
When running tests on CloseBot bots, follow this attach/detach protocol:

1. Detach any currently-attached bot from the source.
2. Attach the bot under test to the source.
3. Run the test.
4. Detach that bot.
5. Move to next bot, attach, test, detach.

Only one bot attached to the source at any given time. This matches the iteration archival rule and prevents source-context bleed across tests.

**Why:** Idriss flagged that test runs without proper attach/detach can yield ambiguous results (different bots may share or interfere with source-bound state). Even when test sessions don't strictly require attachment to function, keeping clean attach state per test prevents confusion and makes results comparable.

**How to apply:**
- For multi-bot test sweeps, build the loop so each iteration: detach previous → attach current → test → detach current
- For single-bot retests, ensure the target bot is attached and others are detached before running
- Reuse the existing `gs_detach_old_tests.js` pattern with a KEEP set
- After all testing is done, restore the original "live" bot attachment if one existed
