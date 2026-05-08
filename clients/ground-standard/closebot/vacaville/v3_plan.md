# Vacaville Grappling Academy — CloseBot v3 Build Plan

**Status:** DRAFT — awaiting JC sign-off before any KDL work  
**Base:** v2 FIXED v2 (`bot_5DIU3OM57G2P8O59`, 51 nodes) — incremental rebuild  
**Source:** 15 TODOs from `tasks/todo.md` + corpus patterns from `conversation_study.md §6`

---

## Approach

Incremental rebuild from v2, not a full rewrite. The v2 happy path is proven working. V3 adds:
- ~8 new Scenario nodes (early-catch patterns)
- Config/settings changes (toggles in CloseBot UI)
- Persona additions (2 new rules in `__CONFIG__`)
- Minor modifications to existing Booking node Descriptions

**v2 legacy bots are never touched.** v3 gets a new bot ID.

---

## Part 1 — Configuration Changes (CloseBot UI, no KDL)

These require no code change. Done in CloseBot UI after the bot is created.

| Setting | Where | Action |
|---|---|---|
| **Debounce burst messages** | Job Flow Settings → Persona Response Delay | Set to **Realistic (20–45s)** |
| **Conversational Rescheduling** | Job Flow Settings → Important Business Info | **Enable** |
| **Smart FAQ** | Tools tab | **Enable** |
| **Chat Summary** | Tools tab | **Enable**, map output to `contact.ai_summary` custom field (confirm field key from `vacaville_fields.json`) |

> **Before build:** verify `contact.ai_summary` exists in Vacaville's field list. If not, Bobby needs to create it in GHL first.

---

## Part 2 — Persona Additions (`__CONFIG__.conversationReason`)

Two new rules appended to the existing Persona text:

**Rule 1 — Merge-token guard:**
> "Never send a message that contains literal template tokens such as `{{`, `First_name`, `Last_name`, or any unreplaced placeholder text. If a variable appears to contain a token rather than real data, ask the contact for the relevant information instead."

**Rule 2 — SMS reaction ignore:**
> "If an incoming message appears to be an SMS reaction notification — for example it starts with 'Liked', 'Loved', 'Laughed at', 'Emphasized', or contains a quoted previous message preceded by a reaction word — do not reply to it. Treat it as if no new message was sent and take no action."

---

## Part 3 — New Scenario Nodes

Each Scenario fires before the normal flow when detected. They are listed in priority order (higher priority = fires first on ambiguous input).

### S1 — "Who is this?" Re-intro
**Trigger:** Contact expresses confusion about who sent the message, asks "who is this", "how did you get my number", doesn't remember signing up.  
**Priority:** 80 | **Threshold:** 6

```
ScenarioCustom id="ns01_who_is_this" {
    AllowReEntry ""
    Priority 80
    Threshold 6
    Title "Who Is This Re-intro"
    Description "Contact does not recognize the sender, asks who sent this message, or has forgotten signing up."
    Next handle="nd01_who_intro"
}
Conversation id="nd01_who_intro" {
    ExtraPrompt "Re-introduce yourself as Emma from Vacaville Grappling Academy. Explain that this contact signed up for information about a free trial class through a social media ad or online form. Keep it friendly and brief — one or two sentences max — then invite them to ask any questions or book a trial. Do not push if they say it was a mistake."
    Next handle="n06_whofor_ask"
}
```

> **Decision for JC:** After re-intro, should the bot route to `n06_whofor_ask` (continue the flow) or to a softer Conversation node first? My recommendation: route to `n06` — if they're confused they'll say so and we exit; if they remember, they can continue.

---

### S2 — Wrong Sport Exit
**Trigger:** Contact asks about judo, karate, wrestling (as standalone sport), muay thai, boxing, kung fu — anything that isn't BJJ/grappling.  
**Priority:** 75 | **Threshold:** 6

```
ScenarioCustom id="ns02_wrong_sport" {
    AllowReEntry ""
    Priority 75
    Threshold 6
    Title "Wrong Sport Exit"
    Description "Contact asks about a martial art we do not offer: judo, karate, wrestling program, muay thai, boxing, or similar."
    Next handle="nd02_wrong_sport_msg"
}
Conversation id="nd02_wrong_sport_msg" {
    ExtraPrompt "Clarify that Vacaville Grappling Academy specializes in No-Gi Brazilian Jiu-Jitsu and Submission Grappling. Wrestling techniques are part of the grappling curriculum but there is no standalone wrestling class. If this is not what they were looking for, thank them warmly and let them know they're welcome back if they ever want to try grappling. Do not continue the booking flow — let the conversation end naturally."
    Next handle="EOC"
}
```

---

### S3 — Military / LE / First Responder Detection
**Trigger:** Contact mentions being military, law enforcement, police, sheriff, CHP, first responder, firefighter, or similar.  
**Priority:** 75 | **Threshold:** 6

```
ScenarioCustom id="ns03_mil_le_fr" {
    AllowReEntry ""
    Priority 75
    Threshold 6
    Title "Mil/LE/FR Handoff"
    Description "Contact mentions military service, law enforcement, police, sheriff, CHP, first responder, or firefighter background."
    Next handle="nd03_mil_tag"
}
ModifyTags id="nd03_mil_tag" {
    Title "Tag: needs-handoff-discount"
    TagsToAdd {
        _ {
            id "tag_mil_handoff"
            Tag "needs-handoff-discount"
        }
    }
    Next handle="nd03_mil_msg"
}
Statement id="nd03_mil_msg" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Mil/LE/FR Thank You"
    Statement "Thank the contact for their service and let them know a team member will reach out personally to assist them. Do not mention pricing or any discount figures."
    Next handle="nd03_mil_stop"
}
StopResponding id="nd03_mil_stop" {
    Title "Stop - Mil/LE/FR Handoff"
    __position 0.0 0.0
    __zIndex 1
}
```

> **Note:** Bot never quotes the 15% discount. Tag triggers human follow-up. No pricing rule applies here.

---

### S4 — Drop-In Traveler Path
**Trigger:** Contact mentions they are visiting Vacaville temporarily, in town for a short time, asks about drop-in sessions, or mentions training at another gym elsewhere.  
**Priority:** 70 | **Threshold:** 6

```
ScenarioCustom id="ns04_dropin" {
    AllowReEntry ""
    Priority 70
    Threshold 6
    Title "Drop-In Traveler"
    Description "Contact is visiting Vacaville temporarily or asks about a single drop-in session rather than membership."
    Next handle="nd04_dropin_tag"
}
ModifyTags id="nd04_dropin_tag" {
    Title "Tag: concierge - drop-in"
    TagsToAdd {
        _ {
            id "tag_dropin"
            Tag "concierge - drop-in"
        }
    }
    Next handle="nd04_dropin_msg"
}
Statement id="nd04_dropin_msg" {
    Attachment ""
    MoveOn ""
    UseAI true
    Title "Drop-In Handoff Message"
    Statement "Welcome the visiting practitioner warmly. Let them know that one of the team will reach out shortly with drop-in details and scheduling. Do not attempt to book through the standard trial class flow."
    Next handle="nd04_dropin_stop"
}
StopResponding id="nd04_dropin_stop" {
    Title "Stop - Drop-In Handoff"
    __position 0.0 0.0
    __zIndex 1
}
```

---

### S5 — Location Too Far (Reactive)
**Trigger:** Contact mentions they are far from Vacaville, gives a distant city or ZIP, or expresses concern about distance.  
**Priority:** 65 | **Threshold:** 6  
**Important:** Bot never asks about location proactively. This only fires when the lead volunteers distance info.

```
ScenarioCustom id="ns05_location_far" {
    AllowReEntry ""
    Priority 65
    Threshold 6
    Title "Location Too Far"
    Description "Contact mentions they are far away from Vacaville or expresses that the distance may be a problem."
    Next handle="nd05_location_msg"
}
Conversation id="nd05_location_msg" {
    ExtraPrompt "Acknowledge the distance and empathize without being pushy. Let them know that many members do make the drive because of the quality of training, but you completely understand if it's not convenient. Keep their info on file in case anything changes. Do not pressure them to book — let the conversation end naturally if they want to exit."
    Next handle="EOC"
}
```

---

### S6 — Age Out of Range (Early Catch)
**Trigger:** Parent volunteers a child's age or year of birth that clearly falls outside all program ranges (under 3 or over 14).  
**Priority:** 65 | **Threshold:** 7

```
ScenarioCustom id="ns06_age_out" {
    AllowReEntry ""
    Priority 65
    Threshold 7
    Title "Age Out of Range"
    Description "Parent mentions a child's age that is under 3 or over 14 — outside all available youth programs."
    Next handle="nd06_age_out_msg"
}
Conversation id="nd06_age_out_msg" {
    ExtraPrompt "Acknowledge the parent's inquiry warmly. Explain that current programs start at age 3 (Kids 3-5) and the youth programs go up to age 14. If the child doesn't fit any current program, let the parent know the team will follow up if new programs open up. Offer a graceful, friendly exit — no pressure."
    Next handle="EOC"
}
```

> **Note:** The AISwitch age routing at nodes n21/n42/n52 still serves as a fallback for ages collected via DOB during the structured flow. This scenario catches early mentions before collection starts.

> **Open question for JC:** Should we add a 4th AISwitch case ("under 3 or over 14") to n21/n42/n52 to handle the case where the parent gives a valid-looking DOB that computes out-of-range during the flow? Currently those nodes have no out-of-range exit — if age is totally off, AI will pick the "closest" case. Low priority — corpus suggests most out-of-range leads self-identify early.

---

### S7 — SMS Reaction Ignore
**Note:** The Persona instruction in Part 2 (Rule 2) is the primary handling. A Scenario cannot cleanly "do nothing" — it always routes somewhere. Routing to EOC would prematurely end the conversation; routing to a Conversation node might produce a response.

**Recommendation:** Persona instruction only. No scenario node. Flag this as a known limitation — CloseBot has no native "no-op" route. If reactions are causing problems post-launch, the workaround is a Conversation node with instructions to say nothing (blank acknowledgment), but this risks a confusing empty response.

> **Decision for JC:** Accept Persona-only handling for SMS reactions, OR add a Scenario that routes to a Conversation node instructed to produce no visible response? My recommendation: Persona-only for now, revisit if it's an issue in production.

---

## Part 4 — Flow Modifications (Existing Nodes)

### 4a — Specific-Slot Booking Language

Add a sentence to all 10 Booking node Descriptions instructing the AI to offer a specific time:

**Add to end of each Booking node's Description:**
> `"Offer a specific available time slot by name (e.g., 'How does Wednesday at 5:15 PM sound?') rather than asking an open-ended question like 'when are you free?'."`

**Affected nodes:** n16, n22, n23, n24, n43, n44, n45, n53, n54, n55

This matches the corpus pattern from §5 of conversation_study.md — Kurt always offers a specific slot, never asks permission to book.

### 4b — Remove Interest-Level Gauge (Proposed)

Nodes `n03_interest`, `n04_interest_check`, `n05_convince` exist in v2 to gauge whether the lead wants a free trial before proceeding. The corpus (§1) shows that leads who reply to an outbound message are already showing intent — the "gauge interest" step adds friction without value.

**Proposal:** Remove n03, n04, n05 and route n02_getname directly to n06_whofor_ask.

> **Decision for JC:** Remove the interest check? It's 3 nodes and one extra back-and-forth turn. Corpus supports removing it, but it's a behavior change worth signing off on explicitly.

---

## Part 5 — Bobby's Action Items (Not Bot Changes)

These cannot be done from the bot side. Bobby needs to act on them separately.

| Item | What Bobby needs to do |
|---|---|
| **Appointment title template** | In GHL, set per-calendar appointment title template to `{{contact.name}} — {{contact.youth_name}}`. Makes booked appointments self-identifying per child. |
| **`cancelled` tag exclusion** | Confirm: should contacts tagged `cancelled` also be filtered out of the fresh-lead bot flow? Currently excluded tags per §SCOPE are: `booked, member, alumni, spam, staff, service, showed, unsubscribed, spam likely`. Need yes/no on `cancelled`. |
| **`ai_summary` custom field** | Confirm or create a GHL custom field to receive the Chat Summary tool output. Check `shared/logs/vacaville_fields.json` first — may already exist. |

---

## Part 6 — Open Questions (Need Answers Before Build)

1. **Interest check removal (§4b):** Remove n03/n04/n05 and route straight to n06? Yes / No.
2. **Age out-of-range AISwitch 4th case (§3 S6 note):** Add explicit out-of-range exit to n21/n42/n52? Yes / No. (Recommend: yes, low effort, adds safety.)
3. **"Who is this?" post-re-intro routing (§3 S1 note):** Route back to n06 after re-intro, or softer exit first?
4. **SMS reaction handling (§3 S7):** Persona-only or add a no-response Scenario?
5. **Cancelled tag exclusion:** Bobby to confirm.
6. **ai_summary field key:** Confirm field exists in Vacaville before enabling Chat Summary.

---

## Part 7 — Proposed Node Inventory (v3)

### Inherited from v2 (modified or unchanged)
| Node | Change |
|---|---|
| `__CONFIG__` | Add 2 Persona rules (merge-token guard, reaction ignore) |
| `n02_getname` | Route to `n06_whofor_ask` if interest check is removed; else unchanged |
| `n16, n22, n23, n24, n43, n44, n45, n53, n54, n55` | Add specific-slot language to Descriptions |
| `n03, n04, n05` | Remove if interest check approved for removal |
| All others | No change |

### New nodes (v3 additions)
| Handle | Type | Purpose |
|---|---|---|
| `ns01_who_is_this` | ScenarioCustom | Who is this? trigger |
| `nd01_who_intro` | Conversation | Re-intro message |
| `ns02_wrong_sport` | ScenarioCustom | Wrong sport trigger |
| `nd02_wrong_sport_msg` | Conversation | Wrong sport exit |
| `ns03_mil_le_fr` | ScenarioCustom | Mil/LE/FR trigger |
| `nd03_mil_tag` | ModifyTags | Add needs-handoff-discount |
| `nd03_mil_msg` | Statement | Thank you for service |
| `nd03_mil_stop` | StopResponding | Halt bot |
| `ns04_dropin` | ScenarioCustom | Drop-in trigger |
| `nd04_dropin_tag` | ModifyTags | Add concierge - drop-in |
| `nd04_dropin_msg` | Statement | Drop-in handoff |
| `nd04_dropin_stop` | StopResponding | Halt bot |
| `ns05_location_far` | ScenarioCustom | Distance concern trigger |
| `nd05_location_msg` | Conversation | Acknowledge distance, soft exit |
| `ns06_age_out` | ScenarioCustom | Age out-of-range trigger |
| `nd06_age_out_msg` | Conversation | Age out-of-range exit |

**Total new nodes:** ~16  
**Total v3 nodes:** ~64 (if interest check removed) or ~67 (if kept)

---

## Part 8 — What Is NOT in v3

Per `conversation_study.md §7` — these are fresh-lead-only bot exclusions. None of these will be designed in:
- Payment changes, card swaps, pause requests
- Schedule changes for existing members
- Post-class logistics, lost items
- Retention / re-engagement of alumni
- Tournament signups for current competitors

**Agent Node features** are also out of scope — CloseBot Agent Node is disabled on our account. Revisit after JC talks to support.

---

## Corpus-Derived Test Recommended Before Build

One adversarial test against v2 using an archetype from corpus §1 — specifically the "Who is this?" or "ultra-terse info ping" opener. Confirms v2 baseline behavior before v3 baseline starts. Waiting for JC "go."

---

---

## Build Notes (Actual vs Planned)

**Bot ID:** `bot_2XEBD57XFF85PS4D`  
**Status:** Published, attached to `src_GDKORXSW4Q8RQUQ8` (Vacaville Grappling Academy)  
**KB:** `file_8ZV4PPX1N6Q2X1XM` updated to v2.1.0 (was v1.5.0)  
**KDL:** `shared/logs/vacaville_v3.kdl`  

**Deviations from plan:**

| Item | Plan | Actual |
|---|---|---|
| Scenario count | 6 new scenarios | 5 kept (max limit is 5 per bot). Wrong sport, location far, age-out, reaction: moved to Persona instructions. |
| nd01_who_intro | Conversation node | Changed to Statement (Conversation can only route to EOC; Statement routes anywhere) |
| Stop Responding | `StopResponding` | `End` (correct KDL class name — discovered from nodeDescriptors) |
| KB upload | `file` form field | `newFile` form field (PUT API requirement) |
| Source | GS Ads src_4R4DUIQTMMX2NFPU | VGA src_GDKORXSW4Q8RQUQ8 — this is the correct production source with 73 fields + KB |
| Chat Summary field | contact.ai_summary | contact.concierge_conversation (existing LARGE_TEXT field, purpose-built for handoff context) |
| Appointment title template | Included | Removed (Bobby's GHL config, not bot's responsibility) |

**What the 5 kept scenarios handle:**
1. `n90_scenario_signup` — intent shown before "who is this for" question
2. `n91_scenario_no_additional` — decline after booking, prevent false re-engagement
3. `ns01_who_is_this` — identity confusion, source-context re-intro
4. `ns03_mil_le_fr` — military/LE/FR detection → tag + stop
5. `ns04_dropin` — drop-in traveler → tag + stop

*Plan written + built 2026-04-21.*
