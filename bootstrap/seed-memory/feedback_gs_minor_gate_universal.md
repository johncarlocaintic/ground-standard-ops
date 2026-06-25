---
name: GS Bots — Minor Gate is Universal
description: Every Ground Standard gym CloseBot includes the under-18 self-book minor gate by default; don't ask per-gym.
type: feedback
originSessionId: 8689aac3-da28-4480-ac6a-456ce20eefe6
---
For every Ground Standard gym CloseBot build, include the minor gate (under-18 self-book block → `minor - needs guardian` tag → no booking) by default. Do not ask whether to include it during `/closebot-plan` intake.

**Why:** Idriss confirmed 2026-05-14 that minor gate is a universal GS policy across all gym sub-accounts, not a per-gym choice. Asking each time wastes a turn.

**How to apply:** When running `/closebot-plan` for any GS gym (Bobby's clients), set `flow.hasMinorGate: true` automatically and skip that intake question. Only revisit if the user explicitly says to disable it for a specific gym.
