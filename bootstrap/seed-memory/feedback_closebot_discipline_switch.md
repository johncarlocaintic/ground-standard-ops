---
name: feedback_closebot_discipline_switch
description: cb_discipline_switch_inject.js is now N-way spec-driven — use it for any GS gym with 2+ adult discipline calendars (BJJ/No-Gi/Muay Thai/Wrestling/etc)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

`shared/scripts/closebot/cb_discipline_switch_inject.js` injects an N-way adult-discipline AISwitch + (N-1) Booking clones before each of the 8 adult Booking instances in the Vacaville classic template. The stock template has only ONE adult calendar; gyms with multiple adult disciplines need this.

**Why:** The Vacaville template's single adult Booking node can't route a lead who asks for a specific discipline. Gracie FV (2 adult cals: BJJ/Kickboxing, 2026-05-18) and Hammer Sports (5 adult cals: BJJ Gi default / No-Gi / Muay Thai / Wrestling / Kettlebell, 2026-05-18) both needed it. The script was generalized from a hardcoded 2-way to N-way, spec-driven.

**How to apply:** During `/closebot-build` for any gym whose spec has `flow.requiresDisciplineSwitch=true` / 2+ `calendars.adult` entries, run it with the spec as the 3rd arg:
`node cb_discipline_switch_inject.js <raw-base.kdl> <raw.kdl> <spec.json>`
- Spec-driven: `calendars.adult` entry with `default:true` -> AISwitch case 0 (the existing substituted Booking node, untouched); every other entry -> a cloned Booking node + its own case. Routing hint derived from each entry's `program` field.
- Omit the spec arg = backward-compatible hardcoded 2-way Gracie FV behavior.
- Pipeline order: substitute -> discipline_switch_inject -> [[feedback_closebot_youth_nocal_gate]] (only if kids cap <14 AND no teen calendar) -> strip_zindex -> import. UUID-format node IDs, flat-append (no outer bot{} wrapper). Scope-guard suffix [[feedback_closebot_booking_scope_guard]] is preserved (it comes from the substitute step on the Description, which the clones copy verbatim).
