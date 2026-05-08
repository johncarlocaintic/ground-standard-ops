---
title: KB Validator — Rule Reference
version: 1.0.1
date: 2026-04-23
---

# KB Validator Rule Reference

This document is the authoritative list of rules enforced by `shared/scripts/closebot/kb_validator.js`.

Each rule has an ID, category, description, and the regex or logic used to detect it.
When you add or change a rule in the script, update this doc and bump the version.

---

## How Versions Work

The script header and this doc both carry a `version` field.
To roll back: `git log --oneline shared/scripts/closebot/kb_validator.js` to find the commit,
then `git checkout <hash> -- shared/scripts/closebot/kb_validator.js references/kb_validator_rules.md`.

---

## Rule Groups

### Group A — Instructional Language
Rules that catch phrasing that turns a KB into a behavior script.
LLM-backed bots treat instructional KB content as commands, causing execution failures.

| ID   | Pattern | What it catches |
|------|---------|-----------------|
| A001 | `/\byou (must|should|need to|have to|are required to)\b/i` | Direct commands to the bot |
| A002 | `/\balways (say|respond|reply|tell|ask)\b/i` | Hardcoded response instructions |
| A003 | `/\bnever (say|mention|discuss|tell)\b/i` | Negative behavior commands |
| A004 | `/\brespond (with|by saying)\b/i` | Scripted response phrases |
| A005 | `/\btell (the|them|leads?|contacts?|customers?)\b/i` | Tell-the-bot directives |
| A006 | `/\bdo not (say|mention|discuss|reveal)\b/i` | Prohibition instructions |

---

### Group B — Pricing
No dollar figures or pricing language in any bot-facing KB.
Redirect pricing questions to a human or booking.

| ID   | Pattern | What it catches |
|------|---------|-----------------|
| B001 | `/\$\d/` | Dollar sign followed by a number |
| B002 | `/\b\d+\s*(dollars?|\/mo|per month|per class|\/class|\/session)\b/i` | Written-out prices |
| ~~B003~~ | *(removed v1.0.1)* | "free trial / no cost / complimentary" — false positive when "free trial class" is a product name. Re-add if a KB contains no-cost offers that should redirect to a human. |

---

### Group C — Booking Language Before Booking Node
The bot must not pre-commit to booking — that lives in the GHL Booking node.
Scoped to bot-voice phrasing only; lines starting with `Q:` or `A:` are excluded to avoid flagging FAQ content.

| ID   | Pattern | What it catches |
|------|---------|-----------------|
| C001 | First-person "I will/I'll book/schedule" (skips Q: lines) | Bot making booking promises |
| C002 | `/\byou('re\| are) (booked\|scheduled\|confirmed\|all set)\b/i` | Booking confirmation language |
| C003 | Bot-voice "book/schedule/reserve your/you [class/session...]" (skips Q:/A: lines) | Direct booking phrase outside Q&A |

---

### Group D — Placeholder / Draft Artifacts
Catches text that was never meant to ship — leftover template tokens, bracket placeholders, etc.

| ID   | Pattern | What it catches |
|------|---------|-----------------|
| D001 | `/\[.*?\]/` | Anything in square brackets |
| D002 | `/\{.*?\}/` | Anything in curly braces |
| D003 | `/\bTBD\b|\bTBC\b|\bPLACEHOLDER\b|\bINSERT\b|\bXXX\b/i` | Common draft tokens |
| D004 | `/lorem ipsum/i` | Lorem ipsum filler |

---

### Group E — Cross-Client Bleed
Catches names or identifiers that belong to another client bleeding into this KB.
This list is extended per-deployment via the `--client` flag (see Usage below).

| ID   | Pattern | What it catches |
|------|---------|-----------------|
| E001 | *(dynamically injected per run — see `--bleed` flag)* | Client-specific terms from other accounts |

---

## Severity Levels

| Level | Meaning | Script behavior |
|-------|---------|-----------------|
| `FAIL` | Hard violation — KB must not ship | Exits with code 1 |
| `WARN` | Soft flag — review before shipping | Prints warning, exits with code 0 |

---

## Usage

```bash
# Validate a KB file
node --env-file=.env shared/scripts/closebot/kb_validator.js --file clients/ground-standard/closebot/my_kb.txt

# With cross-client bleed terms
node --env-file=.env shared/scripts/closebot/kb_validator.js --file my_kb.txt --bleed "Ground Standard,PropertyBots"

# Pipe text directly
cat my_kb.txt | node --env-file=.env shared/scripts/closebot/kb_validator.js --stdin
```

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.1 | 2026-04-23 | Removed B003 (false positives on "free trial class" product names); tightened C001/C003 to skip Q:/A: FAQ lines |
| 1.0.0 | 2026-04-23 | Initial release — Groups A–E |
