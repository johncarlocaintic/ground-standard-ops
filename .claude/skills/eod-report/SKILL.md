---
name: eod-report
description: "This skill should be used when the user asks to write an EOD, end-of-day report, daily update, daily wrap-up, or to log/submit hours. Generates a clean, client-ready EOD in the client's established format, computes the correct date itself (never asks), and logs it to the client's eod-reports/ folder plus time-log.md for payroll."
category: documentation
tags: "[eod, reporting, daily-update, payroll, time-log]"
---

# EOD Report Generator

## Purpose

Write a clean, client-ready End-of-Day report, log it to the client's `eod-reports/` folder, and update that client's `time-log.md` for payroll. The report is the billable paper trail, so dates and hours must be right.

## CRITICAL — date convention (this is the #1 source of past mistakes)

**EOD/report dates use the client's US time zone, computed from PH time. Default is US Eastern = PH minus 12 hours. Compute it yourself. NEVER ask the user "what day is it."** You are in PH working a US client's hours; payroll is on the US calendar, and a PH-dated log runs a day ahead and breaks payroll. Confirm the client's actual zone before the first EOD (for Ground Standard, confirm with JC).

Steps to get the date + day number right, every time:
1. Get current PH time (`date` in the shell), subtract 12 hours (or the client's real offset) → that's the report date.
2. Find the last `day-NN_YYYY-MM-DD.md` in the client's `eod-reports/` folder. The new entry is **day-(NN+1)**.
3. The new date must be the **next workday in sequence** after the last entry (consecutive Mon-Fri unless a weekend was actually worked). If the computed date skips or collides with the last entry, the older entries are probably misdated; fix the sequence so it's consecutive, don't invent a gap or a Saturday.
4. Only involve the user on dates if there's a genuine conflict with something already submitted to payroll (a date already filed). Otherwise compute silently.
5. Sanity check: never log a weekend that wasn't worked; never reuse a date already used by a prior entry.

## When to use

User says: "EOD", "write my EOD", "daily update", "log out report", "log/submit my hours", "daily wrap-up", "end of day".

## Steps

1. **Compute date + day number** per the CRITICAL section above.
2. **Gather the day's work** from the conversation + what the user adds. If they give a bullet dump, structure it. Don't interrogate. Pull in anything they say was on the day's agenda even if it spanned outside this chat.
3. **Write the EOD** in the client's established format (default below).
4. **Save** to `clients/{client}/eod-reports/day-NN_YYYY-MM-DD.md`.
5. **Update** `clients/{client}/time-log.md`: add the row (Day, Date, Hours, link, running cumulative) and bump the balance.
6. **Show the report text** in chat so the user can copy/submit it.

## Default format

Plain bullets, no markdown headers, warm but factual. This is the proven format:

```
**End of Day Report — Month DD, YYYY**

- [accomplishment, concrete: what + why it matters]
- [accomplishment]
- [accomplishment]
- Next: [what's lined up for the next session]

**Hours logged today:** 8

I'll be logging out now.
```

Lead with the most concrete/infrastructural work (accounts set up, systems wired), then the in-progress work. One "Next:" line. Match the sign-off to whoever the client reports to.

## Persona + voice (hard rules)

- **Front as JC** for Ground Standard (and every NewWine client). Never name yourself or any teammate in a client-facing EOD. All work is presented as JC's.
- **Voice:** plain human prose, no AI tells. No em dashes, no "excited to share", no "looking forward to", no rule-of-three padding. Get straight to the work. Match the existing EODs already in that client's folder.
- **Numbers help** where natural (counts, budgets), but don't force them.
