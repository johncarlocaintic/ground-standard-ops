---
name: CloseBot Agent Node — Field/Tool/Exit Chip Syntax
description: When drafting Agent Node bodies, enclose contact/location fields in {{...}}, tools in @@[...], exits in @@@[...] so the UI renders them as styled chips and the LLM treats them as live references
type: feedback
originSessionId: 8f14ee5c-f2f9-4f58-9a07-3e5135c7f39b
---
When drafting prompts for Agent Node (Method) bodies, sections, or instructions in CloseBot, always use the proper merge-token syntax so the references render as chips in the UI and bind to live data:

| Syntax | Renders as | Use for |
|---|---|---|
| `{{contact.first_name}}` | blue Contact chip | Built-in contact fields |
| `{{contact.youth_name}}` | blue @contact chip | Custom fields (note the @ prefix in the chip label) |
| `{{location.timezone}}` | location chip | Location-level fields |
| `@@[Update Contact]` | yellow Tool chip | Tool references — agent will use this tool |
| `@@@[Ready to Book]` | green Exit chip | Exit path references — agent exits via this handle |
| `@@@[Interested]` | green Exit chip | Same — Method node exit |

**Why:** Plain-text references like "first_name" or "Update Contact" render as raw text and the bot can't bind them to actual fields/tools. The UI shows broken/unstyled text, the LLM has no field-data anchor, and merge-token expansion never fires. Using the right syntax means: (1) the chip renders correctly in the editor, (2) at runtime the {{...}} expands to the contact's actual stored value, (3) the @@[...] / @@@[...] tokens become hard hints to the LLM about which tool/exit is required.

**How to apply:** Every time I draft a prompt body or section for a Method/Agent node:
- Field references → `{{contact.X}}` or `{{location.X}}`
- Tool references → `@@[Tool Name]` (canonical tool name from references/closebot_agent_node.md table)
- Exit path references → `@@@[Exit Title]` matching an entry in the node's ExitPaths
- Never use bare snake_case field names in prose — wrap in `{{...}}`
- Never name a tool in plain text — wrap in `@@[...]`
- Never describe an exit by name without `@@@[...]`

**Verification after publish:** Re-export the KDL and confirm the body still has the {{...}}, @@[...], @@@[...] tokens. Look at the UI to confirm chips render (no red "Tool.X Unavailable" or unstyled raw text). The original `@@[Reference Documents]` example was a real bug because that wasn't a canonical tool name (correct: `@@[Library Context]`).

**Tool name reference:** see references/closebot_agent_node.md tools-mapping table for the full list of valid `@@[...]` tool names (Update Contact, Update Tag / List, Check Appointment Availability, Book Appointments (GHL), Library Context, Send Property Image, Get Property Details, Check Distance, Modify Appointment, Email Tool, Smart FAQ, plus any Custom Tools by name).
