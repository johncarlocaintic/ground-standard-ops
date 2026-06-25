# Instruction Worksheet — Hamptons Jiu-Jitsu South

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/hamptonsjj-bot-raw.kdl`,
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
  "adultCalendars": [
    {
      "label": "adult_bjj",
      "calendarId": "3Rt21MmCWcURorQxJilE",
      "calendarName": "Adult BJJ",
      "programs": [
        "bjj",
        "jiu-jitsu",
        "grappling",
        "gi",
        "no-gi",
        "fundamentals"
      ]
    },
    {
      "label": "adult_muay_thai",
      "calendarId": "SoGSt7H7OGmVv6rdghfH",
      "calendarName": "Adult Muay Thai",
      "programs": [
        "muay thai",
        "striking",
        "mma",
        "judo",
        "wrestling"
      ]
    }
  ],
  "kids": [
    {
      "label": "kids_4_7",
      "calendarId": "S5dIqvZ3DsqwUKOnRXw6",
      "calendarName": "Kids 4-7 BJJ",
      "ageMin": 4,
      "ageMax": 7
    },
    {
      "label": "kids_8_12",
      "calendarId": "1ZexVKGM176mU02DVr0L",
      "calendarName": "Kids 8-12 BJJ",
      "ageMin": 8,
      "ageMax": 12
    }
  ]
}
```
