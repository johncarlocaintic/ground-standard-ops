# Stack API Reference
## Verified Capabilities for Claude Code Automation
*Last verified: April 2026*

---

## Quick Summary

| Platform | API Coverage | Can Build Via API | Auth Method |
|---|---|---|---|
| Retell AI | ✅ Full | Agents, LLMs, functions, KBs, calls, phone numbers | Bearer token |
| CloseBot V2 | ✅ Full | Personas, KBs, leads, AND full bot/node creation via API. Confirmed by CloseBot support. Payload schemas require Phase 1 reverse-engineering before first write. | X-CB-KEY header |
| GoHighLevel | ⚠️ Partial | Contacts, opportunities, calendars, sub-accounts | Bearer token + Version header |
| N8N | ✅ Full CRUD | Workflows, activate/deactivate, executions | X-N8N-API-KEY header |
| Sympana | ❌ None | UI-only — no public API | N/A |

---

## Critical Gotchas (Read Before Building)

- **Retell AI**: Prompts live on the LLM, not the agent. Update via `PATCH /update-retell-llm/{llm_id}` — not the agent endpoint.
- **GHL**: `Version: 2021-07-28` header required on every request. Omitting it causes silent failures.
- **GHL**: Pipeline and workflow creation are UI-only. Pre-create in UI, fetch IDs via API.
- **GHL**: Custom field IDs (not names) required for field updates. Retrieve via Custom Fields V2 API.
- **GHL**: Token shown once at creation — copy immediately, cannot be retrieved later.
- **N8N**: No public execute endpoint — use Webhook trigger nodes instead. `POST /rest/workflows/{id}/run` returns 401 with API keys.
- **CloseBot**: V2 API at `api.closebot.com` is confirmed ~100% functional by CloseBot support — full programmatic bot creation is supported. Endpoints (`POST /bot`, `POST /bot/{id}/save`, `POST /bot/ai-create`, `GET /bot/node-descriptors`) are real. The only blocker: `botSteps` payload schema is not publicly documented. **Phase 1 must run before any write operations** — call `GET /bot/node-descriptors`, `GET /bot/{id}/export`, and `GET /bot/{id}/versions/{v}/steps` on a manually-built reference bot to capture the schema, then `POST /bot/{id}/save` becomes writable. Shortcut: try `POST /bot/ai-create` with natural language first — may bypass schema complexity entirely. V1 API (`api.closebot.ai/message`) is legacy, ignore it.
- **Sympana**: No API at all. Entire setup is UI-driven inside GHL Marketplace.

---

## 1. Retell AI

**Base URL:** `https://api.retellai.com`
**Auth:** `Authorization: Bearer YOUR_API_KEY`
**SDKs:** Python (`pip install retell-sdk`), TypeScript (`npm install retell-sdk`), MCP Server (`@retell-ai/mcp-server`)
**API Docs:** `https://docs.retellai.com`

### Two-Step Agent Creation Pattern

Prompts and tools live on the LLM config, not the agent. Always create LLM first, then agent.

**Step 1: Create LLM**
```
POST /create-retell-llm
```
```json
{
  "model": "gpt-4.1",
  "general_prompt": "You are a receptionist for...",
  "begin_message": "Hello! How can I help you today?",
  "general_tools": [
    {"type": "end_call", "name": "end_call", "description": "End the call"},
    {
      "type": "custom",
      "name": "check_availability",
      "description": "Check calendar availability",
      "url": "https://your-n8n-webhook.com/check",
      "method": "POST"
    }
  ],
  "model_temperature": 0,
  "knowledge_base_ids": ["kb_xxx"]
}
```

**Step 2: Create Agent**
```
POST /create-agent
```
```json
{
  "response_engine": {"type": "retell-llm", "llm_id": "llm_xxx"},
  "voice_id": "retell-Cimo",
  "agent_name": "Client Receptionist",
  "language": "en-US",
  "post_call_analysis_data": [
    {
      "type": "string",
      "name": "customer_name",
      "description": "The customer's full name",
      "required": true
    },
    {
      "type": "enum",
      "name": "call_outcome",
      "description": "Outcome of the call",
      "values": ["appointment_booked", "not_interested", "callback_requested"],
      "required": true
    }
  ]
}
```

### Key Endpoints

| Action | Method | Path |
|---|---|---|
| Create LLM | `POST` | `/create-retell-llm` |
| Update LLM (prompt) | `PATCH` | `/update-retell-llm/{llm_id}` |
| Create agent | `POST` | `/create-agent` |
| Update agent | `PATCH` | `/update-agent/{agent_id}` |
| List agents | `GET` | `/list-agents` |
| Delete agent | `DELETE` | `/delete-agent/{agent_id}` |
| Publish agent version | `POST` | `/publish-agent/{agent_id}` |
| Purchase phone number | `POST` | `/create-phone-number` |
| Create outbound call | `POST` | `/create-phone-call` |
| List calls | `POST` | `/list-calls` |
| Get call details | `GET` | `/get-call/{call_id}` |
| Create knowledge base | `POST` | `/create-knowledge-base` |
| Create batch call | `POST` | `/create-batch-call` |

### Limits
- Prompt max: 32,768 tokens (charges start after 3,500)
- Custom function result max: 15,000 characters
- Default concurrency: 20 concurrent calls
- Max call duration: 1 hour (configurable to 2 hours)
- Phone number purchase: US/Canada only (international via SIP)

---

## 2. CloseBot V2

**Base URL:** `https://api.closebot.com`
**Auth:** `X-CB-KEY: YOUR_API_KEY`
**API Docs:** `https://developers.closebot.com`

> ✅ CONFIRMED (April 2026): CloseBot support confirmed the V2 API is ~100% functional and supports full programmatic bot creation. Endpoints are real. The only gap is that `botSteps` payload schemas are not publicly documented — Phase 1 reverse-engineering is required before writing nodes. Do NOT treat as UI-only.

### What's Actually API-Ready (confirmed, schemas known or simple)

**Persona Management:** Full CRUD ✅ — create, list, get, update, delete personas

**Knowledge Base (Library):**

| Action | Confirmed |
|---|---|
| Upload file | ✅ |
| Web-scrape source | ✅ |
| Replace file content | ✅ |
| Attach / Detach file to source | ✅ |
| List / Delete file | ✅ |

**Other confirmed:** Lead CRUD + search, conversation logs + analytics, webhook event triggers, test session management, FAQ management, billing/agency management, CRM source management (GHL connection).

### What Needs Schema Discovery Before Use

**Bot creation and node flow configuration:**

| Action | Endpoint Exists | Schema Status |
|---|---|---|
| Create bot (shell) | ✅ `POST /bot` | ✅ Simple — name, templateId, folderId |
| Create bot with AI | ✅ `POST /bot/ai-create` | ⚠️ Unknown — test first, may be best shortcut |
| Import bot via KDL | ✅ `importKdl` field on POST /bot | ❌ KDL schema undocumented — needs reverse engineering |
| Save bot node structure | ✅ `POST /bot/{id}/save` | ❌ `botSteps` typed as `any` — schema unknown |
| Get node descriptors | ✅ `GET /bot/node-descriptors` | ⚠️ Response unknown — may be the Rosetta Stone |
| Get steps for a version | ✅ `GET /bot/{id}/versions/{v}/steps` | ⚠️ Response unknown — could serve as template |
| Export bot | ✅ `GET /bot/{id}/export` | ⚠️ Likely KDL format — useful for reverse engineering |
| Publish bot | ✅ `POST /bot/{id}/publish` | ✅ Simple — no complex schema |

### Phase 1 Schema Discovery (Required Before First Write)

Capability is confirmed. Phase 1 goal is now schema capture only — not validation. Exact sequence:

1. Build a simple reference bot manually in the UI (2 nodes: Objective → Conversation)
2. Call `GET /bot/node-descriptors` — captures all node type schemas (the Rosetta Stone)
3. Call `GET /bot/{id}/versions/{v}/steps` — captures internal node representation
4. Call `GET /bot/{id}/export` — captures full bot JSON/KDL format
5. **Try `POST /bot/ai-create` first** with a natural language description — if it works cleanly, this bypasses manual schema construction entirely
6. Use captured schemas to write `POST /bot/{id}/save` payloads programmatically via Claude Code

### Limits
- Scenario descriptions must be under 25 words (platform rule, not API limit)
- V2 API launched mid-2025 — still evolving, documentation lagging
- AI provider configuration is UI-only — no API endpoint found

---

## 3. GoHighLevel (GHL) V2

**Base URL:** `https://services.leadconnectorhq.com`
**Auth:** `Authorization: Bearer YOUR_TOKEN` + `Version: 2021-07-28`
**API Docs:** `https://marketplace.gohighlevel.com/docs/`
**Token creation:** Agency Settings → Private Integrations → Create New

> ⚠️ Token is shown ONCE at creation. Copy immediately. Cannot be retrieved later.

### What's API-Accessible vs UI-Only

| Action | API? | Notes |
|---|---|---|
| Create contact | ✅ | |
| Upsert contact | ✅ | |
| Update contact custom fields | ✅ | Requires field ID not name |
| Apply tags | ✅ | Include in contact create/update |
| Create opportunity | ✅ | Requires pre-existing pipelineId + stageId |
| Create calendar | ✅ | |
| Create sub-account | ✅ | Requires $497 Agency Pro plan |
| Add contact to workflow | ✅ | Workflow must pre-exist |
| List workflows | ✅ | Read-only |
| List pipelines | ✅ | Read-only — get IDs here |
| **Create pipeline** | ❌ | UI-only |
| **Create pipeline stages** | ❌ | UI-only |
| **Create workflow/automation** | ❌ | UI-only |

### Key Endpoints

**Create contact:**
```
POST /contacts/
```
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "locationId": "LOCATION_ID",
  "tags": ["lead", "qualified"],
  "customFields": [{"id": "field_id", "value": "Value"}]
}
```

**Create opportunity** (fetch pipelineId/stageId first via `GET /opportunities/pipelines`):
```
POST /opportunities/
```
```json
{
  "title": "New Lead",
  "stageId": "stage_id",
  "pipelineId": "pipeline_id",
  "contactId": "contact_id",
  "status": "open"
}
```

**Add contact to workflow:**
```
POST /contacts/{contactId}/workflow/{workflowId}
```

**Create sub-account:**
```
POST /locations/
```

### Limits
- Rate limit: 100 requests / 10 seconds, 200,000 requests / day
- Contact pagination max: 100 per request
- Sub-account creation requires $497 Agency Pro plan

---

## 4. N8N

**Base URL (cloud):** `https://<account>.app.n8n.cloud/api/v1/`
**Auth:** `X-N8N-API-KEY: YOUR_API_KEY`
**Key creation:** Settings → n8n API → Create an API Key
**JC's cloud instance:** `leadgenlistings.app.n8n.cloud`

### Key Endpoints

| Action | Method | Path |
|---|---|---|
| List workflows | `GET` | `/api/v1/workflows` |
| Create workflow | `POST` | `/api/v1/workflows` |
| Update workflow | `PUT` | `/api/v1/workflows/{id}` |
| Delete workflow | `DELETE` | `/api/v1/workflows/{id}` |
| Activate workflow | `POST` | `/api/v1/workflows/{id}/activate` |
| Deactivate workflow | `POST` | `/api/v1/workflows/{id}/deactivate` |
| List executions | `GET` | `/api/v1/executions` |
| Create credential | `POST` | `/api/v1/credentials` |

### Triggering Workflows Externally

No direct execute endpoint exists. Use a Webhook trigger node then call:
```
POST https://leadgenlistings.app.n8n.cloud/webhook/<your-path>
```

| URL type | Active when |
|---|---|
| `.../webhook/<path>` | Workflow is activated |
| `.../webhook-test/<path>` | 120s after clicking "Listen for test event" |

### Limits
- Cloud webhook timeout: ~100 seconds
- No direct execute API — webhook only
- Max webhook payload: 16MB
- Best practice for workflow creation: build in UI, export JSON, use as template for API creation

---

## 5. Sympana Connector

**API:** None. Entirely UI-configured.
**Install:** GHL Marketplace → search Sympana → install per sub-account

### GHL Workflow Actions It Adds

**Paid ($0.005/trigger):**
- Place Call — initiates outbound AI call via Retell/Vapi
- Get Call Data — retrieves post-call summary, PCA data, duration, status
- Wait For Leads Timezone — holds until lead's local calling window

**Free:**
- Book/reschedule/cancel appointments
- Check available time slots
- Add/retrieve/update contacts
- Timezone resolver

### Data Flow
- **GHL → Retell/Vapi**: contact info, phone numbers, calendar data
- **Retell/Vapi → GHL**: call summaries, PCA fields, booking actions, tags, pipeline stage updates

### Limitations
- No public API — all config is UI-driven
- GHL-only CRM (HubSpot/Pipedrive coming soon)
- Only supports Retell AI and Vapi
- Launched November 2025 — documentation sparse

---

## Realistic Client Onboarding Pattern

**Manual (UI required — do once per client):**
1. Create GHL pipeline + stages in GHL UI
2. Create GHL automation workflows in GHL UI
3. Install and configure Sympana in GHL Marketplace

**Automated via Claude Code scripts:**
1. Create Retell LLM config with prompt + functions → `POST /create-retell-llm`
2. Create Retell agent → `POST /create-agent`
3. Purchase/assign phone number → `POST /create-phone-number`
4. Create Retell knowledge base → `POST /create-knowledge-base`
5. Create CloseBot persona + KB via API → attach to bot shell created via API → build node flow in UI (until Phase 1 testing confirms programmatic node creation is viable)
6. Create GHL sub-account if needed → `POST /locations/`
7. Create GHL contacts/custom fields → GHL API
8. Create N8N webhook workflows → N8N API
9. Seed GHL with contacts/opportunities → GHL API

**Result: ~3 manual steps instead of ~30 per new client once scripts are built.**
