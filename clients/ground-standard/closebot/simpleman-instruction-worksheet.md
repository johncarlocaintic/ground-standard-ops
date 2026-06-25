# Instruction Worksheet — Simple Man Martial Arts

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/simpleman-agentnode-raw.kdl`,
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
  "under-4": "no calendar - no booking, refer to academy (512) 814-0800",
  "4-8": "Youth 4-12 BJJ - guardian required",
  "9-12": "Youth 9-12 BJJ - guardian required",
  "7-17-wrestling": "Youth 7-17 Wrestling - guardian required for under 18",
  "13-17-bjj-only": "no BJJ calendar for teens - note in prose: team will follow up for BJJ interest; wrestling available via Youth 7-17 Wrestling",
  "18+": "Adult Fundamentals BJJ (default); Adult All Levels BJJ (explicit experienced grapplers only)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_fundamentals_bjj",
      "calendarName": "Adult Fundamentals BJJ",
      "calendarId": "q23lf3m5qdJKpk3L3nB0",
      "program": "bjj-fundamentals",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_all_levels_bjj",
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "BCTZsRG4rfYKJelmvYj7",
      "program": "bjj-all-levels",
      "ageMin": 18,
      "onlyOnExplicitRequest": true,
      "note": "For leads who explicitly state they have prior BJJ or grappling experience"
    }
  ],
  "kids": [
    {
      "label": "youth_4_12_bjj",
      "calendarName": "Youth 4-12 BJJ",
      "calendarId": "aTPMDz4APpqhvGW6Dj2L",
      "ageMin": 4,
      "ageMax": 8,
      "discipline": "bjj",
      "note": "Used for ages 4-8; Youth 9-12 BJJ used for 9-12"
    },
    {
      "label": "youth_9_12_bjj",
      "calendarName": "Youth 9-12 BJJ",
      "calendarId": "5rFjXTmY6T0Tg5bjcaaw",
      "ageMin": 9,
      "ageMax": 12,
      "discipline": "bjj"
    },
    {
      "label": "youth_7_17_wrestling",
      "calendarName": "Youth 7-17 Wrestling",
      "calendarId": "Uav8SaATEF0cTcZ5Lli5",
      "ageMin": 7,
      "ageMax": 17,
      "discipline": "wrestling",
      "note": "Covers 7-17 including teens 13-17 for wrestling; guardian required for all under 18"
    }
  ],
  "internalNotForTrial": []
}
```
