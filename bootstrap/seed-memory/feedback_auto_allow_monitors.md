---
name: Auto-Allow Monitors Without Asking
description: When a Monitor times out or a new one is needed, re-arm/spawn it silently — don't ask for permission
type: feedback
originSessionId: 44892c1f-edef-4b2d-b157-910ea7c52c1a
---
When a Monitor tool call needs to be re-armed (timeout) or a new Monitor is needed to track a background process, do it automatically without asking "should I re-arm?" or "want me to start a monitor?" Just spawn it and keep relaying events. The same applies to the 3-min interval snapshot monitor pattern used during long test runs — auto-launch when needed.

**Why:** Monitors are low-cost, read-only, and JC wants uninterrupted relay of events from long-running tasks. Asking for permission slows the feedback loop. Established 2026-04-22 during Vacaville v3.7 testing.

**How to apply:**
- Timeout event arrives → spawn a fresh Monitor on the same file immediately; no question first
- Long background task started → arm a progress Monitor in the same turn
- Don't confirm "Monitor re-armed" unless the user asked for status — just let the next event notification carry the proof it's working
