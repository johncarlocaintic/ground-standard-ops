# SETUP — first-time checklist

This is the day-one walkthrough for the operator running Ground Standard in this repo (currently
**Mark Cabel**, on JC's behalf). Do these once, in order. Should take 30-45 minutes. Clone into a
clean `ground-standard-ops` folder of its own — don't reuse a folder from another client.

---

## 1. Local environment

| Need | Why |
|---|---|
| **Node.js v24 or higher** | All scripts in this repo are ES modules using `node --env-file` — requires v20.6+, recommend v24. Get from https://nodejs.org/ |
| **Git Bash (Windows) / Terminal (Mac/Linux)** | All commands here use bash syntax. On Windows install Git for Windows which includes Git Bash. |
| **Claude Code CLI** | The IDE / terminal agent. Install per https://claude.com/claude-code |
| **GitHub account + access to this repo** | JC will add you as a collaborator OR send you a fine-grained personal access token (PAT). |

Verify Node and git are working:
```bash
node --version    # should print v24.x.x or higher
git --version
```

---

## 2. Clone the repo

```bash
cd ~/your-projects-folder
git clone https://github.com/<jc-username>/ground-standard-ops.git
cd ground-standard-ops
```

If JC sent you a PAT, use the URL form `https://<TOKEN>@github.com/...`. Don't commit the URL.

---

## 3. Get the real .env files from JC

This repo ships only `.env.example` files (placeholders, no real keys). The real credentials come from JC out-of-band:

- 1Password / Bitwarden shared vault item, OR
- Bitwarden Send / 1Password Send (one-time link), OR
- Encrypted message via Signal

You'll receive two files:
- `.env` — root agency credentials (Retell, OpenAI, n8n, Google)
- `clients/ground-standard/.env` — GS-scoped credentials (CloseBot GS key, GHL GS PIT + Location ID)

Place them at the exact paths above. **Do not commit them — `.gitignore` already excludes them, but double-check before any push.**

---

## 4. Run the bootstrap script

```bash
bash bootstrap/setup.sh
```

This:
1. Verifies Node version
2. Runs `npm install` (Playwright dependency)
3. Creates `shared/logs/` directory
4. Seeds your Claude Code auto-memory with 30+ pre-built memory files (CloseBot rules, testing protocols, etc.)
5. Verifies `.env` files are in place

If the memory-seeding step shows the wrong path, see "Manual memory seed" at the bottom of this file.

---

## 5. Log into Claude Code with the GS account

This workspace bills to Bobby's GS Claude Team account. Log in with:

- Email: `ads@groundstandard.com`
- Password: from JC's shared vault

```bash
claude /logout    # if already logged in
claude            # then log in with ads@groundstandard.com
```

Verify the active account:
```bash
curl -s -H "Authorization: Bearer $(jq -r .accessToken ~/.claude/.credentials.json)" \
  https://api.anthropic.com/api/oauth/profile
```

---

## 6. First Claude Code session

Open Claude Code in the repo root. On session start it will automatically read:

1. `CLAUDE.md` — project context, ground rules, env naming, CloseBot tier map
2. `clients/ground-standard/context.md` — full GSA operational guide, KB methodology, no-pricing rule, Vacaville source routing
3. `tasks/todo.md` — current handoff state
4. Your seeded auto-memory — CloseBot rules, testing protocols, identity

You're ready to work.

**Recommended first task:** read `tasks/todo.md` to see what's queued, then read `clients/ground-standard/context.md` end to end before touching any client-facing changes.

---

## 7. Smoke test

Verify credentials are wired correctly:

```bash
node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/diagnostics/check_all_credentials.js
```

This confirms the GHL + CloseBot + Retell + OpenAI credentials are valid. If any fail, check the corresponding `.env` value.

---

## Manual memory seed (if step 4 failed)

The bootstrap script tries to detect Claude Code's per-project memory location and copy `bootstrap/seed-memory/*.md` into it. If that fails, do it manually:

1. Run Claude Code in the repo root once (just to make it create the project memory dir)
2. Look under `~/.claude/projects/` for the auto-created folder matching this repo's path (something like `d--<your-path>-ground-standard-ops`)
3. Copy `bootstrap/seed-memory/*.md` into that folder's `memory/` subdirectory
4. Restart your Claude Code session — the memory index will auto-load

---

## Where to ask for help

- Operational questions about Bobby / GSA / specific gyms → JC directly
- Bobby's preferences or campaign decisions → Bobby directly (channel JC sets up)
- "Why is the bot doing X" → run the SSE diagnostic, then check `tasks/lessons.md` for prior incidents, then ask
- Anything unfamiliar → flag, don't guess
