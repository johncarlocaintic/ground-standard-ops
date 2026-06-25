# Breathe Jiu-Jitsu — KB verification (2026-05-17)

Source: Glenn draft `breathe_jiu_jitsu_kb_v1.0.0_DRAFT.txt` (ClickUp + website).
Cleaned to `breathejiujitsu-kb-v1.0.0.txt`.

## Confirmed

- Name Breathe Jiu-Jitsu (site: Thrive New York Jiu Jitsu LLC DBA Breathe), 
  Yaphank NY, phone (631) 823-0098, email info@breathejiujitsu.com
- Free trial: site confirms "TRY A CLASS FREE" — resolves KB trial gap.
- Pricing not public — no-pricing rule holds.

## Corrected / excluded

- **Georgetown TX address (181 Market St)** excluded. Appears on the site but
  also on an unrelated gym's site = template artifact. KB Yaphank-only. Flag
  for gym to confirm no 2nd location.
- **Kids age buckets** taken from live GHL calendars (4-6, 7-13), which
  supersede the KB's "Little 7-9 / Big 10-12" class naming. Calendars are the
  booking source of truth.

## Live GHL calendars (via PIT, all active, real IDs)

| Calendar | ID | Routing |
|---|---|---|
| Adult Fundamentals BJJ | `p3OHyjTlpZQu5CVtvjLC` | DEFAULT adult trial calendar |
| Adult Women's Only Brazilian Jiu-Jitsu | `aBuKmIdEEaoQwAUzUkM9` | ONLY if lead explicitly requests women's-only; never proactively offered (not advertised on site) |
| Kids 4-6 BJJ | `aOOG8H6Zdnfks33KzKbY` | kids age 4-6 |
| Kids 7-13 BJJ | `KE4BOOChS7TOP6QLigQV` | kids age 7-13 |

Adult selection is a preference branch (Fundamentals default vs Women's-Only on
explicit request), NOT a discipline switch. Single discipline = BJJ.

## Routing decisions

- Adult 18+ default → Adult Fundamentals BJJ; explicit women's-only request →
  Adult Women's Only BJJ.
- Kids 4-6 → Kids 4-6 BJJ; kids 7-13 → Kids 7-13 BJJ.
- Under 4 → no calendar, gym contact (631) 823-0098.
- 14-17 → no clean calendar (kids cap 13, adult floor 18 per GS rule) → minor,
  guardian capture, team follows up.
- Under 18 = minor needing guardian (GS universal rule).
- Competition Class → no calendar, non-bookable (no-calendar default rule).

## Flagged gaps (NOT filled — gym confirm; non-blocking, booking calendar-driven)

1. Class schedule times unconfirmed (booking is GHL-calendar driven; not
   bot-blocking). Confirm for KB completeness.
2. Women's-Only calendar exists in GHL but not advertised on site — confirm bot
   should book it only on explicit request, never proactively.
3. Georgetown TX 2nd location — confirm it does not exist.
4. Competition Class eligibility, instructor bios, membership policies,
   drop-in/mat fee, Fri/Sun — unconfirmed; not bot-blocking.

## Content-standards check — PASS

No `$`/pricing. No bot-instruction language. No placeholder/cross-client bleed.
Free trial present. Minor scope: all kids 4-13 are minors; adults 18+ (GS rule).
