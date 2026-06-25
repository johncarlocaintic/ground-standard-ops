# KDL Audit + Fix Log — Mason Dixon Jiu-Jitsu v1.2

**Source KDL:** `masondixon-bot-clean.kdl`
**Bot being patched:** Mason Dixon Jiu-Jitsu - Launch v1.1 [discipline ask node] (2026-05-16)
**Audit date:** 2026-05-16
**Trigger:** QA sweep verdict NOT READY — 3 issues

---

## Issue #1 — Multi-Enrollee Adult Booking Not Firing

### Root Cause

The multi-enrollee path starts at AISwitch "Kids or Adult or more" (line 31, `a4ad7d05`), which routes "multiple enrollees" to MultiObjective `71994e0a` "For Kids or For Adults Booking."

That MultiObjective collects who needs to be booked and then routes to **Comparator `a9e0a4c5` "For adults?"** (line 1361):

```
AIExpression "The contact mentioned that the booking is for adults"
True  → adult data collection → adult booking
False → kids data collection → kids booking
```

When a lead says "both me and my son want to join," the AI evaluates this as FALSE (not adults-only) → kids path only → kid gets booked → adult booking never fires.

After the kids booking succeeds, the flow continues to **Statement "Confirm Appointment"** (line 1951), then **MultiObjective `fc10a3d6` "For another kid? 1"** (line 1830). This MultiObjective asks "is there another kid?" but its Description only mentioned kids — so the bot never offered to book the parent. An **AISwitch `14eb88f5` "Another Kid? 1"** follows (line 2194) with both "kid" and "adult" cases, where the adult case routes correctly to ModifyTags + adult data collection + adult booking. The routing is correct — the prompt was wrong.

**Compounding factor:** The Confirm Statement (Issue #2) was producing false "You and Jake are both booked" output, causing the test persona to send [END] before the "For another person?" MultiObjective could fire.

### Fix Applied

Changed MultiObjective `fc10a3d6` Title and Description (line 1836-1838):

**Before:**
```
Title "For another kid? 1"
Description "Determine if there is another kid they want to schedule a free trial class"
```

**After:**
```
Title "For another person? 1"
Description "Determine if there is another person — a child or the parent/adult themselves — they want to schedule a free trial class for. Ask {{contact.first_name}} if anyone else in the family also needs to be booked."
```

This causes the bot to explicitly ask "is anyone else — including you — also joining?" after the child is booked. When the adult says "yes, me," the AISwitch `14eb88f5` routes to the "adult" case → ModifyTags "add tag adult" → adult data collection (`3ba0712d-...-1768850499713`) → adult booking → adult confirmation.

**No structural changes required** — the adult routing path already existed and is correct.

---

## Issue #2 — False Closure on Failed Booking Path

### Root Cause

All Booking nodes (Kids 4-7, Kids 8-13, Adult BJJ, Adult Striking) have a single `Next handle` pointing to a "Confirm Appointment" Statement node. There is no separate fail/success routing from the Booking node — both outcomes route to the same Statement.

The Statement nodes use `UseAI true` with this prompt:
```
"Politely confirm the appointment schedule, date and time along with name, email, phone number, and the class they are booking for."
```

When the Booking node fails (no available slots matching the lead's preference), the AI is still told to "politely confirm the appointment schedule" — so it fabricates a confirmation with the lead's stated preference ("See you Saturday!" / "You're all set, Hayden!"). No GHL appointment exists.

This occurred in two test personas:
- **kid_10:** Kids 8-13 had no evening/weekend slots → bot closed with "You're all set, Hayden! Ryan or someone from the team will give you a call." → 0 GHL appointments
- **pricing_deflect:** No Saturday afternoon slots → bot closed with "See you Saturday!" → 0 GHL appointments

**Same mechanism caused Issue #1:** The multi-enrollee Statement (line 1951) said "You and Jake are both booked Monday, May 18th at 10am" even though only Jake's appointment existed — because the AI was told to "confirm the appointment" and it included the parent (Wesley) even though no adult booking was ever created.

### Fix Applied

Changed all "Confirm Appointment" Statement nodes with `replace_all`.

**Kids variant — before (2 occurrences):**
```
Statement "Politely confirm the kid's appointment schedule, date and time along with name, email, phone number, and the class they are booking for "
```

**Kids variant — after:**
```
Statement "If the child's free trial appointment was booked with a specific date and time, confirm those details — child's name, parent's name, email, phone number, and class. If no appointment was created or no specific slot was confirmed, do NOT say 'see you [day]' or 'you're all set' — instead say: 'Someone from our Mason Dixon team will reach out shortly to get the free trial scheduled.'"
```

**Adult/general variant — before (many occurrences):**
```
Statement "Politely confirm the {{contact.first_name}}'s appointment schedule, date and time along with name, email, phone number, and the class they are booking for."
```

**Adult/general variant — after:**
```
Statement "If {{contact.first_name}}'s free trial appointment was booked with a specific date and time, confirm those details — name, email, phone number, and class. If no appointment was created or no specific slot was confirmed, do NOT say 'see you [day]' or 'you're all set' — instead say: 'Someone from our Mason Dixon team will reach out shortly to get the free trial scheduled.'"
```

**Scope:** All Confirm Appointment Statement nodes in the bot — primary path, multi-enrollee path, adult BJJ path, adult Striking path, multi-kid paths.

---

## Issue #3 — Hardcoded Schedule Recitation (Standard Fail)

### Root Cause

When the Booking tool executes, it returns available time slots from the live GHL calendar. The bot's AI model (operating inside the Booking node) was reciting these slots verbally in the conversation:

> "We run Adult Fundamentals classes at 9:00 AM, 10:30 AM, 4:00 PM, and 5:30 PM Monday through Friday."

Per spec rule md_12: "When asked about class schedule, bot indicates the live booking tool will show available slots once contact info is collected. Does NOT recite a hardcoded weekly schedule."

The times were not hardcoded (they came from the live calendar), but the AI reciting them in text violates the spec's intent — the booking UI picker should handle slot selection, not the bot reading out times.

**Classification:** Standard fail (not a blocker) — booking still completed correctly despite the recitation.

### Fix Applied

Added a schedule-recitation rule to `conversationReason` in `__CONFIG__`:

**Before:**
```
conversationReason "You are part of the front desk team named Emma who works for Mason Dixon Jiu-Jitsu. Your goal is to help new leads learn about our martial arts programs and book a free trial class. Never quote membership pricing — redirect all pricing questions to the instructor consultation after the trial."
```

**After:**
```
conversationReason "You are part of the front desk team named Emma who works for Mason Dixon Jiu-Jitsu. Your goal is to help new leads learn about our martial arts programs and book a free trial class. Never quote membership pricing — redirect all pricing questions to the instructor consultation after the trial. When the booking tool is active, do not list or recite available class times — let the booking calendar show available slots."
```

---

## Summary of Changes

| Issue | Level | File Location | Type of Change |
|---|---|---|---|
| Multi-enrollee adult booking | Blocker | MultiObjective `fc10a3d6` (line 1836) | Description + Title text |
| False closure on failed booking | Blocker | All "Confirm Appointment" Statement nodes (15+ occurrences) | Statement prompt (replace_all) |
| Hardcoded schedule recitation | Standard | `__CONFIG__` conversationReason (line 2) | Appended rule |

## Files to Rebuild

1. Strip __zIndex on the edited clean KDL (text-only edits won't add new dupes, but run as a precaution)
2. Import as `Mason Dixon Jiu-Jitsu - Launch v1.2 [multi+closure fixes] (2026-05-16)` via `/closebot-build`
3. Run full re-test via `/closebot-test` — all 8 personas, focus on `adult_and_kid`, `kid_10`, `pricing_deflect`

## Expected Outcomes After v1.2

| Persona | Expected Result |
|---|---|
| adult_and_kid | 2 GHL appointments: adult + kid |
| kid_10 | 0 appointments, handoff language "team will reach out" |
| pricing_deflect | 0 appointments, handoff language "team will reach out" |
| adult_bjj (repeat x3) | 3/3 on Adult Fundamentals BJJ (unchanged) |
