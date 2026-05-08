# Vacaville Bot — Flow Trace, KB Cross-Reference, and Test Plan

**Author:** Claude Code analysis session (2026-04-20)
**Source of truth:** `bot-export.kdl` (2,389 lines, 176 nodes)
**KB reference:** `../vacaville_kb_working.txt` (v2.0.0-working)
**Bot ID:** `bot_9SWB45KI6PAJMX4Y`

---

## TL;DR — Critical Issues Found

Three issues are serious enough that they must be fixed before live testing is meaningful:

1. **SOURCE BLEED — bot prompt lists programs that don't exist at Vacaville.** The `Kids Classes` MultiObjective prompt hardcodes *"Kickboxing: Kids age 4 to 5; BJJ: Kids age 6 to 8; Kickboxing: Kids age 6 to 11; BJJ: Kids age 9 to 13; Kickboxing: Kids age 12 to 15."* Vacaville offers **none of these**. This is another gym's class menu leaking in — a GSA-standard violation (per context.md "Source bleed is a hard validation failure"). Lines: 667, 889.

2. **KB vs CONFIG CONTRADICTION on wrestling.** Bot config says *"You SHOULD NOT MENTION ANYTHING ABOUT WRESTLING OR WRESTLING CLASS."* KB says industry is *"Brazilian Jiu-Jitsu and Wrestling"* and FAQ answers *"All classes are No-Gi Brazilian Jiu-Jitsu and wrestling."* Bot has `EnableLibraryContext` — it CAN see the KB. The bot will contradict itself depending on which signal wins.

3. **Tag labeling bug.** Line 564-571: a `ModifyTags` node is *titled* "add tag (youth)" but actually adds the `adult` tag. That's a silent routing bug — leads tagged wrong in GHL.

Everything else is structural / cleanup-level. These three need decisions before testing is worth the tokens.

---

## Flow Trace (Annotated Walkthrough)

### Entry Sequence

```
Source
  → Get Name (MultiObjective, stores contact.first_name)
  → Interest (MultiObjective — "Determine if contact is interested in free trial")
  → Interested in Sign Up? (Comparator, AI-judged on interest)
    ├─ False → Convince (Conversation: "convince contact to try free trial") → EOC
    └─ True  → Identify Enrollee 1 (MultiObjective, stores contact.program_interest)
             → Main AISwitch
```

**ScenarioCustom "Sign Up" (threshold 7):** interrupts anywhere when contact shows sign-up intent (gives DOB, name, etc.) → jumps straight to `Identify Enrollee`.

### Main AISwitch — "Kids or Adult or more"

Classifies the inquiry into four archetypes:

| Branch | Case | Destination |
|---|---|---|
| 0 | youth (below 18) | add tag (youth) → Kids flow A |
| 1 | adult (18+) | add tag (adult) → Adult flow B |
| 2 | both parent and child | Kids flow variant (C) with double data collection |
| 3 | multiple enrollees (kids and/or adult) | Branch D — the complex "For Kids or For Adults Booking" multi-person flow |

### Branch A — Youth Only (kid solo inquiry)

```
add tag (youth)
  → Minor's Full Name 1   (→ contact.youth_name)
  → Date of Birth (Kid)1   (→ contact.youth_birthday)
  → Adult's First Name + Last Name   (→ contact.first_name / last_name — PARENT NOW)
  → Get Email   (→ contact.email)
  → Get Phone   (→ contact.phone)
  → Date of Birth (Adult)   (→ contact.date_of_birth — PARENT'S DOB)
  → Kids Classes 1 (MultiObjective — ⚠️ wrong program list in prompt)
  → Types of Kids Classes (AISwitch)
      ├─ Age 3-5  → Booking: Kids 3-5 BJJ
      ├─ Age 7-13 → Booking: Kids 7-13 Jiu-Jitsu
      └─ Age 10-14 → Booking: Kids 10-14 BJJ  (NOT dead — exists at line 1103)
  → Confirm Appointment (Statement)
  → Reminders (Statement)
  → add tag (appointment booked)
  → Conversation (open Q&A) → EOC
```

**Note:** The previous analysis flagged the 10-14 branch as a possible dead end. It's not — there's a `Booking` node at line 1103 for Kids 10-14 BJJ. That branch IS wired.

### Branch B — Adult Only

```
add tag (adult)
  → Adult's First Name 1 + Last Name   (→ contact.first_name / last_name)
  → Date of Birth (Adult)   (→ contact.date_of_birth)
  → Get Email
  → Get Phone
  → Booking Adult No-Gi Submission Grappling
  → Confirm Appointment
  → add tag (appointment booked)
  → Next flow... (continues to some post-booking conversation)
```

### Branch C — "Both Parent and Child"

Uses the `-1769116418604` suffix chain — essentially a duplicate of Branch A but triggered for scenarios where the contact explicitly indicates both themselves and a child. Same structure: Minor info → Parent info → Kids class routing → Booking. **This branch uses the same Kids Classes prompt with the wrong program list.**

### Branch D — "Multiple Enrollees"

This is the largest subsystem — it handles sequential bookings for multiple people.

```
For Kids or For Adults Booking (asks how many + types)
  → For adults? (Comparator)
      ├─ True  → Adult flow (clone 1.1) → Booking → "Another adult?" MultiObjective
      │         → Another Booking for Adult 1? (AISwitch)
      │             ├─ adult → Adult flow (clone 1.2) → "Another adult?" 2
      │             │         → Another Booking for Adult 2? → clone 1.3 → 3 → 4 (up to 4 adults)
      │             └─ kid   → Kids flow (multi-kid variant)
      └─ False → Kids flow (multi-kid variant)
                → Kids flow repeats with "Another kid?" loops
```

**This is where 90% of the node count comes from.** Hand-duplicated up to 4 deep for adults, plus nested "another kid" loops. CloseBot has no loop primitive, so this is forced — but the depth may be unnecessary (see Bobby questions #1, #5).

### Terminal Patterns

Every booking subtree ends with the same 4-node coda:
```
Booking → Confirm Appointment (Statement) → add tag (appointment booked) → Conversation → EOC
```
This is duplicated ~8 times across the whole flow. Every duplicate is a maintenance liability — if you change the reminder text, you have to change it in 8 places.

---

## KB Cross-Reference — Does Bot Have KB-Adequate Answers?

For questions likely to come up during a real conversation:

| Question | KB has it? | Bot can answer correctly? | Notes |
|---|---|---|---|
| Where are you located? | ✅ | ✅ | KB Section 2 |
| What classes do you offer? | ✅ | ⚠️ | KB has 4 programs. Kids Classes prompt hardcodes DIFFERENT programs (kickboxing). Bot will pick between them unpredictably. |
| Do you offer kickboxing? | ✅ (no) | ❌ | Bot prompt says yes. Will hallucinate. |
| Do you offer wrestling? | ✅ (yes) | ❌ | Config says no wrestling. Contradiction. |
| How much does it cost? | ✅ (redirect) | ⚠️ | No explicit pricing ScenarioCustom. Depends on whether KB's declarative facts override bot instinct. |
| My kid is 6 — what class? | ✅ (no program) | ❌ | AISwitch only has 3-5 / 7-13 / 10-14 cases. Age 6 falls into gap; AI will probably misroute. |
| My kid is 10 — 7-13 or 10-14? | ✅ (both) | ❌ | AISwitch forces one-or-the-other. Can't present both. |
| My kid is 14 — kid or adult? | ✅ (both) | ❌ | Main AISwitch has "below 18 = youth". 14 never sees the adult option. |
| Is there a free trial? | ✅ | ⚠️ | KB has full answer. Playwright test got no response — reason unclear, possible scenario gap. |
| What should I wear? | ✅ | ✅ | KB Section 4 |
| Can I bring a guest? | ✅ | ✅ | KB Section 4 |
| Do you use CLA? | ✅ | ✅ | KB FAQ |

---

## Structural Issues Inventory

| # | Issue | Severity | Location/Count | Impact |
|---|---|---|---|---|
| S1 | Source bleed: kickboxing/wrong-BJJ program list in Kids Classes prompts | **HIGH** | 2-3 nodes | Bot will offer classes that don't exist |
| S2 | Wrestling mention contradiction (config vs KB) | **HIGH** | Config + KB | Bot contradicts itself |
| S3 | Tag labeling bug — "add tag (youth)" adds `adult` | **HIGH** | Line 564-571 | GHL routing wrong |
| S4 | MaxAttempts = "99" on most MultiObjectives | **MEDIUM** | ~40 nodes | SMS carrier Error 30007 risk (context.md says max 2) |
| S5 | Variable collision: `contact.first_name` used for both inquirer-adult AND parent | **MEDIUM** | Multiple | When flow revisits first_name, it overwrites. Same for last_name, date_of_birth. |
| S6 | No age 6 handler in Types of Kids Classes AISwitch | **MEDIUM** | AISwitch @ line 100 | Age 6 inquiry routes unpredictably |
| S7 | Age-14 misrouted (top AISwitch splits at 18) | **MEDIUM** | Main AISwitch | Age 14 never sees adult option even though KB offers both |
| S8 | Age-10-13 overlap collapsed to one branch | **MEDIUM** | Kids AISwitch | AISwitch picks one of two valid programs; KB says present both |
| S9 | Heavy duplication (~8x on terminal coda) | LOW | ~40 nodes | Maintenance burden, not a correctness bug |
| S10 | `Sensitivity 3` on one node (likely typo for 30 or 50) | LOW | Line 1788 | Adult's First Name 1.4 may over-match |
| S11 | No explicit pricing ScenarioCustom | LOW | — | Relies on KB redirect. Works if KB is facts-only (it is). |
| S12 | No member-tag check | LOW | — | Re-engages existing members. Less risky for a DEMO bot. |

---

## Test Plan — Competency Checklist

Derived from the flow trace. Each row = one SSE test scenario. Expected behavior is what the bot *should* do per its KDL; flag if it deviates.

### Happy Paths (should pass)

| # | Scenario | Persona | Expected End State |
|---|---|---|---|
| T1 | Adult signing up for themselves | 28yo beginner, no kids | Tagged adult, booked Adult No-Gi |
| T2 | Parent for one kid age 4 | Parent of 4yo | Tagged youth, kid booked Kids 3-5 BJJ |
| T3 | Parent for one kid age 9 | Parent of 9yo | Tagged youth, kid booked Kids 7-13 Jiu-Jitsu |
| T4 | Adult age 30 wants to try | Generic prospect | Same as T1 |

### Edge Cases (will expose bugs)

| # | Scenario | Persona | Expected | Predicted Bug |
|---|---|---|---|---|
| T5 | Parent for kid age 6 | Parent of 6yo | Explain no program, offer waitlist | Bot will misroute into one of 3-5/7-13/10-14 |
| T6 | Parent for kid age 10 | Parent of 10yo | Present both 7-13 and 10-14 options | Bot will pick ONE via AISwitch |
| T7 | 14-year-old inquiring | 14yo | Present Kids 10-14 AND Adult | Goes to kids only (AISwitch ≤18 = youth) |
| T8 | Parent + 2 kids of different ages | Parent of 5yo + 10yo | Book 2 kids in different programs | Branch D flow should handle, untested |
| T9 | Couple: adult + adult | Two adults | Book both into Adult No-Gi | Branch D "multi-adult" path |
| T10 | Ask about kickboxing | Curious prospect | "We don't offer kickboxing, we offer No-Gi BJJ" | **Bot will say yes we have kickboxing** (source bleed) |
| T11 | Ask about wrestling classes | Curious prospect | Undefined (KB says yes, config says don't mention) | **Contradiction surface — either ignores or mentions** |
| T12 | Ask about pricing | Price-sensitive | Redirect to instructor at trial class | Depends on KB facts working through AI |
| T13 | Not ready to book | Window shopper | Convince + nurture path | Comparator routes to Conversation |
| T14 | Existing member inquires | Member check | Should stop responding | **No member check exists — bot will engage** |

### Compliance Checks (auto-fail triggers)

| # | Rule | How to detect |
|---|---|---|
| C1 | No pricing figures mentioned by bot | Regex `\$\d` in bot replies |
| C2 | No booking language before Booking node hit | Track SSE `action` events for node hits vs. keywords |
| C3 | Each outbound message ≤ ~100 chars | SSE `message-sent` body length |
| C4 | No multiple-questions-per-message | Count `?` per message (>1 = flag) |
| C5 | No urgency language | Regex `act now|limited time|don't miss` |
| C6 | No wrestling mention | Regex `wrestling|wrestle` in bot replies |
| C7 | No kickboxing mention | Regex `kickbox` in bot replies |

---

## Recommended Order of Operations

Given what we found, testing the bot as-is will mostly confirm known bugs. Better sequence:

### Phase 1 — Fix the Source Bleed + Tag Bug (Before Any Testing)
Can't test meaningfully while kickboxing phantoms live in the prompts. This is 3 nodes to fix:
- Lines 667, 889 — replace Kids Classes prompt with correct Vacaville class list from KB
- Lines 564-571 — fix the tag bug (title says youth, adds adult)
- Bot config line 2 — decide on wrestling language (say yes or delete the prohibition)

⚠️ **Reminder:** `POST /bot/{id}/save` is broken per Phase 1 discovery. These fixes must be UI edits or a duplicate-and-reimport workflow.

### Phase 2 — Decide the 6 Open Questions (Bobby Input)
Per `bot-structure.md`, these determine the redesign scope:
1. Realistic max enrollees per inquiry?
2. Do 7-13 and 10-14 both exist, or retire one?
3. Confirmed class menu (vs. the KB)?
4. Free trial = single class or package?
5. Multi-enrollee = separate slots or group?
6. Free trial response gap — known or bug?

### Phase 3 — Baseline Test (Current Bot, Post-Fix)
Run T1-T14 above via SSE. Log actual vs. expected. This tells us:
- Does the bot route correctly when the prompt is clean?
- Where does AI classification diverge from intended branches?
- Which edge cases genuinely break (vs. being masked by the source bleed)?

### Phase 4 — Redesign Decisions
Based on Phases 2 + 3, decide:
- **Rebuild from scratch** (leaner, loop-free by necessity but less duplication at top level)
- **Surgical in-place edits** (keep structure, fix bugs)
- **Rebuild with a cleaner archetype split** (single-person, group-of-2, group-3+ rather than 4 flavors by headcount)

---

## Learnings for `/closebot-test` Skill Design

Things I learned from this trace that will shape the test skill:

1. **Test runner must track SSE `action` events** — not just messages — so we can verify which nodes were hit (catches "bot said the right thing but via the wrong branch").
2. **Per-bot config files** need to declare: expected program menu, expected age cutoffs, KB version pinned, forbidden-words list (like "wrestling" here). The test plan is derived from this config + the KDL + the KB.
3. **Source bleed is a real-world failure mode**, not a theoretical one. The skill should have a pre-flight check: scan bot KDL prompts for product names that don't appear in the KB. That would have caught the kickboxing issue in <1 second.
4. **Variable collision detection is valuable** — scan KDL for the same `Variable` used by multiple MultiObjectives, flag where one might overwrite another mid-flow.
5. **The "competency checklist" format here is the right shape** — each scenario is a testable row with persona + expected end state + predicted bug. The skill should generate these from the KDL.

---

## Files This Analysis References

- `clients/ground-standard/closebot/vacaville/bot-export.kdl` (source of truth)
- `clients/ground-standard/closebot/vacaville/bot-structure.md` (high-level map)
- `clients/ground-standard/closebot/vacaville_kb_working.txt` (KB v2.0.0)
- `clients/ground-standard/context.md` (Section 11 — Build Standards, Section 6 — Technical Overview)
- `shared/scripts/closebot/run_sse_test.js` (for Phase 3 testing)
