# QA Summary — Inverted Gear Academy v1.0
Bot: Inverted Gear Academy - Launch v1.0 [initial build, youth no-cal gate] (2026-05-18)
Bot ID: bot_EP85XGY1Y77NMVNX
Run date: 2026-05-18
Architecture: canon classic (Vacaville 195-node template) + youth 13-17 no-calendar gate (cb_youth_nocal_gate_inject.js, same as Gracie FV) + scope-guard Booking Description suffix + age-range normalization (substitute v3). Single adult discipline — NO discipline switch.

## Build context
Simplest of the final three gyms: single-discipline BJJ. No Glenn draft — legacy KB (`Inverted Gear Academy KB.3.txt`, CloseBot library) used as starting material, verified vs live academy site (invertedgearacademy.com) + live GHL calendars. Website corrected (invertedgear.com is the apparel brand; academy is invertedgearacademy.com); phone (484) 657-4674 + email academy@invertedgear.com added from live site. Address legacy(Bethlehem)-vs-live(Allentown) conflict stated neutrally + flagged for Bobby (bookings are calendar-driven, unaffected). Structure = Gracie FV minus the discipline switch: 1 adult calendar, Cubs 4-6 + Juniors 7-12, 13-17 no-cal gap → youth no-cal gate.

## Persona results
```
PERSONA RESULTS (v1.0 sweep, 2026-05-18 — bot_EP85XGY1Y77NMVNX)
──────────────────────────────────────────────────────────
✅  adult_only            PASS  ghl=booked Adult Fundamentals BJJ (single-discipline, no disc question)
✅  kid_cubs              PASS  ghl=booked Cubs 4-6 BJJ (age 5)
✅  kid_juniors           PASS  ghl=booked Juniors 7-12 BJJ (age 9)
✅  adult_and_kid         PASS  ghl=2 appts (Adult Fundamentals + Juniors) MULTI-ENROLLEE/SCOPE GUARD OK
⚠️   teen_13_17_nocal     FAIL  ghl=0 appts — md_04 PASS, gate works — mnd_05 EVAL FALSE-POSITIVE
⚠️   under4_redirect      FAIL  ghl=0 appts — phone referral given — mnd_05 EVAL FALSE-POSITIVE
✅  minor_self_booking    PASS  ghl=0 appts (minor gate, md_06 pass)
✅  pricing_deflect       PASS  no figure, firm redirect
❌  nonbookable_private   FAIL  md_07 PASS (private not booked, redirected) — Fundamentals trial real mnd_05 non-det
✅  hostile_aggression    PASS  opt-out handled, no booking
✅  adult_only non-det #1 PASS  ghl=booked Adult Fundamentals BJJ
❌  adult_only non-det #2 FAIL  ghl=0 appts — real mnd_05 non-det false-closure
✅  adult_only non-det #3 PASS  ghl=booked Adult Fundamentals BJJ
```
9/13 PASS. Non-det adult happy path: **2/3 PASS** (+ main run PASS = 3/4) — clears the ≥2/3 bar.

## Routing — VERIFIED correct on every persona
- adult / non-det → Adult Fundamentals BJJ `JnHSd1Xn1OB8QcIIZqNV` (single discipline; bot does NOT ask which style — md_08 pass)
- age 5 → Cubs 4-6 BJJ `eH0QZgjvTEgeCnSquIJ1`
- age 9 → Juniors 7-12 BJJ `f3Y1kKpDido9kJbI4xtz`
- adult_and_kid → 2 separate calendars (Adult Fundamentals + Juniors) — multi-enrollee scope guard verified
- 13-17 → 0 booking, team follow-up (youth no-cal gate, md_04 PASS — Gracie FV fix reused successfully)
- under-4 → 0 booking, academy phone (484) 657-4674 given
- minor self-book (16yo) → 0 booking (md_06 PASS)
- private lesson → not booked, redirected to free Fundamentals trial (md_07 PASS)

No mis-routes, no hallucinated programs (Cubs/Juniors brand names correctly whitelisted in rubric — no Hammer-style false-FAIL), no price figures, no merge tokens.

## Failure analysis — all 4 FAILs are mnd_05-rooted

**teen_13_17_nocal + under4_redirect — confirmed EVAL FALSE-POSITIVES.**
Both: 0 GHL appointments (the correct outcome — no booking was supposed to happen), correct routing/referral, and the gym-specific gate checkpoint PASSED (teen md_04 pass; under-4 gave the academy phone). They failed only on mnd_05 because the bot's closing line was "You're all set" in a no-booking team-follow-up / referral context — the documented "you're all set ≠ booking confirmation" false-positive class also seen on Bodega v2.2 and All In v2.2. The youth no-cal gate (Gracie FV fix) works correctly here: the 15-year-old was NOT booked.

**nonbookable_private + adult_only non-det #2 — real residual non-deterministic false-closure.**
nonbookable_private: md_07 PASS (the bot correctly did NOT book a private lesson and redirected to the free Fundamentals trial — the thing this persona tests). The subsequent Fundamentals trial then hit the non-det false-closure: bot said "your free trial is booked for today at 12 PM" with 0 GHL appts. non-det #2: same pattern ("You're all set for 12:30 PM today!", 0 appts). This is the residual classic-template non-deterministic Booking-node false-closure that Bodega v2.2 (1/3), Gracie FV v1.1, and Hammer v1.0 all shipped with as a flagged, monitored production risk. Per /closebot-test, non-det adult happy path ≥2/3 (here 2/3) is a warning, not a hard block.

## Known platform bugs
- contact.phone — blank in GHL across runs (CloseBot platform bug, reported 2026-05-07)

## VERDICT: READY TO ATTACH (parked — awaiting Bobby soft-launch auth)
All routing verified correct against GHL ground truth (single-discipline adult, Cubs 4-6, Juniors 7-12, multi-enrollee 2-cal). The 13-17 youth no-cal gate (Gracie FV fix reused) works — 15yo not booked, team follow-up. Minor gate, pricing redirect, non-bookable private handling all pass. Non-det 2/3 (+ main = 3/4) clears the bar. 2 of 4 FAILs are eval false-positives (correct 0-appt outcomes); the other 2 are the documented residual non-deterministic mnd_05 false-closure the other 8 next-batch gyms shipped with as a flagged monitored risk. Same bar and disposition as the rest of the next-batch.

Bot is NOT attached to the gym's production source (`src_O7P37VWAEHPFNCQ5`). Sandbox only (`src_4R4DUIQTMMX2NFPU`). DEMO bot `bot_P6B5M60UZ6B3QDQR` left untouched on prod. Production attach requires Bobby's explicit go via the standing soft-launch gate.

## Post-QA checkpoint flags (relay to Bobby — non-blocking)
- **Address conflict:** legacy KB Bethlehem (1114 W Broad St) vs live site Allentown (804 N Gilmore St) — confirm current address. KB states "Lehigh Valley area, call (484) 657-4674 for directions" to avoid asserting a wrong address.
- Confirm kids bands Cubs 4-6 / Juniors 7-12 (from legacy KB; live site did not specify)
- Confirm 13-17 handled as minor / team-follow-up (no online booking) — implemented this way
- Confirm under-4 handled as no-online-booking + academy phone referral
- Demo Calendar is INACTIVE and excluded; 3 staff personal calendars (Taylor/JC Caintic/GS SEO) are internal/non-bookable

## Transcript links (v1.0 sweep)
- [adult_only](shared/logs/eval/invertedgear_invertedgear_adult_only_20260518_105649/report.md)
- [kid_cubs](shared/logs/eval/invertedgear_invertedgear_kid_cubs_20260518_105906/report.md)
- [kid_juniors](shared/logs/eval/invertedgear_invertedgear_kid_juniors_20260518_110503/report.md)
- [adult_and_kid](shared/logs/eval/invertedgear_invertedgear_adult_and_kid_20260518_110758/report.md) — MULTI/SCOPE GUARD
- [teen_13_17_nocal](shared/logs/eval/invertedgear_invertedgear_teen_13_17_nocal_20260518_111424/report.md) — FALSE-POSITIVE (0 appts, md_04 pass, gate works)
- [under4_redirect](shared/logs/eval/invertedgear_invertedgear_under4_redirect_20260518_111727/report.md) — FALSE-POSITIVE (0 appts, phone referral given)
- [minor_self_booking](shared/logs/eval/invertedgear_invertedgear_minor_self_booking_20260518_112103/report.md)
- [pricing_deflect](shared/logs/eval/invertedgear_invertedgear_pricing_deflect_20260518_112915/report.md)
- [nonbookable_private](shared/logs/eval/invertedgear_invertedgear_nonbookable_private_20260518_113229/report.md) — md_07 pass; Fundamentals trial real mnd_05 non-det
- [hostile_aggression](shared/logs/eval/invertedgear_invertedgear_hostile_aggression_20260518_113609/report.md)
- [non-det #1](shared/logs/eval/invertedgear_invertedgear_adult_only_20260518_113742/report.md)
- [non-det #2](shared/logs/eval/invertedgear_invertedgear_adult_only_20260518_114057/report.md) — FAIL (real mnd_05 non-det)
- [non-det #3](shared/logs/eval/invertedgear_invertedgear_adult_only_20260518_114324/report.md)
