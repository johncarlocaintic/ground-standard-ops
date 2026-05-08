---
name: Claude account switching — no mid-session swap
description: claude-use script failed its promise; real account switching is /logout + re-login inside the extension
type: feedback
originSessionId: ec9a4695-ef4b-4890-9bba-5c9fc0a41bf3
---
The `claude-use` script (in top-secret/) swaps the config directory that *new* Claude Code sessions read at startup. It CANNOT hot-swap the OAuth token of an already-running session — Claude Code loads the token into memory at session start and has no reauth hook.

Real account switching path (works inside Antigravity extension, no terminal):
1. Type `/logout` in the Claude Code chat.
2. Log back in, pick the target account in the browser.
3. New session runs under that account.

**Why:** JC was sold "seamless mid-session account switching" when he built `claude-use`. That outcome is architecturally impossible in Claude Code. The script produces a false sense of having switched. Confirmed 2026-04-20 when JC asked to verify which account was active — had to hit Anthropic's `/api/oauth/profile` endpoint with the actual token to prove identity, because `claude-use status` alone doesn't reflect the running session's auth.

**Empirically proven broken (2026-04-20):** Decrypted all three encrypted token blobs in `top-secret/credentials/` and tested each access token against `/api/oauth/profile`. All three returned HTTP 401 — expired the previous day. Anthropic access tokens are short-lived (~24h), so the "encrypted token backup for portability" scheme was structurally broken: tokens expire faster than they can be re-encrypted. The whole subsystem (`switch.sh` + `credentials/` + `restore.sh`) was deleted 2026-04-20. The git-secret infrastructure stays — `.env.secret` at repo root is still valuable (API keys have no web re-auth path).

**How to apply:**
- Never propose `claude-use` as a solution for switching accounts mid-session. It isn't one.
- When JC wants to switch accounts, tell him: `/logout` in this chat, then log back in.
- JC works inside the Antigravity IDE Claude Code extension and does not want terminal-based workflows. Solutions must work in the extension chat.
- If JC decides to keep `claude-use`, scope it to: "pre-stage config for the *next* fresh session only." Don't oversell.

**Verifying the active account (when it matters):**
- Ground truth: hit `https://api.anthropic.com/api/oauth/profile` with `Authorization: Bearer <accessToken from ~/.claude/.credentials.json>`. Returns email, account UUID, plan. This is Anthropic's authoritative answer, not a local config read.
