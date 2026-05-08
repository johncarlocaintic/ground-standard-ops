# Claude Code agents, skills, and workspace architecture

Claude Code's power comes not from one killer feature but from a layered system — persistent memory files, on-demand skills, isolated sub-agents, and parallel execution — that compounds when used together. Understanding how each layer works and where it fits is the difference between treating Claude Code as a chat assistant and treating it as a coordinated team of specialists. This document walks through every major layer, grounded in official Anthropic documentation and battle-tested community patterns, so you can internalize the concepts before building anything.

The architecture has evolved rapidly. As of early 2026, Claude Code supports custom sub-agents defined as markdown files, experimental peer-to-peer agent teams, git worktree isolation for parallel work, and a skills system that loads domain knowledge on demand without bloating every session. Antigravity IDE, the Google VS Code fork you're already using, has its own `.agents/` directory and Manager View that can coexist with Claude Code's patterns in the same workspace on your E: drive.

---

## CLAUDE.md is your persistent contract with Claude

CLAUDE.md is a plain-text markdown file that gives Claude Code persistent instructions across every session. Think of it as a briefing document: Claude reads it at the start of each conversation and treats its contents as context, not enforced configuration. The more specific and concise the file, the more reliably Claude follows it. [CONFIRMED from docs]

**Where it lives matters.** Claude Code supports multiple scopes of CLAUDE.md, loaded in a specific priority order from highest to lowest: managed policy (org-wide, stored in system directories like `C:\Program Files\ClaudeCode\CLAUDE.md` on Windows), project instructions (`./CLAUDE.md` or `./.claude/CLAUDE.md` in your repo root), user instructions (`~/.claude/CLAUDE.md` for all your projects), and local instructions (`./CLAUDE.local.md`, which you gitignore for personal notes). [CONFIRMED from docs]

You can absolutely have nested CLAUDE.md files in subdirectories. Claude Code walks up the directory tree from the current working directory, finding and concatenating every CLAUDE.md and CLAUDE.local.md it encounters. Subdirectory files — say `src/api/CLAUDE.md` — are **not loaded at launch**; they load on demand only when Claude starts working with files in that directory. Within each directory, CLAUDE.local.md is appended after CLAUDE.md, giving your personal notes effective priority when instructions conflict. Nothing overrides anything; everything gets concatenated into context. [CONFIRMED from docs]

### What separates a great CLAUDE.md from a mediocre one

The community has converged on a clear set of principles. A great CLAUDE.md is **under 80–200 lines** (Anthropic says target under 200; the community repo with 21K+ stars warns that beyond 80 lines, Claude starts ignoring parts). It includes only things Claude cannot figure out by reading the code: specific bash commands for your build system, code style rules that differ from defaults, testing workflows, repo conventions like branch naming, architectural decisions, and environment quirks. [CONFIRMED from docs, COMMUNITY REPORTED]

A mediocre CLAUDE.md restates the obvious ("write clean code"), duplicates what a linter already enforces, includes personality instructions ("be a senior engineer"), embeds large API docs instead of linking them, or describes the codebase file-by-file. Anthropic's own guidance explicitly says to avoid anything Claude can infer from reading the source. The Claude Code system prompt already contains roughly 50 instructions, and frontier models can reliably follow about **150–200 instructions total** — your CLAUDE.md is sharing that budget. [CONFIRMED from docs, COMMUNITY REPORTED]

Here's a real example of a well-structured CLAUDE.md, drawn from Anthropic's own documentation style:

```markdown
# Code style
- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible

# Workflow
- Typecheck when done making a series of code changes
- Run single tests, not the whole suite, for performance

# Architecture
- API routes live in src/api/, React components in src/components/
- All database access goes through src/db/client.ts
```

Notice what's absent: no paragraphs of explanation, no personality directives, no information the code itself communicates. Every line earns its place.

### The @-import system and modular rules

For larger projects, CLAUDE.md supports importing additional files with `@path/to/import` syntax. Imported files expand and load at launch, with a maximum nesting depth of five hops. External imports require one-time approval. However, community wisdom cautions against heavy use of @-imports: embedding an entire API guide every session wastes tokens. Better to write a natural-language reference like "For Stripe integration, see docs/stripe-guide.md" — Claude reads it only when relevant. [CONFIRMED from docs, COMMUNITY REPORTED]

The `.claude/rules/` directory offers another modular approach: individual topic files (like `testing.md` or `api-design.md`) that can optionally include `paths` frontmatter with glob patterns, making them load only when Claude works with matching files. This conditional loading is powerful for monorepos where different modules have different conventions. [CONFIRMED from docs]

---

## Skills are on-demand playbooks, not always-on context

Skills are a distinct concept from CLAUDE.md, and the distinction matters. A CLAUDE.md file loads every session whether or not its content is relevant. A skill loads **only when invoked** — either manually via a slash command or automatically when Claude's semantic matching determines the skill is relevant to your current request. This means lengthy reference material, step-by-step procedures, or domain-specific playbooks cost almost nothing until they're actually needed. [CONFIRMED from docs]

Each skill is a **directory** (not a single file) with a required `SKILL.md` entrypoint plus optional supporting files:

```
.claude/skills/retell-voice-agent/
├── SKILL.md           # Main instructions with YAML frontmatter
├── template.md        # Template for Claude to fill in
├── examples/
│   └── sample-flow.md
└── scripts/
    └── validate.sh
```

Skills live in three scopes: personal (`~/.claude/skills/`), project (`.claude/skills/`), and enterprise (managed settings). Project skills ship with the repo; personal skills follow you everywhere. [CONFIRMED from docs]

### How skills differ from CLAUDE.md in practice

The key distinction is lifecycle. CLAUDE.md content enters every conversation and stays permanently. Skill content enters only when invoked and persists for the rest of that session, with auto-compaction carrying the first **5,000 tokens per skill** forward (combined budget of 25,000 tokens across all active skills). [CONFIRMED from docs]

The `description` field in a skill's YAML frontmatter acts as a **trigger, not a summary**. Claude uses semantic matching on this description to decide when to automatically apply the skill. The community's best-practices repo (21K+ stars) advises writing descriptions from the model's perspective — "when should I fire?" — rather than describing what the skill does for humans. Front-load the key use case, because the description is truncated at **1,536 characters**. [CONFIRMED from docs, COMMUNITY REPORTED]

The practical rule of thumb: if you keep pasting the same checklist or playbook into chat, it should be a skill. If it's a fact or convention that applies broadly (like "always use TypeScript strict mode"), it belongs in CLAUDE.md. For your GHL automations and Retell AI work, you might have a skill for each integration pattern — one for setting up a new Retell voice agent, one for configuring GHL webhook flows — while your CLAUDE.md holds universal workspace rules. [INFERRED]

Skills also support advanced features: the `context: fork` frontmatter runs the skill in an isolated sub-agent context, `allowed-tools` grants specific tool permissions without asking, and `!command` syntax in SKILL.md injects dynamic shell output into the prompt. Custom commands in `.claude/commands/` still work but have been merged into the skills system; Anthropic recommends using skills going forward. [CONFIRMED from docs]

---

## Sub-agents run in their own isolated world

A Claude Code sub-agent is a separate Claude instance spawned by the main agent (or by you directly) to handle a focused task in its own context window. This is not the same as asking Claude Code to do something in your current conversation. The sub-agent gets **its own fresh context**, its own system prompt, its own tool access — and when it finishes, only its final message comes back to the parent. All intermediate tool calls, file reads, and reasoning stay inside the sub-agent's context and never touch yours. [CONFIRMED from docs]

This isolation is the entire point. Sub-agents keep your main conversation clean. A research task that reads 50 files and generates verbose output happens in the sub-agent's context; your parent agent receives a concise summary. Without sub-agents, that same work would consume your main context window and degrade Claude's performance on subsequent tasks.

### How sub-agents are spawned

The primary mechanism is the **Agent tool** (renamed from "Task tool" in Claude Code v2.1.63; both names still work). The parent agent calls this tool with a description and a prompt, and a new Claude instance spins up. You can also spawn sub-agents by typing `@` and picking from a typeahead menu, using the `/agents` interactive command, running `claude --agent code-reviewer` from the command line, or passing JSON agent definitions via the `--agents` CLI flag. [CONFIRMED from docs]

Custom sub-agents are defined as markdown files with YAML frontmatter, stored in `.claude/agents/` (project scope) or `~/.claude/agents/` (user scope). Here's a real example:

```yaml
---
name: code-reviewer
description: Reviews code for quality, patterns, and potential bugs
tools: Read, Glob, Grep
model: sonnet
memory: project
---
You are a code reviewer. Focus on correctness, edge cases, and 
adherence to the project's conventions in CLAUDE.md. Update your 
agent memory with patterns you discover.
```

Priority order for agent definitions runs from managed settings (highest) through CLI flags, project agents, user agents, and finally plugin agents. [CONFIRMED from docs]

### What sub-agents see and don't see

This is critical to understand. A sub-agent receives its own system prompt (the markdown body from its definition), the Agent tool's prompt string (the only channel from parent to sub-agent), project CLAUDE.md files (loaded normally), and its allowed tool definitions. It does **not** receive the parent's conversation history, the parent's tool results, the parent's system prompt, or any skills unless explicitly listed in the `skills` frontmatter field. [CONFIRMED from docs]

Because the prompt string is the sole communication channel, vague instructions like "implement the feature" are a documented anti-pattern. You need to pass specific file paths, error messages, constraints, and expected outputs directly in the prompt. The more context you pack into that prompt, the better the sub-agent performs. [CONFIRMED from docs, COMMUNITY REPORTED]

One hard constraint: **sub-agents cannot spawn other sub-agents**. This prevents infinite nesting. If you need multi-level orchestration, chain sub-agents from the main conversation or use skills instead. [CONFIRMED from docs]

### Foreground vs. background execution

Sub-agents can run in two modes. **Foreground sub-agents** block the main conversation until they complete, with permission prompts passing through to you. **Background sub-agents** run concurrently while you keep working — press **Ctrl+B** to send a running task to the background, or set `background: true` in the agent's frontmatter. Background agents pre-approve permissions before launch and auto-deny anything not pre-approved. [CONFIRMED from docs]

You can explicitly ask Claude to parallelize: "Research the authentication, database, and API modules in parallel using separate sub-agents." Up to roughly **7 parallel sub-agents** have been observed running simultaneously within a single session. [CONFIRMED from docs, COMMUNITY REPORTED]

---

## How experts organize workspaces for multi-agent work

The dominant pattern among power users is deceptively simple: **git worktrees for isolation, CLAUDE.md for shared context, and file ownership conventions to prevent conflicts.** The fancy multi-agent orchestration patterns exist but are reserved for genuinely complex, parallelizable work.

### Git worktrees are the primary isolation mechanism

When multiple agents need to work simultaneously on the same codebase, they can't all edit the same files in the same directory. Git worktrees solve this by creating separate working directories, each with its own branch, while sharing the same git history. Claude Code has native worktree support via the `--worktree` flag:

```bash
# Terminal 1 — feature work
claude --worktree feature-auth
# Terminal 2 — bugfix
claude --worktree bugfix-123
# Terminal 3 — background refactor
claude --worktree refactor-api-layer
```

Each worktree lives in `.claude/worktrees/<name>/` with its own branch named `worktree-<name>`. Boris Cherny, Claude Code's creator at Anthropic, runs **10–15 concurrent sessions** daily: 5 in numbered terminal tabs with separate git checkouts, 5–10 on claude.ai/code, plus mobile sessions. Each session is a separate worker with its own context. [CONFIRMED from docs, COMMUNITY REPORTED]

For sub-agents specifically, adding `isolation: worktree` to the agent's YAML frontmatter automatically creates an isolated git worktree for that agent's execution. When the agent finishes with no changes, the worktree is auto-removed; if changes exist, Claude prompts you to keep or discard. [CONFIRMED from docs]

### File ownership and scratch pads

Beyond worktrees, experts use **directory ownership conventions** — each agent is explicitly scoped to specific directories. A backend agent owns `src/api/`, a frontend agent owns `src/components/`, and shared contracts (like TypeScript interfaces or API schemas) are written first by one agent sequentially before the parallel phase begins. [COMMUNITY REPORTED]

The **scratch pad pattern** is widely used for task tracking and inter-session memory. A common structure:

```
project-root/
├── CLAUDE.md
├── CLAUDE.local.md          # Personal, gitignored
├── .claude/
│   ├── agents/              # Custom sub-agent definitions
│   ├── skills/              # On-demand skills
│   ├── settings.json
│   └── worktrees/           # Isolated working directories
├── tasks/
│   ├── todo.md              # Checklist-style progress tracking
│   └── lessons.md           # Accumulated learnings from corrections
└── src/
    ├── api/CLAUDE.md        # Directory-specific context
    └── components/CLAUDE.md
```

The `tasks/todo.md` and `tasks/lessons.md` files act as persistent state across sessions. Boris Cherny's pattern: write the plan to `tasks/todo.md` with checkable items, verify before starting, mark items complete as you go, and capture corrections in `tasks/lessons.md` so they're never repeated. [COMMUNITY REPORTED]

For agents that need to share state during a session, the community has built tools like the **scratchpad-mcp** server (a community MCP server providing shared scratchpads for sub-agent collaboration). Agent Teams, the experimental feature, uses filesystem-based inboxes at `~/.claude/teams/{team-name}/` and a shared task list with dependency tracking. [CONFIRMED from docs, COMMUNITY REPORTED]

---

## Antigravity's .agents/ directory and how it coexists with Claude Code

Antigravity IDE (Google's agent-first VS Code fork, launched November 2025) has its own workspace configuration system centered on the `.agents/` directory. Since Antigravity is a VS Code fork, Claude Code installs directly as an extension inside it, making hybrid workflows practical. [CONFIRMED from docs]

### What goes in .agents/

The `.agents/` directory is Antigravity's native equivalent to Claude Code's `.claude/` directory. Its canonical structure:

```
project-root/
├── GEMINI.md              # Antigravity-specific rules (highest priority)
├── AGENTS.md              # Cross-tool rules (works with Antigravity AND Claude Code)
├── .agents/
│   ├── rules/             # Workspace rules files (code-style.md, testing.md)
│   ├── skills/            # Agent skills as directory packages
│   │   └── my-skill/
│   │       ├── SKILL.md
│   │       ├── scripts/
│   │       └── references/
│   └── workflows/         # Multi-step workflow definitions (slash commands)
```

There's an important naming note: Antigravity transitioned from `.agent/` (singular) to `.agents/` (plural) around v1.18–v1.19, and some documentation still references the old name. Google's own Codelabs tutorials use both forms in different places. If you're setting up a fresh workspace, use `.agents/` (plural). [COMMUNITY REPORTED]

### The AGENTS.md cross-tool bridge

Starting with Antigravity v1.20.3 (March 2026), the IDE reads `AGENTS.md` in addition to `GEMINI.md`. This is significant for hybrid workflows because **AGENTS.md works across Antigravity, Cursor, and Claude Code simultaneously**. Claude Code reads CLAUDE.md natively but can import AGENTS.md via the `@AGENTS.md` syntax. This means you can maintain one shared rules file that both tools respect, plus tool-specific files for each. [COMMUNITY REPORTED]

A practical dual-tool workspace on your E: drive might look like:

```
E:\client-project\
├── CLAUDE.md              # Claude Code-specific instructions
├── AGENTS.md              # Shared rules (imported by CLAUDE.md via @AGENTS.md)
├── GEMINI.md              # Antigravity-specific instructions
├── CLAUDE.local.md        # Your personal Claude Code notes (gitignored)
├── .claude/
│   ├── agents/            # Claude Code sub-agent definitions
│   └── skills/            # Claude Code skills
├── .agents/
│   ├── rules/             # Antigravity rules
│   ├── skills/            # Antigravity skills
│   └── workflows/         # Antigravity workflows
└── src/
```

The key insight is that both systems can coexist without conflict. They use different directories (`.claude/` vs `.agents/`), different primary rule files (CLAUDE.md vs GEMINI.md), and AGENTS.md serves as the shared bridge. Claude Code ignores the `.agents/` directory; Antigravity ignores `.claude/`. [INFERRED from architecture, COMMUNITY REPORTED]

### Manager View and Claude Code interaction

Antigravity's **Manager View** is its signature feature — a "Mission Control" interface that greets you on launch (instead of a file tree). It lets you dispatch **up to 5 agents** working simultaneously on different tasks, monitor their progress asynchronously, and leave Google Docs-style comments on their artifacts. Toggle between Manager View and Editor View with **Ctrl+E** on Windows. [CONFIRMED from docs]

When both Antigravity's native Gemini agents and Claude Code are pointed at the same workspace, they access the same project files but **do not automatically coordinate with each other**. They are separate execution environments with separate billing (Claude Code against your Anthropic subscription, Antigravity's Gemini against Google's). MCP server configuration carries over since `~/.claude/` is shared across VS Code-based environments. [COMMUNITY REPORTED]

The practical hybrid pattern that's emerged: use Antigravity's Gemini agents for planning and architecture (saving Claude tokens), then switch to Claude Code for high-quality implementation. When Gemini rate limits hit, Claude Code keeps you productive. The community has built starter templates like **antigravity-workspace-template** on GitHub that create shared context files across both tools. [COMMUNITY REPORTED]

---

## Real-world agent patterns and how experts decompose work

Anthropic's own engineering team published a critical insight in early 2026: **adopt a context-centric view, not a problem-centric view**. Context-centric means dividing work by what context each agent needs (each agent owns a self-contained module). Problem-centric means dividing by type of work (one agent writes code, another writes tests) — this creates constant coordination overhead and is explicitly called out as counterproductive. [CONFIRMED from docs]

### The maturity ladder most experts follow

The community has converged on a progression that starts simple and adds complexity only when justified:

- **Level 1 — Solo session**: Plan mode (Shift+Tab twice) → iterate until good → switch to normal mode for execution → verify. Single CLAUDE.md. Slash commands for repeated workflows. This handles the vast majority of daily work.
- **Level 2 — Sub-agents within a session**: Offload research and exploration to sub-agents to keep the main context clean. Use lighter models (Haiku) for exploration, Sonnet for focused implementation.
- **Level 3 — Parallel sessions**: Git worktrees for isolation, 3–5 terminal tabs, file ownership conventions. Each session has its own context and branch.
- **Level 4 — Agent Teams**: Shared task lists with dependency tracking, peer-to-peer messaging between agents, team lead coordination. Experimental, Opus 4.6+ required, roughly 7x standard token usage. [CONFIRMED from docs, COMMUNITY REPORTED]

Boris Cherny's daily workflow sits at Level 3: five numbered terminal tabs, each in its own git checkout, with iTerm2 notifications alerting him when any session needs attention. He uses specific sub-agents per phase — `code-simplifier` to clean up after main work, `verify-app` for end-to-end testing, `build-validator` for build checks. His personal CLAUDE.md is about **100 lines / 2,500 tokens**, mostly pointing to the team's shared file. [COMMUNITY REPORTED]

### Anthropic's own extreme example

When Anthropic built a C compiler using Claude Code, they ran **16 agents in parallel Docker containers** with a shared bare git repo, completing over 100,000 lines of Rust across roughly 2,000 sessions at approximately $20,000 in API costs. This is the far end of the scale — instructive for understanding what's possible, not a typical workflow. [CONFIRMED from docs]

### What breaks when agent architecture goes wrong

The failure modes are well-documented across community sources and worth internalizing:

**Context failures** are the most common. Sub-agents start with a blank slate; if the parent doesn't provide a detailed brief, the sub-agent produces generic results. The fix is always the same: pack specific file paths, error context, and expected outputs into the prompt string.

**Naming-based inference override** is a subtle trap. Claude Code may infer a sub-agent's function from its name, silently overriding your custom system prompt. Naming an agent `code-reviewer` triggers generic code review behavior regardless of what you wrote. Some practitioners use non-descriptive names to avoid this. [COMMUNITY REPORTED]

**Over-parallelization** is the most expensive mistake. Launching 10 agents for a feature that touches 4 files wastes tokens on context setup (each agent loads its own copy of CLAUDE.md and project context) without meaningful speed gains. The sweet spot is **3–5 parallel agents** for genuinely independent work. Beyond 5, merge complexity and API rate limits create more overhead than time saved. [COMMUNITY REPORTED]

**Context pollution on return** happens when many sub-agents return detailed results to the parent, consuming significant main context. For tasks needing sustained parallelism, Agent Teams provide fully independent contexts rather than reporting everything back to one parent. [CONFIRMED from docs]

---

## Parallel agents — what it actually looks like and costs

Running agents in parallel is real, not simulated — multiple Claude instances execute concurrently with separate context windows. There are three distinct mechanisms, each operating at a different level.

**Within a single session**, you ask Claude to spawn multiple sub-agents simultaneously. Each runs as a separate Claude instance. You can request this explicitly: "Explore the authentication and database modules in parallel using separate sub-agents." Claude is conservative by default about parallelizing, so being explicit in your prompt helps. Sub-agents only report back to the parent — they cannot communicate with each other. [CONFIRMED from docs]

**Across separate sessions**, you run multiple Claude Code instances in different terminal windows, each in its own git worktree. This is the pattern most power users rely on daily. No special feature required — just open more terminals. [CONFIRMED from docs]

**Agent Teams** (experimental, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) coordinate multiple independent Claude Code instances with a shared task list and peer-to-peer messaging. One session acts as team lead; teammates work independently and can message each other directly. This requires Opus 4.6 and uses roughly **7x standard token usage**. [CONFIRMED from docs]

### Cost implications are significant

Multi-agent workflows use **4–7x more tokens** than single-agent sessions because each agent opens its own context window and loads its own copy of project context. On the Max 5x plan ($100/month with ~88K tokens per 5-hour window), you can sustain moderate sub-agent use. The Max 20x plan ($200/month with ~220K tokens per 5-hour window) is recommended for heavy parallel work. On the Pro plan ($20/month), sub-agents drain quota fast — expect 2–3 Agent Teams tasks per day at most. [CONFIRMED from docs, COMMUNITY REPORTED]

A useful cost-control lever: set `CLAUDE_CODE_SUBAGENT_MODEL` to route sub-agents to cheaper models. Haiku for read-only exploration, Sonnet for focused implementation, Opus only for complex reasoning that requires it. [CONFIRMED from docs]

### When to parallelize and when not to

Parallelize when tasks are independent with no shared state, when work is self-contained and returns a useful summary, when you're dealing with volume (multiple similar tasks), or when competing hypotheses need testing simultaneously. Keep work sequential when tasks have dependencies, when agents would touch the same files, when scope is unclear and needs understanding before proceeding, or when integration requires coordination across components. [CONFIRMED from docs, COMMUNITY REPORTED]

---

## Connecting the pieces for a hybrid workflow

For someone using Claude Code daily alongside Antigravity IDE on a Windows 10 machine with Git Bash, the practical architecture comes down to a few decisions about where context lives and which tool handles what.

Your CLAUDE.md is your primary contract with Claude Code. Keep it lean, specific, and checked into git. Your AGENTS.md bridges the gap to Antigravity — import it from CLAUDE.md with `@AGENTS.md` so both tools share common rules. Your GEMINI.md holds anything Antigravity-specific. The `.claude/` and `.agents/` directories coexist peacefully in the same project root, each invisible to the other tool.

For your GHL, Retell AI, and N8N workflow projects, skills are where domain-specific playbooks live. A skill for each integration pattern keeps your CLAUDE.md clean while making specialized knowledge available on demand. Sub-agents earn their keep when you need to research multiple API docs simultaneously or implement independent components in parallel — but most daily tasks are better handled in a single focused session that starts in Plan mode and finishes with verification.

The consensus across every credible source — from Anthropic's own engineers to the community's most-starred repos — is consistent: **start simple, add complexity only when you hit a wall that simpler approaches can't solve.** The bottleneck is rarely the model. It's the workflow.