# Instruction Worksheet — Gracie Farmington Valley

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/graciefv-bot-raw.kdl`,
each wrapped in `<<<REVIEW...>>>`. You MUST hand-author/verify both, then
remove the `<<<REVIEW...>>>` marker, before the bot is considered built.
Authoritative sources are this gym's spec + verified KB. Do not blind-trust the draft.

## 1. n10_intro "Push Toward Booking"
Authoritative: spec.gym.rules, spec.nonBookablePrograms, spec.nonBookableHandling, discipline (requiresDisciplineSwitch=true).
- Discipline statement correct? MULTI — confirm the disciplines + default
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
      "label": "adult_bjj",
      "calendarName": "Adult Fundamentals BJJ",
      "calendarId": "NrtxDxqI0cvLSOil1JIk",
      "program": "bjj",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_kickboxing",
      "calendarName": "Adult All Levels Cardio Kickboxing",
      "calendarId": "O4eTDlBuKizeHMusaNLg",
      "program": "kickboxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "kids_4_5_bjj",
      "calendarName": "Kids 4-5 BJJ",
      "calendarId": "5dbeoaCIpxsgP5hqYeDH",
      "program": "bjj",
      "ageMin": 4,
      "ageMax": 5,
      "templateBand": "KIDS_3_5"
    },
    {
      "label": "kids_6_7_bjj",
      "calendarName": "Kids 6-7 BJJ",
      "calendarId": "kkOVsc9JUgacdZD4YEVr",
      "program": "bjj",
      "ageMin": 6,
      "ageMax": 7,
      "templateBand": "KIDS_7_13"
    },
    {
      "label": "kids_8_13_bjj",
      "calendarName": "Kids 8-13 BJJ",
      "calendarId": "fkxupMrT52curLV5Q7Ht",
      "program": "bjj",
      "ageMin": 8,
      "ageMax": 13,
      "templateBand": "KIDS_10_14"
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "14-17",
      "status": "no calendar",
      "default": "minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-4",
      "status": "no calendar",
      "default": "youngest is Kids 4-5; gym contact (860) 500-3829"
    }
  ],
  "inactiveExcluded": [
    {
      "calendarName": "Kids 10-14 BJJ",
      "calendarId": "lBjBPTpoMvF3T7zXPy3I",
      "note": "inactive in GHL — not mirrored, not booked"
    }
  ]
}
```
