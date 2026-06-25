# CloseBot Support — Follow-up on Vacaville `update_contact` / `add_tag` silent failures

**Date:** 2026-05-07
**Account:** Ground Standard (CB key — Vacaville Grappling Academy source)
**Prior ticket:** `update_contact` silent failure on Vacaville bot — escalated to dev team earlier this week, evidence lead `lead_test_HCS0WS8EQZ1STXMH`

---

## TL;DR

Thanks for the dev-team escalation on the original ticket — **the fix is partially live**. After today's verification run, 4 of 5 `update_contact` fields are now writing through to GHL correctly. However, **two related silent-failure paths are still live**:

1. **`update_contact` for the `phone` field** still reports success but writes nothing to GHL (the original symptom from the 2026-05-06 ticket — only this one field).
2. **`add_tag` for the `action opt-in` tag** has the same pattern: tool returns "Successfully added", but the tag is missing from the contact record in GHL.

Full reproduction evidence below. Both look like the same family of bug as the original — tool-side success report, but the actual write to GHL is dropped silently.

---

## Setup for today's test

- **Bot:** `Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)`
  - bot ID: `bot_GBIF5HQVM8FPQ0XJ`
- **Mimic source (testSession `mimicSourceId`):** `src_GDKORXSW4Q8RQUQ8` (Vacaville production source)
- **Test lead ID:** `lead_test_HF10VERDLBATFMG9`
- **Test session created at:** 2026-05-07T14:34:57.232Z
- **Real GHL contact created:** id `3BHmztEuln3zSBopgLI1`, name "Kennedy Hayes", on Vacaville location `JFnXPPTB9Rkgyi0KOUv8`

The bot ran a clean end-to-end conversation (12 turns), exited cleanly through the qualification methods, called `book_appointment` successfully, and the appointment landed in the live GHL calendar (`eP72M7eCi37bpN7Shg2a`) for Mon 2026-05-11 6:30 PM. So the routing and downstream booking are healthy.

---

## Issue #1 — `update_contact` still silently dropping the `phone` field

### What the bot reported (CloseBot tool log, full success message)

Tool call (turn 7 of the conversation):

```
toolName:    update_contact
toolCallId:  toolu_012f2XBuGuCJQkxShQgAWsgj
arguments:   { "field_name": "contact.phone", "field_value": "925 485 5443" }
result:      "Successfully updated contact.phone to \"925 485 5443\"."
```

Same message format as the four other `update_contact` calls in the same conversation (first_name, last_name, email, date_of_birth) — all four of those returned identical success messages **and** all four wrote successfully to GHL after your fix.

### What landed in GHL

Pulled via GHL API V2 `GET /contacts/3BHmztEuln3zSBopgLI1` (`Version: 2021-07-28`):

| Field | Bot's `update_contact` value | GHL stored value |
|---|---|---|
| firstName | Kennedy | Kennedy ✅ |
| lastName | Hayes | Hayes ✅ |
| email | tester.hayes.sujj@donotuse.com | tester.hayes.sujj+9153830376133569442@donotuse.com (CloseBot test-session `+N` dedupe suffix — expected) ✅ |
| dateOfBirth | 07/14/1994 | 1994-07-14 (ISO normalization — fine) ✅ |
| **phone** | **925 485 5443** | **(blank)** ❌ |

Phone search across all formats returned zero matches:

```
search "925 485 5443"   → 0 matches
search "+19254855443"   → 0 matches
search "9254855443"     → 0 matches
```

So the field genuinely never got written, not just stored under a normalized form we missed.

### Reproduces the original 2026-05-06 ticket exactly

- Original ticket reported phone-blank on contacts Brennan Doyle / Jamie Reyes.
- Today's verification run reproduces the same thing on Kennedy Hayes.
- The dev fix appears to have covered first_name / last_name / email / DOB, but `contact.phone` specifically is still silently dropped.

---

## Issue #2 — `add_tag` silently dropping the `action opt-in` tag

This one is new — surfaced in today's verification while we were checking the phone field.

### What the bot reported

Tool call (after the bot finished collecting personal info):

```
toolName:    add_tag
toolCallId:  toolu_01QhGoTS7MDywwyMtEx6muhd
arguments:   { "tag": "action opt-in" }
result:      "Successfully added tag \"action opt-in\" to the contact."
```

In the same conversation, three other `add_tag` calls fired with identical-shaped responses:

| Tool call ID | Tag | GHL state |
|---|---|---|
| toolu_01KeNWea2mYNx44govRycFSr | `interested` | ✅ present |
| toolu_014VQcc4QGwM5GLc727Yhc7Z | `adult` | ✅ present |
| **toolu_01QhGoTS7MDywwyMtEx6muhd** | **`action opt-in`** | **❌ missing** |
| toolu_01CtpcFwdwGNFkfTDdPPsgQM | `booked` | ✅ present |

### What landed in GHL

GHL contact `3BHmztEuln3zSBopgLI1` `tags` field:
```
["interested", "adult", "hot", "booked"]
```

(Note: `hot` is from a Vacaville GHL workflow that fires on the `booked` tag — not relevant to this bug, just explaining its presence.)

### Pattern match with Issue #1

Identical signature to the phone bug: tool returns "Successfully added", but the actual write is silently dropped. Same family of bug, just hitting `add_tag` instead of `update_contact`. The other three tags in the same conversation persisted fine, so it's not a global failure — something about this specific call is being dropped on the way to GHL.

The tag value contains a space (`action opt-in`). It's possible the issue is space-related (encoding / URL-escaping at some layer between your tool and GHL's tag write). If that helps narrow it down for the dev team.

---

## What I'd like back from you

1. **Confirmation the dev team can repro both** using the lead/contact IDs above.
2. **A timeline estimate** for the phone-field fix specifically — Bobby's gym is live and any new lead going through the bot right now will land in GHL with no phone number. That blocks his SMS follow-up automations.
3. **Whether the `add_tag` "action opt-in" miss is the same root cause** or a separate bug — if separate, please open it as a tracked ticket so we can monitor both.

If it'd help your team to repro live in our account directly (instead of from the test session evidence), happy to coordinate a window.

---

## Reference IDs in one place (for your dev team)

| Item | ID |
|---|---|
| Bot | `bot_GBIF5HQVM8FPQ0XJ` |
| Mimic source | `src_GDKORXSW4Q8RQUQ8` |
| Test lead | `lead_test_HF10VERDLBATFMG9` |
| GHL contact | `3BHmztEuln3zSBopgLI1` |
| GHL location | `JFnXPPTB9Rkgyi0KOUv8` |
| Calendar | `eP72M7eCi37bpN7Shg2a` |
| Phone tool call ID | `toolu_012f2XBuGuCJQkxShQgAWsgj` |
| `action opt-in` tool call ID | `toolu_01QhGoTS7MDywwyMtEx6muhd` |
| Test session timestamp | 2026-05-07T14:34:57.232Z |
| Prior ticket reference | `lead_test_HCS0WS8EQZ1STXMH` |

Thanks again — happy to provide more diagnostic data if useful.
