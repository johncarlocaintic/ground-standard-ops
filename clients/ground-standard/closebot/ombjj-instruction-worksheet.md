# Instruction Worksheet — OM Brazilian Jiu-Jitsu and Judo

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/ombjj-agentnode-raw.kdl`,
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
{
  "under-4": "no calendar - no booking, refer to academy (631) 327-8094",
  "4-9": "Kids 4-9 BJJ - guardian required",
  "10-15": "Teens 10-15 BJJ - guardian required",
  "16-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
  "18+": "adult discipline AISwitch (BJJ & Judo default / NoGi BJJ explicit)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_bjj_judo",
      "calendarName": "Adult Brazilian Jiu-Jitsu & Judo",
      "calendarId": "2ToifGdjcoxWP7R7SkYR",
      "program": "bjj-judo",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_nogi",
      "calendarName": "Adult NoGi Brazilian Jiu-Jitsu",
      "calendarId": "b7hgRBfkxz8fUPZRH28n",
      "program": "nogi-bjj",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "kids_4_9",
      "calendarName": "Kids 4-9 BJJ",
      "calendarId": "ZaNk0DiLmFXvfkuspu0p",
      "program": "bjj",
      "ageMin": 4,
      "ageMax": 9,
      "templateBand": "KIDS_3_5"
    },
    {
      "label": "teens_10_15",
      "calendarName": "Teens 10-15 BJJ",
      "calendarId": "r1MuiRLtvD8PIUJTHgwK",
      "program": "bjj",
      "ageMin": 10,
      "ageMax": 15,
      "templateBand": "KIDS_7_13"
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "16-17",
      "status": "no calendar",
      "default": "minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-4",
      "status": "no calendar",
      "default": "youngest is Kids 4-9 BJJ (ages 4-9); do not book, academy contact (631) 327-8094"
    }
  ],
  "inactiveExcluded": []
}
```
