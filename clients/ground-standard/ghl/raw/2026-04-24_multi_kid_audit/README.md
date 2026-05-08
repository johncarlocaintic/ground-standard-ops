# Vacaville GHL Contact Schema Audit — Multi-Kid Problem

**Date of pull:** 2026-04-24
**GHL location:** Vacaville Grappling Academy (`JFnXPPTB9Rkgyi0KOUv8`)
**PIT used:** `GHL_VACAVILLE_API_TOKEN` (lives in `clients/ground-standard/.env`)
**Why this exists:** investigating how Bobby's team currently stores kid data on contact records, and whether the current schema can handle a family with multiple kids in different age-based programs (e.g. one 7yo + one 14yo).

---

## Bottom line

1. **Contact = parent, always.** No kid is ever a primary contact record.
2. **`contact.youth_name` is dead** — every populated row contains the literal string `"Update"` (a workflow default nobody overwrites). Kid's real name is NOT stored here.
3. **`contact.youth_birthday` is a DATE field and holds exactly ONE kid's DOB.** Second kid would overwrite the first. No array, no second slot.
4. **The kid's actual name only survives in the appointment title** (pattern: `{StudentName} ({Program})`).
5. **The two-kids-different-calendars scenario has never happened in the data.** Zero contacts show it. The current schema has no path to handle it cleanly.

---

## Vacaville contact schema (what's actually on a contact)

Only two kid-related custom fields exist:

| Field | Key | Type | Behavior observed |
|---|---|---|---|
| Youth Name | `contact.youth_name` | TEXT | Always literal `"Update"` on every populated row |
| Youth Birthday | `contact.youth_birthday` | DATE | One kid's DOB; single value |

Parent DOB uses the built-in `contact.dateOfBirth` (DATE).

Full schema dump: [custom_fields.json](./custom_fields.json) — 53 fields total.

Field IDs (for any future script that needs to read/write these):
- `ofSm228f46nQZHVVGGcU` — youth_name
- `ngltZB9FHC9RH9BnMDOl` — youth_birthday

---

## Vacaville calendars

| Calendar ID | Name | Live per Bobby? | Appointments last 180d |
|---|---|---|---|
| `5BZ9V5do89DR1sKxXfrM` | Kids 7-13 Jiu-Jitsu | YES | 57 |
| `eP72M7eCi37bpN7Shg2a` | Adult No-Gi Submission Grappling | YES | 36 |
| `80CSGgA3OrluQNcf816V` | Adult Express No-Gi Fundamentals | PHASED OUT | 1 (mislabelled) |
| `YdfBrZRJfzbuEcQiyLxU` | Kids 10-14 BJJ | PHASED OUT | 0 |
| `rUNpciMLyI2VGHu6ONrq` | Kids 3-5 BJJ | PHASED OUT | 0 |

Only two programs are actually live: **Kids 7-13** (ages 7 to 13) and **Adult No-Gi** (ages 14+). Ages 14-17 ride the adult calendar but are still minors and require a guardian.

Full calendar dump: [calendars.json](./calendars.json).

---

## Pattern from live data (94 appointments across 62 contacts)

### Single-kid family (the common case)
- Parent is the contact record
- `dateOfBirth` = parent's real DOB
- `youth_birthday` = one kid's DOB
- `youth_name` = `"Update"` (useless)
- One appointment titled `"{Kid Name} (Kids BJJ 7-13)"`

### Parent-plus-one-kid booking (found, works)
Example: **AJ Frere** contact (`THXMSkCwSmE6D2hILO6E`)
- Parent DOB 1989-03-15 (age 36)
- `youth_birthday` 2018-05-29 (kid age 7)
- Same day (2025-11-19), two appointments on this single contact:
  - `"AJ Frere Frere" (Kids BJJ 7-13)` on Kids 7-13 calendar (the kid)
  - `"AJ Frere" (Adult No-Gi Submission Grappling)` on Adult calendar (the parent)

The system handles this by creating two separate appointments on the same parent contact, each on the correct calendar, with the student's name embedded in the appointment title.

### Two-different-kids-different-calendars scenario (the problem)
**Not present in the data.** Zero contacts across the 94 appointments show this. The only "multi-student" contacts are:
- **AJ Frere** — parent + one kid (different calendars, works)
- **Ashton Perez** (`eBNBcgoh5Xtczn4Y7ctZ`) — parent + one kid "Mari Perez" (one title glitch where "Ashton" appears in a kids calendar appointment)
- **Solen Ostrom** (`SUuvS8SDZEcWbSwKQPb2`) — parent + one kid "Eric Ostrom" (same title glitch)
- **Ivan Tena** (`3c5RMKzClvibK0aAysPG`) — two 21yo adults, not a family

None of these demonstrate two kids in two different age brackets. The scenario simply has not been booked through the current system.

---

## Why the current schema can't handle 7yo + 14yo siblings

1. **One `youth_birthday` slot.** If the bot collects the 7yo's DOB first, then the 14yo's, the second overwrites the first. The bot has no way to keep both.
2. **No "second kid" fields.** No `youth_name_2`, `youth_birthday_2`, kid-array custom field, or any other structured slot.
3. **Appointment title is free-text.** It works as a per-booking label but carries no structured data back to GHL contact fields.
4. **Routing depends on DOB.** The bot's minor-check / adult-vs-kid-calendar routing evaluates a DOB against age thresholds. With two kids' DOBs colliding into one field, routing cannot fork into two calendars for one contact.
5. **No cross-contact linkage.** Nothing prevents creating two separate contacts (one per kid), but nothing ties them together either. Today, every observed multi-person booking sits under one parent contact record.

---

## Raw data included in this folder

| File | What's in it |
|---|---|
| `custom_fields.json` | All 53 Vacaville custom fields with IDs, keys, types |
| `calendars.json` | All 5 Vacaville calendars with IDs, names, eventType |
| `contacts_with_youth_name.json` | 47 contacts where `customFields.youth_name` is populated (all equal `"Update"`) |
| `contacts_tagged_youth.json` | 36 contacts tagged `youth` in GHL |
| `appointments/{contactId}.json` | 76 files, one per unique contact from the two searches. 62 contain appointment events, 14 are empty |

---

## How to re-pull this data

All commands assume repo root = working dir, with env chained:

```bash
# Env setup
source clients/ground-standard/.env
# GHL_VACAVILLE_API_TOKEN and GHL_VACAVILLE_LOCATION_ID are now in shell

# Custom fields (contact schema)
curl -s \
  -H "Authorization: Bearer $GHL_VACAVILLE_API_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  "https://services.leadconnectorhq.com/locations/$GHL_VACAVILLE_LOCATION_ID/customFields"

# Calendars
curl -s \
  -H "Authorization: Bearer $GHL_VACAVILLE_API_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  "https://services.leadconnectorhq.com/calendars/?locationId=$GHL_VACAVILLE_LOCATION_ID"

# Contacts with youth_name populated
curl -s -X POST \
  -H "Authorization: Bearer $GHL_VACAVILLE_API_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Content-Type: application/json" \
  -d "{\"locationId\":\"$GHL_VACAVILLE_LOCATION_ID\",\"pageLimit\":100,\"filters\":[{\"field\":\"customFields.youth_name\",\"operator\":\"exists\"}]}" \
  "https://services.leadconnectorhq.com/contacts/search"

# Contacts tagged "youth"
curl -s -X POST \
  -H "Authorization: Bearer $GHL_VACAVILLE_API_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Content-Type: application/json" \
  -d "{\"locationId\":\"$GHL_VACAVILLE_LOCATION_ID\",\"pageLimit\":100,\"filters\":[{\"field\":\"tags\",\"operator\":\"contains\",\"value\":\"youth\"}]}" \
  "https://services.leadconnectorhq.com/contacts/search"

# Appointments for one contact
curl -s \
  -H "Authorization: Bearer $GHL_VACAVILLE_API_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Accept: application/json" \
  "https://services.leadconnectorhq.com/contacts/{CONTACT_ID}/appointments"
```

**Note on PIT scope:** the bulk `calendars/events` endpoint returned 401 ("not authorized for this scope"). The per-contact `/contacts/{id}/appointments` endpoint works fine. If you need bulk calendar pulls you'll need a broader PIT or the calendar events scope added.

---

## Questions left open (for the other session to tackle)

1. **Should a second kid be handled as a second contact or as extra appointments on the parent contact?** Both patterns exist in the GHL product; neither is implemented today.
2. **If two contacts, how are they linked?** (GHL relationships? A shared parent-id custom field? Both share the parent's phone and email?)
3. **How does the bot collect and store kid #2's DOB** without overwriting kid #1?
4. **How does the booking node pick the right calendar per kid** in one conversation flow?
5. **What happens when the 14yo needs the Adult calendar under guardian?** The existing minor-guardian rule (CLAUDE.md Section 10, Vacaville v3.19) handles self-booking minors, but does not explicitly handle a parent booking two minors where one routes to Adult and one to Kids.
