# Ground Standard Ops

Operational workspace **and full memory** for Ground Standard Agency (GSA) — Bobby Freda's martial-arts marketing agency. This is the AI chatbot automation side of the operation: CloseBot SMS bots driving trial-class bookings via GoHighLevel, plus supporting infrastructure (n8n, Retell AI voice, Google).

**Who runs it:** JC owns the Ground Standard client; **Mark Cabel** operates this repo on JC's behalf. Everything client-facing fronts as JC — never name Mark or any associate to Bobby. (See `CLAUDE.md` → "WHO RUNS THIS WORKSPACE".)

**Where things stand (2026-06-26):** Vacaville Grappling Academy is live on production (v4.6); ~28 Agent Node gym bots are QA-passed and parked on the sandbox source, awaiting per-gym cutover. Full current state in `tasks/todo.md`.

---

## Quick start

1. **Read `SETUP.md`** — first-time checklist (Node, Claude Code CLI, .env files, bootstrap script).
2. **Run `bash bootstrap/setup.sh`** — installs deps, seeds Claude Code memory, validates env files.
3. **Open Claude Code in repo root** — it auto-reads `CLAUDE.md` and `clients/ground-standard/context.md` on session start.

---

## What's in this repo

| Folder | What |
|---|---|
| `clients/ground-standard/` | Bobby's GSA — gym portfolio, KB drafts, CloseBot exports, GHL inspections, reports |
| `shared/scripts/{closebot,ghl,n8n,retell,playwright,diagnostics,...}/` | All automation scripts. Run with `node --env-file=.env [--env-file=clients/ground-standard/.env] script.js` |
| `references/` | CloseBot vendor canon (`closebot_docs_reference.md`), architecture (`closebot_architecture.md`), Agent Node deep doc, stack reference |
| `tasks/todo.md` | Current state + immediate next action — read first on every session |
| `tasks/lessons.md` | Append-only learning log (April 2026 onward). Most recent at top. |
| `bootstrap/` | First-time setup script + seed Claude Code memory files |
| `.claude/skills/` | Installed Claude Code skills (CloseBot helpers, doc formats, n8n, etc.) |

---

## Where docs live (read this order on session start)

1. `tasks/todo.md` — handoff state
2. `CLAUDE.md` — ground rules, env naming, CloseBot tier map
3. `clients/ground-standard/context.md` — full GSA operational guide (KB methodology, no-pricing rule, Vacaville source routing, persona globality, multi-kid contact design)
4. `tasks/lessons.md` — recent investigation history (last ~10 entries minimum)

---

## Hard rules (one-line summary — full versions in CLAUDE.md and context.md)

- **No pricing in any bot-facing content.** Defer to coach at/after free trial.
- **No instructions in KBs.** Declarative facts only.
- **No booking language before the booking node.**
- **`mimicSourceId` for Vacaville evals = `src_4R4DUIQTMMX2NFPU`** (sandbox). NEVER use the production source as a mimic without explicit `ALLOW_PROD_MIMIC=true`.
- **Persona is global across all GS bots.** Universal rules go on the persona, gym-specific rules go in `__CONFIG__` or Sections.
- **KDL imports must dedupe `__zIndex` per block** before `POST /bot { importKdl }`.
- **Validate every KB before delivery** — `$`, `%`, instruction language, placeholders, source bleed.
