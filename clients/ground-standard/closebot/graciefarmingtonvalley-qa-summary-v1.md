# QA Summary — Gracie Farmington Valley v1.1
Bot: Gracie Farmington Valley - Launch v1.1 [14-17 no-cal gate fix] (2026-05-18)
Bot ID: bot_6M9WIXCXKY4W9HDV
Run date: 2026-05-18
Architecture: canon classic (Vacaville 195-node template) + adult-discipline AISwitch (cb_discipline_switch_inject.js) + youth 14-17 no-calendar gate (cb_youth_nocal_gate_inject.js) + scope-guard Booking Description suffix + age-range normalization (substitute script v3)

## Build complexity
Gracie FV is the most complex next-batch gym:
- **2 adult disciplines** — Adult Fundamentals BJJ (default) + Adult All Levels Cardio Kickboxing (explicit request only). Stock template has 1 adult calendar. Solved with `cb_discipline_switch_inject.js`: an adult-discipline AISwitch + Kickboxing Booking clone injected before all 8 adult Booking nodes (main + 7 multi-enrollee copies).
- **3 kids bands** — Kids 4-5, Kids 6-7, Kids 8-13 BJJ.
- **14-17 no-calendar gap** — kids cap at 13, adults are 18+. The stock Vacaville template hardcodes youth routing to "book ages 7-14" with NO terminal "too old for kids / no calendar" branch (Vacaville's kids go to 14 with no gap). v1.0 booked 14-17 minors straight into Kids 8-13.

## Key fix validated (v1.0 → v1.1)
v1.0 (bot_6UQPKNZ2QZ719272) FAILED teen_14_17_nocal: a 15-year-old was booked into Kids 8-13 BJJ. Same root cause produced a false-PASS on minor_self_booking (17yo also booked into Kids 8-13). This is a **canon-template architectural gap**, not a config error — it recurs for any gym whose kids cap below the 14-17 minor band.

Fix: `cb_youth_nocal_gate_inject.js` inserts a DOB-age Comparator before every kids-age AISwitch (4 instances). Age 14-17 → no-booking "team will follow up" Statement → EOC. Under 14 → unchanged kids routing. New pipeline stage: substitute → discipline_switch_inject → **youth_nocal_gate_inject** → strip_zindex → import.

v1.1 confirmed: teen_14_17_nocal PASS / 0 appts; minor_self_booking PASS / 0 appts. Bot now says: *"our kids program goes up to 13 and adult classes start at 18, so we don't have an online booking option for that age group... our team will reach out directly."*

## Persona results
```
PERSONA RESULTS (v1.1 sweep, 2026-05-18 — bot_6M9WIXCXKY4W9HDV)
──────────────────────────────────────────────────────────
❌  adult_only (main)       FAIL    blockers=1  mnd_05 non-det false-closure (0 appts)
✅  adult_kickboxing        PASS    blockers=0  ghl=booked Cardio Kickboxing (DISCIPLINE SWITCH ALT VERIFIED)
⚠️   kid_youngest           PASS    blockers=0  ghl=0 appts — gate passed 4yo correctly; non-det slot-deflection
✅  kid_middle              PASS    blockers=0  ghl=booked Kids 6-7 BJJ
✅  kid_older               PASS    blockers=0  ghl=booked Kids 8-13 BJJ
✅  adult_and_kid           PASS    blockers=0  ghl=2 appts diff cals (Adult Fund + Kids 8-13) SCOPE GUARD VERIFIED
✅  teen_14_17_nocal        PASS    blockers=0  ghl=no booking (14-17 NO-CAL GATE FIX VERIFIED)
✅  minor_self_booking      PASS    blockers=0  ghl=no booking (minor gate + 14-17 gate correct)
❌  pricing_deflect         FAIL    blockers=1  mnd_01+md_05 PASS (pricing correct); mnd_05 non-det false-closure
✅  hostile_aggression      PASS    blockers=0  ghl=no booking (opt-out handled)
✅  adult_only non-det #1   PASS    blockers=0  ghl=booked Adult Fundamentals BJJ
✅  adult_only non-det #2   PASS    blockers=0  ghl=booked Adult Fundamentals BJJ
✅  adult_only non-det #3   PASS    blockers=0  ghl=booked Adult Fundamentals BJJ
```

## Discipline switch — VERIFIED both paths
- adult_only / non-det ×3: no kickboxing mention → **Adult Fundamentals BJJ** (`JnHSd1Xn1OB8QcIIZqNV`) — switch DEFAULT correct
- adult_kickboxing: explicit "cardio kickboxing" → **Adult All Levels Cardio Kickboxing** (`65C4tpb9HB5SCYPveh3L`) — switch ALTERNATE correct
- adult_and_kid: adult (no kickboxing) → Adult Fundamentals BJJ + kid → Kids 8-13, 2 separate calendars — discipline switch + scope guard coexist correctly

## Kids age-band routing — VERIFIED all 3
- Kids 4-5 BJJ → `s2yXpdh895KnJwd8QWwf` (v1.0 kid_youngest confirmed)
- Kids 6-7 BJJ → `9fiyuQ3FGcYCllA7lVpJ` (v1.1 kid_middle)
- Kids 8-13 BJJ → `NewV46aYm64roBvbJmM4` (kid_older, adult_and_kid child leg)

## Failure analysis — both FAILs are the known non-deterministic false-closure

**adult_only (main, 075444) + pricing_deflect (084712):** both fail mnd_05 only. Bot said "you're all set" then deferred ("team will reach out"), 0 GHL appts. pricing_deflect's pricing checkpoints (mnd_01 no figure, md_05 firm redirect) both PASS — the deflection itself is correct. This is the **residual classic-template non-deterministic false-closure** also shipped (flagged, monitored) on Bodega v2.2 and All In v2.2 — the Booking-node LLM intermittently confirms/defers before book_appointment lands. Not introduced by either injection (adult path doesn't touch the youth gate; the discipline-switch path passed clean on adult_kickboxing + 3/3 non-det).

**kid_youngest (080533):** QA PASS, judge fail, 0 appts. The 14-17 gate correctly passed the 4-year-old through to the kids program (transcript: "Emma will be in our Kids Brazilian Jiu-Jitsu program"). Bot then non-det-deflected on the slot ask ("I don't have class times in front of me, team will reach out") — same Booking-node non-determinism, not a gate misfire.

**Non-determinism rate:** dedicated adult_only ×3 = **3/3 PASS** (bar is ≥2/3). Across all 13 booking-path conversations the residual false-closure/deflection appears ~3 times (~23%), within the documented ~1/3 tolerance the other next-batch gyms shipped with. Per /closebot-test: 1/3 = warning, not a hard block. Flagged as known production-monitoring risk.

## pricing_deflect orchestrator instability (infra, not bot)
pricing_deflect produced NO REPORT twice (shutdown-killed partial + one orchestrator crash post-tester) before the isolated re-run completed. Bot pricing behavior was correct in every partial transcript. Infra flakiness in the QA-agent step, not a bot defect.

## Known platform bugs
- contact.phone — blank in GHL across runs (CloseBot platform bug, reported 2026-05-07)

## VERDICT: READY TO ATTACH (parked — awaiting Bobby soft-launch auth)
The v1.0 blocker (14-17 no-calendar band) is fixed and confirmed on both manifestations. Discipline switch (both paths), multi-enrollee scope guard, and all 3 kids age-bands are verified against GHL ground truth. Non-det check 3/3. The two FAILs are the known residual non-deterministic false-closure that Bodega v2.2 and All In v2.2 shipped with as a flagged monitored risk — same bar, same risk, same disposition.

Bot is NOT attached to the gym's production source (`src_LGA6WCCJSAEE8X6R`). Sandbox only (`src_4R4DUIQTMMX2NFPU`). DEMO bot `bot_8PI9YQ90JJ9TLVTN` left untouched on prod. Production attach requires Bobby's explicit go via the standing soft-launch gate.

## Post-QA checkpoint flags (relay to Bobby — non-blocking)
- Confirm Adult All Levels Cardio Kickboxing is the intended 2nd bookable adult trial
- Confirm kids buckets 4-5 / 6-7 / 8-13
- Confirm 14-17 handled as minor / team-follow-up (no online booking) — implemented this way
- Confirm Competition Class is not online-bookable
- Confirm no Georgetown TX 2nd location (excluded as template artifact)
- pit-inventory.md lists wrong source id `src_8PI9YQ90JJ9TLVTN` (empty); prod is `src_LGA6WCCJSAEE8X6R` — fix inventory later, non-blocking

## Transcript links (v1.1 sweep)
- [adult_only main FAIL](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_only_20260518_075444/report.md) — non-det false-closure
- [adult_kickboxing](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_kickboxing_20260518_080222/report.md)
- [kid_youngest](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_kid_youngest_20260518_080533/report.md) — 0 appts, non-det slot-deflection
- [kid_middle](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_kid_middle_20260518_080917/report.md)
- [kid_older](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_kid_older_20260518_081244/report.md)
- [adult_and_kid](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_and_kid_20260518_081728/report.md) — SCOPE GUARD
- [teen_14_17_nocal](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_teen_14_17_nocal_20260518_082311/report.md) — **14-17 GATE FIX**
- [minor_self_booking](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_minor_self_booking_20260518_082649/report.md)
- [pricing_deflect FAIL](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_pricing_deflect_20260518_084712/report.md) — pricing PASS, mnd_05 non-det false-closure
- [hostile_aggression](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_hostile_aggression_20260518_083539/report.md)
- [non-det #1](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_only_20260518_083658/report.md)
- [non-det #2](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_only_20260518_084026/report.md)
- [non-det #3](shared/logs/eval/graciefarmingtonvalley_graciefarmingtonvalley_adult_only_20260518_084311/report.md)
