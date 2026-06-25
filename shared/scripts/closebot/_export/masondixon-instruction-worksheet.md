# Instruction Worksheet — Mason Dixon Jiu-Jitsu

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/masondixon-bot-raw.kdl`,
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
  "adult": null,
  "adultCalendars": [
    {
      "label": "adult_bjj",
      "calendarName": "Adult Fundamentals BJJ",
      "programs": [
        "bjj",
        "jiu-jitsu",
        "grappling",
        "no-gi"
      ]
    },
    {
      "label": "adult_striking",
      "calendarName": "Adult Striking",
      "programs": [
        "striking",
        "muay thai",
        "kickboxing",
        "mma"
      ]
    }
  ],
  "kids": [
    {
      "label": "kids_4_7",
      "calendarName": "Kids 4-7 Martial Arts",
      "ageMin": 4,
      "ageMax": 7
    },
    {
      "label": "kids_8_13",
      "calendarName": "Kids 8-13 Martial Arts",
      "ageMin": 8,
      "ageMax": 13
    }
  ]
}
```
