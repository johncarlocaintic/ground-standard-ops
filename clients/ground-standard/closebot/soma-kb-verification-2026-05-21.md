# SOMA MVMT KB Verification — 2026-05-21

**Sources consulted:** somamvmt.com landing page + live GHL location data (`dIyjbKFHzS4MRBKtd7oQ`).

## Verified facts
- Studio name: SOMA MVMT
- Address: 6 W Parker Ave, Maplewood NJ 07040 (matches GHL + website)
- Programs visible on site: Adult Small Group Fitness (Functional Strength Interval Training), Steel Mace Flow, Mindfulness/Meditation, Guided Breathwork
- Equipment: kettlebells, steel maces, bodyweight
- Demographic: adults 30s-50s, creative professionals
- Philosophy: sustainable training, small class sizes
- Bookable trial entry: "SOMA MVMT Introduction Class" (60 min) — confirmed via GHL calendar `RxiVRNWlCHsaC3rEVCmi`

## Discrepancies flagged
- **Phone number:** Website lists `908-408-2137`; GHL has `+1 201-403-3225`.
  - Decision: KB uses the GHL number `(201) 403-3225`. The bot operates against the GHL contact + calendar, so the GHL-side phone is the operational truth. Flag for Bobby to confirm at soft-launch which number leads should be told to call.

## Gaps / not in KB
- **Coaches / instructors:** not listed on the landing page. No `/about` or `/team` page accessible. Omitted from KB rather than fabricated.
- **Class schedule:** gated behind the `/adult-offer` lead-capture page. KB does not state class times; the booking node pulls live availability from GHL.
- **Pricing:** not stated in KB per GS content standards.
- **Age band specifics:** no explicit minimum age mentioned. KB states the studio does not run dedicated youth/kids/teen programs; the bot's minor gate handles under-18 leads as no-cal referrals.

## Bot behavior implications
- **No youth path needed.** No kids/teen calendars exist.
- **No discipline switch needed.** Single bookable calendar.
- **Minor gate still applied per universal GS rule.** Under-18 leads get captured + team referral, no booking attempt.
- **No "non-bookable program" handling needed** beyond the universal flow — Steel Mace Flow / Mindfulness etc. are part of the regular membership but the Intro Class is the trial entry point for all of them.
