# CloseBot Agent Node — Reference Documentation

**Source:** Official docs (docs.closebot.com) + Agent Node Launch Party transcript (Bryce DeCora webinar, April 2026)
**Status:** Live as of April 2026 launch. Some settings (Thinking Mode, Intelligence Level, Remove Limits) locked — coming soon.

---

## 1. What Is Agent Node

Agent Node is a new node type that replaces all previously separate conversational nodes (Objective, Booking Node, Statement, Conversation Node). One Agent Node can do what previously required 12+ nodes.

Unlike classic CloseBot nodes that follow a rigid linear path, Agent Node:
- Has its own instruction set
- Holds a pool of tools it can use at any point during that stage
- Stays active until an Exit condition fires
- Can handle off-script questions, double back to missed info, and use multiple tools in a single turn
- Is AI-driven (not rule-driven) — closer to a real person managing the conversation

**Key quote from Bryce:** "If you become an expert at agent node, you don't need any of the other purple gradient nodes, ever. This can do all of that stuff."

**When to keep classic nodes instead:** When you need rigid, deterministic flow — the bot should not deviate, should follow a strict sequence, should not go back. Classic Objective nodes are still better for hyper-predictable stages.

---

## 2. Core Components

Three things to understand:

| Component | What it does |
|---|---|
| **Instructions** | Tell the agent what to do, how to behave on this specific node |
| **Tools** | Grant the agent access to actions (booking, updating fields, custom APIs) |
| **Exits** | Define when to leave this node and move to the next (which may have different tools) |

---

## 3. Instructions

### Global vs. Node-Specific

Agent Node inherits the **global instructions** set in Job Flow Settings (why the conversation is happening, business info, persona). Inside each Agent Node you add **node-specific instructions** that clarify:
- How and when to use specific tools
- When to trigger an exit
- Which fields to collect at this stage

### Sections

Instructions are entered as **Sections** — organized text blocks, not one giant paragraph. Think of them as labeled categories (e.g. "General Info Collection", "Booking Instructions"). The AI reads sectioned instructions more reliably than a wall of text.

- 1000 character limit per Agent Node (base plan)
- Instructions are not the place for your knowledge base content — KB goes in Uploads

### @ Mention System

Inside the instruction text, use `@` to reference items:

| Syntax | References |
|---|---|
| `@` | Variables (contact fields, location fields, etc.) |
| `@@` | Tools |
| `@@@` | Exits |

Explicitly mentioning tools and exits by `@@`/`@@@` in the instructions improves reliability — the AI knows exactly when and how to use them. Not required, but strongly recommended for precise behavior.

**Warning:** If you @-mention a tool or exit that has since been removed from the node, you'll see a validation error.

---

## 4. Tools

Tools are the actions an Agent Node can take outside of just chatting. Without tools, an Agent Node is a chatbot and nothing more.

### Global vs. Node-Specific Tools

**Global tools** — enabled once, available to every Agent Node in the job flow. Use for tools you always want available regardless of stage (e.g. Check Appointment Availability, Update Contact).

**Node-specific tools** — enabled only on a single Agent Node. Use to gate access. Classic example: the Book Appointment tool should not be available at the Qualify stage — only add it to the node that comes after qualification.

**Why this matters:** If the lead can book before they're qualified, the AI will let them. Gating tools by stage prevents premature actions.

### Built-in Tools (Confirmed Available)

#### Source-Connected Tools (require GHL or HubSpot source)
- **Check Appointment Availability** — checks calendar slots; can be scoped to a specific calendar by naming it in the instructions (e.g. "check the Consultation calendar"). Without specifying, it sees all calendars and picks by title.
- **Book Appointment** — books directly to a GHL calendar. Add this only to the node where you want booking to happen.
- **Update Contact** — updates GHL contact fields
- **Update Tags** — adds/removes GHL tags on the contact

#### General Native Tools
- **Get Property Details** — returns property info (sq footage, etc.) for US addresses
- **Send Property Image** — pulls a street view image for an address
- **Check Distance Between Locations** — calculates distance between two points

#### Bot-Level Tools (managed via `POST /bot/{id}/saveTools`, not per-node flags)
- **Smart FAQ** — logs knowledge gaps during conversations (see section 7). Type: `smart_faq`
- **Email Tool** — sends AI-generated emails to the contact (see section 6). Type: `email_followup`
- **Chat Summary** — saves an AI summary of the conversation to the CRM. Type: `save_conversation`. Options: `OutputVariable`
- **Chat Transcript** — saves the full conversation transcript to the CRM. Type: `transcribe_conversation`. Options: `OutputVariable`
- **Smart Follow Up** *(hidden, coming soon)* — AI sets a follow-up time based on conversation context. Type: `SmartFollowUp`

### Tool Behavior During Test Conversations

In the test console, active tools are highlighted on the node as they're used. You can see in real time which tool fired and when. A small orange indicator means the tool hit a minor issue and retried automatically.

---

## 5. Custom Tools

Custom Tools let you connect Agent Node to any external API. If it has an API, it can be a tool.

**Requirement:** Paid CloseBot plan. Free plans cannot create or use custom tools.
**Current availability:** Can be created now, but can only be used once the "Remove Limits" setting is unlocked (coming soon).

### 4-Step Creation Wizard

**Step 1 — Name and Description**
- **Name:** Visible in logs; also used by the AI to decide when to invoke the tool. Name it clearly (e.g. "Get Calendly Availability", "Send ClickUp Task").
- **Description:** Tells the AI when to use the tool and what it returns. Example: "Use this tool when we need to get availability from Calendly. You will get available slots in return."
- **Icon:** Visual label for quick identification in logs.

**Step 2 — API Connection**
Standard API builder:
- Method (GET, POST, etc.)
- URL
- Headers
- Body
- Query parameters

All values come from the third-party's API docs.

**Custom Parameters** — fields the AI must collect from the conversation before it can call the API, because you don't have a contact field for them. Examples:
- A Calendly tool needs `start_time` and `end_time` — create two custom parameters
- A GIF search tool needs `search_term` — the AI will conversationally gather this before calling the API

The AI will prompt the lead for custom parameters naturally during conversation before executing the tool call.

**Step 3 — Test Response**
- Input test values for each custom parameter
- Click **Send Request** to live-test the API call
- Alternatively, paste in example JSON to simulate a response

**Step 4 — Restrict View (optional)**
Choose which fields in the API response the AI can see vs. cannot see. Use this to hide sensitive data the AI doesn't need. Example: a Stripe invoice tool that returns a `stripe_id` — hide the ID, let the AI see only the invoice details.

### After Creation
Enable the custom tool globally or on a specific Agent Node, same as built-in tools.

### Real-World Examples from Launch
- **Calendly booking** — check availability and book directly on Calendly calendar
- **Med spa EMR booking** — book directly to Boulevard/Sonote, bypassing GHL roundabout
- **ClickUp task creation** — agent pings the ClickUp team when KB gaps are detected
- **Property solar potential** — pull solar data for an address
- **GIF sender** — agent sends contextual GIFs mid-conversation

---

## 6. Email Tool

The Email Tool enables the Agent Node to send an email to the contact when they ask for one.

**Requirement:** The contact must have an email address on their GHL contact record.

**How it works:**
- Available in Job Flow on the right side (tools/actions menu)
- When the contact requests an email (e.g. "can you send me your package details?"), the AI generates an email using:
  - Persona guidance
  - Conversation context
  - Business information
  - Relevant Knowledge Documents
- Sends via the CRM email channel regardless of Source Filter settings

**Compatibility:** One of only two tools that can be used with **legacy nodes** (not just Agent Node). The other is Smart FAQ.

**AdditionalPrompt option:** The Email tool accepts an `AdditionalPrompt` field (set via `POST /bot/{id}/saveTools`) to customize how the AI writes the email — e.g., tone, format, what to include.

**Example use cases:**
- Contact wants to review package pricing with a spouse before deciding — agent emails full details
- Property inquiry — contact asks for complete amenity list to share — agent emails from KB

---

## 7. Smart FAQ

Smart FAQ monitors conversations for knowledge gaps and auto-logs them for later resolution.

**How it works:**
- When the agent cannot answer a question (knowledge gap), Smart FAQ flags it
- Creates a Smart FAQ item in the Knowledge Library, organized by source
- You (account owner) get notified
- You review unresolved items and provide answers
- Once you answer, the system auto-generates a KB document and assigns it to the correct source

**Where to find items:** Knowledge Library > Smart FAQ section.

**Technical note:** Smart FAQ is checked in every conversational action **except** the Booking action. Enabling it may also reduce hallucination (it modifies prompting parameters).

**Compatibility:** Works with legacy nodes in addition to Agent Node.

---

## 8. Exits

Exits define when and why an Agent Node should hand off to the next node.

### Creating an Exit
- Click **Exits** button on the Agent Node > **Add Exit**
- Name the exit (e.g. "Qualified", "Booked", "Opted Out")
- The exit does nothing until you either:
  - `@@@`-mention it in the instructions (AI-driven), or
  - Configure tag/list rules (CRM-driven)
- If neither is set, you'll see a warning

### AI-Driven Exits (@@@ Mention)
Inside instructions, tell the agent when to use the exit:
```
Once we have all of their information, exit immediately with @@@Qualified
```
The AI decides when the condition is met and fires the exit.

### Tag/List-Driven Exits (Optional)
Set tag combinations that automatically remove a lead from the current Agent Node if detected. Use for CRM automation triggers — e.g., if your GHL automation adds the tag "already booked" (from a website booking), the lead exits the Qualify node immediately.

These are checked constantly, not just when the AI responds.

**KDL format for a tag-rule exit:**
```kdl
ExitPaths {
    _ {
        Title "Already Booked"
        Description ""
        MustHaveTags {
            _ { Tag "booked" }
        }
        CantHaveTags
        UseTagRules true
    }
}
```
A tag-rule exit can be combined with an AI-driven exit — set `UseTagRules true` AND `@@@`-mention it in instructions. The exit fires whichever way triggers first.

### Exit to Next Node
After an exit is created, a connector dot appears on the node. Drag a new Agent Node (or any node) to the exit. Each exit can route to a different next node with its own tools and instructions.

---

## 9. Agent Node Settings (Partially Locked — Coming Soon)

Three settings visible in the UI but not yet unlocked:

### Thinking Mode
Before responding, the AI prints out a thought process / plan, then starts responding and using tools. Higher accuracy, higher cost.

### Intelligence Level
Toggle to higher-capability (more expensive) AI models from OpenAI or Anthropic. Current default is optimized for high capability + relatively low cost. Unlocking this may yield ~2% improvement but at ~2x cost — available as an option, not forced.

### Remove Limits
- Removes the 1000-character instruction limit
- Allows more than 7 tools per Agent Node
- **Required to use Custom Tools**
- Enables access to Thinking Mode and higher Intelligence Levels

**API status (confirmed 2026-04-23):** Intelligence Level and Remove Limits are not exposed in the API at all — not in `GET /bot/{id}`, not in nodeDescriptors. Truly locked/UI-only until Bryce enables them.

`EnableThinking` is present in the KDL (`EnableThinking false`) and settable via KDL import, but has no effect until the feature is unlocked server-side.

---

## 10. Pricing and Billing

**Base plan (no settings unlocked):**
- 1000 character limit on instructions
- Max 7 tools per Agent Node
- No Thinking Mode
- Standard models only
- Cost: **same as always — 1.2 cents per message** (no increase)

**With Remove Limits / upgrades unlocked:**
- Cost multiplies proportionally to token usage
- Example: if a higher model costs 2x more to run, it counts as 2 messages
- All usage visible in logs with transparent token count + cost
- No flat surcharge — strictly proportional billing

**Key point:** CloseBot deliberately kept the base Agent Node free of extra cost. Limits are what make that possible.

---

## 11. Comparison to Legacy Nodes

| Situation | Use Agent Node | Use Classic Nodes |
|---|---|---|
| Complex multi-step data collection | Yes | No |
| Multi-child / multi-appointment booking | Yes | No |
| Field correction after moving forward | Yes | No |
| Repeat booking / return visits | Yes | No |
| External API integration | Yes (Custom Tools) | Webhook only, one-shot |
| Rigid linear flow, no deviation | No | Yes |
| Hyper-predictable, must not go off-script | No | Yes |

**Hybrid design:** Use classic Objective nodes for tight gatekeeping stages where you want zero deviation. Wrap them with Agent Nodes for stages that need flexibility.

---

## 12. Impact Metrics (from Booking Node Upgrade, ~2 weeks before launch)

CloseBot already shipped the booking node on the new Agent Node methodology ~1.5 weeks before the full launch. Results:
- **+10% more bookings**
- **1.2 fewer messages on average to complete a booking**

The 1.2 message reduction is significant at scale — every extra message is a dropout risk.

---

## 13. Key Use Cases from Beta Testing

**Multi-child martial arts enrollment (Alex's case)**
- Parent books multiple kids across different calendars in one conversation
- Agent picks the right calendar by child age from title, books each, updates custom fields, titles appointments per child
- Previously required fragile multi-step objective chain; now handles in a single Agent Node

**Repeat bookings / DBRs (Deal Board Reviews)**
- Contact was booked, comes back later to reschedule or book again
- Agent Node can book again without needing a fresh flow trigger

**Field correction post-booking**
- Contact gives wrong email during qualification
- Classic flow: bot is past that stage, cannot go back
- Agent Node: can update the email at any point during its active stage

**Off-script recovery**
- Mid-flow, contact asks "where are you located?" — agent answers and continues collecting where it left off
- Classic nodes would lose context; Agent Node handles it gracefully

---

## 14. API Access

Agent Node is fully accessible via API. The CloseBot developer docs (`developers.closebot.com`) cover endpoints. This includes creating bots with Agent Node configurations and publishing.

---

## 15. Architectural Notes for Our Builds

- **Gate booking tool** by stage — never give Book Appointment access to a Qualify-stage Agent Node.
- **Use global tools sparingly** — only tools needed at every stage. Node-specific is safer and cheaper.
- **@@-mention tools explicitly** in instructions when the timing or scope matters (e.g. "use @@Check Appointment Availability only on the Consultation calendar, not the Follow-Up calendar").
- **@@@-mention exits** in instructions to tell the AI the trigger condition in plain language.
- **Custom parameters** replace the need to have a GHL contact field for every piece of data the AI needs to run an API call.
- **Restrict View** in Custom Tools is security hygiene — never expose API keys, stripe IDs, or internal system IDs to the AI model.
- **Smart FAQ** should be on by default in production bots — it's free intelligence on where the KB has gaps.
- Agent Node instructions are not a KB. Keep instructions under 1000 chars. Put knowledge in Uploads.

---

## 16. KDL and API Implementation Reference

*Confirmed from live discovery (2026-04-23). Use this as the authoritative schema reference for deploy scripts.*

### Method Node — Full KDL Template

```kdl
Method id="<uuid>" {
    // ── Tool flags (all default true except Email + SmartFaq) ──────────────
    EnableUpdateContact true
    EnableAddTag true
    EnableCheckAvailability true
    EnableGhlBooking true
    EnableLibraryContext true
    EnableSendPropertyImage true
    EnableGetPropertyDetails true
    EnableCheckDistance true
    EnableModifyAppointment true
    EnableEmail false
    EnableSmartFaq false

    // ── Custom tools (by name, not ID) ────────────────────────────────────
    EnabledCustomTools {
        _ { Name "GIF Tool" }
        _ { Name "Calendly Availability" }
    }

    // ── Calendar targeting (only needed when booking to a specific calendar)
    // GhlBookingCalendarId "cal_XXXXXXXXXXXXXXXX"

    // ── Instructions + Sections (BOTH must be populated) ──────────────────
    Sections {
        _ {
            Title "Qualify"
            Body "Collect {{contact.first_name}}, {{contact.email}}.\nUse @@[Update Contact] to save.\nWhen complete, exit with @@@[Booking]"
        }
    }
    Instructions "Collect {{contact.first_name}}, {{contact.email}}.\nUse @@[Update Contact] to save.\nWhen complete, exit with @@@[Booking]"

    // ── Exits ─────────────────────────────────────────────────────────────
    ExitPaths {
        // AI-driven exit (no tag rules)
        _ {
            Title "Booking"
            Description ""
            MustHaveTags
            CantHaveTags
            UseTagRules false
        }
        // Tag-rule exit (fires when CRM adds tag "booked")
        _ {
            Title "Already Booked"
            Description ""
            MustHaveTags {
                _ { Tag "booked" }
            }
            CantHaveTags
            UseTagRules true
        }
    }

    // ── Settings (locked in UI but present in KDL) ─────────────────────
    EnableThinking false    // flip to true when Bryce unlocks Thinking Mode
    ToolOrder               // controls display order in UI; leave empty
    EnabledCustomTools      // duplicate key omit if no custom tools

    // ── Connections ────────────────────────────────────────────────────
    ExitPaths:0 handle="<next-node-uuid-or-EOC>"
    ExitPaths:1 handle="EOC"

    __position 0 0
}
```

### Bot-Level Tools API

`POST /bot/{id}/saveTools` — array of tool objects:

```json
[
  {
    "type": "smart_faq",
    "enabled": true,
    "options": {}
  },
  {
    "type": "email_followup",
    "enabled": true,
    "options": {
      "AdditionalPrompt": "Write in a professional tone. Include all details from our KB."
    }
  },
  {
    "type": "save_conversation",
    "enabled": true,
    "options": {
      "OutputVariable": "chatSummary"
    }
  },
  {
    "type": "transcribe_conversation",
    "enabled": true,
    "options": {
      "OutputVariable": "chatTranscript"
    }
  }
]
```

**Type discriminators (confirmed):** `smart_faq`, `email_followup`, `save_conversation`, `transcribe_conversation`
**Hidden (coming soon):** `SmartFollowUp` — AI-determined follow-up timing based on conversation.

### Custom Tools

`GET /bot/customTool` → returns `null` if no custom tools exist.
`POST /bot/customTool` → **405 Method Not Allowed** — creation is UI-only for now (gated behind Remove Limits).

When custom tools exist, they appear in the KDL as `EnabledCustomTools { _ { Name "Tool Name" } }` — referenced by the name you gave them in the wizard, not by ID.

### Per-Node Enable Flags — Quick Reference

| KDL Flag | Tool | Default |
|---|---|---|
| `EnableUpdateContact` | Update Contact | true |
| `EnableAddTag` | Update Tag / List | true |
| `EnableCheckAvailability` | Check Appointment Availability | true |
| `EnableGhlBooking` | Book Appointments (GHL) | true |
| `EnableLibraryContext` | KB / Library Context | true |
| `EnableSendPropertyImage` | Send Property Image | true |
| `EnableGetPropertyDetails` | Get Property Details | true |
| `EnableCheckDistance` | Check Distance | true |
| `EnableModifyAppointment` | Modify Appointment | true |
| `EnableEmail` | Email Tool | false |
| `EnableSmartFaq` | Smart FAQ | false |
| `EnabledCustomTools` | Custom Tools (by name) | empty list |

### globalAgentTools

The `globalAgentTools {}` block on the Source node appears in exported KDL but is stripped on import — setting global tools programmatically via KDL does not work. Use per-node `Enable*` flags for all tool control via API.
