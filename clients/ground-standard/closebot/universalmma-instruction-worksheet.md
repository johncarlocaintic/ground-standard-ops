# Instruction Worksheet — Universal Mixed Martial Arts

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/universalmma-agentnode-raw.kdl`,
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
  "under-4": "no calendar - no booking, refer to academy (718) 659-1700",
  "4-12": "Kids Martial Arts - guardian required",
  "13-17": "Adult Martial Arts via youth path - guardian captured, minor-needs-guardian tag",
  "18+": "Adult Martial Arts (self-book)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_martial_arts",
      "calendarName": "Adult Martial Arts",
      "calendarId": "zBdJGEC5m2PdxXOP1gmO",
      "program": "martial-arts",
      "ageMin": 13,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "kids_4_12",
      "calendarName": "Kids Martial Arts",
      "calendarId": "ZfTveExmW5cGwD1a1cAQ",
      "ageMin": 4,
      "ageMax": 12
    },
    {
      "label": "teen_13_17_adult_cal",
      "calendarName": "Adult Martial Arts",
      "calendarId": "zBdJGEC5m2PdxXOP1gmO",
      "ageMin": 13,
      "ageMax": 17,
      "note": "13-17 books the Adult Martial Arts calendar via the youth path (guardian captured); academy adult class serves 13+"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Copy of Kids Martial Arts",
      "calendarId": "hBvksfuabXdPkY8Uu7Gm",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Kids 10-14 BJJ",
      "calendarId": "wZ4WqfUfcIU18JMBAl6D",
      "note": "inactive round_robin - not bookable"
    }
  ]
}
```
