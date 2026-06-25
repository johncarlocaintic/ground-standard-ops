# Instruction Worksheet — Hamptons Jiu-Jitsu West

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/hamptonsjjwest-bot-raw.kdl`,
each wrapped in `<<<REVIEW...>>>`. You MUST hand-author/verify both, then
remove the `<<<REVIEW...>>>` marker, before the bot is considered built.
Authoritative sources are this gym's spec + verified KB. Do not blind-trust the draft.

## 1. n10_intro "Push Toward Booking"
Authoritative: spec.gym.rules, spec.nonBookablePrograms, spec.nonBookableHandling, discipline (requiresDisciplineSwitch=false).
- Discipline statement correct? SINGLE
- Non-bookable programs listed verbatim + exact deflection (no coach-redirect, no substitute calendar)?
- Exits kept verbatim: @@@[Interested] / @@@[Parent for Child]; "DO NOT DISCUSS BOOKING ... IN THIS NODE" kept?

## 2. n30_book "Booking" routing (BOTH the Sections Body and the flat Instructions — keep them identical)
Authoritative: spec.flow.ageRouting (line by line), spec.calendars (exact GHL names), spec.flow.minorGate, spec.flow.youthNoCalGate.
- Every bookable calendar present by EXACT name → correct age band?
- Every no-calendar band → no-book + exact spec behavior (team follow-up / phone referral ) + correct tag?
- "compute age as of today, do NOT infer" kept? multi-enrollee slot-pair rule kept? AM/PM guard kept? booked/alert tagging kept?

spec.flow.ageRouting for reference:
```json
{}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_fundamentals",
      "calendarName": "Adult Fundamentals BJJ",
      "calendarId": "not_in_db",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_all_levels",
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "not_in_db",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "kids_3_5",
      "calendarName": "Kids 3-5 BJJ",
      "calendarId": "not_in_db",
      "ageMin": 3,
      "ageMax": 5
    },
    {
      "label": "kids_6_9",
      "calendarName": "Kids 6-9 BJJ",
      "calendarId": "not_in_db",
      "ageMin": 6,
      "ageMax": 9
    },
    {
      "label": "kids_10_14",
      "calendarName": "Kids 10-14 BJJ",
      "calendarId": "not_in_db",
      "ageMin": 10,
      "ageMax": 14
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "15-17",
      "status": "no calendar",
      "default": "treat as minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-3",
      "status": "no calendar",
      "default": "youngest is Kids 3-5 BJJ; suggest contacting the gym"
    }
  ]
}
```
