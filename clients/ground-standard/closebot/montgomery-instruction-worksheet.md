# Instruction Worksheet — Montgomery Brazilian Jiu-Jitsu

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/montgomery-agentnode-raw.kdl`,
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
  "under-3": "no calendar - no booking, refer to academy (609) 355-7500",
  "3-6": "Kids Brazilian Jiu-Jitsu (3-6) - guardian required",
  "7-13": "Kids Brazilian Jiu-Jitsu (7-13) - guardian required",
  "14-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
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
      "calendarId": "59I9RtWqB7vimQZZYBdr",
      "program": "bjj-fundamentals",
      "ageMin": 18,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "kids_3_6",
      "calendarName": "Kids Brazilian Jiu-Jitsu (3-6)",
      "calendarId": "5A25XDYECvtokbzfeaMT",
      "ageMin": 3,
      "ageMax": 6
    },
    {
      "label": "kids_7_13",
      "calendarName": "Kids Brazilian Jiu-Jitsu (7-13)",
      "calendarId": "6wFCGH31Qm14muq997ic",
      "ageMin": 7,
      "ageMax": 13
    }
  ],
  "internalNotForTrial": [
    {
      "calendarName": "Adult Advanced BJJ",
      "calendarId": "7aLyaiURMltbcZzLupKV",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Adult All Levels BJJ",
      "calendarId": "8MTqnCKqoyjnj5CBFddU",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Kids 6-9 BJJ",
      "calendarId": "XluEU933dyEYvVI3IKRZ",
      "note": "inactive round_robin - not bookable"
    },
    {
      "calendarName": "Kids 10-14 BJJ",
      "calendarId": "vyUP9yNZ82FNxtTUTMSP",
      "note": "inactive round_robin - not bookable"
    }
  ]
}
```
