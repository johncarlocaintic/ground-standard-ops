# Mason Dixon Jiu-Jitsu — ClickUp Master Reference

**Source:** ClickUp doc "Mason Dixon" under Concierge Notes
**Author:** Kurt McPeek (+ contributors)
**Last updated (per ClickUp):** 2026-01-20 21:55
**Captured to repo:** 2026-05-08
**Capture method:** transcribed from screenshot shared by Glenn

> **This is the SOLE source of truth for Mason Dixon facts.** No content from other sources, the gym's website, or assumptions is added. Gaps are flagged in the `[INTERNAL FLAGS]` section at the bottom — they are NOT to be filled in without going back to the source.

---

## Voicemail Script — NOT FOR BOT KB

> **⚠️ FLAG.** The voicemail script in the source doc references **"10th Planet Jiu-Jitsu Dallas"** — not Mason Dixon. Almost certainly leftover template text. Confirm with the doc owner before relying on any of this section. Voicemail scripts are for human concierge phone outreach, not for the SMS bot, so this does NOT affect KB content directly — but it's a quality signal about the source document.

> Hi [Lead's Name], this is [Your Name] from [10th Planet Jiu-Jitsu Dallas]. I noticed you were interested in trying out a class with us, and I'd love to help you get started! Give us a call back or feel free to text us. We're excited to meet you and help you book your intro class. Talk soon!
>
> "Hi, this is Phil with [10th Planet Jiu-Jitsu Dallas]. I saw that we missed you for your scheduled class, so I just wanted to check in and see what day and time works better for you to reschedule. You can call or text us back at this number, and either myself or someone on our team will get back to you as soon as possible. Looking forward to seeing you in class!"

---

## Address

**1495 Lincoln Way East, Chambersburg, PA**

---

## Contact Information

| Field | Value |
|---|---|
| Full Name (point of contact) | Ryan Chadwick |
| Cell Phone | (717) 658-9132 |
| Business Phone | (717) 251-2908 |
| Business Email | tcachambersburg@gmail.com |
| Business Website URL | TCAMMA.com → will be moved to Gymdesk |

> **Context inferred from source:** "TCAMMA" is the previous gym brand at this location. Mason Dixon Jiu-Jitsu is taking over the location and rebranding. The TCAMMA.com domain will be moved off HostGator to Gymdesk. The "Membership Qualification" naming on the existing CloseBot bot likely reflects the inherited TCAMMA member list that needs to be re-engaged.

---

## Class Information

### Overview
- 6 Adult Jiu-Jitsu classes/week (No-Gi only)
- 2 Adult Muay Thai classes/week
- 3 Kids (Ages 4–7) classes/week — 30 minutes
- 3 Kids (Ages 8–13) classes/week — 1 hour
- Bring water bottles
- Arrive 10–15 minutes early to fill out waiver

### Detailed Schedule

**Monday**
- 6:00 AM — Adult Jiu-Jitsu
- 5:30 PM — Kids Striking (4–7)
- 6:00 PM — Kids Striking (8–13)
- 7:15–8:30 PM — Adult Striking

**Tuesday**
- 5:30 PM — Kids Jiu-Jitsu (4–7)
- 6:00 PM — Kids Jiu-Jitsu (8–13)
- 7:15–8:30 PM — Adult Jiu-Jitsu

**Wednesday**
- ⚠️ **GAP — schedule for Wednesday was clipped from the screenshot. Need full Wednesday entries from the doc owner before KB can ship.**

**Thursday**
- 6:00 AM — Adult Jiu-Jitsu
- 5:30 PM — Kids BJJ (8–13)
- 6:30–7:30 PM — Adult Jiu-Jitsu
- ⚠️ **POSSIBLE GAP** — no entry shown for Kids 4–7 on Thursday; the overview says 3 kids 4-7 classes/week and we only see Tue 5:30. Verify Thursday's full lineup.

**Friday**
- 6:00–7:00 PM — Adult Advanced Jiu-Jitsu
- 7:00–8:00 PM — Open Mat

**Saturday / Sunday**
- ⚠️ **GAP** — no entries shown. Verify whether the gym is closed or whether weekend schedule was clipped.

### Other Notes
- Free rolling / open mat available after all adult Jiu-Jitsu classes
- New students generally join regular classes
- Quick intro classes possible, but scheduling is tight

---

## Mission Statement

> To build a thriving martial arts community in Chambersburg by offering high level No-Gi Jiu-Jitsu and Muay Thai to students of all backgrounds, helping them grow in skill, confidence, and resilience.

---

## Staff / Sign-up Team

- Ryan Chadwick (primary point of contact)
- Steve Xeras — steve@cxcservices.com
- No additional sign-up staff at this time

---

## Products to Sell Online (gear / merch)

- T-Shirts
- Rash Guards
- Shorts
- Gloves
- Shin Guards

> Not bot-facing for trial-booking flow. Belongs in a separate gear/store flow if one is ever built.

---

## Website Content Status (from source)

- About Us: TBD
- Owner Bio: TBD

> Both unfilled in source. KB cannot include facts that don't exist yet — these stay flagged.

---

## [INTERNAL FLAGS] — gaps and inconsistencies

> This section is for build planning ONLY. Do NOT include in the KB delivered to CloseBot.

### Gaps that block KB delivery
1. **Wednesday class schedule** — clipped from screenshot, must be retrieved from source.
2. **Thursday Kids 4–7 entry** — overview claims 3 sessions/week for 4–7s but only one (Tuesday 5:30) is visible. Verify the missing two.
3. **Saturday and Sunday** — no entries shown. Closed days, or clipped?
4. **Pricing** — no pricing information of any kind in source (per GSA standard, this is correct — pricing redirects to coach. Confirmed not a gap.)
5. **About Us / Owner Bio** — source says TBD. Bot will not have these facts; FAQ entries about gym history / instructor background must be deferred or omitted.

### Quality signals from source
1. **Voicemail script references "10th Planet Jiu-Jitsu Dallas"** — leftover template text, not relevant to Mason Dixon. Cosmetic for KB build but flag with doc owner.
2. **TCAMMA → Mason Dixon takeover context** — this is a brand transition, not a greenfield gym. The existing CloseBot bot named "Membership Qualification (DEMO)" likely reflects the inherited TCAMMA member list. Decide build approach based on this:
   - **Trial-class booking flow** (Vacaville-style) for net-new leads inquiring about intro class
   - **Member re-qualification flow** for inherited TCAMMA members — different conversation goal
   - May need both, on separate triggers / source filters

### Domain knowledge that must be confirmed from source before bot ships
1. **Trial class policy** — overview says "Bring water bottles, arrive 10-15 min early to fill out waiver" but does not name the trial class explicitly. Is the trial class free? Paid? Length? Verify.
2. **Adult age policy** — Vacaville has an under-18 self-booking gate (14-17yos can train Adult No-Gi but require parent consent). Is the same policy in force at Mason Dixon? The source doesn't say.
3. **Kids program age boundaries** — 4-7 and 8-13 are documented. What about a 6yo with grappling experience, or a 14yo? Vacaville ages out under-7s entirely; Mason Dixon's policy isn't explicit.
4. **Address vs map** — source has "1495 Lincoln Way East, Chambersburg PA" as a heading under "MAP" but no actual map link or directions. Address is sufficient for KB.

---

## Source capture notes

- This file is the source-of-truth snapshot. If ClickUp is updated, update this file alongside.
- Filename + path: `clients/ground-standard/closebot/mason-dixon/source/clickup_master.md`
- Future ClickUp updates: add a dated section at the bottom rather than overwriting prior content, so we keep the historical record.
