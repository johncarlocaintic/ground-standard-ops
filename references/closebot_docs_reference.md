# CloseBot Complete Documentation Reference

> **Source:** Synthesized from https://docs.closebot.com/en/ (12 collections, ~82 articles)
> **Scope:** Everything needed to design, configure, and troubleshoot a CloseBot agent — personas, job flows, every node type, every tool, every setting, sources, knowledge library, API.
> **Purpose:** Master context doc for CloseBot agent creation.

---

## 1. Platform Architecture — The Seven Core Pieces

CloseBot V2 is assembled from seven interconnected pieces. Understand this hierarchy before building anything.

| Component | Purpose |
|---|---|
| **Source** | CRM integration (HighLevel, LeadConnector, HubSpot, Webhook). Where messages come from — CloseBot does *not* talk directly to SMS/FB/etc., it piggybacks on the CRM's channels. |
| **AI Provider** | The LLM backend (OpenAI, Anthropic, Gemini, Grok). Business/Agency plans can connect custom API keys. |
| **Persona** | The agent's voice, tone, avatar, delay behavior. Reusable across job flows. |
| **AI Job Flow** | The logic graph — nodes, branches, tools. Defines *what the agent does*. |
| **Agent** | One Persona + one Job Flow. The deployable unit. Can be assigned to multiple sources with different KB attached per source. |
| **Knowledge Library** | Uploaded content (web scrapes, PDFs, DOCX, TXT, CSV, Excel, text-input) attached to sources. |
| **Dashboard** | Usage metrics and revenue tracking. |

**Build order (canonical):** Source → Persona → Job Flow → combine into Agent → attach Knowledge → test → publish.

---

## 2. Sources

### 2.1 What a Source Is
A Source is a CRM integration enabling CloseBot to read and respond to messages. Prerequisites before adding one:
- Admin access to the target HighLevel / HubSpot / LeadConnector workspace.
- Logged into that workspace in another browser tab (OAuth popup needs it).

**Supported source types:** HighLevel Sub-Account, LeadConnector Sub-Account, HubSpot, Webhook (custom).

### 2.2 Connection Steps (all OAuth-based sources)
1. Agents → Sources → **New Source**.
2. Pick the type (HighLevel / LeadConnector / HubSpot / Webhook).
3. OAuth popup → select workspace → sign in if needed → **scroll to the bottom** of the permissions page and approve.
4. Pick the specific sub-account.
5. Enable field-creation permissions checkbox.
6. Return to CloseBot tab → **Add Source**.

Disconnection: use the source's three-dot menu, or uninstall from the CRM's installed-app list. **Never disconnect + reconnect a source that has a wallet balance — it clears the balance.**

### 2.3 Webhook Source (custom)
For any non-supported CRM. Fields required at creation:
- **Source Name** — display label.
- **Webhook URL** — endpoint CloseBot POSTs to for outbound messages + field updates.

After creation, the **Setup tab** gives you:
- **Access Token** (for your inbound calls to CloseBot)
- **Event Endpoint URL** (where you POST inbound events)

**Inbound message payload** (your system → CloseBot):
```
POST {EVENT_ENDPOINT}
Content-Type: application/json
{ "accessToken": "...", "kind": "message", "contactId": "...", "body": "..." }
```

**Contact field update payload** (your system → CloseBot):
```
POST {EVENT_ENDPOINT}
Content-Type: application/json
{ "accessToken": "...", "kind": "set-field", "contactId": "...", "field": "...", "value": "..." }
```

**Outbound response payload** (CloseBot → your webhook URL):
```json
{
  "kind": "response-generated",
  "timestamp": "<ISO 8601>",
  "data": {
    "contactId": "<echoes the inbound id>",
    "messageId": "<generated>",
    "body": "<response text>",
    "state": "<optional, echoed back unchanged>"
  }
}
```

Use `state` to hold arbitrary context (channel hint, thread ID, etc.) — CloseBot returns it untouched.

### 2.4 Source Settings (per-source tabs)

| Tab | Purpose |
|---|---|
| **Setup** | Access to the CloseBot Intelligence Pixel (lead enrichment + widget activation). |
| **Settings** | Three toggles — see below. |
| **User Access** | Which invited client users can view/edit the source, set rebilling, adjust variables. |
| **Rebill** | Wallet, payment info, upcharge settings, Stripe customer linkage, recent charges. |
| **Variables** | Fill source-level job-flow variables + persona-name overrides per source. |

**Settings-tab toggles:**
1. **Bot Auto Shutoff on manual message** — applies `ai off` tag the moment a human replies.
2. **Graceful Goodbye when goodbye is detected** — agent sends a polite closer when contact says goodbye.
3. **Leave conversations as unread** — keeps conversations marked unread in the CRM after CloseBot replies.

**Availability Settings** (separate tab): set **Reply Restrictions** (time windows and which channels) and **Follow-Up Restrictions** (when follow-ups can fire).

### 2.5 Source Filters (critical for controlling agent activation)

Filters live in three places — pick any:
- Agents page → Job Flow's three-dot menu.
- Job Flow Settings → Source tab.
- Job-flow creation wizard, page 2.

**Two filter types:**

**Channel filter** — whitelist channels the agent may reply on (e.g., SMS + Live Chat only).

**Tag filter** — color-coded:
- **Green = required.** Contact MUST have this tag to enter the flow. Multiple greens = all of them required. No greens = responds to all new leads.
- **Red = excluded.** Any one of these tags blocks entry. **`ai off` is red by default** and acts as the universal kill switch.

Example rule: Green = `ai aggression detected` + `ai booking error`, Red = `ai off` + `ai bot detected`.

---

## 3. AI Providers

### 3.1 Supported Providers
- **OpenAI**
- **Anthropic**
- **Gemini**
- **Grok**

### 3.2 How Provider Selection Works
- **Background tasks** (decision making, objective completion detection) — CloseBot picks the provider itself. Not user-controlled.
- **Response generation** — user-selectable per Persona.
- **Billing** — per-message cost model across all four providers (Business + Agency plans).

### 3.3 HIPAA
CloseBot is **only HIPAA-compliant via Anthropic.** HIPAA-regulated accounts must use Anthropic exclusively for both messaging and agent processing.

### 3.4 Provider Fallback
Every message attempts the **primary** provider first. On failure the order is:
1. Try another model within the same provider.
2. Fail over to secondary provider.
3. Continue down the ordered list until one succeeds.

Message history is preserved across switches — conversation context is never lost.

### 3.5 Known provider quirks
- **Anthropic occasionally mislabels calendar dates** (e.g., says "Tuesday the 7th" when it's Tuesday the 8th). If you see this, switch providers for that persona.

---

## 4. Personas

A Persona is *the voice of the agent* — separated from logic (job flow) so you can A/B test voices against the same workflow.

### 4.1 Persona Settings — Field by Field

| Field | Role |
|---|---|
| **Image / Avatar** | Shown on the agent screen. Stock or custom upload. |
| **Name** | What the agent calls itself (e.g., "Sam"). |
| **Color / Theme** | Organizational only — no behavior effect. |
| **Description** | Internal notes; never seen by contacts. |

### 4.2 Behavior Settings

| Setting | Effect |
|---|---|
| **Response Delay / Variable Reply Times** | Adds pause before replying so messages feel human. Options: *No Extra Delay*, *Realistic (20–45 s)*, *Slow (45–90 s)*, *Random (5–120 s)*, or **Custom fixed seconds** (no variability). |
| **Frequency AI Typos** | Occasional misspellings + corrections for live-chat authenticity. |
| **Breakup Larger Messages** | Splits long replies into multiple smaller bubbles. |

### 4.3 How to Respond (free-form instructions)

Short, iterative directives that shape tone. Test one at a time.

**⚠️ Never put booking language here — causes false bookings.**

Proven examples:
- *"Don't be exclamatory with your responses."* (kills over-enthusiasm)
- *"You can speak any language."* (unlocks 30+ languages; English is default)
- *"If personal things come up while chatting, be sincere and engaged."* (softens task-focused bots)
- *"Try to sound natural and not like a typical formal assistant."* (de-robotifies)

### 4.4 Voice Styles
Up to **three descriptive words**. Note: the agent is *already* Friendly + Kind by default — don't waste slots on those.

### 4.5 Provider Selection (Persona level)
Select primary provider + optional fallback chain. CloseBot picks the model within the provider automatically.

---

## 5. Job Flows — The Core Agent Logic

### 5.1 Creating a Job Flow
1. Agents tab → **+** → name it, optionally group it, pick **type** (required, **unchangeable** later).
2. Connect a source → set Source Filters (channels + tag rules).
3. Pick a starting method: **Template** (50+ pro templates on paid plans) / **AI Prompt** (describe it in plain English) / **Scratch**.
4. After building, attach a Persona before publish or test.

The agent always starts at **START** and follows arrows. Custom Scenarios can jump into sub-flows; when the sub-flow ends in an open branch, the agent auto-returns to where it was.

### 5.2 Job Flow Settings Tabs (reached via Settings button in the builder)

- **Source** — source + filters.
- **Job Information** — *Why the Conversation is Happening* + *Important Business Information* (see §8).
- **Variables** — create client-facing placeholders (see §9).
- **Follow-Ups** — cadence (see §10).
- **Prohibited Words** — compliance-level blocked vocabulary (see §5.11).

### 5.3 Node Taxonomy

Two generations exist. **Agent Node** is the modern primitive and replaces most legacy ones. Legacy nodes (Objective, Statement, Conversation, Booking) are still supported and appear in older templates.

| Category | Nodes |
|---|---|
| **Modern (V2)** | **Agent Node** 🤖 |
| **Legacy speaking nodes** | Objective, Statement, Conversation, Booking |
| **Logic / routing** | True/False, Switch, Custom Scenario, Aggression Detected, Bot Detected |
| **Flow control** | Delay (time), Delay (variable), Stop Responding |
| **Side-effect actions** | Set Field, Modify Tags (GHL/LC), Custom Webhook |
| **"Other Actions" built-ins** | Check Distance, Get Property Details, Generate Street View |

---

## 6. The Nodes — Full Reference

### 6.1 Agent Node 🤖 (the modern primitive)

Per docs: *"The agent node has become the most powerful tool in your toolbox"* — replaces Objective, Statement, Booking, Conversation.

**Three configuration sections:**

**1. Instructions**
- Organized as multiple **Sections** (categorized text blocks), not one long paragraph.
- Follows global Job Flow instructions + adds node-specific directives.
- **Mention syntax:**
  - `@` → reference a variable
  - `@@` → reference a tool
  - `@@@` → reference an exit
- Explicit mentions make the agent much more reliable about when/how to act.

**2. Allowed Tools**
- Without tools, the Agent Node is a text-only chatbot.
- Can be **global** (always on) or **node-specific** (scoped to this node only).

**3. Exits**
- Transition points to next nodes.
- **Exit Description** — optional; describes when to exit (or use `@@@` in instructions).
- **Exit Tags** — auto-triggers exit when a tag combo is detected. Useful for CRM-driven transitions.
- ⚠️ If you set exit-tag filters with no description AND don't `@@@`-mention the exit, the agent **will never take that exit** unless the tag rule becomes true.

### 6.2 Objective (legacy — collect info from contact)

*"Objectives GET information from the contact"* (vs. Statements that GIVE information).

| Field | Role |
|---|---|
| **Short Description** | ⭐ Most important field — what info to collect. Don't phrase as a literal question; don't combine multiple items. |
| **Title** | Shown in builder + conversation views. |
| **Output Variable** | CRM field where collected info is saved (optional). |
| **+ multi-component** | Add several sub-fields in one objective — e.g., First Name + Email asked together. |

**Advanced:**
- **Extra Prompt** — extra context *only* while on this objective.
- **Max Attempts** — retry cap for optional info (e.g., 3 for non-critical).
- **Sensitivity** — 0–100. 0 accepts anything; 100 extremely strict; **default 50**.
- **Skip if Not Blank** — default ON. Skips the objective if the field already has a value. Disable to force a re-ask.

Agent only advances after all info is collected or Max Attempts hit.

### 6.3 Statement (legacy — give info to contact)

*"Statements GIVE information to the contact."*

- **With AI** — CloseBot paraphrases your input into conversational form.
- **Without AI** — sends your message verbatim (use for exact URLs, legal language, etc.).

**Advanced:**
- **Move on without a response** (default ON) — agent proceeds automatically after sending. Turn OFF if you need the contact to acknowledge first.
- **Image link** — paste a direct image URL; CloseBot attaches it to the message.

### 6.4 Conversation (legacy — open Q&A)

Passive node — the agent answers contact questions using Persona + Important Business Info + Knowledge Library, but **never initiates questions and never advances**.

**Extra Prompt** examples:
- "Focus only on answering questions."
- "Suggest the service or product only if appropriate."

⚠️ **Conversation must be the terminal node in its branch.** To escape it, pair with a **Custom Scenario** that jumps elsewhere.

### 6.5 Booking (legacy — calendar scheduling)

**Two ways to pick the calendar:**

1. **By Name** — dropdown. Auto-fills title + short description. Works well if the same-named calendar exists across multiple sources (CloseBot reads the "Source of Truth" — the first connected source).
2. **By Calendar ID** — use the permanent ID from the CRM's calendar settings. Supports dynamic booking (different calendars per source). ID can be hardcoded or sourced from a variable / custom field / Job Flow Variable.

**Fields:**
- **Short Description** — keep it tight: appointment type + duration only. E.g., "Book a 30 minute in-person appointment."
- **Advanced Settings** — minimal extra context; optional **failure tag** applied when (a) CRM doesn't return, or (b) no slots found.

**Timezone logic:** contact timezone (if stored) → source timezone (fallback) → Eastern Time (last resort). For multi-TZ businesses, collect timezone via Objective *before* the Booking node.

**Conversational rescheduling** — disabled by default. Enable in Job Flow Settings → Important Business Info to let contacts reschedule existing appointments mid-conversation.

### 6.6 Custom Scenario (always-listening trigger)

Monitors every message for a condition; jumps to a sub-flow when triggered. Auto-returns to the original location if the sub-flow ends open.

**Settings:**
- **Description** — ⭐ single most important field. Examples:
  - "This contact is explicitly asking to chat with a human or we are confused and need human help."
  - "This contact is trying to book a meeting."
  - "This contact isn't at all interested in our product."
- **Threshold** — 1 (hair-trigger) to 10 (very strict). **Start at 5** and tune.
- **Priority** — if multiple scenarios trigger simultaneously, highest priority wins.
- **Allow Re-Entry** — toggles whether the scenario can fire multiple times per conversation.
- **Silent Mode** — when ON, agent sends no filler reply before jumping. When OFF, agent can say "one moment" etc.

**Built-in retrigger protections:**
1. If the sub-flow returns to the main flow → cannot retrigger within the next 5 messages.
2. If the sub-flow ends in an open node → cannot retrigger until the scenario completes or 5 messages pass.

### 6.7 Aggression Detected (pre-built Custom Scenario)

Jumps to a sub-flow if contact becomes aggressive. Typical pattern: aggression detected → apply tag → Stop Responding. Especially relevant for database reactivation / cold outbound.

### 6.8 Bot Detected (pre-built Custom Scenario)

Detects bot-on-bot conversations (another AI replying). Saves money by stopping infinite AI-talking-to-AI loops. Typical sub-flow: add `ai off` tag → Stop Responding.

### 6.9 Stop Responding

Halts outbound messaging *at this point in the flow*. Agent still listens and can be re-activated by:
1. **Conversational Rescheduling** (if enabled in Job Flow Settings).
2. A **Custom Scenario** that matches something the contact says next.

**Stop Responding vs. `ai off` tag:**
| | Stop Responding | `ai off` tag |
|---|---|---|
| Scope | This one job flow | All CloseBot flows, everywhere |
| Reversible | Yes, via scenario re-entry | Effectively permanent |
| Use for | "Not interested" tagging with re-engagement possible | Absolute kill switch |

### 6.10 True/False (binary router)

Silent node — no agent output, just routes. **Top branch = True (green)**, **bottom branch = False (red)**.

**Inputs:**
- **Left Value** / **Right Value** / **Operator**
- **AI to Power the Decision** — let the LLM decide based on conversation history when you can't rely on a variable.

Don't enable AI when the operator decision is purely variable-driven (e.g., distance check) — adds cost and volatility.

### 6.11 Switch (multi-way router)

Same as True/False but with **N branches + a catch-all**. Example: Real estate — Left = "role", branches: Buyer / Seller / Both / default. Each branch runs its own tailored objectives.

### 6.12 Delay (Time) — fixed pause

Wait for N seconds/minutes at this point in the flow. Two modes:
- **Silent** — agent doesn't speak until the delay expires.
- **Continue Responding** — agent keeps answering questions during the wait.

Practical uses: "processing your application" buffer, objection-handling window before follow-up.

### 6.13 Delay (Variable) — wait until a field is populated

Pause until a named source variable becomes non-blank. Same silent/responsive toggle as time delay.

Use case: cleaning company — (1) Objective collects address/service, (2) Statement "getting your quote", (3) Delay (variable) on `quote_amount`, (4) Statement delivers quote once external automation fills `quote_amount`.

### 6.14 Action Operators (for True/False + Switch)

Operators auto-coerce types across left / right / op. Full list:

| Category | Operators |
|---|---|
| **Numeric** | `LessThan`, `GreaterThan`, `LessThanEqual`, `GreaterThanEqual`, `Equal`, `NotEqual` |
| **Date** | `Date After`, `Date Before`, `Date Equal` |
| **Text** | `Contains`, `DoesNotContain`, `Equal`, `NotEqual`, `Starts With`, `Ends With` |
| **Field presence** | `IsEmpty`, `IsNotEmpty`, `Contains`, `DoesNotContain`, `Equal`, `NotEqual` |

`Contains` is the right pick for space-separated multi-value fields (tags-as-string, multi-select).

### 6.15 Set Field

Updates any CRM contact field.

- **Output Variable** — the CRM field to update.
- **Field Value** — static value, a variable from another node, OR
- **Use AI to create the field value** — AI extracts the value from conversation history. Huge for capturing *why* a lead didn't book without actually asking.

### 6.16 Modify Tags (GHL/LC)

*"Likely the most useful action within CloseBot"* for GHL/LC.

- **Title** required (for internal reference).
- **Tags to Add / Tags to Remove** — each click adds an input box.
- System auto-lowercases tags (GHL/LC restriction).
- ⚠️ Prefer fixed values; variables can silently create new unintended tags.

Common uses: move contacts between pipeline stages, trigger CRM workflows, group leads by interest.

### 6.17 Custom Webhook

Full HTTP outbound from within a flow.

- **URL** — endpoint. Can inject variables via the `+` button.
- **Method** — GET/POST/etc.
- **Query Parameters** / **Body** (JSON or Form) / **Headers** (Advanced — auth tokens).
- **Wait for Response** — default ON. Turn OFF if response is irrelevant (e.g., GA event).

**⚠️ Critical:** before saving you MUST run a test — the **Test Result** must be visible in the **Response** box. Only after a successful test are the response fields available as output variables downstream. If you modify the webhook later, test again.

### 6.18 Other Actions (built-in third-party integrations)

Paid-plan "actions disguised as webhooks, pre-simplified." Each typically needs three pieces: Objective to collect inputs → the Other Action → downstream action that consumes the output.

**Check Distance** — Google-style distance between Origin + Destination. Output variables include `DistanceMiles`, `DistanceKilometers`, `DurationSeconds`, `DurationText`, plus address confirmations. Use cases: service-area qualification, mileage-based pricing, route-to-nearest-location.

**Get Property Details** — takes Address 1 / City / State / Zip. Returns: `PropertyId`, `EstimatedValue`, `Bedrooms`, `Bathrooms`, `SquareFeet`, `YearBuilt`, `SaleDate`, `SaleAmount`, `BuyerName`, `SellerName`, `Latitude`, `Longitude` (+ more). Real-estate workflow: qualify, price, or make offer based on data.

**Generate Street View** — takes Address 1 / City / State / Postal Code. Output: `[Title].StreetView` (image URL). Pattern: collect address → generate street view → Statement sends image → Objective asks "is this the right property?" → True/False routes based on answer.

---

## 7. Tools (Agent Node tools + legacy tools)

### 7.1 What a Tool Is
"Tools are things your Agent Node(s) can use at any time to perform actions outside of CloseBot." Book appointments, update fields, call APIs, send emails.

### 7.2 Scope
- **Global tools** — available to any Agent Node in the flow.
- **Node-specific tools** — locked to specific nodes.

Keeping tools scoped tightly = better reliability + lower cost + prevents premature tool use.

### 7.3 Tool Categories
- **Source-specific** — built-ins for HubSpot / HighLevel (check availability, book, update contact).
- **General** — native CloseBot utilities (Check Distance, Get Property, image sharing, etc.).
- **Custom** — user-built (see below).

### 7.4 Custom Tools (paid plans only)

Four-step creation:

**1. Identification**
- **Tool Name** — shown to you + referenced by Agent Nodes for usage decisions.
- **Description** — when to use it + expected output shape.
- **Icon** — visual tag in logs + canvas.

**2. API Configuration**
Standard HTTP fields — Method, URL, Headers, Body, Query params, plus:
- **Custom Parameters** — data the AI should collect from the conversation that you don't already have as fields. All declared custom params MUST be used in this step.

**3. Testing**
- Enter test values for custom params and hit send, OR paste an example JSON response directly.

**4. Response Filtering**
Pick which fields from the response are exposed to the AI vs. hidden (hide contact IDs, internal IDs, noise).

After creation: enable globally, or bind to specific Agent Nodes.

### 7.5 Email Tool

Sends emails to contacts on request. Requirements:
- Contact must have an email address on record.
- AI drafts body using Persona + conversation context + Important Business Info + attached Knowledge Documents.
- Always goes via the CRM's email channel, **even if Source Filters would block email**.

Best used when contacts explicitly ask for things in writing — package breakdowns, amenity lists, summary notes.

### 7.6 Smart FAQ

Auto-monitors conversations for questions the agent couldn't answer. Surfaces the gap in Knowledge Library → Smart FAQ, source-by-source. You type the answer; CloseBot auto-generates a knowledge doc attached to that source.

- Works across all conversational actions **except Booking**.
- Uses specialized prompting to reduce hallucination.
- Setup: Job Flow Builder → Tools icon → Smart FAQ icon → "update tools" for each job flow.

### 7.7 Chat Summary Tool

Continuously updates a CRM contact field with a running summary of the conversation. Each new message (contact or agent) refreshes the summary. Use for handoff prep / meeting notes.

Setup: Tools tab → activate Chat Summary → pick **Output Variable** (CRM field).

### 7.8 Chat Transcript Tool

Same setup as Chat Summary, but writes the literal transcript (not a summary) into a CRM field.

---

## 8. Job Flow Instructions (global)

Two fields in Job Flow Settings → Job Information. Both feed every agent message — think of them as system-prompt scaffolding.

### 8.1 Why the Conversation is Happening

Context for *where this conversation came from*. Template:

> "You are an assistant who works for **[Business]**. The contact **[reached out to learn about X / was contacted by us because of Y]**."

**Include:** agent identity, contact origin (inbound vs outbound), why the contact is talking right now.

**DO NOT include:**
- Specific jobs or goals — those belong in job-flow actions.
- Booking language — causes false bookings. Booking mentions live inside Booking nodes only.

### 8.2 Important Business Information

What the agent needs memorized about the business it represents. Sent with every message.

**Include (what a new hire memorizes Day 1):**
- Business name + location.
- Years in business / short history.
- Industry, core service type.
- 1–2 differentiators (family-owned, specialty, reputation).

Example: *"Empire Cleaning, Austin TX. 30 years, family-run, specializes in residential cleaning, especially move-out and pet cleanup."*

**DO NOT include:**
- Booking instructions (false bookings).
- Exhaustive service/product lists → those belong in the Knowledge Library.

---

## 9. Job Flow Variables (for agency templates)

Variables created in Job Flow settings that can be **filled per source / per client** later. Usable in almost any input field across the builder.

**Three use patterns:**
1. **Agency builds the template** — creates variables, publishes the flow.
2. **Agency fills on behalf of client** — Source Settings → Variables tab.
3. **Client self-service** — invited users get a simplified portal where they fill their own values (e.g., Calendar ID, service list, hours).

Canonical examples: `Info` (business blurb) and `Calendar ID` — different for every school/location the template is reused for.

---

## 10. Follow-Ups

Enable in Job Flow Settings → Follow-Ups tab (toggle must be ON first).

**Trigger conditions:** follow-ups fire only when the contact has not responded AND the flow is sitting on an **Objective** or **Booking** step. Other steps never trigger follow-ups. Any contact reply resets the cadence.

**Cadence example:** First follow-up 1 day after no response → second follow-up 5 days after the first has no response. Reply at any point restarts the sequence.

**Repeat Final Follow-Up** toggle — keeps sending follow-ups at the final interval indefinitely. *"Can be costly to use at scale."*

**Smart Follow-Ups** — if a contact says "follow up with me next month" the AI schedules a follow-up for that date (vague terms allowed) and pauses the regular cadence. Regular cadence resumes if still no reply after the smart follow-up.

**Extra Follow-Up Prompt** — custom rules for follow-up generation. Strong pattern: reference the conversation context so each follow-up is contextually varied, not "hey, still there?" #7.

**Availability windows** — follow-ups scheduled outside Source Availability Settings are queued to the next open slot. Timezone logic: contact TZ → source TZ.

---

## 11. Prohibited Words

Per-job-flow list of words the agent cannot use. **Only for legal/compliance restrictions.**

Legit example: pest control bans the word "SAFE" per regulation.

**Wrong use:** stylistic preferences ("stop saying Hi so much"). Those belong in Persona → How to Respond.

---

## 12. Knowledge Library

Agent's reference store — consulted only when a contact asks a question.

### 12.1 Input Types

| Type | Reliability | Notes |
|---|---|---|
| **Text Input** | ⭐ Most reliable | Pasted text auto-converted to bot-friendly TXT. Cumbersome but bulletproof. |
| **TXT** | ⭐ Very reliable | What-you-see-is-what-you-get. |
| **DOC / DOCX** | Good | Better-preserved formatting than PDFs. |
| **PDF** | Risky | Hidden formatting can corrupt extraction. |
| **CSV** | Good for Q&A / link lists | Use **descriptive column headers** — the agent reads headers as context. |
| **Web Scrape** | Risky | Captures nav/sidebars/footers. Re-scrapes every 24 h. |
| **Smart FAQ** | Structured Q&A | Fastest lookup + lower cost. |

⚠️ **The bot only knows the contents of each doc, not the title.** Bake the title into the content.

### 12.2 Web Scraping

- Paste URL → pick detail level: **Thorough / Standard / Quick**.
- Favicon appears when CloseBot recognizes the site.
- Status progression: **Queued → Processing → Live**.
- **6 MB hard limit per document.**
- Only real websites — Google Doc / share-link URLs **do not work**.
- Dedup is automatic (won't scrape the same page twice).
- **Must be attached to a source** for the agent to access it.
- Re-scrape every 24 hours.

**Official guidance:** *"Using upload or Create Text File to add knowledge documents is much more controllable and will have better results than using the web scraper."*

### 12.3 Quality Principle

**Relevance > volume.** Dumping irrelevant docs dilutes retrieval accuracy. Organize with paragraphs, lists, clear headings.

---

## 13. Custom Ideas / Patterns

### 13.1 One Agent → Many Calendars
- **Option A — Branch/Switch:** collect info conversationally, route to different Booking nodes based on variables/fields. Best when you want deterministic routing.
- **Option B — Custom Scenarios:** match intent ("book a consultation" vs "book a site visit") and jump to the matching booking sub-flow. Each scenario needs its own pre-booking objectives (email, name, etc.).

### 13.2 One Source → Multiple Agents
Assign the same source to multiple job flows, differentiated by Source Filters:
- **By tag** — flow #1 active when `test` present and `ai off` absent; flow #2 for different tag combos.
- **By channel** — flow #1 for Live Chat, flow #2 for WhatsApp/FB/IG.

Use when branch/switch/custom-scenario inside one flow doesn't fit — e.g., genuinely different personas per channel.

### 13.3 Database Reactivation / Outbound
**CloseBot is purely responsive** — it doesn't send cold first messages. Outbound pattern:
1. Fire first message via CRM (email/SMS blast).
2. CloseBot handles every reply.
3. First objective = interest qualification.
4. Always-listening Custom Scenario for disinterest → tag `not interested` → Stop Responding.
5. Collect missing contact info before booking.
6. Booking node → post-book conversation.

### 13.4 Dynamic Objective Switching Based on Prior Values
Use Branch/Switch on:
- A previous Objective's output value.
- A CRM contact field.
- The number of attempts the previous objective took.
- Whether the previous objective succeeded.

Example: phone number collected — if area code contains "308", ask a geography-specific follow-up question; otherwise skip.

### 13.5 Don't Reply to Reactions (emoji reacts on Messenger/SMS/IG)

Pattern:
1. Always-listening Custom Scenario — description: *"The last message from contact is a reaction that would be awkward to reply to."*
2. Statement with an empty message — CloseBot blocks blank sends, so no reply goes out.

---

## 14. Troubleshooting

### 14.1 Why Did My Agent Say That?
Log access for every message — hover the **info icon** next to an agent reply. Two links:
- **See Prompt Log** — reconstructs the message with each step labeled by tool name.
- **Examine Action** — jumps to the builder node that produced the message.

**Quick indicators** on messages: booking attempted, objective resolved, True/False or Switch resolved, custom scenario fired.

**Biggest root cause for "weird" agent behavior:** the Objective **Short Description** — it's the single most overweight field in the whole system.

### 14.2 Calendar Booking Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Agent confirms booking, no calendar entry created | Booking language mentioned outside a Booking node | **Never mention booking in any section other than Booking nodes.** Hover the message — no calendar icon = the agent wasn't actually on a booking objective. |
| Wrong days/dates ("Tuesday the 7th" when it's the 8th) | **Anthropic-specific bug.** | Switch providers. |
| "No slots found" | Calendar has zero real availability, bad calendar ID (use permanent, from Calendar Settings — not temporary), calendar deleted, or contact has no email/phone | Check availability, use permanent ID, add email/phone objective pre-booking. |
| Wrong availability stated | Timezone mismatch | Click **reasoning** on the booking message → check availability pulled. Timezone priority: contact TZ → source TZ → Eastern. Cross-check GHL calendar availability config. |

### 14.3 Agent Not Responding
Two families of failure:

**Messages not in CloseBot queue** = source disconnect or CRM-side failure. Reinstall the source. **⚠️ Never disconnect + reconnect if the source has a wallet balance — it wipes the wallet.** Report persistent connection problems to the CRM's support, not CloseBot's.

**Messages in queue but no reply** = Source Filters misconfigured. Check channel whitelist + tag rules (greens + reds).

### 14.4 Field Updating Issues

Two most common causes:
1. **Confusing field titles / options.** CloseBot feeds the title + options to the LLM. Ambiguous labels → wrong values. Hover the completion icon on a message → see the reasoning for the chosen value.
2. **Sensitivity set too high** → objective never completes → field never writes.

Other causes:
- Objective has no Output Variable picked.
- Objective never completed (CloseBot only writes on completion; doesn't retroactively fill).

### 14.5 Multiple Messages Sent

| Pattern | Cause | Fix |
|---|---|---|
| Two different but same-intent messages ("Great, how can I help?" + "Awesome, what can I do?") | **CloseBot Classic (V1) and V2 both active** | Check duplicate apps, disable old Classic workflow. |
| Two identical duplicates | Temporary send failure → CloseBot retried | Check delivery logs; contact support if both delivered. |
| Multiple replies to rapid-fire contact messages | CRM slow to forward messages in sequence | Increase Persona **Response Delay** so CloseBot has time to batch. |

---

## 15. Developer / API

### 15.1 Auth
Header-based key auth:
```
X-CB-KEY: {YOUR_KEY}
Content-Type: application/json   # for PUT / POST
```

**Keys are user-account-specific and issued exactly once.** Store on creation — no re-fetch.

### 15.2 Example Endpoints

**List sources**
```
GET https://api.closebot.com/agency/source
```

**Update source settings**
```
PUT https://api.closebot.com/agency/source/{SOURCE_ID}
{ "summarizeAttachments": false }
```

### 15.3 Full Reference
Interactive docs + "Try it" + per-language code templates: **https://developers.closebot.com/**

The REST API is *"near 100% functional"* — almost every UI feature is programmatically controllable.

---

## 16. Chat Widget (deployment channel — brief)

Collection exists with 6 articles covering: **Creating + Ordering Widgets**, **Chat Settings**, **Form Settings**, **Target (Page Filter) Settings**, **Behavior Settings**, **Embedded Chat Widgets + Custom Styling**.

This is the embeddable web chat — a channel any source can opt into, in addition to CRM channels. Page-filter targets scope which URLs show the widget; behavior settings control open/autoload; embedded mode allows custom CSS. Not required for agent creation — revisit when deploying to a website.

---

## 17. Sales Intelligence Pixel (lead enrichment — brief)

Two articles: **What is the Sales Intelligence Pixel?** + **Setup**. A tracking pixel you drop on the client's site. Enriches lead data, activates chat widgets, feeds contextual info into conversations. Not required for agent creation — revisit for lead-capture use cases.

---

## 18. Account / Billing (brief)

- **Plans:** Free, Business, Agency.
- **Agency:** custom API keys (providers), Rebilling, Wallet Credits, invited client user types.
- **Impersonation:** agencies can view client accounts.
- **Agent Share Links:** sharable test links for prospects (see also Client Testing Portal below).
- **Affiliates:** separate affiliate portal; existing affiliate accounts can be linked.

---

## 19. Pro Templates Library

- **50+ templates** for diverse industries.
- Included on annual plans; otherwise $499 one-time purchase (User Settings → Subscriptions → Add to Plan); occasionally earned via promos.
- Once acquired → permanent access to current + future templates.
- **Not plug-and-play.** Must: fill Job Information, edit actions for fit, update booking node to your calendar.

---

## 20. Client Testing Portal

Shareable, fully interactive job-flow demo link.

- Access via the **game controller button** in the Job Flow Builder.
- Create new link, copy URL, pause/resume/delete.
- Contact enters a website URL on open → system scrapes it → populates a temporary KB → contact chats with the demo. Contact can skip URL step.
- **Does not affect reporting data** — safe to share widely.
- **Applies your white-label settings** — no CloseBot branding exposed.

---

## 21. Keyboard Shortcuts (Job Flow Builder)

- **Multi-select actions:** `Cmd + Click` (or Ctrl + Click)
- **Lasso select:** hold `Shift` + drag
- **Delete selected:** `Backspace` / `Delete`

---

## 22. Reference Links

- Main docs: https://docs.closebot.com/en/
- API / developer portal: https://developers.closebot.com/
- Community: https://www.facebook.com/groups/closebot
- YouTube: https://www.youtube.com/@closebot
- Office Hours: https://community.closebot.com/c/office-hours/

---

## 23. Quick Decision Cheatsheet

**"What node do I use to …?"**

| Goal | Node |
|---|---|
| Ask the contact for info and save it | **Objective** (or Agent Node with `@`-mentioned variable) |
| Say something (fixed or AI-phrased) | **Statement** |
| Open-ended Q&A at the end of a path | **Conversation** |
| Book a calendar slot | **Booking** |
| Route based on variable comparison | **True/False** (2 paths) or **Switch** (N paths) |
| Always listen for an intent | **Custom Scenario** (or Aggression / Bot Detected pre-builts) |
| Halt agent messaging | **Stop Responding** |
| Pause for N seconds | **Delay (time)** |
| Pause until a field is populated | **Delay (variable)** |
| Update a CRM field | **Set Field** |
| Tag a contact | **Modify Tags (GHL/LC)** |
| Call any external API | **Custom Webhook** (or a **Custom Tool** in an Agent Node) |
| Qualify by service area | **Check Distance** (Other Action) |
| Real estate property data | **Get Property Details** (Other Action) |
| Roofing / siding / curb-appeal photo | **Generate Street View** (Other Action) |

---

## 24. Build-Time Checklist (assembled from docs-wide guidance)

1. ✅ Source connected, correct workspace, permissions approved (scroll to bottom on OAuth).
2. ✅ Source Filters configured — `ai off` is red by default; add green requireds if needed.
3. ✅ Persona created — avatar, name, voice styles (≤3 words), reply delay strategy, provider + fallback.
4. ✅ Job Flow Settings → Why the Conversation (no goals, no booking language) + Important Business Info (facts, not instructions).
5. ✅ Knowledge Library populated — prefer Text / TXT / CSV over PDF or Web Scrape.
6. ✅ Nodes built — never mention booking outside Booking nodes.
7. ✅ Custom Scenarios set (aggression, bot detected, disinterest, human-handoff). Start threshold 5.
8. ✅ Exits + Exit Tags wired on Agent Nodes. If exit tag is set with no description AND no `@@@`-mention → agent will never use it.
9. ✅ Custom Webhooks TESTED — Response box must be filled to expose output variables.
10. ✅ Follow-Ups configured — only fire on Objective/Booking steps, respect availability windows.
11. ✅ Smart FAQ enabled if live coverage of knowledge gaps is wanted.
12. ✅ Tested via Client Testing Portal before attaching to live source.
13. ✅ Persona attached to Job Flow, combined into an Agent.
14. ✅ Published.
