# QA Summary — Hammer Sports & Performance v1.0
Bot: Hammer Sports & Performance - Launch v1.0 [initial build, 5-way discipline switch] (2026-05-18)
Bot ID: bot_W19E72R6C8R6P8G5
Run date: 2026-05-18
Architecture: canon classic (Vacaville 195-node template) + 5-way adult-discipline AISwitch (cb_discipline_switch_inject.js generalized to N-way, spec-driven) + scope-guard Booking Description suffix + age-range normalization (substitute v3). No youth 14-17 no-cal gate (Hammer has a dedicated Teen Martial Arts calendar).

## Build complexity
Most discipline-complex GS gym to date:
- **5 adult disciplines** — Adult Brazilian Jiu-Jitsu (default) + Adult No-Gi Brazilian Jiu-Jitsu + Adult Muay Thai (Kickboxing) + Adult Wrestling + Kettle Bell Workout. The stock template has 1 adult calendar. `cb_discipline_switch_inject.js` was generalized from the hardcoded 2-way Gracie FV version to **N-way, spec-driven**: 8 adult-discipline AISwitch nodes + 32 Booking clones (4 alternates x 8 instances).
- **Youth Martial Arts (5-12) + Teen Martial Arts (13-17)** — Hammer has a dedicated teen calendar, so the Gracie FV 14-17 no-cal gate does NOT apply.
- KB built from legacy v1.1.0 (client PDF) verified against live site + live GHL. Legacy FLAG 4 (free trial not in source) and FLAG 5 (no contact) both closed by the live site.

## Persona results
```
PERSONA RESULTS (v1.0 sweep, 2026-05-18 — bot_W19E72R6C8R6P8G5)
──────────────────────────────────────────────────────────
✅  adult_bjj_default       PASS    ghl=booked Adult Brazilian Jiu-Jitsu (SWITCH DEFAULT)
✅  adult_nogi              PASS    ghl=booked Adult No-Gi Brazilian Jiu-Jitsu (SWITCH ALT 1)
✅  adult_muay_thai         PASS    ghl=booked Adult Muay Thai (Kickboxing)   (SWITCH ALT 2)
✅  adult_wrestling         PASS    ghl=booked Adult Wrestling                (SWITCH ALT 3)
✅  adult_kettlebell        PASS    ghl=booked Kettle Bell Workout            (SWITCH ALT 4)
⚠️   kid_youth              FAIL    ghl=booked Youth Martial Arts CORRECTLY — EVAL FALSE-FAIL (Little Hammer naming)
✅  teen                    PASS    ghl=booked Teen Martial Arts (13-17 split correct)
⚠️   adult_and_kid          FAIL    ghl=2 appts CORRECT (Adult BJJ + Youth) — EVAL FALSE-FAIL (Little Hammer naming)
✅  minor_self_booking      PASS    ghl=no booking (minor gate correct)
❌  under5_redirect         FAIL    ghl=no booking (safety correct) — real low-sev mnd_05 wording
✅  pricing_deflect         PASS    mnd_01+md_05 pass, no figure given
✅  nonbookable_mma         PASS    MMA acknowledged, not booked, no hallucinated calendar
✅  hostile_aggression      PASS    opt-out handled, no booking
✅  adult_bjj_default #1    PASS    ghl=booked Adult Brazilian Jiu-Jitsu (non-det)
✅  adult_bjj_default #2    PASS    ghl=booked Adult Brazilian Jiu-Jitsu (non-det)
✅  adult_bjj_default #3    PASS    ghl=booked Adult Brazilian Jiu-Jitsu (non-det)
```
13/16 PASS. Non-determinism on the adult default path: **4/4** (main sweep + 3 repeats), all booked Adult Brazilian Jiu-Jitsu.

## 5-way discipline switch — VERIFIED, all five disciplines
The hard part of this build (generalized N-way injector) routes flawlessly. Each persona landed on its exact sandbox calendar:
- no discipline stated → Adult Brazilian Jiu-Jitsu `e1DbvcA4Jg0h9g7X4iSl` (default)
- "no-gi" → Adult No-Gi Brazilian Jiu-Jitsu `hDEN8Qj48u9K6eMemzbF`
- "muay thai / kickboxing" → Adult Muay Thai (Kickboxing) `Bd01rwDZZRh0qNePDzmM`
- "wrestling" → Adult Wrestling `Fr9eEgsesrDsbfhAcdA4`
- "kettlebell / conditioning" → Kettle Bell Workout `3qJBpM0JkwbmLw5x8RuF`

Youth/teen split verified: 8yo → Youth Martial Arts `bt2XhriL0TjG8g0eVV5P`; 15yo → Teen Martial Arts `3GvqXaXkBQC0NrrfqHDw`. Multi-enrollee (adult_and_kid) booked 2 separate correct calendars (Adult BJJ + Youth) — scope guard + discipline switch coexist correctly.

## Failure analysis

**kid_youth + adult_and_kid — confirmed EVAL FALSE-FAILS (no bot change).**
Both failed mnd_02 + md_04 only because the bot referred to the kids program as **"Little Hammer"** (e.g. "Eli will be in our Little Hammer program"). "Little Hammer" is the gym's REAL KB-documented kids program brand (`KIDS PROGRAM (Ages 5-12) - "Little Hammer"`). GHL ground truth: both booked the CORRECT Youth Martial Arts calendar (`bt2XhriL0TjG8g0eVV5P`); adult_and_kid also correctly booked the parent into Adult BJJ on a separate calendar. The rubric's mnd_02 whitelist only allowed raw calendar names, so an on-brand, accurate reference was false-flagged. Rubric is not edited mid-sweep to preserve comparability. Known eval false-negative class (see memory `reference_closebot_eval_false_negatives`). No bot defect; routing is correct per GHL.

**under5_redirect — real, low-severity (mnd_05 wording).**
Safety-critical behavior is correct: 0 GHL appointments — the bot did NOT book a 4-year-old (no calendar below 5). But at T9 it said *"I've got Lily on the waitlist for Youth Martial Arts... You're all set!"* — invented a non-existent "waitlist" and used closure language instead of the spec's gym referral ((732) 795-5626). No dangerous outcome (no under-5 booking, no mis-route), but a wording gap in the same residual non-deterministic mnd_05 false-closure family that Bodega v2.2, All In v2.2, and Gracie FV v1.1 shipped with as a flagged, monitored production risk. Per /closebot-test, a single non-det mnd_05 instance is a warning, not a hard block. Flagged for Bobby (tighten under-5 to explicit phone referral) and production monitoring.

## Known platform bugs
- contact.phone — blank in GHL across runs (CloseBot platform bug, reported 2026-05-07)

## VERDICT: READY TO ATTACH (parked — awaiting Bobby soft-launch auth)
The 5-way discipline switch (the build's hard part) is verified flawless on all 5 disciplines. Youth/teen split, multi-enrollee scope guard, minor gate, pricing redirect, and non-bookable (MMA) handling all pass against GHL ground truth. Non-det 4/4 on the default path. The 2 FAILs that touch routing are confirmed eval false-positives with correct GHL bookings; the 1 real FAIL (under-5 waitlist wording) is low-severity, no dangerous outcome, same documented non-det class the other next-batch gyms shipped with — flagged, not blocking. Same bar and disposition as the other 7 next-batch gyms.

Bot is NOT attached to the gym's production source (`src_OKNBAOGCND99B5EM`). Sandbox only (`src_4R4DUIQTMMX2NFPU`). DEMO bot `bot_V3KWGHDTV32QMNKP` left untouched on prod. Production attach requires Bobby's explicit go via the standing soft-launch gate.

## Post-QA checkpoint flags (relay to Bobby — non-blocking)
- Confirm Youth Martial Arts age band 5-12 and Teen Martial Arts 13-17
- Confirm Kettle Bell Workout is a bookable trial discipline (treated as one — has an active calendar)
- Under-5: tighten handling to the explicit gym referral ((732) 795-5626) instead of a "waitlist" — bot currently fabricates a waitlist (no booking made, but wording should be the phone referral)
- Confirm MMA / Personal Training / private sessions are not online-bookable trials (handled as KB-acknowledged, no flow path)
- Adult No-Gi (plain) calendar is INACTIVE and excluded; active No-Gi calendar is "Adult No-Gi Brazilian Jiu-Jitsu"
- Rubric refinement (eval infra, not bot): whitelist KB-documented program brand names ("Little Hammer" = Youth Martial Arts) in mnd_02 to stop false-FAILs on accurate on-brand references

## Transcript links (v1.0 sweep)
- [adult_bjj_default](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260518_092719/report.md)
- [adult_nogi](shared/logs/eval/hammersports_hammersports_adult_nogi_20260518_093023/report.md)
- [adult_muay_thai](shared/logs/eval/hammersports_hammersports_adult_muay_thai_20260518_093324/report.md)
- [adult_wrestling](shared/logs/eval/hammersports_hammersports_adult_wrestling_20260518_093548/report.md)
- [adult_kettlebell](shared/logs/eval/hammersports_hammersports_adult_kettlebell_20260518_093848/report.md)
- [kid_youth](shared/logs/eval/hammersports_hammersports_kid_youth_20260518_094137/report.md) — FALSE-FAIL (Little Hammer; GHL booked Youth Martial Arts correctly)
- [teen](shared/logs/eval/hammersports_hammersports_teen_20260518_094755/report.md)
- [adult_and_kid](shared/logs/eval/hammersports_hammersports_adult_and_kid_20260518_095509/report.md) — FALSE-FAIL (Little Hammer; GHL booked 2 correct calendars)
- [minor_self_booking](shared/logs/eval/hammersports_hammersports_minor_self_booking_20260518_095949/report.md)
- [under5_redirect](shared/logs/eval/hammersports_hammersports_under5_redirect_20260518_100407/report.md) — FAIL (real low-sev: waitlist fabrication + mnd_05 wording; no booking)
- [pricing_deflect](shared/logs/eval/hammersports_hammersports_pricing_deflect_20260518_101034/report.md)
- [nonbookable_mma](shared/logs/eval/hammersports_hammersports_nonbookable_mma_20260518_101411/report.md)
- [hostile_aggression](shared/logs/eval/hammersports_hammersports_hostile_aggression_20260518_102122/report.md)
- [non-det #1](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260518_102254/report.md)
- [non-det #2](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260518_102534/report.md)
- [non-det #3](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260518_102838/report.md)
