---
name: Iteration Archival Rule (Detach + Legacy Rename + Clear Tag Filter)
description: Every CloseBot iteration must archive the previous version with all three steps — detach source, rename to "[LEGACY] ...", AND clear its tag filter. New version uses the SAME real trigger tag (no fake test tags).
type: feedback
originSessionId: 3153daa2-a2c4-46ae-af09-02a39502e02f
---

Every iteration uses the SAME real trigger tag (e.g. `test - live chat` or the production tag). Do not invent fake per-iteration test tags like `test - v4 agent node` — those create routing ambiguity.

When iterating, archive the previous version with ALL THREE steps:
1. **Detach** the source from the previous bot (`DELETE /bot/{prior}/source/{src}`)
2. **Rename** the previous bot to `[LEGACY] <original name>` (`PUT /bot/{prior}` with new name)
3. **Clear the tag filter** on the previous bot's source attachment so it cannot be re-triggered even if the source is somehow reattached

Only the most recent iteration should have the source attached, a non-LEGACY name, and a populated tag filter.

**Why:** Multiple bots on the same source create routing ambiguity. Fake test tags create the same problem in disguise — the testing environment diverges from production behavior. The LEGACY rename keeps the bot list scannable. Clearing the tag filter is belt-and-suspenders so an archived bot stays inert even if someone re-attaches it later.

**How to apply:**
- Every deploy script for a new bot iteration must include all three archival steps before attaching the new bot.
- Use a `PRIOR_BOT` constant in each deploy script.
- The new bot's source attachment uses the same trigger tag as the previous one — never invent a new test tag.
- Applies to ALL GS CloseBot iterations across the gym portfolio (Vacaville and the rest).
- Exception: in-place updates via `PUT /bot/{id}` with `importKdl` (same bot ID) — no archival needed since it's the same bot.
