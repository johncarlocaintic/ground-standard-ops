# Instruction Worksheet — Ray Longo's MMA

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/raylongo-agentnode-raw.kdl`,
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
  "under-4": "no calendar - no booking, refer to gym (516) 900-9042",
  "4-6": "Youth 4-6 Martial Arts - guardian required",
  "7-12": "Youth 7-12 Martial Arts - guardian required",
  "13-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
  "18+": "5-way adult discipline switch (Intro to MMA default)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_intro_mma",
      "calendarName": "Adult Intro to Mixed Martial Arts",
      "calendarId": "81bFEgxMnAsFQYYdcI5d",
      "program": "mma",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_kickboxing",
      "calendarName": "Adult Kickboxing",
      "calendarId": "ByfwxvYu2GUxBnq8vkQX",
      "program": "kickboxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_bjj",
      "calendarName": "Adult Brazilian Jiu-Jitsu",
      "calendarId": "ECNwYUVxkria28gHCHgw",
      "program": "bjj-gi",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_nogi",
      "calendarName": "Adult No-Gi Brazilian Jiu-Jitsu",
      "calendarId": "jjnRviO00HolFttyEmwq",
      "program": "bjj-nogi",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_boxing",
      "calendarName": "Adult Boxing",
      "calendarId": "kWCavL0cMP2rY7g2iDad",
      "program": "boxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "youth_4_6",
      "calendarName": "Youth 4-6 Martial Arts",
      "calendarId": "0v5kYtLcKVIAWdkczBG3",
      "ageMin": 4,
      "ageMax": 6
    },
    {
      "label": "youth_7_12",
      "calendarName": "Youth 7-12 Martial Arts",
      "calendarId": "ULSNj8GpMWwQypdL0RQg",
      "ageMin": 7,
      "ageMax": 12
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "NF743zn6FtVG9psFcF7C",
      "note": "inactive round_robin - not bookable"
    }
  ]
}
```
