# Academy Eden Prairie — KB verification pass (2026-05-17)

Source: Glenn draft `academy_eden_prairie_kb_v1.1.0_DRAFT.txt` (single PDF
source, no website/ClickUp cross-check done by Glenn). Cleaned to
`academyedenprairie-kb-v1.0.0.txt`.

## Corrected (live website is authoritative)

- **City: Minneapolis -> Edina.** Draft said "Minneapolis, MN 55439". Live
  academyedenprairie.com states 7501 Washington Ave S, **Edina, MN 55439**.
  Same street + zip; 55439 is Edina. Corrected in Section 1 + 2.

## Confirmed match (no change)

- Business name (The Academy Eden Prairie / + "LLC" on site — immaterial)
- Phone 952-377-8111
- Free trial class, no commitment — site has "GET A FREE TRIAL" CTA
- Membership pricing not public — site gates pricing behind a separate page;
  no-pricing rule holds, KB Section 8 stays redirect-only

## Flagged gaps (NOT filled — client confirm)

1. **"Competition Class"** appears in the website's program list but is absent
   from the PDF/KB. Not added (no source basis). Bot will not offer it; if it's
   a real bookable program, needs a KB line + a GHL calendar.
2. **KB program structure vs GHL calendars.** pit-inventory.md lists Eden
   Prairie's source as 4 calendars (2 BJJ, 2 Muay Thai). The KB describes more
   granular tracks (Kids 4-7, Kids 8-12, adult Gi JJ, No-Gi JJ, Muay Thai,
   Women's Only). Booking can only target calendars that exist on the source —
   reconcile by fetching live calendars during /closebot-plan and binding the
   booking node to actual calendar IDs.
3. Single-source KB: only the May 2026 PDF. No ClickUp triangulation existed
   for this gym (unlike Bodega/Breathe/Centerline which have mismatch reports).

## Content-standards check — PASS

- No dollar figures anywhere.
- No bot-instruction language ("you must", "always say"). Section 6 policies
  are gym-facts, not bot directives — acceptable.
- No placeholder text, no cross-client bleed.
- Free trial present (aligns with trial-always-true rule).
- Minor scope: all kids programs are ages 4–12 (minors); adult tracks 18+.
  Standard GS minor gate applies.
