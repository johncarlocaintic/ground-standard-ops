# Instruction Worksheet — Royal Jiu-Jitsu Academy Queens

The build wrote spec-derived DRAFTS into the 2 prose regions of `shared/scripts/closebot/_export/royaljj-bot-raw.kdl`,
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
  "under_5": "no calendar — capture parent contact, tag concierge - failed booking, team follow-up, no booking",
  "5_13": "Kids BJJ",
  "14_17": "no calendar — capture parent contact, tag minor - needs guardian, team follow-up, no booking",
  "18_plus": "Adult Fundamentals BJJ"
}
```
calendars:
```json
{
  "adult": [
    {
      "label": "adult_fundamentals_bjj",
      "calendarName": "Adult Fundamentals BJJ",
      "calendarId": "I2E4k2r3XIpKtbFWbqEW",
      "program": "bjj-fundamentals",
      "ageMin": 18,
      "default": true,
      "durationMinutes": 60
    }
  ],
  "kids": [
    {
      "label": "kids_5_13",
      "calendarName": "Kids BJJ",
      "calendarId": "I8Adff7GjXy2fI7WHc3a",
      "program": "bjj",
      "ageMin": 5,
      "ageMax": 13,
      "durationMinutes": 60
    }
  ],
  "teen": []
}
```
