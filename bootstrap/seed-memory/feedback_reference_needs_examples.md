---
name: Reference docs need templates, not more rules
description: When JC calls CloseBot prompts "sloppy," the fix is worked before/after examples, not more rules — rules without templates keep sprawling
type: feedback
originSessionId: 6fcf6a44-f710-4e3a-b191-15d57ddd3838
---
When JC says persona/KB/config authoring is "sloppy" or "inconsistent across iterations," do **not** respond by adding more rules to `references/closebot_architecture.md`. The rules already exist (§9 Persona, §10 tier map at line 404). What's missing is:

1. **A worked before/after example** — a real ~900-word sloppy `conversationReason` rewritten as a short tier-separated version, side by side
2. **A per-slot template** with word-count targets (e.g. `conversationReason`: 3–5 sentences; `businessInformation`: 1 paragraph; KB sections: standard order)
3. **A per-slot decision test** — "if the content answers 'what info does the bot need,' it's KB; if it answers 'how should the bot sound,' it's persona; if it answers 'when X happens, do Y,' it's a Scenario"
4. **The `businessInformation` slot is currently undocumented** in our tier map — worth testing what it actually does and adding it

**Why:** April 23, 2026 session — JC flagged sloppy prompting. I initially proposed adding a new section; then discovered the tier map was already added earlier this session but wasn't enough to stop the slop. Rules tell you *what* to separate; templates show you *what it looks like when done right*. Without examples, each new build drifts back to the landfill pattern.

**How to apply:** When improving reference docs for any authoring task (persona, KB, Retell system prompts, etc.), always ship rule + template + worked example together. If the reference is "just rules," it won't stick.
