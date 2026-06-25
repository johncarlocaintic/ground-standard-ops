# Sugoi Submissions — KB Verification (2026-05-19)

**Source material:** legacy KB v1.1.0 `file_WSF3D54UJ6PGSX7M` (client intake PDF, Mar 2026; already pricing-redirected in v1.1.0). Saved reference: `_sugoi-legacy-kb-REFERENCE.txt`.
**Verified against:** live site sugoisubmissions.com (WebFetch 2026-05-19) + live GHL location `13FZuBUiLGp1WVpWYz3b` calendars (source `src_JPK476A1ODXA5YGB`).

## Confirmed
- Address `3403 South Padre Island Drive, Suite 205, Corpus Christi, TX 78415` — site + KB match.
- Free trial / intro class — site explicitly offers ("GET A FREE TRIAL"), KB matches.
- Gym operational — site has current class info, instructor profiles, recent testimonials.
- Programs (BJJ Gi, Kids BJJ, Competition/Open Mat) — site subset confirms KB; KB retains fuller client-intake program list (No-Gi, Wrestling, Women's, Mat Mobility).

## Corrections / decisions
- **Kids age bands:** legacy KB says "Kids 4–12". Live GHL active trial (round_robin) calendars split this into **Kids 4-8 Fundamentals** and **Teens 9-15 Fundamentals**. GHL is the booking source of truth → KB reworded to age-neutral ("age-appropriate groups"); spec routes 4-8 and 9-15 per GHL.
- **Phone:** site does not list a phone; legacy KB (client intake) has `(361) 336-0859` — retained as client-confirmed.
- **Email discrepancy (flagged, non-blocking):** legacy KB `sergio@sugoisubmissions.com` vs site `jiujitsuhub2025@gmail.com`. Email is not bot-critical and not used in flow; **excluded from KB** rather than assert a contradiction. Relay to Bobby at checkpoint.
- Internal sections dropped: changelog, pricing-figure history (already removed in v1.1.0), behavioral framework notes.

## Bookable vs non-bookable (live GHL round_robin trial calendars)
ACTIVE round_robin (trial-bookable):
- Adult Fundamentals BJJ — `HDi7QEsiQLBPZa3q7lWw` (18+)
- Kids 4-8 Fundamentals Jiu-Jitsu — `9txY0SGOngIPvHeqgfEv` (ages 4-8, guardian)
- Teens 9-15 Fundamentals Jiu-Jitsu — `ERl4iddht0BH08ViscJM` (ages 9-15, guardian, minor)

INACTIVE round_robin (NOT bookable): Kids 3-5 BJJ, Kids 6-9 BJJ, Kids 10-14 BJJ, Adult All Levels BJJ.
class_booking entries (recurring class timetable, NOT trial calendars — non-bookable via bot): Adults Gi (multiple day/time), Adults No-Gi, Women's Jiu-Jitsu (Gi), Wrestling for Jiu-Jitsu, Mobility & Movement, Open Mat & Competition Rounds, Teens/Kids day-specific class slots.

## Age routing (from live GHL)
- under 4: no calendar → no booking, refer to academy (361) 336-0859
- 4-8: Kids 4-8 Fundamentals Jiu-Jitsu (guardian required)
- 9-15: Teens 9-15 Fundamentals Jiu-Jitsu (guardian required, minor)
- 16-17: NO calendar band (teens cap at 15, adult is 18+) → **youth no-cal gate required**
- 18+: Adult Fundamentals BJJ (single adult discipline — no discipline switch)

## Genuine gaps (flag to Bobby, not fabricated)
- Email of record (KB vs site mismatch — above).
- 16-17 has no trial calendar — confirm intended handling (gate to team follow-up).
- Several inactive round_robin kids calendars (3-5, 6-9, 10-14) — confirm the active 4-8 / 9-15 split is current and intentional.
- No-Gi / Wrestling / Women's / Mat Mobility have no round_robin trial calendar — bot treats as non-bookable (KB-acknowledged, no flow path). Confirm with Bobby.
