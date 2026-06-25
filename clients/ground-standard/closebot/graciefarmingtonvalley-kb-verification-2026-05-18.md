# Gracie Farmington Valley — KB verification (2026-05-18)

No Glenn draft existed. Built from live website + live GHL calendars.

## Source-ID reconciliation (was a discrepancy)

todo.md = `src_LGA6WCCJSAEE8X6R`; pit-inventory.md = `src_8PI9YQ90JJ9TLVTN`.
Probed both via agency API: `src_LGA6WCCJSAEE8X6R` returns Gracie FV's exact
calendars; `src_8PI9YQ90JJ9TLVTN` returns empty. **Correct source =
`src_LGA6WCCJSAEE8X6R`** (todo.md was right; pit-inventory entry is stale —
fix later, non-blocking).

## Confirmed (website)

- GFV Mega LLC DBA Gracie Farmington Valley, 15 Cheryl Drive Suite D, Canton
  CT 06019, (860) 500-3829, gfvjiujitsu@gmail.com, owner Joseph, >decade open
- Programs: Adult BJJ, Adult Cardio Kickboxing, Kids BJJ, Competition Class
- Free trial confirmed ("Try A Class Free" / "GET A FREE TRIAL")
- Pricing not public — no-pricing rule holds
- Georgetown TX (181 Market St) header address = template artifact (same
  pattern as Breathe) — EXCLUDED; CT is the real location

## Live GHL calendars (PIT pit-3807906c-e578-4a83-bd57-ac93ab568a55, loc 5yxX1tJAbq5vttIUwGzJ)

| Calendar | ID | Active | Routing |
|---|---|---|---|
| Adult Fundamentals BJJ | `NrtxDxqI0cvLSOil1JIk` | yes | DEFAULT adult discipline |
| Adult All Levels Cardio Kickboxing | `O4eTDlBuKizeHMusaNLg` | yes | 2nd adult discipline — book on explicit kickboxing/cardio request |
| Kids 4-5 BJJ | `5dbeoaCIpxsgP5hqYeDH` | yes | kids age 4-5 |
| Kids 6-7 BJJ | `kkOVsc9JUgacdZD4YEVr` | yes | kids age 6-7 |
| Kids 8-13 BJJ | `fkxupMrT52curLV5Q7Ht` | yes | kids age 8-13 |
| Kids 10-14 BJJ | `lBjBPTpoMvF3T7zXPy3I` | **inactive** | NOT used |

Two adult disciplines (BJJ + Cardio Kickboxing) → adult discipline-switch on the
classic flow's adult path (mirror the template's multi-band AISwitch pattern).
Three kids BJJ buckets map cleanly onto the template's 3 youth bands
(4-5 → KIDS_3_5 slot, 6-7 → KIDS_7_13 slot, 8-13 → KIDS_10_14 slot, retitled).
Kids are BJJ only — no kids cardio kickboxing calendar.

## Routing decisions

- Adult 18+ default → Adult Fundamentals BJJ; explicit cardio kickboxing
  request → Adult All Levels Cardio Kickboxing.
- Kids 4-5 → Kids 4-5 BJJ; 6-7 → Kids 6-7 BJJ; 8-13 → Kids 8-13 BJJ.
- Under 4 → no calendar, gym contact (860) 500-3829.
- 14-17 → no clean calendar (kids cap 13, adult floor 18 per GS rule) → minor,
  capture guardian, no booking, team follows up.
- Under 18 = minor needing guardian (GS universal rule).
- Competition Class → no calendar, non-bookable (no-calendar default rule).

## Flagged gaps (gym confirm; non-blocking — booking is calendar-driven)

1. Class schedule times unconfirmed in text (booking is GHL-calendar driven).
2. Kids age buckets from GHL calendars (4-5/6-7/8-13); site didn't specify.
3. Confirm Adult Cardio Kickboxing is the intended 2nd bookable adult trial.
4. Georgetown TX 2nd location — confirm it does not exist.

## Content-standards check — PASS

No `$`/pricing. No bot-instruction language. No placeholder/cross-client bleed.
Free trial present. Minor scope: kids 4-13 are minors; adults 18+ (GS rule).
