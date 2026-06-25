# Instruction Worksheet — Killer B Combat Sports Academy

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/killerb-agentnode-raw.kdl`,
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
  "under-5": "no calendar - no booking, refer to gym (732) 996-8146",
  "5-12": "Kids MMA & Fitness - guardian required",
  "13-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
  "18+": "4-way adult discipline switch (MMA default)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_mma",
      "calendarName": "Adult MMA",
      "calendarId": "3BmU4UVAN0xxbCF5AYfh",
      "program": "mma",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_kickboxing",
      "calendarName": "Adult Kickboxing",
      "calendarId": "rRVZexebtr5kJ8Npr6gA",
      "program": "kickboxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_boxing",
      "calendarName": "Adult Boxing",
      "calendarId": "rRujrlhmyqnimqt3XwI1",
      "program": "boxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_nogi_grappling",
      "calendarName": "Adult Nogi Grappling",
      "calendarId": "4MjOucx9Fp6wOjyaDKfk",
      "program": "nogi-grappling",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "kids_mma_fitness",
      "calendarName": "Kids MMA & Fitness",
      "calendarId": "p3Kq0qmqfAjIIYkxRYqm",
      "ageMin": 5,
      "ageMax": 12
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Adult Yoga",
      "calendarId": "CWjbyZvjPfMGHPT9nMmF",
      "note": "not a martial arts trial"
    },
    {
      "calendarName": "KB Personal Training Consultation",
      "calendarId": "KPzlLNqM7E0MoqPrrlsl",
      "note": "personal training consult - not a trial"
    },
    {
      "calendarName": "Follow Up",
      "calendarId": "N6tdiUmqoBQKluHgCppY",
      "note": "internal follow-up calendar"
    },
    {
      "calendarName": "JC Caintic's Personal Calendar",
      "calendarId": "NqorYgFTASSqzlc7qBQ8",
      "note": "personal calendar - not bookable"
    },
    {
      "calendarName": "test calendar 1",
      "calendarId": "SXhChbvtqSrYvD7hBFzd",
      "note": "test calendar - not bookable"
    },
    {
      "calendarName": "Women's Self Defense Seminar: Sunday 10/20",
      "calendarId": "ZTQjZeeTnHwGzhiUBZlj",
      "note": "one-time past event - not bookable"
    },
    {
      "calendarName": "Taylor Manning-Drake's Personal Calendar",
      "calendarId": "t6UHWENoHSjHBaC7XqB0",
      "note": "personal calendar - not bookable"
    },
    {
      "calendarName": "Adult BLAB Fitness",
      "calendarId": "yMRdsSbJKZ0AOQFLUToz",
      "note": "fitness class - not a martial arts trial"
    }
  ]
}
```
