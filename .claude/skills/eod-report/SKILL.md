---
name: eod-report
description: "This skill should be used when the user asks to write an EOD, end-of-day report, daily update, or daily wrap-up. Generates a Slack-ready EOD update in the AI Agency Institute house format based on what the user accomplished that day."
category: documentation
tags: "[eod, reporting, slack, daily-update, ai-agency-institute]"
---

# EOD Report Generator

## Purpose

Generate a Slack-ready End-of-Day (EOD) update in the AI Agency Institute house format. Bulleted list (each line prefixed with `•`) of what happened today — no headers, no platform tags, no padding.

## When to Use This Skill

Trigger when the user says:
- "EOD report"
- "Write my EOD"
- "Daily update"
- "Log out report"
- "EOD wrap-up"

## Information to Collect

Before generating, gather:
1. **Today's date** (ISO format, `YYYY-MM-DD`)
2. **What happened today** — completed work, fires fought, fixes shipped, blockers hit, current state of live systems

If the user gives a bullet-point dump, extract and structure it — don't ask for more than what's needed.

## Output Format

Match this format exactly (Slack message — header line, blank line, then bullet lines prefixed with `•`):

```
EOD — YYYY-MM-DD

• [One-line bullet — what happened, what was fixed, what's the state]
• [One-line bullet]
• [One-line bullet]
...
```

Reference example:

```
EOD — 2026-05-07

• Vacaville bot down all day — CloseBot backend exception on every API-imported Agent Node bot
• Tried 3 rebuild paths, all failed; UI-copied bots work, API-imported don't
• Caught + fixed an emergency: a bot got pushed to Vacaville prod source without tag filters, detached immediately
• Patched tag logic: `booked`, `alert`, `aggressive`, `underage` (replacing old verbose tag names)
• Added Bobby's new tag flow: `action opt-in` + `adult`/`youth` after data capture
• Updated source filter to exclude `alert` and `aggressive` (don't re-engage escalated leads)
• Sent multiple support tickets with full audit evidence; CloseBot pushed a partial fix (no more crash, but `@@[Update Contact]` still doesn't write to GHL)
• LIVE: `bot_GBIF5HQVM8FPQ0XJ` with full tag logic; STANDBY: `bot_ZXYBAYGE06NC6DDW`
• Blocked on CloseBot's next fix before full end-to-end validation
```

## Style Rules

- **Header:** `EOD — YYYY-MM-DD`. Em dash, ISO date. Nothing else on this line.
- **Every line is a bullet** — prefix each line with `•`. One line per event/fix/state.
- **One thought per line.** If two facts are linked (e.g., problem + outcome), join with `;` or em dash. Otherwise split.
- **Inline code formatting** for: tag names, bot IDs, source IDs, field names, function references, error strings. Use single backticks.
- **Tone:** factual, technical, no padding. Not "excited to share", not "looking forward to". Just what happened.
- **Numbers matter** when relevant — node counts, attempt counts, ticket counts.
- **Live state at the end** — if there are running systems with IDs (LIVE/STANDBY/DEPLOYED), name them on a dedicated line.
- **Blocker on the last line** if blocked. One line, what you're waiting on.
- **No "Remaining:" / "In Progress:" / "Completed:" labels.** State no longer split by status — it's chronological / topical, with the live-state and blocker lines anchoring the end.
- **No platform tags in parentheses after items.** The platform is implicit from the content.
