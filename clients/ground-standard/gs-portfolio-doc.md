# Ground Standard — AI Lead Response System
## Project Portfolio & Case Study Document
*Compiled 2026-05-24 | Confidential*

---

## Overview

Built and deployed a full AI SMS lead response system for Ground Standard, a martial arts gym management agency operating ~30 locations across the United States. The system handles inbound leads 24/7, qualifies them, and books free trial classes — without human intervention.

---

## Scale

| Metric | Value |
|---|---|
| Active bots deployed | 31 |
| Gyms covered | 22 active (30+ in pipeline) |
| US states covered | FL, CA, NY, TX, MN, CT, AZ, NC, AL, MD, NJ, OR, WA |
| Appointments in last 30 days | 228 |
| Bot response time | Instant (24/7, no delay) |
| Highest-volume gym (30d) | Ray Longo MMA — 65 appointments |

---

## What the System Does

Every gym gets a bot named Emma — a front desk persona that responds to SMS leads coming in from Meta ads, Google, and GHL automations.

**Core flow:**
1. Lead opts in via ad → GHL tags fire → Emma engages within seconds
2. Emma qualifies the lead (adult vs youth, program interest)
3. Collects name, email, phone, DOB
4. Books the free trial directly into GHL calendar
5. Sends confirmation + reminders automatically
6. Applies tags at each stage for pipeline visibility

**Smart routing handles:**
- Adult path (single or multi-discipline)
- Youth path with age-appropriate calendar routing
- Multi-enrollee (parent signing up + enrolling a child)
- Minor gate (under-18 self-booking → redirected to guardian capture)
- Human handoff via `ai off` tag with autoShutoff

---

## Case Study 1 — Midnight Booking, Zero Friction
**Gym:** Sugoi Submissions (Corpus Christi, TX)
**Lead:** Dale Moody

A returning BJJ practitioner came in at 12:47 AM asking about class times and pricing. Emma handled the pricing deflection cleanly and booked him in 9 minutes.

```
12:47 AM  LEAD: No I use to do BJJ years ago but the instructor moved.
                How much is the class and what are the times
12:48 AM  BOT:  Oh awesome, welcome back to the mats! For class times, we have
                Adult Gi at 6:30 PM on Monday, Tuesday, Thursday, and Friday,
                plus Saturday at 10:00 AM. The first class is free so you can
                jump right in before we talk membership.
12:49 AM  LEAD: Yes just for myself
12:49 AM  BOT:  Perfect! Let's get you scheduled for a free trial class.
                This will just take a minute.
12:50 AM  LEAD: Ok when would you be able to do a free class
12:51 AM  BOT:  Great! Before I can get you on the schedule, I just need to
                grab a few quick details. Can you confirm your full name is
                Dale Moody?
12:51 AM  LEAD: Yes
12:51 AM  BOT:  Perfect! And what's your best email?
12:52 AM  LEAD: dalemoody59@yahoo.com
12:52 AM  BOT:  Got it! And just to confirm, is this the best number: (904) 452-1737?
12:53 AM  LEAD: Yes it is
12:53 AM  BOT:  Perfect! Last thing, what's your date of birth?
12:54 AM  LEAD: 04/20/1985
12:54 AM  BOT:  I've got openings tomorrow Friday at 6:30 PM, Tuesday the 26th
                at 6:30 PM, or Wednesday the 27th at 6:30 PM. What works best?
12:55 AM  LEAD: Wednesday the 27th and then go from there
12:56 AM  BOT:  [APPOINTMENT BOOKED] Dale Moody - Free Trial Class
                You're all set for Wednesday, May 27th at 6:30 PM.
                We're at 3403 South Padre Island Drive, Suite 205, Corpus Christi.
```

**Result:** Booked at 12:56 AM. No staff involvement. Lead had been asking about pricing — bot redirected, collected data, and closed.

---

## Case Study 2 — Parent Enrolling Child, Smooth Youth Path
**Gym:** Signature of Jiu-Jitsu (Belmont, CA)
**Lead:** Reid Bogert (enrolling son Yvo, age 9)

Parent reached out after Yvo's friend told him about the gym. Bot routed to the youth path, age-verified Yvo (born 2016 → Kids 8-10 class), captured parent DOB, and booked the correct kids calendar.

```
02:06 AM  LEAD: Hi! Thank you! We're interested in having our son start.
                His friend Jax attends there and he is interested in joining.
02:06 AM  BOT:  That's awesome! Love when friends train together. So just
                to confirm, you're looking to get your son signed up for a
                trial class?
02:07 AM  LEAD: Yes I think that would be great.
02:07 AM  BOT:  Perfect! What's your son's full name?
02:30 AM  LEAD: Yvo Bogert
02:30 AM  BOT:  Got it, Yvo! And what's his date of birth?
02:31 AM  LEAD: 06/19/2016
02:31 AM  BOT:  Perfect. And your date of birth as well? Just so we have
                the parent info on file.
02:32 AM  LEAD: 03/15/1983
02:33 AM  BOT:  Great, thanks Reid. And best email for you?
02:33 AM  LEAD: Rsbogert@gmail.com
02:33 AM  BOT:  Perfect. Yvo is 9, so he'll be in our Kids 8-10 Brazilian
                Jiu-Jitsu class. I've got Wednesday May 27th at 3:30 PM,
                Wednesday June 3rd at 3:30 PM, or Monday June 8th at 3:30 PM.
02:51 AM  LEAD: June 8 at 3:30 would work
02:51 AM  BOT:  [APPOINTMENT BOOKED] Yvo Bogert - Free Trial Class
                Yvo is all set for Monday, June 8th at 3:30 PM.
                We're at 915 Ralston Ave, Belmont, CA 94002. See you both then!
```
*Reid reacted with 👍 to the confirmation message.*

**Result:** Bot correctly identified lead as a youth enrollment, routed to the right age bracket, captured both child and parent DOB, booked to the Kids 8-10 calendar. Parent confirmed with a thumbs up.

---

## Case Study 3 — Lead Persistence Over Multiple Sessions
**Gym:** The Academy Eden Prairie (Edina, MN)
**Lead:** Niman Matan

Niman no-showed twice, went cold, then re-engaged asking about the schedule. Bot stayed in, handled his pricing concern ("just not sure about price right now"), rescheduled him twice, and eventually booked him for Muay Thai on a third attempt.

> **"I do appreciate you guys reaching out and scheduling it but I know this
> is something I want to do, just worried about price right now"**

Bot response: *"We will see you at 7:30pm for your free intro class. We can talk after class about everything else."*

Niman eventually came back on his own, said he was interested in Muay Thai specifically, and the bot collected his details and booked him. He responded to the confirmation by reacting to the message.

**Result:** 3 booking attempts over 8 days. Bot stayed persistent and non-pushy, handled pricing objections without giving a number, and closed on the third attempt.

---

## System Architecture

### Bot Pipeline
Every gym goes through a 3-phase build process:

1. **/closebot-plan** — Structured intake: live GHL calendar pull, program mapping, flow design, spec output (JSON + markdown)
2. **/closebot-build** — KDL generation from Agent Node template, architecture assertion, import + publish via CB API, sandbox attach
3. **/closebot-test** — 13-persona eval suite (adult, youth, multi-enrollee, minor gate, pricing pressure, hostile, non-bookable programs), GHL appointment verification, judge LLM cross-reference

### Quality Gates (per bot)
- Architecture assertion: Agent Node only (no classic bots)
- Zero blocker fails across all 13 personas
- Every booking persona verified against GHL (not just transcript)
- Non-determinism check: adult path passes ≥ 2/3 repeat runs
- Production attach gated on explicit per-gym authorization

### What Each Bot Handles
| Scenario | Handling |
|---|---|
| New adult lead | Full qualification → data capture → booking |
| Parent enrolling child | Youth path with age-routing to correct calendar |
| Parent + self enrolling | Multi-enrollee: both bookings in one session |
| Under-18 self-booking | Blocked → captures info → team handoff |
| Pricing question | Deflect to trial → pricing discussed in person |
| Non-bookable program | Acknowledged, redirected to trial for context |
| Staff manually replies | `ai off` autoShutoff applies immediately |
| Hostile / opt-out | Graceful de-escalation, no booking attempt |

---

## Monitoring & Reporting

Custom GHL monitoring scripts track:
- New appointments per gym per week (contacts-based, all 22 gyms)
- Bot-booked vs human-booked distinction via `cb` tag
- `ai off` tag audit across all sub-accounts
- Bot source attachment status (prod vs sandbox vs detached)

---

## Gyms Covered

| Gym | State | Status |
|---|---|---|
| Vacaville Grappling Academy | CA | Live |
| Hamptons Jiu-Jitsu West | NY | Live |
| SOMA MVMT | CA | Live |
| 10th Planet Jiu-Jitsu Miami | FL | Live |
| Champion Martial Arts | AZ | Live |
| The Academy Eden Prairie | MN | Live |
| Academy of Jiu-Jitsu Scottsdale | AZ | Live |
| Ballantyne Martial Arts | NC | Live |
| Breathe Jiu-Jitsu | OR | Live |
| Artistry BJJ | WA | Live |
| Grit Jiu-Jitsu | TX | Live |
| Centerline Jiu-Jitsu | AZ | Live |
| OM Brazilian Jiu-Jitsu & Judo | CA | Live |
| Sugoi Submissions | TX | Live |
| Ray Longo's MMA | NY | Live |
| Universal Mixed Martial Arts | CA | Live |
| Montgomery Brazilian Jiu-Jitsu | AL | Live |
| Signature of Jiu-Jitsu | CA | Live |
| Roberts Family MMA | NJ | Live |
| Simple Man Martial Arts | MD | Live |
| Killer B Combat Sports Academy | MD | Live |
| Mason Dixon Jiu-Jitsu | MD | Live |

---

## Key Differentiators

- **Instant response, any hour** — leads never wait; bookings happen at 1 AM, on weekends, during holidays
- **GHL-native** — writes directly to CRM, books real calendar slots, applies tags for pipeline automation
- **Handles the hard cases** — pricing objections, youth enrollments, multi-program gyms, aggressive leads
- **Human handoff baked in** — staff can take over any conversation instantly with `ai off`; bot won't re-engage
- **Verifiable results** — every booking cross-referenced against GHL appointments, not just transcript claims

---

*Document compiled from live GHL data and verified appointment records.*
*Transcript excerpts use real contact first names only.*
