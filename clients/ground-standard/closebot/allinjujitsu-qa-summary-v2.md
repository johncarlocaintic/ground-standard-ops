# QA Summary — All In Jiu-Jitsu (v2.0 canon classic) — NOT READY

**Bot:** All In Jiu-Jitsu - Launch v2.0 [canon rebuild from Vacaville template] (2026-05-18)
**Bot ID:** `bot_IAHRWLP8HI2X82V1`
**Run date:** 2026-05-18
**Sandbox:** `src_4R4DUIQTMMX2NFPU` — All In 3 calendars mirrored, KB `file_DQATZDUMK1QMC4G8` indexed
**Verdict: NOT READY — systemic non-deterministic false-closure blocker (mnd_05)**

Built per canon `/closebot-build` from the 195-node Vacaville classic template
(178 nodes, 0 orphan handles, 0 placeholders). Supersedes the broken lean v1.0
`bot_W7SALTJ86VFW8LA0` `[LEGACY-BROKEN]`.

## Result: 8 PASS / 6 FAIL (11 personas + 3 non-determinism)

| Persona | Verdict | GHL appts | Note |
|---|---|---|---|
| adult_only | ✅ PASS | 1 | Adult Fundamentals BJJ booked |
| kid_young (6) | ✅ PASS | 1 | Kids 5-12 booked — lean build dead-ended here; canon FIXED it |
| kid_older (11) | ✅ PASS | 1 | Kids 5-12 booked |
| adult_and_kid | ✅ PASS | 2 | multi-enrollee BOTH booked — lean build = 0; canon FIXED it |
| teen_13_17_nocal | ✅ PASS | 0 (correct) | referral, no booking |
| under5_redirect | ✅ PASS | 0 (correct) | gym-contact redirect |
| **kid_boundary_12 (12)** | ❌ FAIL | 0 | mnd_05: T24 "You're all set!" — no booking, judge: critical fabrication |
| **nonbookable_alllevels** | ❌ FAIL | 0 | mnd_05: T14 "You're all set for Monday at 12pm!" — judge: critical fabrication |
| **pricing_deflect** | ❌ FAIL | 0 | mnd_05: T24 "You're all set for Tuesday at 6:00 PM." — judge: critical fabrication |
| **minor_self_booking (16)** | ❌ FAIL | 0 | md_11: bot said "At 16 you'd be in our adult program" — contradicts spec under-18=referral |
| **hostile_aggression** | ❌ FAIL | 0 | mnd_05: "All set Spencer, you're removed" false-closure phrasing |
| adult_only ×3 | PASS / **FAIL** / PASS | — | non-determinism: rep2 same mnd_05 false-closure |

## Root cause (cross-examined vs GHL ground truth)

**Systemic, non-deterministic false closure (mnd_05 blocker):** the classic
Vacaville-template bot confirms "you're all set" to the lead on some
booking/edge runs **with 0 GHL appointment and no booking executed** — a
fabricated confirmation. GHL Verifier (ground truth) shows 0 appointments on
kid_boundary_12 / nonbookable_alllevels / pricing_deflect; the Judge
independently flagged all three as critical fabrication. It is non-deterministic:
adult_only / kid_young / kid_older / adult_and_kid DID land real appointments
(booking fires on those paths), and adult_only itself failed 1 of 3 repeats with
the identical false-closure. So the bot sometimes books and sometimes fabricates
the confirmation — the most dangerous failure class (tells real leads they are
booked when they are not).

Secondary: classic-template minor handling says a 16-year-old "would be in our
adult program" — contradicts the All In spec rule (under 18 = minor, referral,
no self-book). The Vacaville template's minor-gate semantics do not match this
gym's spec.

## What canon FIXED vs the lean v1.0

The lean v1.0 had: Parent-for-Child dead-end (kid_young 0 appt) and
multi-enrollee never-books (adult_and_kid 0 appt). The canon classic build
**fixed both** — kid_young books (1 appt), adult_and_kid books both (2 appts).
Net: canon is better on the kid/multi-enrollee paths, but introduces/exposes a
non-deterministic false-closure on pricing/edge/boundary paths that the lean
build did not have. Neither architecture has produced a clean All In.

## Test-harness note (real gap, flag)

The orchestrator's `events.json` `tool_use` capture is agent-node-shaped — for
classic-architecture bots it logged "NO TOOL_USE EVENTS" even on runs where GHL
confirms real appointments landed. **Trust the GHL Verifier appt-count, not the
event log, for classic builds.** The cross-examination here used GHL ground
truth + judge, not the event regex.

## VERDICT: NOT READY

Blocker: mnd_05 false closure, non-deterministic, multiple personas + 1/3
non-determinism. Plus minor-gate spec mismatch. Per canon Phase 8 (booking
persona with 0 GHL appts + fabrication discrepancy = not ready). Bot detached
from sandbox; test contacts cleaned. NOT a lean hand-patch and NOT another
classic rebuild without a decision — see _CANON-AUDIT + the open decision doc.
