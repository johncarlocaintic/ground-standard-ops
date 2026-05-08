---
name: Always Cross-Reference CloseBot Logs / Node Events
description: When debugging bot behavior, always pull SSE events / node-execution data and trace which node fired vs what the bot said — never rely on transcript text alone
type: feedback
originSessionId: 8f14ee5c-f2f9-4f58-9a07-3e5135c7f39b
---
When investigating why a CloseBot bot behaved a certain way (false closure, wrong routing, missing tool calls, hallucinations, weird tags), always cross-reference the bot's text output with the actual node execution / SSE events. The transcript only shows what the bot said — the events show which node fired, in what order, and which tool calls actually executed.

**Why:** During Vacaville eval debugging (2026-04-29), the bot said "you're all set for Monday" but GHL had 0 appointments and contact was tagged `unaccompanied_minor`. Looking only at the transcript, we couldn't tell if the booking node fired, mis-fired, or was bypassed entirely. Without the events stream we can't distinguish: (a) booking node ran but failed silently, (b) routing sent the contact to a different terminal node, (c) the bot's text was pure hallucination with no node activity.

**How to apply:** For every eval run or production debugging session involving unexpected bot behavior:
1. Capture and save the SSE events stream (orchestrator now persists this as `events.json` per run, alongside transcript.md / score.json / ghl_facts.json — added 2026-04-29).
2. When a run produces unexpected results, read `events.json` alongside `transcript.md` to identify which node was active at each turn.
3. If GHL ground truth doesn't match the bot's stated outcome, the events stream is the authoritative source for understanding what the KDL actually did.
4. Don't theorize about routing without first checking the event log.

**Vendor's own diagnostic path (UI-side, for production debugging):**
- CloseBot docs §14.1 "Why Did My Agent Say That?": hover the info icon next to any agent reply in the conversation view. Two links appear: **See Prompt Log** (reconstructs the message with each step labeled by tool name) and **Examine Action** (jumps to the builder node that produced the message). Quick indicators on each message: booking attempted, objective resolved, True/False or Switch resolved, custom scenario fired.
- CloseBot docs §14.2 row 1: "Agent confirms booking, no calendar entry created → Booking language mentioned outside a Booking node." Vendor's diagnostic: hover the message — no calendar icon = the agent wasn't actually on a booking objective. Fix: never mention booking language in any node other than a Booking node.
