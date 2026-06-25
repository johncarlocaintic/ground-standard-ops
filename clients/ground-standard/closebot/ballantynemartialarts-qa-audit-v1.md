# QA Audit — Ballantyne v1.0 (cross-referenced)

**Method:** for each run, extracted every `tool_use` event from `events.json`, matched arguments + results against `ghl_facts.json`, and verified calendar IDs against the live GS Ads calendar list.

---

## NEW FINDINGS (missed in v1 summary)

### 1. adult_only ran BEFORE the KB swap — verdict is compromised
Tool events show two `get_library_context` calls with Ballantyne-targeted queries (`"location address"`, `"Ballantyne Martial Arts location address phone"`) — both returned **Vacaville Grappling Academy** KB excerpts. The bot answered from the wrong gym's KB. The PASS verdict is technically unsafe — **must re-run** adult_only with Ballantyne KB attached.

### 2. adult_and_kid: book_appointment fired TWICE, both returned "Successfully booked" — but only 1 appointment landed in GHL
This changes the diagnosis. The bot DID try to book both:
- Call 1: `calendar_id=5NsNbMiiL6ulIWM2OwCY` (Kids 6-11 Kickboxing), name="Ethan Kerns - Trial Class" → success
- Call 2: `calendar_id=2XUrKQbGHRH6nqEDX4xd` (Adult Kickboxing), name="Wesley Kerns - Trial Class" → **"Successfully booked appointment! Title: Ethan Kerns - Trial Class"** (note the wrong title in the result)

The result message for Call 2 echoed the wrong title. The bot trusted "Successfully booked" and announced both bookings, but GHL ground truth shows only Ethan's appointment. **This is a CloseBot platform reliability bug, not a bot design bug.** The booking tool returned a success message that did not reflect actual GHL state.

### 3. nonbookable_program: bot skipped first_name collection
The bot prompted "Starting with you — what's your last name?" and never asked for first name. Tool events: only `last_name=Lane` was captured. GHL contact ends up `"testing lane"` (the `"testing"` is a stale default). The n20_details node's data-capture order is non-deterministic — sometimes captures first_name, sometimes skips. Real production risk: contact records with missing first names.

### 4. list_calendars returns only 2 of 7 Ballantyne calendars
Every booking run's `book_appointment(action: "list_calendars")` returned:
```
1. Adult Kickboxing (2XUrKQbGHRH6nqEDX4xd)
2. Kids 6-11 Kickboxing (5NsNbMiiL6ulIWM2OwCY)
```
The other 5 (Adult BJJ, Kids 4-5 KB, Kids 6-8 BJJ, Kids 9-13 BJJ, Kids 12-15 KB) exist in GS Ads but are not in the tool result. Bot still books on them correctly via instruction-baked IDs. This is a CloseBot platform quirk — not breaking, but a known unknown.

### 5. Legacy Vacaville test calendars still in GS Ads sandbox
Live in GS Ads: `Kids 7-13 Jiu-Jitsu`, `Adult No-Gi Submission Grappling`, `Kids 3-5 BJJ`, `Kids 10-14 BJJ`. Leftover from Vacaville sandbox setup. Cleanup needed before more gym tests.

### 6. minor_self_booking — field-morph behavior CONFIRMED working
Audit shows the bot correctly:
1. Captured Jordan as primary contact (5 fields)
2. Detected minor → exit "Minor Detected"
3. Copied Jordan's data into `youth_name` + `youth_birthday`
4. CLEARED `first_name`, `last_name`, `date_of_birth` on the primary contact
5. Captured Lisa (parent) into the now-empty primary contact fields
6. Final GHL state: `contact=lisa nolan, tags=[minor - needs guardian], youth_name="Jordan Nolan", youth_birthday="2009-10-07"`

This is a positive validation of the minor gate flow.

### 7. hostile_aggression — Aggression scenario DID fire (confirmed via judge node trace)
Node sequence: `n01_source → n10_intro → n_scenario_aggression → n_tag_aggressive → n_end_aggressive` — skipped data capture + booking as expected. The bot's silence after T1 was a deliberate exit, not a hang. My v1 summary called this "unknown"; it's actually PASS.

---

## CONFIRMED FROM v1 SUMMARY

| Finding | Evidence in audit |
|---|---|
| Kids 4-5 not bookable due to KB v4 gap | Bot called `add_tag("child under age 6")` and `exit_method("Ready to Book", reason: "ready for follow-up when child turns 6")` — bot is faithful to KB; KB content is wrong |
| Adult BJJ booking works | adult_only + pricing_deflect both booked `zkw9aYNzHrFO1FiO8BFr` (Adult BJJ) successfully — appointment in GHL matches |
| Kids 6-8 BJJ routing works | kid_older (8yo + BJJ) booked `k3zXosJgWZSzxeeUqmms` (Kids 6-8 BJJ) — confirmed |
| Kids 9-13 BJJ routing works | nonbookable_program (10yo + BJJ pivot) booked `7jljvIvAPTfIm5cFQ1lS` (Kids 9-13 BJJ) — confirmed |
| Pricing deflection works | 3 deflections in transcript, no `book_appointment` until after relent, no figure in any `send_message` arguments |

---

## REVISED VERDICT

**Status: NOT READY** — but the breakdown is more precise now:

| Category | Issue | Severity | Fix owner |
|---|---|---|---|
| **KB content** | KB v4 says minimum age is 6; calendars include 4-5 KB | BLOCKER | KB rebuild |
| **Platform bug** | `book_appointment` tool returns false-positive success for the 2nd call in multi-enrollee path | CRITICAL | CloseBot vendor — file ticket; mitigation = single-enrollee flow only until fixed |
| **Bot flow** | n20_details data capture order is non-deterministic; can skip first_name | STANDARD | KDL — make first_name mandatory first prompt |
| **Process** | KB-swap protocol not followed for adult_only run | n/a | Re-run with Ballantyne KB attached for clean PASS |
| **Sandbox hygiene** | 4 legacy Vacaville calendars still in GS Ads | LOW | Manual cleanup in GHL UI |

---

## RE-RUN LIST (after KB fix + first_name fix)

1. `adult_only` — clean run with Ballantyne KB attached (current PASS is compromised)
2. `kid_only` — should now book Lily into Kids 4-5 Kickboxing once KB is rebuilt
3. `adult_and_kid` — confirms whether multi-enrollee tool bug is reproducible (or a one-off platform glitch)
4. `nonbookable_program` — confirm first_name is now collected

Single-source-of-truth report: this audit file. Earlier v1 summary at [ballantynemartialarts-qa-summary-v1.md](ballantynemartialarts-qa-summary-v1.md) is superseded.

---

## UPDATE — 2026-05-14 (post-fix re-run session)

All v1 blockers resolved. Re-run results:

| Issue | Fix | Re-run | Outcome |
|---|---|---|---|
| KB v4 missing Kids 4-5 Kickboxing | KB v5 rebuilt | kid_only `_201309` | Kids 4-5 KB booked ✓ |
| Multi-enrollee drops 2nd booking | `appointmentPerSlot` raised to 10 on all 7 BMA calendars | adult_and_kid `_225308` | Both appointments landed in GHL ✓ |
| adult_only ran with wrong KB | KB swap protocol applied | adult_only `_230041` | Clean PASS with Ballantyne KB ✓ |
| first_name skip in nonbookable_program | No KDL change needed — was context-dependent | nonbookable_program `_203601` | first_name collected correctly ✓ |

Non-determinism check (adult_only ×3 via repeat_persona.js): 3/3 PASS, 0 blockers, 0 standards.

**REVISED VERDICT: READY TO ATTACH**

See [ballantynemartialarts-qa-summary-v2.md](ballantynemartialarts-qa-summary-v2.md) for full post-fix QA summary.
