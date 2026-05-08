---
name: Always Timestamp Logs and Checkpoints
description: every log entry, checkpoint, and documentation update must include an ISO date (YYYY-MM-DD) stamp; preferably full ISO timestamp for high-resolution events
type: feedback
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
Every time I log, checkpoint, or document anything, include a timestamp. Use ISO date (YYYY-MM-DD) at minimum. For high-resolution events (deploy logs, diagnostic captures, exception traces, multi-event-per-day notes), include full ISO timestamp (YYYY-MM-DDTHH:MM:SSZ).

**Why:** Idriss reads logs and memories across multiple sessions and days. Without timestamps, "we found X" or "v4.2 broke" loses temporal context fast. Especially during active debugging where state shifts hour-to-hour, a missing timestamp turns an authoritative finding into a vague claim.

**How to apply:**
- Memory entries: include date in body when logging session-specific findings
- todo.md updates: every section change includes the date
- Architecture/decision docs: every decision row includes a date
- Append-only logs (lessons.md, project status docs): every new entry leads with the date
- Diagnostic findings: include the actionId timestamp from the source data
- Don't backfill dates I'm guessing at; if unknown, mark as "(date unknown)" rather than fabricate

This extends and reinforces CLAUDE.md ground rule #7 (date-stamp dated facts).
