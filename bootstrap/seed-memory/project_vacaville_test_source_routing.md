---
name: Vacaville Eval — Source-to-GHL Routing Map (verified 2026-04-29)
description: Which CloseBot mimicSourceId routes to which GHL location for the Vacaville test bench bot_J56AWZ5TYQI9HKJS — and which one is safe for evals
type: project
originSessionId: 8f14ee5c-f2f9-4f58-9a07-3e5135c7f39b
---
For the Vacaville test bench `bot_J56AWZ5TYQI9HKJS`, the `mimicSourceId` passed to `PUT /bot/{id}/testSession/{leadId}` deterministically controls which GHL location receives the booking.

| mimicSourceId | GHL location | Use |
|---|---|---|
| `src_4R4DUIQTMMX2NFPU` | GS Ads (`isGl70YkeLEAiVckMhgT`) | **Sandbox — default for all evals.** Bobby's GS Ads GHL has full PIT scopes (read + write + delete), so test bookings can be cleaned up via API. |
| `src_GDKORXSW4Q8RQUQ8` | Vacaville production (`JFnXPPTB9Rkgyi0KOUv8`) | Production. NEVER use as a mimic for routine testing. Bookings created here land on Coach Nick's real calendar. PIT is read-only — cleanup must be done via UI by Idriss. |

**Why:** Verified by controlled experiment 2026-04-29. Two back-to-back `cooperative_scheduler` runs on the same bot, only differing in mimicSourceId:
- `src_GDKORXSW4Q8RQUQ8` → Tester Marsh contact + 2 appointments in Vacaville GHL with addresses "310 East Monte Vista Avenue, Vacaville California"
- `src_4R4DUIQTMMX2NFPU` → Tester Webb contact + 2 appointments in GS Ads GHL on calendars `GWdabDvAgRFHZGsBN9Fq` + `KKR9rxFq16DS0fykxXMa`

**How to apply:**
- The orchestrator and sweep scripts now default to `src_4R4DUIQTMMX2NFPU` and have a hard guardrail that exits with code 2 if `MIMIC_SOURCE_ID=src_GDKORXSW4Q8RQUQ8` is set without `ALLOW_PROD_MIMIC=true`.
- Before any test run that bypasses the orchestrator (e.g. ad-hoc tester.js call), confirm the mimic source is the GS Ads one.
- The `tasks/todo.md` Key IDs section has the labeled-and-warned table.
- For production deploy validation specifically, set `ALLOW_PROD_MIMIC=true` and use a single deliberate run; clean up immediately via UI.

**Background context:** The CloseBot bot's "Sources" UI shows a label "GS Ads" on the connected source, but that label is misleading — the underlying GHL location binding is what controls routing. Detaching and re-attaching the source in the CloseBot UI does not change the binding (verified by Idriss 2026-04-29).
