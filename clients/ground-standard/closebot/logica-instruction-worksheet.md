# Instruction Worksheet — Logica Jiu-Jitsu

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/logica-agentnode-raw.kdl`,
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
{
  "under-8": "no calendar - no booking, refer to academy (423) 565-4549",
  "8-13": "Youth Jiu-Jitsu (8-13) - guardian required",
  "14-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
  "18+": "Adult Foundations BJJ (single discipline, beginner trial)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_foundations_bjj",
      "calendarName": "Adult Foundations BJJ",
      "calendarId": "qULhIvCYkrLYo5lg3VPG",
      "program": "bjj-nogi",
      "ageMin": 18,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "youth_jiujitsu_8_13",
      "calendarName": "Youth Jiu-Jitsu (8-13)",
      "calendarId": "Lek30992aw6Ang5riW7K",
      "program": "bjj-nogi",
      "ageMin": 8,
      "ageMax": 13,
      "templateBand": "KIDS_7_13"
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "14-17",
      "status": "no calendar",
      "default": "minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-8",
      "status": "no calendar",
      "default": "youngest is Youth Jiu-Jitsu (8-13); do not book, academy contact (423) 565-4549"
    }
  ],
  "inactiveExcluded": [
    {
      "calendarName": "Women's Self Defense 6-Week Challenge",
      "calendarId": "01n9JfRtruHEdbBSD1rm",
      "note": "INACTIVE - not mirrored, not booked"
    },
    {
      "calendarName": "Kids (8-13) - 6 Week Intro to Jiu-Jitsu Challenge",
      "calendarId": "KDPjfgwChsLZ5q5klM1c",
      "note": "INACTIVE"
    },
    {
      "calendarName": "Adults - 6 Week Intro to Jiu-Jitsu Challenge",
      "calendarId": "QuPJ1MGzRTs7za3fQZKy",
      "note": "INACTIVE"
    },
    {
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "bDbjywX9j0oGe7wigHb1",
      "note": "INACTIVE; All Levels is intermediate, not a beginner trial"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Free Consultation",
      "calendarId": "kiieIViftkqALXhvf25I",
      "note": "consult/sales call; not a trial booking"
    },
    {
      "calendarName": "Logica 2.0 Grand Re-Opening",
      "calendarId": "CZFbDdH9TOR8RXMd1Abh",
      "note": "one-off reopening event; not a recurring trial - flag for Bobby"
    }
  ]
}
```
