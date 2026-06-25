# Instruction Worksheet — All In Jiu-Jitsu

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/allin-bot-raw.kdl`,
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
      "calendarId": "gicbjCQ004KHLYVYlPfw",
      "program": "bjj",
      "ageMin": 18,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "kids_5_12_bjj",
      "calendarName": "Kids 5-12 BJJ",
      "calendarId": "deuaXkSEzYGTm5zbRp1c",
      "program": "bjj",
      "ageMin": 5,
      "ageMax": 12
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "13-17",
      "status": "no calendar",
      "default": "treat as minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-5",
      "status": "no calendar",
      "default": "youngest is Kids 5-12; suggest gym contact 732-903-2999"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "fqS7MHeEhy2dtc11h7AM",
      "note": "ongoing-member class; bot never books this for a trial — trial is Adult Fundamentals BJJ"
    }
  ]
}
```
