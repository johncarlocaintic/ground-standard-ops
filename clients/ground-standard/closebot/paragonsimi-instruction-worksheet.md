# Instruction Worksheet — Paragon Simi Valley

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/paragonsimi-agentnode-raw.kdl`,
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
  "under-3": "no calendar - no booking, refer to academy (805) 744-5449",
  "3-6": "Kids 3-6 Fun Jitsu - guardian required",
  "7-14": "Kids 7-14 BJJ - guardian required",
  "15-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
  "18+": "adult discipline AISwitch (Gi BJJ default / No-Gi BJJ / Muay Thai / MMA)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_gi_bjj",
      "calendarName": "Adult Gi BJJ",
      "calendarId": "tXUikVuCUy8KaHZCxC9u",
      "program": "bjj-gi",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_nogi_bjj",
      "calendarName": "Adult No-Gi BJJ",
      "calendarId": "EywP00tCh2wlXmnIekZm",
      "program": "bjj-nogi",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_muay_thai",
      "calendarName": "Adult Muay Thai",
      "calendarId": "YVbgt1gmdm2CpKMnHS1T",
      "program": "muay-thai",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_mma",
      "calendarName": "Adult Mixed Martial Arts",
      "calendarId": "FN0tQiwHjyigzUmdihJd",
      "program": "mma",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "kids_3_6_funjitsu",
      "calendarName": "Kids 3-6 Fun Jitsu",
      "calendarId": "ddmOhTfUkXV1RdDKOfpY",
      "program": "funjitsu",
      "ageMin": 3,
      "ageMax": 6,
      "templateBand": "KIDS_3_5"
    },
    {
      "label": "kids_7_14_bjj",
      "calendarName": "Kids 7-14 BJJ",
      "calendarId": "AFoWlffSZq18isEuVqwO",
      "program": "bjj",
      "ageMin": 7,
      "ageMax": 14,
      "templateBand": "KIDS_7_13"
    }
  ],
  "noCalendarAgeBands": [
    {
      "band": "15-17",
      "status": "no calendar",
      "default": "minor, capture guardian, do not book, team follows up"
    },
    {
      "band": "under-3",
      "status": "no calendar",
      "default": "youngest is Fun Jitsu (3-6); do not book, academy contact (805) 744-5449"
    }
  ],
  "inactiveExcluded": [
    {
      "calendarName": "Kids 6-9 BJJ",
      "calendarId": "7vZi4GhfxeiXTPSPbRTs",
      "note": "INACTIVE - not mirrored, not booked"
    },
    {
      "calendarName": "Adult Advanced BJJ",
      "calendarId": "YQDaxE0GhSrFaUnqBF2P",
      "note": "INACTIVE; advanced, not a beginner trial"
    },
    {
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "vg23tU8G6NRpdxlLlHnu",
      "note": "INACTIVE"
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Taylor Manning-Drake's Personal Calendar",
      "calendarId": "WYz8CdK5jGEJ13xW0mW5",
      "note": "staff personal calendar; internal only"
    }
  ]
}
```
