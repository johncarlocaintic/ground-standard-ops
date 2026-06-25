# Instruction Worksheet — Roberts Family MMA

The build wrote spec-derived DRAFTS into the 2 prose regions of `clients/ground-standard/closebot/roberts-agentnode-raw.kdl`,
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
  "under-5": "no calendar - no booking, refer to academy (978) 581-0601",
  "5-10": "Kids 5-10 BJJ or Kids 5-10 Wrestling - guardian required (discipline choice)",
  "11-17": "Teens 11-17 BJJ or Kids 11-17 Wrestling - guardian required (discipline choice)",
  "18+": "4-way adult discipline switch (Fundamentals BJJ default)"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_fundamentals_bjj",
      "calendarName": "Adult Fundamentals BJJ",
      "calendarId": "M0e98oYSS3OhOibzw0a4",
      "program": "bjj-gi",
      "ageMin": 18,
      "default": true
    },
    {
      "label": "adult_nogi_bjj",
      "calendarName": "Adult Fundamentals No-Gi BJJ",
      "calendarId": "3STGgKnHu55zhtcr1cUg",
      "program": "bjj-nogi",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_boxing",
      "calendarName": "Adult Boxing",
      "calendarId": "kwXNyHeQheAHP1wH5wst",
      "program": "boxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    },
    {
      "label": "adult_thai_boxing",
      "calendarName": "Adult Thai Boxing",
      "calendarId": "tALj3XaYaItIMsEurjzZ",
      "program": "thai-boxing",
      "ageMin": 18,
      "onlyOnExplicitRequest": true
    }
  ],
  "kids": [
    {
      "label": "kids_5_10_bjj",
      "calendarName": "Kids 5-10 BJJ",
      "calendarId": "UMhkQHI9icuipqq9ivS2",
      "ageMin": 5,
      "ageMax": 10,
      "discipline": "bjj"
    },
    {
      "label": "kids_5_10_wrestling",
      "calendarName": "Kids 5-10 Wrestling",
      "calendarId": "pWmMHvpwPWvmp1DLXCkT",
      "ageMin": 5,
      "ageMax": 10,
      "discipline": "wrestling"
    },
    {
      "label": "teens_11_17_bjj",
      "calendarName": "Teens 11-17 BJJ",
      "calendarId": "huSRlv9vhFd9Q7E9z45k",
      "ageMin": 11,
      "ageMax": 17,
      "discipline": "bjj"
    },
    {
      "label": "kids_11_17_wrestling",
      "calendarName": "Kids 11-17 Wrestling",
      "calendarId": "GXWxp7hi6BI2dWGsd9Qc",
      "ageMin": 11,
      "ageMax": 17,
      "discipline": "wrestling"
    }
  ],
  "internalNotForTrial": []
}
```
