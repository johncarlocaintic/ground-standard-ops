# Vacaville Bot — Structure & Analysis

Snapshot taken 2026-04-20 from live CloseBot API.
Source of truth: `bot-export.kdl` in this folder.

---

## Bot config (from `__CONFIG__` block)

**conversationReason:**
> You are part of the front desk team named "Emma" who works for "Vacaville Grappling Academy". Introduce yourself as "Emma" with Vacaville Grappling Academy. The contact reached out to us to learn more about our martial arts classes. You will professionally guide the contact thru series of questions and get important information about the enrollee and potentially book them for their free trial.
>
> Their website is www.vacavillegrappling.com
>
> When asking questions, we ask them one by one and avoid asking multiple questions in one go.
> You SHOULD NOT MENTION ANYTHING ABOUT WRESTLING OR WRESTLING CLASS
>
> Use Data Collection Friction Handling in knowledge base when contact refuses to provide information for whatever reason.

**businessInformation:** `The company name is Vacaville Grappling Academy`

**Global tools enabled:** `EnableLibraryContext`, `EnableGhlBooking`

---

## Node counts (176 total)

| Node type | Count | Purpose |
|---|---|---|
| MultiObjective | 69 | Question nodes — ask the lead for info, store to a variable |
| Booking | 29 | GHL calendar booking — one per program × age-group × branch |
| ModifyTags | 23 | Apply GHL tags (youth, adult, appointment booked, etc.) |
| Statement | 21 | Bot delivers a line (e.g. "Politely confirm the appointment...") |
| AISwitch | 12 | AI-classified branching on contact's answer |
| Comparator | 10 | Logic-based true/false branching |
| Conversation | 9 | Open Q&A segments |
| ScenarioCustom | 2 | Custom scenario handling |
| Source | 1 | Entry point |

---

## Flow map (top-level)

```
Source
  └─> MultiObjective: "Get Name"            → stores contact.first_name
        └─> AISwitch: "Kids or Adult or more"
              ├─ youth (below 18)         → add tag (youth)  → Kids flow
              ├─ adult (18+)              → add tag (adult)  → Adult flow
              ├─ both parent and child    → Combined flow
              └─ multiple enrollees       → Multiple flow (up to 4 hand-copied)
```

**Kids flow inner branching** (second AISwitch: "Types of Kids Classes"):
- 3–5 years old   → Booking: `Kids 3-5 BJJ`
- 7–13 years old  → Booking: `Kids 7-13 Jiu-Jitsu`
- 10–14 years old → (leftover branch — destination unclear, likely dead)

**Adult flow** → Booking: `Adult No-Gi Submission Grappling`

---

## What each node type stores (via KDL fields)

**MultiObjective** — every question node carries:
- `Title` — label
- `Description` — what info to gather
- `Prompt` — literal instruction to Emma (e.g. "Give a short intro of Vacaville Grappling Academy then ask for their name.")
- `Variable` — GHL contact field where the answer is saved (`contact.first_name`, `contact.youth_name`, `contact.email`, `contact.phone`, `contact.date_of_birth` etc.)
- `MaxAttempts`, `Sensitivity`, `SkipIfNotBlank` — behaviour tuning
- `Next handle="<id>"` — next node

**AISwitch** — AI-classified branching:
- `Description` — what the AI reads to classify (often `{{nodes.<id>.result[0]}}`)
- `AiCases` — named branches (e.g. "youth (below 18)", "multiple enrollees (kids and/or adult)")
- `AiCases:N handle="<id>"` — each branch's next node

**Comparator** — logic-based true/false branching (not AI).

**Booking** — GHL calendar booking:
- `CalendarName` — exact GHL calendar (e.g. `Kids 7-13 Jiu-Jitsu`)
- `Description` — dynamic, references prior node results
- `FailedTag` — tag applied on booking failure (`concierge - failed booking`)

**ModifyTags** — applies GHL tags (e.g. `youth`, `adult`, `appointment booked`).

**Statement** — bot delivers a line, `UseAI true` means the wording is generated; `Statement` field is the instruction.

---

## Complexity observations

1. **Duplication by design.** Many nodes share base IDs with suffixes like `-1768845441789-1768854224545-1769117315285`. That's the CloseBot UI's "duplicate node" pattern — you built a sub-flow once, then copied it into each enrollee-count branch. That's why there are `Adult's First Name 1/2/3/4`, `Date of Birth (Kid) 1/2/3/4`, etc.

2. **No loop primitive in CloseBot.** To handle "up to N enrollees," duplication is the only path. That structural limit is on CloseBot, not on JC's build.

3. **4 parallel chains on the top-level AISwitch** — one for each enrollee archetype (1 kid, 1 adult, both, multiple). That alone doubles or quadruples everything downstream.

4. **Dead/leftover branch candidate:** the "Age range 10 to 14 years old" case in the Kids AISwitch. Handle exists but no clear booking target. Could be leftover from iteration.

5. **29 booking nodes** — one per `(program × age-group × enrollee-branch)` combination. If we collapsed archetypes, this count would drop a lot.

---

## Open questions for redesign

Before touching the bot, need answers on:

1. **Realistic max enrollees per enquiry?** 1 kid alone? 1 adult alone? Parent + 1 kid? Parent + 2 kids? Adult + partner? This caps the required duplication depth.
2. **Do 7–13 and 10–14 kid age brackets both need to exist, or is one a leftover?**
3. **What's the actual class menu we want Emma booking into?** The bot currently references:
   - Kids 3-5 BJJ
   - Kids 7-13 Jiu-Jitsu
   - Adult No-Gi Submission Grappling
   - (10–14 branch exists but unclear)
4. **Is "free trial = one free class" always the offer, or are there multi-class trial packages?**
5. **When multiple enrollees, should the bot book each person into a separate calendar slot, or one group session?**
6. **Free trial question returned no response in April 18 Playwright test** — is this a known gap or a scenario bug?

---

## Next step (after Bobby confirms the above)

1. Decide target archetypes (likely: single-enrollee + group-of-N rather than 4 separate branches).
2. Sketch simplified flow on paper/whiteboard — goal is fewer nodes, fewer duplicated chains.
3. Use SSE tester (`shared/scripts/closebot/run_sse_test.js`) to battle-test the current bot against the scenarios we identify as must-pass.
4. Decide: rebuild from scratch vs edit in place. (Note: `POST /bot/{id}/save` is broken per Phase 1 discovery — node edits must happen via UI, or via duplicate-and-re-import.)
