---
name: Reference bots by UI name, never by bot ID
description: When referring to any CloseBot bot in chat, always use the exact bot name as it appears in the CloseBot UI — never show the bot_XXXX ID unless the user explicitly asks for it.
type: feedback
originSessionId: 6669c2ad-676a-40db-8ce1-89adcf26d79d
---
When mentioning any CloseBot bot in user-facing output, always use the exact bot name as displayed in the CloseBot UI. Never show the `bot_XXXX` ID.

**Why:** Idriss navigates CloseBot through the UI, not the API. Bot IDs are noise to him — they don't help him find or verify anything. Listing IDs in chat (especially in tables of multiple bots) makes responses harder to read and slower to act on.

**How to apply:**
- In chat output, tables, lists: use the bot's UI name verbatim (e.g. `Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)`).
- Internal scripts and logs may still use bot IDs (the API needs them) — this rule applies only to what Idriss reads in chat.
- Only show a bot ID if Idriss explicitly asks ("what's the ID", "give me the bot ID", "I need the ID for X").
- When pulling a bot inventory, query by ID under the hood but render the UI name in any summary back to him.
