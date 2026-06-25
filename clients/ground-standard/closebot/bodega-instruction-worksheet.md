# Instruction Worksheet — Bodega Jiu-Jitsu

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/bodega-bot-raw.kdl`,
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
      "label": "adult_nogi",
      "calendarName": "Adult No-Gi Brazilian Jiu-Jitsu",
      "calendarId": "wIgLDLmgL5lPY0pqIgTM",
      "program": "bjj",
      "ageMin": 18
    }
  ],
  "kids": [
    {
      "label": "kids_6_14_bjj",
      "calendarName": "Kids 6-14 BJJ",
      "calendarId": "eQkMthNv6VgQ7W56E3VL",
      "program": "bjj",
      "ageMin": 6,
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
      "band": "under-6",
      "status": "no calendar",
      "default": "youngest is Kids 6-14; suggest gym contact 908-201-3863"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Kids 9-12 BJJ",
      "calendarId": "H6mtYnRcrDaQrPEOCrwL",
      "note": "active but a narrower 2nd time-slot overlapping Kids 6-14; bot never books this — all kids go to the superset Kids 6-14 BJJ"
    }
  ]
}
```
