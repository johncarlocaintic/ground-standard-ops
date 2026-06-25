# Instruction Worksheet — Hammer Sports & Performance

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/hammer-bot-raw.kdl`,
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
  "under-5": "no calendar - no booking, refer to gym (732) 795-5626",
  "5-12": "Youth Martial Arts (Little Hammer) - guardian required",
  "13-17": "Teen Martial Arts - guardian required",
  "18+": "adult discipline AISwitch (BJJ Gi default / No-Gi / Muay Thai / Wrestling / Kettlebell)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_bjj_gi",
      "calendarName": "Adult Brazilian Jiu-Jitsu",
      "calendarId": "LVXGgBrnpysMvL5SeXO4",
      "program": "bjj-gi",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_nogi",
      "calendarName": "Adult No-Gi Brazilian Jiu-Jitsu",
      "calendarId": "7lDnZI0guVOkAPRC4WOg",
      "program": "bjj-nogi",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_muay_thai",
      "calendarName": "Adult Muay Thai (Kickboxing)",
      "calendarId": "GguRLKLUnTL4vwKOI3vi",
      "program": "muay-thai",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_wrestling",
      "calendarName": "Adult Wrestling",
      "calendarId": "HPHCI7asG4MIs1gHKtp4",
      "program": "wrestling",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_kettlebell",
      "calendarName": "Kettle Bell Workout",
      "calendarId": "fliTy42M3zCzQVPv3RWO",
      "program": "conditioning",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "youth_martial_arts",
      "calendarName": "Youth Martial Arts",
      "calendarId": "42uFk8DjUKX49nbN6egp",
      "program": "little-hammer",
      "ageMin": 5,
      "ageMax": 12,
      "templateBand": "KIDS_3_5"
    },
    {
      "label": "teen_martial_arts",
      "calendarName": "Teen Martial Arts",
      "calendarId": "dyKieKPgrZTSlvJXckqs",
      "program": "teen",
      "ageMin": 13,
      "ageMax": 17,
      "templateBand": "KIDS_7_13"
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "under-5",
      "status": "no calendar",
      "default": "youngest is Youth Martial Arts (5-12); do not book, gym contact (732) 795-5626"
    }
  ],
  "inactiveExcluded": [
    {
      "calendarName": "Adult No-Gi",
      "calendarId": "vXplvwPxKVBLJoTrLdSj",
      "note": "INACTIVE in GHL - superseded by Adult No-Gi Brazilian Jiu-Jitsu; not mirrored, not booked"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Personal Training Consultation Call",
      "calendarId": "Z65Qdz3OuP7KIyBiDrbn",
      "note": "sales/PT consult; bot never books for a trial"
    },
    {
      "calendarName": "Coach Josh Private Session",
      "calendarId": "hek6PGsySuxxtCkiK4gA",
      "note": "private session; internal only"
    },
    {
      "calendarName": "Taylor Manning-Drake's Personal Calendar",
      "calendarId": "rW8JVwGrxnm5ovXbLRNA",
      "note": "staff personal calendar; internal only"
    }
  ]
}
```
