---
name: feedback_closebot_booking_scope_guard
description: Booking node AI is greedy — append a one-line multi-enrollee scope guard to every Booking Description. Critical for single-kids-cal gyms; harmless for multi-cal.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6cdcd7b6-af28-4c2f-8a61-fec60b7da847
---

**Rule:** Every CloseBot classic Booking node's Description must end with this one-line scope guard:

`. Book one trial only - additional enrollees are handled in a separate step`

**Why:** The Booking node gives its internal AI 15 tool iterations and access to the full conversation. Without an explicit scope constraint, when a persona prompts a second booking mid-node ("what about my trial?"), the AI just calls `check_availability` + `book_appointment` AGAIN on the SAME node's hard-bound calendar. `exit_method` is one option the AI may pick, not a hard "exit after one success" rule. Calendar binding alone is not scope.

Vacaville hides this because its 3 kid Bookings each bind to DIFFERENT calendars (3-5 / 7-13 / 10-14) — the calendar name itself is a soft scope hint. Single-kids-cal gyms (Bodega, All In, future Inverted Gear) collapse all 3 to one calendar, removing that hint — and the kid Booking node then books BOTH the kid and the adult to the kid calendar. Verified 2026-05-18 on Bodega bot_ENNVPB9HV6R8TOPN: GHL appointment `rpp6rEphgTb6xgp2vqsw` and `DDX6AgimHi9CKrAcWvCF` both landed on `x5UsfwUr0Glp9zVsb6Pk` (Kids 6-14) when the adult should have been on Adult No-Gi.

**How to apply:** Already baked into `shared/scripts/closebot/cb_vacaville_substitute.js` (Phase 3c, idempotent regex over every `Booking { ... Description "..." }` block). Don't bypass. If you build a Booking node by hand outside the substitute script, add this sentence yourself.

This is the single allowed exception to the standing rule that Booking Description = appointment type + duration only ([[feedback_closebot_booking_short_description]]) — because it prevents a real cross-calendar mis-route bug, not a style nit.

Pairs with: [[feedback_closebot_prompt_discipline]], [[feedback_closebot_booking_short_description]], [[feedback_gs_kb_verification_standard]].
