# Instruction Worksheet — Inverted Gear Academy

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/invertedgear-bot-raw.kdl`,
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
  "under-4": "no calendar - no booking, refer to academy (484) 657-4674",
  "4-6": "Cubs 4-6 BJJ - guardian required",
  "7-12": "Juniors 7-12 BJJ - guardian required",
  "13-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
  "18+": "Adult Fundamentals BJJ (single discipline)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_fundamentals_bjj",
      "calendarName": "Adult Fundamentals BJJ",
      "calendarId": "2ePcQUWj9vMYsVxjBAi9",
      "program": "bjj",
      "ageMin": 18,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "cubs_4_6_bjj",
      "calendarName": "Cubs 4-6 BJJ",
      "calendarId": "d0BgipZ6s6H9VnLFDnKr",
      "program": "bjj",
      "ageMin": 4,
      "ageMax": 6,
      "templateBand": "KIDS_3_5"
    },
    {
      "label": "juniors_7_12_bjj",
      "calendarName": "Juniors 7-12 BJJ",
      "calendarId": "B3K3EDv4UGNVuN30kHLD",
      "program": "bjj",
      "ageMin": 7,
      "ageMax": 12,
      "templateBand": "KIDS_7_13"
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "13-17",
      "status": "no calendar",
      "default": "minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-4",
      "status": "no calendar",
      "default": "youngest is Cubs (4-6); do not book, academy contact (484) 657-4674"
    }
  ],
  "inactiveExcluded": [
    {
      "calendarName": "Demo Calendar",
      "calendarId": "q6l7sQt0A6xPUHoO4KyT",
      "note": "INACTIVE in GHL - not mirrored, not booked"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Taylor Manning-Drake's Personal Calendar",
      "calendarId": "0EqbxE7IzBLS5xSt4x6E",
      "note": "staff personal calendar; internal only"
    },
    {
      "calendarName": "JC Caintic's Personal Calendar",
      "calendarId": "T71rxUdgtjilE1G6t88X",
      "note": "staff personal calendar; internal only"
    },
    {
      "calendarName": "GS SEO's Personal Calendar",
      "calendarId": "pEFncqXKVdaZXWqYvIFJ",
      "note": "staff personal calendar; internal only"
    }
  ]
}
```
