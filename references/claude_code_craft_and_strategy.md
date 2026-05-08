# Claude Code — Craft, Strategy, and Failure Defense
## The practitioner's guide to skills, agents, behavior, and context

This is Part 2 of the research series. Part 1 covered architecture — what everything is and where it lives. This document covers the **craft layer**: how to actually write skills and agents that work, how to shape and train Claude's behavior over time, how to manage context and tokens without losing your mind, and how to handle failure modes before they cost you real money and real time.

---

## Part 1 — Writing Skills That Actually Trigger and Perform

### The description field is your semantic trigger — treat it like a job posting

The most common reason a skill fails to fire automatically is a weak description. Claude uses semantic matching on the description to decide when to load a skill. The matching is not keyword-based — it's intent-based. This means the description needs to answer one question from Claude's perspective: **"When should I invoke this?"**

A bad description says what the skill does. A good description says **when the situation calls for it**. Compare:

```yaml
# Bad — describes the skill, not when to invoke it
description: "Tool for creating Retell AI voice agents"

# Good — describes the triggering situation
description: "Use when building, configuring, or modifying a Retell AI voice
agent. Covers LLM creation, agent setup, phone number assignment, knowledge
base attachment, and post-call analysis fields."
```

The description field is capped at **1,536 characters** and is front-loaded in matching weight. The most specific, high-signal phrase belongs in the first sentence. Write it like a job posting: the role title and key requirement first, elaboration second. [CONFIRMED from docs]

### The content of SKILL.md — progressive disclosure, not a brain dump

Anthropic's own authoring guide makes this explicit: **concise is the most important quality a skill can have**. Every token in SKILL.md competes with your conversation history and current task for context budget. The key principle is that Claude is already smart — you only need to include what Claude genuinely cannot infer on its own.

The **progressive disclosure** model means your SKILL.md should contain the core instructions and reference external files for detail:

```
skill-name/
├── SKILL.md           # Core instructions only — what Claude reads first
├── REFERENCE.md       # Deep docs, schemas, examples — loaded only if needed
├── scripts/
│   └── validate.sh   # Executable logic that runs without consuming context
└── templates/
    └── base.md        # Templates Claude fills in
```

The rule for what goes where:
- **SKILL.md**: Role framing, key steps, decision rules, critical constraints
- **Reference files**: Schemas, API docs, detailed examples, edge cases
- **Scripts**: Anything deterministic that doesn't need reasoning — validators, formatters, file generators
- **Templates**: Output structures Claude should fill rather than generate from scratch

[CONFIRMED from official Anthropic skill authoring docs]

### The "degrees of freedom" principle

One of the cleaner frameworks from Anthropic's skill authoring guide: match the level of specificity in your instructions to **how fragile or variable the task is**.

For tasks where the exact format matters (like structured API calls or file outputs), be highly prescriptive — use exact templates and explicit constraints. For tasks that are naturally flexible (like analysis or explanation), give Claude room to reason and just specify the framework. Over-specifying flexible tasks bloats the skill with unnecessary instructions that reduce Claude's ability to adapt.

Practical example for your stack:

```markdown
# GHL Contact Creation

ALWAYS include these required fields:
- locationId: use $ARGUMENTS or pull from CLAUDE.local.md
- phone: normalize to E.164 format (+1XXXXXXXXXX)
- tags: apply ["lead", "ai-sourced"] minimum

DO NOT include pricing, booking language, or agent-specific
internal notes in any contact field.

For optional fields, follow client-specific mapping in
./references/field-map.md
```

The required fields are locked down precisely (fragile). The optional field handling defers to a reference file (flexible). [CONFIRMED from docs]

### The two-Claude method for skill development

Anthropic's official best practices describe a specific iterative method that power users have adopted widely. It uses two separate Claude instances:

**Claude A** (your development session) — helps you design and refine the SKILL.md. You bring domain expertise; Claude A brings understanding of how agents read instructions.

**Claude B** (a fresh session with the skill loaded) — executes actual tasks using the skill. You observe where it succeeds, where it hedges, where it misses.

The feedback loop:
1. Use Claude A to draft the initial SKILL.md based on a task you've done manually
2. Load the skill in Claude B's context and give it **real work**, not test prompts
3. Watch what Claude B does — specifically: what files does it read in what order? What does it ignore? Where does it go off-script?
4. Bring those observations back to Claude A: "Claude B forgot to filter test accounts even though the skill mentions it. The rule isn't prominent enough."
5. Revise based on observed behavior, not assumptions

The key observation signals: if Claude B repeatedly reads the same reference file, move that content into SKILL.md. If it never reads a bundled file, either the pointer isn't explicit enough or the file isn't needed. If it takes an unexpected execution path, your structure isn't as intuitive as you thought. [CONFIRMED from Anthropic skill authoring docs]

### Versioning skills properly

Skills that touch live systems — API calls, file outputs going to clients, GHL automation logic — should be versioned. The community convention:

```
.claude/skills/
├── retell-voice-agent-v1/     # Deprecated but don't delete — audit trail
├── retell-voice-agent-v2/     # Current
└── retell-voice-agent-v3/     # In development / testing
```

Your active skills point (via CLAUDE.md or explicit invocation) to the current version. Old versions stay because if a client's build used v1 behavior and you need to reproduce it, you need v1 intact. This is especially important for skills that encode your actual client delivery process — they're your reproducible build system. [INFERRED from community practice, CONFIRMED as pattern from Boris Cherny team recommendations]

---

## Part 2 — Writing Agent Definitions That Behave Predictably

### The system prompt is the only lever — use it deliberately

When you write a custom sub-agent's markdown body (the content after the frontmatter), that's its entire system prompt. Claude Code doesn't transfer the parent's instructions, conversation, or CLAUDE.md content to sub-agents automatically unless you configure it. This means every agent definition must be **self-contained**.

The anatomy of a well-written agent system prompt:

```markdown
---
name: ghl-contact-creator
description: Creates and updates GHL contacts from structured lead data.
Use when processing inbound lead data that needs to be written to GHL CRM.
tools: Bash, Read
model: sonnet
memory: project
---

You are a GHL API specialist responsible for creating and updating contacts
in GoHighLevel for PropertyBots.AI client sub-accounts.

## Your scope
- Create contacts via POST /contacts/
- Update custom fields via PATCH /contacts/{id}
- Apply tags as specified in the task prompt
- Log every API call result to the task's output file

## Hard constraints
- NEVER include pricing, internal notes, or agent script content in contact fields
- Phone numbers must be E.164 format before any API call
- If locationId is not in the task prompt, STOP and report missing

## How to handle errors
- 401: API token expired — report immediately, do not retry
- 429: Rate limit — wait 10s, retry once, then report
- 422: Log the exact field that failed, do not guess and retry

## Output format
After completing, write a summary to the designated output file:
- Contacts created: N
- Contacts updated: N
- Errors: list each with contact name and reason
```

Notice: role framing, explicit scope, hard stops, error handling, output format. The agent knows exactly what it does, what it doesn't do, when to stop, and what to return. [COMMUNITY REPORTED as best practice pattern]

### Naming agents without creating behavior override

Claude Code infers agent behavior from the agent's name. This is a documented gotcha: naming an agent `code-reviewer` activates generic code review behavior even if your system prompt says something different. The model's training creates strong associations between names and behaviors that can override your custom instructions.

Solutions:
1. Use **functional + scoped names** instead of generic role names: `ghl-contact-writer` instead of `backend-engineer`, `retell-agent-provisioner` instead of `api-caller`
2. If you're seeing unexpected behavior, test whether renaming fixes it before debugging the system prompt
3. Include an explicit "Your name is X but your actual role is Y" line if you need a generic name for UX reasons

[COMMUNITY REPORTED from multiple practitioner sources]

### The `memory: project` frontmatter field

Setting `memory: project` in an agent's frontmatter gives it access to the project's persistent memory file at `.claude/memory.md`. This is how agents accumulate learnings across sessions without you having to re-explain context each time.

Practical use: an agent that builds Retell voice agents can write discovered patterns (like which voice IDs perform best for real estate clients, or which post-call analysis field names your clients actually use) into project memory. The next time the agent runs, it reads those learnings automatically.

The caution: project memory accumulates noise over time. It should be reviewed and pruned periodically, similar to CLAUDE.md maintenance. [CONFIRMED from docs]

---

## Part 3 — "Behavior Training": Shaping Claude Over Time

There's no fine-tuning for Claude Code in the traditional ML sense. What experts call "behavior training" is actually a set of practices for **progressively encoding your corrections, preferences, and standards into persistent context** so you stop repeating yourself.

### The lessons.md pattern

The most widely adopted behavioral anchoring pattern: maintain a `tasks/lessons.md` file (gitignored or committed, your choice) that captures every meaningful correction you've made to Claude.

```markdown
# lessons.md — Accumulated corrections and preferences

## GHL API
- Custom fields require the field ID, not the field name. Always fetch IDs
  via GET /custom-fields/v2 before any update operation.
- The Version: 2021-07-28 header is required on every request. Omitting it
  causes silent 200 responses with no actual changes.

## Retell AI
- Prompts live on the LLM config, not the agent. Update via
  PATCH /update-retell-llm/{llm_id} — not the agent endpoint.
- begin_message is required; if missing the agent starts silent.

## Output standards
- All KB content = facts only. No "you should", "always say", or any
  behavioral directive. This causes execution failures in CloseBot.
```

Reference this file in your CLAUDE.md so it loads every session. As patterns solidify, graduate the most important lessons from lessons.md into CLAUDE.md proper. [COMMUNITY REPORTED — Boris Cherny team pattern]

### Using CLAUDE.md as progressive behavioral scaffolding

Your CLAUDE.md isn't a static document — it's a living behavioral spec that you refine as Claude makes mistakes. The upgrade path:

1. Claude makes a mistake you've seen before
2. You correct it in conversation
3. If the same mistake is possible again, add the correction to lessons.md
4. If it's fundamental to your work standard, add it directly to CLAUDE.md
5. If it's complex enough to warrant a full procedure, make it a skill

This is the difference between users who fight the same battles every session and users who only fight each battle once. The goal is a CLAUDE.md that reads like "here's what Claude doesn't know about this specific workspace that can't be inferred from the code." [CONFIRMED — Anthropic official guidance + community pattern]

### Enforcing behavior with hooks vs. relying on instructions

For behaviors that are critical and non-negotiable, CLAUDE.md instructions are **advisory** — the community has documented an ~80% compliance rate under normal load. For hard constraints, use settings.json and hooks instead:

- **settings.json** enforces things like which model to use, attribution behavior, and permission policies — these are deterministic, not advisory
- **Hooks** run shell scripts after every Claude turn — use them for validation, formatting enforcement, logging, or blocking specific patterns

Example: instead of "NEVER add Co-Authored-By to commits" in CLAUDE.md (advisory), set `attribution.commit: ""` in settings.json (deterministic). The setting guarantees the behavior; the instruction only requests it. [COMMUNITY REPORTED — from the claude-code-best-practice repo, Boris Cherny team]

### The "interview me first" pattern for complex tasks

For large or ambiguous tasks, the community's most-cited technique: explicitly tell Claude to interview you before starting. "Before you build this, ask me questions about things I might not have considered."

This works because Claude's training gives it strong priors about implementation details, edge cases, and tradeoffs that you might not have thought about. The interview forces those considerations into the conversation before context is consumed by incorrect execution. It's also how you surface Claude's assumptions — if Claude asks a question that reveals it misunderstood your intent, you catch that before it writes 500 lines in the wrong direction. [COMMUNITY REPORTED]

---

## Part 4 — Context and Token Management

### The context window is your most important resource

Context is working memory, and it fills up in ways that aren't obvious. A single debugging session can consume tens of thousands of tokens. Once context gets full, Claude starts "forgetting" earlier instructions, making inconsistent decisions, and producing results that conflict with earlier work in the same session.

Claude Code operates on a **~200K token context window** for standard use (1M token window is available but comes with documented tradeoffs). The budget is shared across: system prompt (~50 instructions), tools loaded, memory files, active skills, and conversation history. [CONFIRMED from docs]

**The context degradation pattern that kills sessions**: context rot. Research shows that as context fills, performance degrades measurably — Opus 4.6 shows a 17-point accuracy drop (93% → 76%) at 1M context vs. 200K. The 1M window is real, but using it means accepting lower recall accuracy and hitting **premium pricing** on all tokens once you exceed 200K (not just the tokens above the threshold). [CONFIRMED from community research + Anthropic data]

### The four failure modes of context depletion

Understanding what breaks — and when — is more useful than trying to prevent depletion entirely:

1. **Inconsistent code** — Claude generates something that conflicts with earlier work in the same session. Files diverge from patterns established in turn 3 when you're on turn 40.
2. **Repeated questions** — Claude asks about project structure you already explained. The early conversation has been compressed or dropped.
3. **Lost decisions** — Architectural choices made mid-session get forgotten in later turns. Claude reverts to its defaults.
4. **Breaking changes** — Claude ignores patterns it established minutes earlier, creating regressions it can't trace.

[CONFIRMED from multiple community sources]

### Watching your context

Three layers of visibility:
- **Status bar**: token percentage, color-coded, bottom of terminal. Check it before starting each new task.
- **/context command**: exact breakdown — system prompt, tools, memory files, skills, conversation history. If memory files are eating 15% before you start, that's a problem you can fix.
- **/btw overlay**: for quick one-off questions that don't belong in conversation history. The answer appears in an overlay and never enters context. [CONFIRMED from docs]

### The compact command — your primary context control

`/compact` is how you compress conversation history without losing session continuity. When it triggers automatically, Claude summarizes what matters most — code patterns, file states, key decisions — and continues. When you run it manually:

```
/compact Focus on the API changes and ignore the debug output
/compact Keep the full list of modified files and test commands
```

You can customize automatic compaction behavior in CLAUDE.md:
```markdown
When compacting, always preserve:
- Full list of modified files
- Any test commands discovered
- API endpoints created or modified
- Client-specific field mappings used
```

This ensures the information that actually matters for your automation work survives summarization, not just whatever Claude thinks is important. [CONFIRMED from docs]

### /rewind for surgical recovery

If a specific turn went wrong, use `/rewind` (double-tap Escape) instead of starting over. The rewind menu shows every checkpoint and lets you: restore conversation only, restore code only, or restore both. You can also `Summarize from here` on a specific message, which condenses everything after that point while keeping earlier context intact. [CONFIRMED from docs]

### Token strategies that matter most

Ranked by impact, based on community documentation:

**1. Use `@file` references instead of letting Claude explore** — the biggest single-habit improvement. One targeted `@src/api/auth.js` costs a fraction of "find my auth code." Exploration causes Claude to read directories, traverse trees, and load adjacent files it doesn't need. Estimated 30–40% reduction in token usage from this habit alone. [COMMUNITY REPORTED]

**2. Disable MCP servers you're not actively using** — each enabled MCP server adds its full tool definition set to your system prompt. One MCP server was measured at ~14K tokens (7% of a 200K window). Toggle servers on/off by phase: enable during planning, disable during implementation. [CONFIRMED from community measurement]

**3. Use sub-agents for research** — offloading codebase exploration to sub-agents keeps the main context clean. The sub-agent reads 30 files; your parent context receives a 200-token summary. [CONFIRMED from docs]

**4. Match the model to the task** — Haiku for exploration and read-only research, Sonnet for standard implementation, Opus only for complex architecture or debugging that genuinely needs it. Route sub-agents to cheaper models via `CLAUDE_CODE_SUBAGENT_MODEL`. [CONFIRMED from docs]

**5. Write specific prompts with numbered steps** — vague prompts cause Claude to explore for clarification, burning tokens on wrong paths. "Numbered steps, specific files, clear outcomes" reduces iterations. [COMMUNITY REPORTED]

---

## Part 5 — Handling Failure, Hallucinations, and Quality Degradation

### The hallucination pattern that broke Claude Code in early 2026

In February–March 2026, the community reverse-engineered a specific failure mode that emerged from a combination of Claude Code updates. The pattern became known as "rush to completion" behavior:

- Fabricating API versions, commit SHAs, GUIDs, and package names instead of looking them up
- Declaring problems solved when they weren't
- Answering from training data instead of checking docs
- Skipping verification steps

The root cause: a combination of adaptive thinking mode changes and a new `redact-thinking-2026-02-12` header that hid raw chain-of-thought from the interface. Turns where Claude fabricated had zero chain-of-thought emitted — the verification that should have happened (the "wait, I need to check this" moment) was suppressed. The thinking was still occurring inside the model; it was just hidden.

The community fixes that work:
1. Explicitly ask for reasoning: "Show your work" or "Explain each step before implementing"
2. Use plan mode (`Shift+Tab`) for any multi-step task — forces explicit planning before execution
3. For API-specific work, require Claude to fetch the current docs before making calls
4. Use `effort: max` in the API for tasks where hallucination is costly

[COMMUNITY REPORTED — DEV Community investigation, HN thread]

### Reducing hallucinations by design

From Anthropic's official hallucination reduction guide:

**Quote-grounding for large docs**: For tasks involving documents over 20K tokens, ask Claude to extract word-for-word quotes first before analysis. This anchors responses in actual source text.

**Citation requirement**: Make Claude's response auditable by requiring it to cite quotes for each claim. "If you can't find a supporting quote, retract the claim."

**Chain-of-thought verification**: Ask Claude to explain reasoning step-by-step before giving a final answer. This surfaces faulty logic before it becomes an output.

**Best-of-N**: For high-stakes outputs, run the same prompt multiple times and compare. Inconsistencies across runs signal hallucination-prone claims.

For your automation work specifically — API calls, GHL field operations, Retell config — the practical approach is to require Claude to read the actual API response before making any further calls, never assume a previous call succeeded, and log every API result explicitly. [CONFIRMED from Anthropic official docs]

### The "convergence cliff" — what breaks agentic codebases

The community has documented a specific failure mode they call the **convergence cliff**: once an AI-generated codebase (or automation workflow) reaches a certain size and complexity, fixing one bug causes another. No agent — Claude Code, Codex, Gemini — can reliably salvage it.

The practical lesson: invest in architectural guardrails (type systems, linting, design docs, testing) **before** complexity crosses that threshold, not after. For your N8N and GHL automation work: document the schema and data contracts between workflow nodes, enforce validation at integration points, and test each component independently before connecting them. Once an automation pipeline is tangled, agent-assisted debugging amplifies the tangles rather than resolving them. [COMMUNITY REPORTED]

### Recovery patterns when things go wrong mid-session

**Context degradation**: use `/compact` with specific preservation instructions, then verify Claude understands current state with a quick "summarize what we've built so far" before continuing.

**Wrong direction**: don't just correct and continue — use `/rewind` to restore to the checkpoint before the wrong turn. Correction-on-top-of-wrong-code compounds the problem. "Knowing everything you know now, scrap this and implement the elegant solution." [COMMUNITY REPORTED — direct Boris Cherny team quote]

**Hallucinated API call**: immediately verify against the actual API response or documentation. Never let Claude proceed from an unverified API result. One fabricated field ID in a GHL contact creation call can silently corrupt data with no error returned.

**Stuck in a loop**: the community pattern is "challenge Claude" — "grill me on these changes and don't make a PR until I pass your test" or "prove to me this works and diff from main." Making Claude defend its own output surfaces problems it would otherwise gloss over. [COMMUNITY REPORTED]

### Dispatch and auto-retry for unattended workflows

For overnight or unattended work, Claude Code's Dispatch system (Q1 2026) provides:
- **Automatic retry with configurable backoff** — failed tasks retry instead of stalling the queue
- **Priority queuing** — time-sensitive tasks jump the queue
- **Restartable pipelines** — if the whole job fails, restart from the last checkpoint, not the beginning

For your automation use case (e.g., batch provisioning GHL sub-accounts, creating multiple Retell agents from a client list): structure work as a Dispatch job rather than a single sequential session. Each item in the queue gets its own task with its own retry logic. You wake up to results, not a stalled terminal. [CONFIRMED from docs]

---

## Part 6 — Strategic Patterns Experts Use Daily

### The Explore → Plan → Act loop is the foundation

Every serious practitioner starts here. It maps to Plan Mode in Claude Code:

- **Explore** (read-only mode): Claude reads the relevant files, maps dependencies, understands what exists. No changes. You can steer what it reads with `@file` references to prevent unnecessary exploration.
- **Plan** (planning mode): Claude proposes a strategy. You review and adjust before any code is written. This is where you catch bad assumptions before they cost tokens to unwind.
- **Act** (full execution): Implementation, testing, iteration. Claude has all tools unlocked.

The explicit mode separation prevents Claude from jumping to implementation based on a half-formed understanding. Most sessions where "Claude went in the wrong direction" are sessions where the Explore and Plan phases were skipped. This single pattern prevents the majority of expensive corrections. [CONFIRMED from docs + community]

### Prompt caching — the underused token multiplier

For sessions with heavy use of CLAUDE.md, reference docs, or the same skill content, prompt caching can reduce effective token costs by **up to 90%** on input tokens that stay stable across turns. The API handles this automatically when you use the `cache_control` parameter on system prompt blocks. For Claude Code users, the skills system already leverages this — skill content loaded early in a session is cached for subsequent turns. [CONFIRMED from Anthropic pricing docs]

### The Command → Agent → Skill pattern

From the claude-code-best-practice community repo (trending on GitHub), the canonical orchestration architecture:

- **Slash command** triggers the workflow
- The command's markdown spawns a named **sub-agent** with appropriate scope
- The sub-agent invokes its **skill** for domain-specific execution

This separation means each layer is independently maintainable. The command defines the triggering condition. The agent defines the role and tooling. The skill defines the procedure. You can update any one without touching the others. For your client onboarding workflow, this would look like: `/provision-client` → `client-provisioner` agent → `retell-voice-agent-builder` + `ghl-setup` skills. [COMMUNITY REPORTED — from shanraisshan/claude-code-best-practice repo]

### Feature-specific sub-agents with skills over general agents

One of the most cited tips from the Boris Cherny team: **have feature-specific sub-agents with skills (progressive disclosure) instead of general QA, backend engineer, or API-caller agents**.

A general "backend engineer" agent is a trap. It has no specific context about your stack's quirks, your clients' data structures, or your output standards. A `ghl-contact-writer` agent with a `ghl-api-conventions` skill knows exactly what it's doing and why.

The narrower the agent's scope, the better its output and the more token-efficient its operation. [CONFIRMED — Boris Cherny team direct quote]

### Context engineering is the real leverage point in 2026

The consensus from every serious Claude Code practitioner converges on the same insight: **the model is rarely the bottleneck. Context almost always is.**

Prompt engineering — crafting clever individual prompts — has been overtaken by **context engineering**: the practice of structuring everything Claude receives before and during a task. System prompts, files, memory, examples, role framing, constraints. The same model produces dramatically different output quality depending on what context it has.

Your CLAUDE.md, your skills, your lessons.md, your agent definitions — these are your context engineering system. Each piece is a bet that the upfront investment in structure compounds into better, more consistent output across every session. The gap between users who treat Claude Code as infrastructure and users who treat it as a chat window widens with every session. [COMMUNITY REPORTED — consistent across all practitioner sources]

---

## Quick Reference — Decision Heuristics

**"Should this be a skill or in CLAUDE.md?"**
If you've pasted the same instructions more than twice, it's a skill candidate. If it applies universally to every session, it's CLAUDE.md. If it's conditional on task type, it's a skill.

**"Is my description triggering reliably?"**
Write it from Claude's POV: "Use when [situation]." Front-load the most specific phrase. Test by starting a new session and describing the situation in natural language — does the skill auto-load?

**"My agent isn't following its system prompt."**
First check: is the name overriding the instructions? Rename to something more specific. Second check: is the prompt too long? Trim to essentials and move detail to reference files. Third check: are you requiring things that conflict with Claude's training priors?

**"Context is filling up mid-session."**
Use `/compact Focus on [the specific thing that matters]`. Then check `/context` to see what's consuming space. Disable MCP servers you're not using. Switch to Haiku for read-only tasks going forward in the session.

**"Claude hallucinated an API call."**
Never proceed from an unverified API result. Use `/rewind` to restore to before the bad call. Require Claude to show the actual response before making any downstream call.

**"My automation workflow is breaking in unpredictable ways."**
You may be past the convergence cliff. Stop adding to it and document the current state first. Add validation between components. Test each node independently before reconnecting.
