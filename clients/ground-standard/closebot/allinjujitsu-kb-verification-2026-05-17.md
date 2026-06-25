# All In Jiu-Jitsu — KB verification (2026-05-17)

No trusted Glenn KB draft existed (glenn_kb_doc.txt had only an
`all_in_jiu_jitsu_mismatch_report`, no KB body). Built from live website +
live GHL calendars; mismatch report used as cross-check only.

## Triangulation: reference (untrusted) vs website vs calendars

| Item | Old data / mismatch report | Live website | Decision |
|---|---|---|---|
| Website | dead `bteamnj.com` | `allinjiujitsu.com` (live) | website |
| Phone | 732-903-2999 (from report) | 732-903-2999 | match ✓ |
| Email | info@allinjiujitsu.com (report) | info@allinjiujitsu.com | match ✓ |
| Address | not in report | 263 Route 22 Suite B, Green Brook NJ 08812 | website |
| $35 mat fee | in old ClickUp | not shown | EXCLUDED (no-pricing rule) |
| Free trial | — | "FIRST CLASS FREE" | confirmed |
| Pricing | — | not public | no-pricing rule holds |

## Live GHL calendars (via PIT, all active, real IDs)

| Calendar | ID | Routing |
|---|---|---|
| Adult Fundamentals BJJ | `gicbjCQ004KHLYVYlPfw` | DEFAULT adult trial calendar |
| Adult All Levels BJJ | `fqS7MHeEhy2dtc11h7AM` | ongoing-member class — NOT a trial calendar (non-bookable) |
| Kids 5-12 BJJ | `deuaXkSEzYGTm5zbRp1c` | kids age 5-12 (single bucket) |

Single discipline BJJ. Site describes adult as no-gi format; GHL calendars are
generic "BJJ" — bot books the trial calendars by name, no gi/no-gi branch.

## Routing decisions

- Adult 18+ → Adult Fundamentals BJJ.
- Kids 5-12 → Kids 5-12 BJJ.
- Age 13-17 → no calendar (kids cap 12, adult floor 18 per GS rule) → minor,
  guardian capture, team follows up.
- Under 5 → no calendar, gym contact 732-903-2999.
- Under 18 = minor needing guardian (GS universal rule).
- Adult All Levels BJJ → non-bookable (ongoing-member class, not a trial);
  no-calendar default handling (not proactively mentioned; "not available to
  book online" if asked; no coach-redirect; no substitute).

## Flagged gaps (NOT filled — gym confirm; non-blocking, booking calendar-driven)

1. Class schedule days/times not reliably available (old data flagged as
   uncertain; site doesn't show; booking is GHL-calendar driven). Open
   questions from the mismatch report for Glenn/Bobby: Wed Ladies No-Gi time,
   Tue evening block times, trial-class days ("M,W,F,T or Sat" — T = Tue/Thu?).
2. Kids age range from GHL calendar (5-12); site did not specify — confirm.
3. Instructor bios, exact program tracks unconfirmed (non-blocking).

## Content-standards check — PASS

No `$`/pricing (old $35 mat fee excluded by design). No bot-instruction
language. No placeholder/cross-client bleed. Free trial present. Minor scope:
all kids 5-12 are minors; adults 18+ (GS rule).
