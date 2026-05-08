# GoHighLevel MCP Integration for Retell AI Voice Agents

Comprehensive patterns for integrating Retell AI voice agents with GoHighLevel CRM using MCP server.

## Overview

GoHighLevel MCP server provides direct CRM access from voice agents without custom webhooks. This enables real-time contact creation, updates, tagging, and workflow triggers during voice conversations.

**Key Benefits:**
- No webhook infrastructure needed
- Real-time CRM updates during calls
- Automatic lead routing based on qualification
- Returning caller recognition
- Seamless workflow automation

## MCP Server Configuration

### Authentication

**URL**: `https://services.leadconnectorhq.com/mcp/`

**Authentication Method**: Private Integration Token (PIT), NOT regular API key

**Required Scopes:**
- View/Edit Contacts
- View Calendars  
- View Calendar Events
- Edit Calendar Events
- View Custom Fields

**Headers:**
```
Authorization: Bearer <your-pit-token>
locationId: <sub-account-id>
```

**Creating PIT:**
1. GHL Dashboard → Settings → Private Integrations
2. Create new integration
3. Select required scopes
4. Copy token (store securely)

### Tool Naming Convention

**Pattern**: `category_action-detail`
- Underscore separates category from action
- Hyphens separate words within action
- All lowercase

**Examples:**
- `contacts_create-contact`
- `contacts_update-contact`
- `contacts_search-contact`
- `contacts_add-tags`
- `calendars_get-calendar-events`
- `calendars_create-appointment`

### Parameter Format

**Critical**: ALL parameters use **camelCase**, not snake_case

```
Good: firstName, lastName, contactId, phoneNumber
Bad: first_name, last_name, contact_id, phone_number
```

## Common Integration Patterns

### Pattern 1: Create Contact on Call Start (INBOUND)

**Use Case**: Capture every inbound lead immediately, even if they hang up early.

**Workflow:**
1. Call connects
2. Agent opens with greeting
3. Ask for name ("What's your name?")
4. Immediately create GHL contact with name + caller ID

**Tool Configuration:**
```json
{
  "type": "custom",
  "name": "create_lead_contact",
  "description": "Create contact in CRM immediately after caller provides their name. Call this right after getting their first name, before any qualification questions. Use caller_id from {{user_number}} for phone number.",
  "url": "https://services.leadconnectorhq.com/contacts/",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_PIT_TOKEN",
    "Content-Type": "application/json",
    "Version": "2021-07-28",
    "locationId": "YOUR_LOCATION_ID"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "firstName": {
        "type": "string",
        "description": "Caller's first name"
      },
      "lastName": {
        "type": "string",
        "description": "Caller's last name if provided"
      },
      "phone": {
        "type": "string",
        "description": "Phone number in E.164 format from {{user_number}}"
      },
      "source": {
        "type": "string",
        "description": "Always set to 'Voice AI Inbound'"
      },
      "tags": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Initial tags: ['Voice-Lead', 'Needs-Qualification']"
      }
    },
    "required": ["firstName", "phone", "source", "tags"]
  },
  "speak_during_execution": true,
  "speak_during_execution_message": "Perfect, let me note that down.",
  "speak_after_execution": false,
  "response_data": [
    {
      "name": "contact_id",
      "path": "$.contact.id",
      "description": "Store contact_id for future updates"
    }
  ]
}
```

**Prompt Integration:**
```
## WORKFLOW - Contact Creation
Step 1: Opening greeting
Step 2: Ask: "What's your name?"
Step 3: IMMEDIATELY call create_lead_contact with:
  - firstName: what they said
  - phone: {{user_number}} in E.164 format
  - source: "Voice AI Inbound"
  - tags: ["Voice-Lead", "Needs-Qualification"]
Step 4: Store returned contact_id for later use
Step 5: Continue with qualification questions

IMPORTANT: Create contact BEFORE starting qualification. This ensures we capture the lead even if they hang up early.
```

### Pattern 2: Progressive Updates During Qualification

**Use Case**: Update contact with qualification data as conversation progresses.

**Workflow:**
1. Contact created (Pattern 1)
2. Each qualification answer → update custom field
3. End of call → final update with score/routing

**Custom Fields Setup (in GHL):**
```
age (number)
home_ownership_status (dropdown: own/mortgage/rent)
equity_percentage (text)
primary_intent (text)
timeline (dropdown: immediate/30-days/60-days/exploring)
lead_score (number)
qualification_date (date)
```

**Tool Configuration:**
```json
{
  "type": "custom",
  "name": "update_qualification_data",
  "description": "Update contact with qualification information after collecting an answer. Call this after EACH qualification question to progressively build the lead profile.",
  "url": "https://services.leadconnectorhq.com/contacts/{{contact_id}}",
  "method": "PUT",
  "headers": {
    "Authorization": "Bearer YOUR_PIT_TOKEN",
    "Content-Type": "application/json",
    "Version": "2021-07-28",
    "locationId": "YOUR_LOCATION_ID"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "contactId": {
        "type": "string",
        "description": "Contact ID from create_lead_contact response"
      },
      "customFields": {
        "type": "object",
        "description": "Qualification data as key-value pairs",
        "properties": {
          "age": {"type": "number"},
          "home_ownership_status": {"type": "string"},
          "equity_percentage": {"type": "string"},
          "primary_intent": {"type": "string"},
          "timeline": {"type": "string"}
        }
      }
    },
    "required": ["contactId", "customFields"]
  },
  "speak_during_execution": false,
  "speak_after_execution": false
}
```

**Prompt Integration:**
```
## PROGRESSIVE QUALIFICATION UPDATES
After EACH qualification question, call update_qualification_data:

Question 1 (Age): 
Caller responds → Call update_qualification_data with customFields: {age: [number]}

Question 2 (Home Status):
Caller responds → Call update_qualification_data with customFields: {home_ownership_status: [answer]}

Question 3 (Equity):
Caller responds → Call update_qualification_data with customFields: {equity_percentage: [answer]}

[etc.]

This builds complete lead profile even if call disconnects mid-qualification.
```

### Pattern 3: Tag-Based Routing

**Use Case**: Route leads to appropriate workflows based on qualification outcome.

**GHL Tag Strategy:**
```
Lead Quality Tags:
- Hot-Lead (62+, primary, 50%+ equity, immediate)
- Warm-Lead (62+, primary, exploring)
- Cool-Lead (qualified but no urgency)
- Not-Qualified (didn't meet criteria)

Status Tags:
- Voice-Lead (all voice leads)
- Needs-Qualification (created, not qualified yet)
- Qualified (completed qualification)
- Transferred (sent to LO)
- Appointment-Booked (scheduled callback)

Disqualification Reason Tags:
- DQ-Age (under 62)
- DQ-Investment-Property (not primary residence)
- DQ-Low-Equity (insufficient equity)
```

**Tool Configuration:**
```json
{
  "type": "custom",
  "name": "add_routing_tags",
  "description": "Add tags to contact based on qualification outcome. Call this at the END of qualification before transfer or booking. Tags determine which GHL workflow triggers.",
  "url": "https://services.leadconnectorhq.com/contacts/{{contact_id}}/tags",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_PIT_TOKEN",
    "Content-Type": "application/json",
    "Version": "2021-07-28",
    "locationId": "YOUR_LOCATION_ID"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "contactId": {
        "type": "string",
        "description": "Contact ID from create_lead_contact"
      },
      "tags": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Tags to add based on qualification outcome"
      }
    },
    "required": ["contactId", "tags"]
  },
  "speak_during_execution": false,
  "speak_after_execution": false
}
```

**Prompt Integration:**
```
## ROUTING LOGIC WITH TAGS

IF qualified as HOT LEAD:
  Call add_routing_tags with tags: ["Hot-Lead", "Qualified", "Transferred"]
  Then call transfer_call

IF qualified as WARM LEAD:
  Call add_routing_tags with tags: ["Warm-Lead", "Qualified", "Appointment-Booked"]
  Then call book_appointment_cal

IF NOT QUALIFIED (age):
  Call add_routing_tags with tags: ["Not-Qualified", "DQ-Age"]
  End call politely

IF NOT QUALIFIED (property type):
  Call add_routing_tags with tags: ["Not-Qualified", "DQ-Investment-Property"]
  End call politely
```

### Pattern 4: Returning Caller Recognition

**Use Case**: Personalize conversation for returning callers.

**Workflow:**
1. Call connects
2. Search GHL by phone number ({{user_number}})
3. If found → greet by name, reference previous interaction
4. If not found → standard new caller flow

**Tool Configuration:**
```json
{
  "type": "custom",
  "name": "search_existing_contact",
  "description": "Search for existing contact by phone number at start of call. Use this BEFORE asking for name to check if this is a returning caller.",
  "url": "https://services.leadconnectorhq.com/contacts/search",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer YOUR_PIT_TOKEN",
    "Content-Type": "application/json",
    "Version": "2021-07-28",
    "locationId": "YOUR_LOCATION_ID"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "phone": {
        "type": "string",
        "description": "Phone number from {{user_number}} in E.164 format"
      }
    },
    "required": ["phone"]
  },
  "speak_during_execution": true,
  "speak_during_execution_message": "One moment...",
  "speak_after_execution": false,
  "response_data": [
    {
      "name": "existing_contact_id",
      "path": "$.contact.id",
      "description": "Contact ID if found, null if new caller"
    },
    {
      "name": "contact_name",
      "path": "$.contact.firstName",
      "description": "First name if returning caller"
    },
    {
      "name": "last_interaction",
      "path": "$.contact.lastActivity",
      "description": "Date of last interaction"
    }
  ]
}
```

**Prompt Integration:**
```
## OPENING FLOW - Returning Caller Check

Step 1: Call connects
Step 2: Immediately call search_existing_contact with phone: {{user_number}}
Step 3: Check response:

IF existing_contact_id found:
  "Welcome back, [contact_name]! I see we spoke with you on [last_interaction]. How can I help you today?"
  Store existing_contact_id for updates (don't create new contact)

IF no existing_contact_id:
  "Good [morning/afternoon], this is [Agent Name] with [Company]. What's your name?"
  Continue with Pattern 1 (create new contact)
```

### Pattern 5: Appointment Booking Integration

**Use Case**: Book appointments in GHL calendar from voice agent.

**Prerequisites:**
- Calendar configured in GHL
- Calendar ID obtained
- Appointment types defined

**Tool Configuration:**
```json
{
  "type": "custom",
  "name": "book_loan_officer_appointment",
  "description": "Book appointment in GHL calendar for qualified warm leads. Call this after qualification when caller agrees to schedule callback.",
  "url": "https://services.leadconnectorhq.com/calendars/events/appointments",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_PIT_TOKEN",
    "Content-Type": "application/json",
    "Version": "2021-07-28",
    "locationId": "YOUR_LOCATION_ID"
  },
  "parameters": {
    "type": "object",
    "properties": {
      "calendarId": {
        "type": "string",
        "description": "GHL calendar ID (pre-configured)"
      },
      "contactId": {
        "type": "string",
        "description": "Contact ID from earlier in conversation"
      },
      "startTime": {
        "type": "string",
        "description": "ISO 8601 datetime for appointment start"
      },
      "appointmentTitle": {
        "type": "string",
        "description": "Appointment title, e.g., 'HECM Qualification Call'"
      },
      "notes": {
        "type": "string",
        "description": "Qualification summary for loan officer"
      }
    },
    "required": ["calendarId", "contactId", "startTime", "appointmentTitle"]
  },
  "speak_during_execution": true,
  "speak_during_execution_message": "Let me check availability and get that booked for you.",
  "speak_after_execution": true,
  "speak_after_execution_message": "All set! You'll receive a confirmation with details shortly.",
  "response_data": [
    {
      "name": "appointment_id",
      "path": "$.appointment.id",
      "description": "Appointment ID for confirmation"
    },
    {
      "name": "appointment_time",
      "path": "$.appointment.startTime",
      "description": "Confirmed appointment time"
    }
  ]
}
```

## Best Practices

### CREATE vs UPSERT Pattern

**Critical Discovery**: Use CREATE + ADD_TAGS, not upsert.

**Why**: Upsert REPLACES all tags, losing existing ones.

**Pattern:**
```
1. Search contact by phone
2. IF exists: Use existing contact_id, ADD tags
3. IF new: Create contact, SET initial tags
```

**Code:**
```
IF search_existing_contact returns contact_id:
  Use that contact_id
  Call add_routing_tags (ADDS to existing tags)
ELSE:
  Call create_lead_contact (SETS initial tags)
  Use returned contact_id
```

### Phone Number Format

**Always use E.164 format**: +1XXXXXXXXXX

**From caller ID:**
```
{{user_number}} is already in E.164 format
Use directly in phone field
```

**If collecting from user:**
```
Ask: "What's your phone number?"
Parse: Remove spaces, dashes, parentheses
Format: +1 + 10 digits
Validate: Must be exactly 11 chars (+1 + 10 digits)
```

### Error Handling

**Always handle GHL API errors gracefully:**

```
## ERROR HANDLING FOR GHL CALLS

IF create_lead_contact fails:
  Continue conversation normally
  Don't mention CRM issue to caller
  Log error for manual follow-up
  Still qualify and route appropriately

IF update_qualification_data fails:
  Continue conversation
  Data already captured in earlier call
  
IF add_routing_tags fails:
  Still execute transfer or booking
  Manually tag later from call recording
```

### speak_during_execution Settings

**For background operations (CREATE, UPDATE):**
```
speak_during_execution: true
speak_during_execution_message: "Let me note that down." / "Perfect, saving that."
speak_after_execution: false
```

**For user-facing operations (SEARCH, BOOK):**
```
speak_during_execution: true
speak_during_execution_message: "One moment, checking that..."
speak_after_execution: true
speak_after_execution_message: "All set!" / "Got it!"
```

**Reasoning**: 
- Background ops: Brief acknowledgment, move on
- User-facing ops: Confirm completion explicitly

### Custom Fields Strategy

**Design custom fields for:**
1. **Qualification criteria** (age, equity, etc.)
2. **Routing logic** (lead_score, qualification_status)
3. **Agent performance** (call_duration, questions_completed)
4. **Follow-up context** (last_objection, next_step)

**Avoid:**
- Storing entire transcripts (use recording link)
- Redundant data (already in standard fields)
- Temporary calculation values

## Testing GHL Integration

**Test Checklist:**
- [ ] Contact creation works
- [ ] Progressive updates work
- [ ] Tags added correctly
- [ ] Returning caller recognized
- [ ] Appointments book successfully
- [ ] Errors handled gracefully
- [ ] Workflows trigger properly in GHL
- [ ] Data visible in GHL dashboard

**Testing Tools:**
- GHL Test Mode (if available)
- Create test contact in GHL before call
- Verify data in GHL after each test call
- Check GHL workflow trigger logs

## Example: Complete HECM Integration

**Full workflow combining all patterns:**

```
## COMPLETE GHL INTEGRATION FLOW

CALL START:
1. Call search_existing_contact (Pattern 4)
   - IF found: Greet by name, use existing_contact_id
   - IF not found: Continue to step 2

2. Ask: "What's your name?"

3. Call create_lead_contact (Pattern 1)
   - firstName: [answer]
   - phone: {{user_number}}
   - source: "Voice AI Inbound"
   - tags: ["Voice-Lead", "Needs-Qualification"]
   - Store: contact_id

QUALIFICATION:
4. Ask age → Call update_qualification_data with {age: X}
5. Ask home status → Call update_qualification_data with {home_ownership_status: X}
6. Ask equity → Call update_qualification_data with {equity_percentage: X}
7. Ask intent → Call update_qualification_data with {primary_intent: X}
8. Ask HUD counseling → Call update_qualification_data with {hud_counseling: X}

ROUTING:
9. Determine qualification outcome

IF HOT LEAD:
  10a. Call add_routing_tags with ["Hot-Lead", "Qualified", "Transferred"]
  10b. Call transfer_call
  
IF WARM LEAD:
  10a. Call add_routing_tags with ["Warm-Lead", "Qualified", "Appointment-Booked"]
  10b. Call book_loan_officer_appointment
  
IF NOT QUALIFIED:
  10a. Call add_routing_tags with ["Not-Qualified", "DQ-[reason]"]
  10b. Polite exit
```

## Troubleshooting Common Issues

**Issue**: Tags not appearing in GHL
- Check: Using POST to /tags endpoint (not PUT)
- Check: Tags array format correct
- Check: locationId header included

**Issue**: Contact creation fails
- Check: PIT token has correct scopes
- Check: Phone number in E.164 format
- Check: Required fields included

**Issue**: Returning callers not recognized
- Check: Search using exact phone format as stored
- Check: Phone field normalized in GHL (no spaces/dashes)

**Issue**: Appointments not booking
- Check: calendarId valid for this location
- Check: startTime in future (not past)
- Check: startTime in ISO 8601 format

## Summary

GoHighLevel MCP integration enables:
- ✓ Real-time lead capture
- ✓ Progressive qualification data collection
- ✓ Intelligent tag-based routing
- ✓ Returning caller personalization  
- ✓ Seamless appointment booking
- ✓ Automatic workflow triggers

**Key Success Factors:**
1. Use CREATE + ADD_TAGS pattern (not upsert)
2. Format phone numbers consistently (E.164)
3. Set up custom fields before integration
4. Handle errors gracefully
5. Test thoroughly before production

**Remember**: GHL MCP eliminates webhook infrastructure while providing powerful CRM integration. The patterns above are production-proven and handle edge cases effectively.
