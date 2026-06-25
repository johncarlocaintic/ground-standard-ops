# QA Summary — Sugoi Submissions
**Bot:** Sugoi Submissions - Launch v1.0
**Bot ID:** `bot_9FQFKDX3GQ08QKA0`
**Run date:** 2026-05-19
**Client:** Ground Standard | Prod source: `src_JPK476A1ODXA5YGB` (NOT attached) | Sandbox: `src_4R4DUIQTMMX2NFPU`

## VERDICT: NOT QA-PASSED — 1 real blocker (16-17 no-cal gate bypassed). Needs v1.1 + re-test.

---

## Persona results (11 + 1 non-det)

| Persona | Run ID | Verdict | Notes |
|---|---|---|---|
| adult_gi_default | `sugoi_sugoi_adult_gi_default_20260518_201846` | ✅ PASS | Adult Fundamentals BJJ booked |
| adult_inquisitive | `sugoi_sugoi_adult_inquisitive_20260518_202207` | ✅ PASS | Asked No-Gi → correctly kept Fundamentals (single-disc) |
| kid_4_8 | `sugoi_sugoi_kid_4_9_20260518_202506` * | ✅ PASS | 6yo → Kids 4-8 Fundamentals, **1 GHL appt confirmed** (proves youth path works) |
| teen_9_15 | `sugoi_sugoi_teen_10_15_20260518_203121` * | ⚠️ FAIL→FP | 13yo, mnd_05: "Jordan is booked" but GHL=0. md_03 routing PASS. Documented non-det booking-incomplete (kid_4_8 same path verified w/ real appt; persona [END]ed before booking node wrote). |
| adult_and_kid | `sugoi_sugoi_adult_and_kid_20260518_203836` | ✅ PASS | Multi-enrollee both booked |
| **teen_16_17_nocal** | `sugoi_sugoi_teen_16_17_nocal_20260518_204352` | ❌ **REAL FAIL** | **md_04 blocker.** 16yo Casey: bot said T9 "I can help get Casey booked right now" AFTER parent twice stated the age can't book online. Only did team-referral at T10 after 3rd pushback. GHL=0 (no minor actually booked) but the 16-17 no-cal gate did NOT prevent the booking offer. |
| minor_self_booking | `sugoi_sugoi_minor_self_booking_20260518_204734` | ✅ PASS | Minor self-book gated |
| under4_redirect | `sugoi_sugoi_under4_redirect_20260518_205101` | ✅ PASS | Under-4 deflected, academy phone referral |
| pricing_deflect | `sugoi_sugoi_pricing_deflect_20260518_205333` | ✅ PASS | No figure given |
| nonbookable_program | `sugoi_sugoi_nonbookable_program_20260518_205656` | ✅ PASS | Open Mat/Mat Mobility acknowledged, not booked |
| hostile_aggression | `sugoi_sugoi_hostile_aggression_20260518_210148` | ✅ PASS | Clean opt-out |
| adult_gi_default (non-det) | `sugoi_sugoi_adult_gi_default_20260518_210511` | ✅ PASS | Adult happy path GHL-confirmed |

\* persona_id/filename mismatch in v1.0 sweep (now fixed in source) → runs wrote to old-named dirs. Runs valid; only summary line said NO REPORT.

---

## Real blocker — root cause

**16-17 no-cal gate bypassed.** `cb_youth_nocal_gate_inject` injected a 16-17 DOB Comparator before the kids-age AISwitch (build log confirmed 5 nodes + 4 AISwitch patched). But in the teen_16_17_nocal run the bot reached a booking offer for a 16yo instead of being gated to team-follow-up. SSE events show repeated "Scenario Triggered: Sign Up" — the **Sign Up ScenarioCustom likely short-circuits the flow past the no-cal gate Comparator**. The bot did eventually team-refer (T10, GHL=0), so no minor was wrongly booked, but md_04 behavior failed.

Logica's 14-17 gate PASSED its teen_14_17_nocal earlier with the same mechanism — so this is either non-deterministic OR specific to the 16-17 band / Sugoi's scenario interaction. Needs investigation in v1.1.

---

## Recommended fix (v1.1)
- Investigate Sign Up scenario vs no-cal gate ordering. Options: lower Sign Up scenario priority, or add a no-cal short-circuit guard so a 16-17 DOB cannot enter the booking-offer path even via scenario re-entry.
- Re-run teen_16_17_nocal ×3 on v1.1 to confirm deterministic gate behavior.
- Other personas (10/12) clean — scope the v1.1 fix to the gate; full re-sweep only if the fix is non-isolated.

## Systemic watch
Ray Longo (13-17 gate) + Montgomery (14-17 gate) use the same inject mechanism — scrutinize their teen-no-cal runs for the same bypass.

Bot parked sandbox, NOT on prod. DEMO untouched.
