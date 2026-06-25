---
name: Always Link Output Files
description: After producing any file output (rendered PNG, generated doc, exported asset, etc.), always include a clickable file link so the user can open it immediately
type: feedback
originSessionId: ee8126d9-0e34-420f-80de-05573194ef09
---
After creating or updating any output file (PNGs, PDFs, generated docs, exports, etc.), always include a clickable markdown link to it in the response.

**Why:** Idriss wants to verify the output immediately, not hunt through Explorer. Giving the path embedded in a link removes the friction.

**How to apply:** Every time a file is generated/saved, end the message with a plain link `[name](path)` (NOT markdown image syntax). Confirmed 2026-05-09: Claude Code chat panel does not render `![](path)` inline — falls back to nothing. Plain link syntax opens the file in editor where Idriss's Image Preview extension takes over.

Applies to: render outputs, generated docs, exports, anything saved to disk that the user might want to view.
