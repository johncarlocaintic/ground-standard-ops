---
name: feedback_closebot_youth_nocal_gate
description: Vacaville canon template has no 14-17 no-calendar gate; any gym whose kids cap below 14 needs cb_youth_nocal_gate_inject.js or it books teens into the oldest kids calendar
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

The Vacaville 195-node canon template hardcodes youth routing to "book ages 7-14" with NO terminal "too old for kids / too young for adult / no calendar" branch. Vacaville's own kids program runs to 14 with no gap, so the template never needed one.

**Why:** Any gym whose kids program caps BELOW the 14-17 minor band (e.g. Gracie Farmington Valley: kids 4-13, adults 18+) will book 14-17 minors straight into the oldest kids calendar. Confirmed 2026-05-18 on Gracie FV v1.0 (`bot_6UQPKNZ2QZ719272`): a 15yo booked into Kids 8-13; same root cause produced a false-PASS on minor_self_booking (17yo also booked). The spec's youth minor-gate comparator does not catch this — the AI-driven kids-age AISwitch consumes 14-17 before any gate fires.

**How to apply:** During `/closebot-build` for any gym where the top kids calendar's ageMax < 17 and there is no adult calendar for 14-17, run `shared/scripts/closebot/cb_youth_nocal_gate_inject.js` as a pipeline stage. It inserts a DOB-age Comparator before every kids-age AISwitch (`44682e4d-...` family): age [nocalMin]-17 → no-booking "team will follow up" Statement → EOC; under [nocalMin] → unchanged kids routing. Pipeline order: substitute → discipline_switch_inject (if 2+ adult disciplines) → youth_nocal_gate_inject (if kids cap <17) → strip_zindex → import. Use UUID-format node IDs (CloseBot rejects non-UUID ids on publish) and flat-append nodes (the KDL has no outer `bot{}` wrapper).

**SPEC-DRIVEN (updated 2026-05-19):** Pass the spec.json as the 3rd arg: `node cb_youth_nocal_gate_inject.js <in> <out> <spec.json>`. The script reads `flow.youthNoCalGate.band` (e.g. "16-17" or "15-17") and `calendars.kids[].ageMax` to compute the exact no-cal band. Without a spec arg it defaults to 14-17 (backward compatible). **Always pass the spec** — hardcoded 14-17 is wrong for gyms where kids cap at 14 or 15 (Paragon has Kids 7-14 BJJ, so gate must start at 15; OM BJJ cap is 15 so gate starts at 16).

**Bug found 2026-05-19 on Paragon v1.2:** Hardcoded 14-17 gate was catching 14-year-olds who should go into Kids 7-14 BJJ. Fix: rebuilt as v1.3 with spec-driven 15-17 gate. Always verify gate ages match `flow.youthNoCalGate.band` in the spec before import. Sibling pattern: [[feedback_closebot_booking_scope_guard]].
