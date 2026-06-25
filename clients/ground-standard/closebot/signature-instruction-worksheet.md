# Instruction Worksheet — Signature of Jiu-Jitsu

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/signature-agentnode-raw.kdl`,
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
  "under-5": "no calendar - no booking, refer to academy 650-398-7837",
  "5-7": "Kids 5-7 BJJ - guardian required",
  "8-10": "Kids 8-10 BJJ - guardian required",
  "11-14": "Kids 11-14 BJJ - guardian required",
  "15-17": "no calendar - minor, guardian capture, team follow-up, no booking (youth no-cal gate)",
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
      "calendarId": "dvEQWeLqOk0DnIYZ6VD6",
      "program": "bjj-fundamentals",
      "ageMin": 18,
      "default": true
    }
  ],
  "kids": [
    {
      "label": "kids_5_7",
      "calendarName": "Kids 5-7 BJJ",
      "calendarId": "p8shns2lFfc1Dxzv1jfx",
      "ageMin": 5,
      "ageMax": 7
    },
    {
      "label": "kids_8_10",
      "calendarName": "Kids 8-10 BJJ",
      "calendarId": "Iuv6iiN568vKWQ0lWmlI",
      "ageMin": 8,
      "ageMax": 10
    },
    {
      "label": "kids_11_14",
      "calendarName": "Kids 11-14 BJJ",
      "calendarId": "FwPYPuwmeTEPnW86Gpa6",
      "ageMin": 11,
      "ageMax": 14
    }
  ],
  "internalNotForTrial": []
}
```
