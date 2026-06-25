# Instruction Worksheet — Sugoi Submissions

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/sugoi-agentnode-raw.kdl`,
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
  "under-4": "no calendar - no booking, refer to academy (361) 336-0859",
  "4-8": "Kids 4-8 Fundamentals Jiu-Jitsu - guardian required",
  "9-15": "Teens 9-15 Fundamentals Jiu-Jitsu - guardian required",
  "16-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
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
      "calendarId": "HDi7QEsiQLBPZa3q7lWw",
      "program": "bjj-fundamentals",
      "ageMin": 18,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "kids_4_8",
      "calendarName": "Kids 4-8 Fundamentals Jiu-Jitsu",
      "calendarId": "9txY0SGOngIPvHeqgfEv",
      "ageMin": 4,
      "ageMax": 8
    },
    {
      "label": "teens_9_15",
      "calendarName": "Teens 9-15 Fundamentals Jiu-Jitsu",
      "calendarId": "ERl4iddht0BH08ViscJM",
      "ageMin": 9,
      "ageMax": 15
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Kids 3-5 BJJ",
      "calendarId": "fmJUt5lF3DWYBovOFmtG",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Kids 6-9 BJJ",
      "calendarId": "j3JWfjnN6Ux81XYorxCz",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Kids 10-14 BJJ",
      "calendarId": "ZmoUW7hrKe38Kqo5Vkk9",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "xfYOfyOPLmIZRxA9OiQU",
      "note": "inactive round_robin - not bookable"
    }
  ]
}
```
