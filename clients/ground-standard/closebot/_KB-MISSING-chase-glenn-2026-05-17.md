# GS CloseBot — KB-Missing Gyms (chase Glenn) — 2026-05-17

These 4 gyms in the "next batch" CANNOT be built until a verified KB draft
exists. Per the no-fabrication rule, KBs are NOT authored from the website
alone — Glenn's draft (or equivalent source material) is required, then
website + GHL-calendar verified.

## Blocked gyms

| Gym | Source ID | GHL loc | KB status |
|---|---|---|---|
| All In Jiu-Jitsu | `src_PQQCANSMZ8CS09UA` | `7jz3trWsyu4R0zBlnCRI` | glenn_kb_doc.txt has ONLY an `all_in_jiu_jitsu_mismatch_report` — no actual KB draft body. Was wrongly listed KB-ready. |
| Gracie Farmington Valley | (verify) | `5yxX1tJAbq5vttIUwGzJ` | No draft received. todo listed "pending verification". |
| Hammer Sports & Performance | `src_OKNBAOGCND99B5EM` | `IB5NHYNn4F4ANpNt5NvX` | No draft received. "pending verification". |
| Inverted Gear Academy | `src_O7P37VWAEHPFNCQ5` | `ajf9RVwQJUGwU900yGEq` | No draft received. "pending verification". |

Note: Gracie Farmington Valley source ID disagrees between todo.md
(`src_LGA6WCCJSAEE8X6R`) and pit-inventory.md (`src_8PI9YQ90JJ9TLVTN`) —
reconcile against the live agency API before its build.

## What we already have for All In (from the mismatch report)

For when All In's KB is built — confirmed facts to fold in:
- Working website: **allinjiujitsu.com** (dead `bteamnj.com` in old ClickUp/KB)
- Phone: **732-903-2999**
- Email: **info@allinjiujitsu.com**
- $35 mat fee exists (EXCLUDE per GS no-pricing rule)
- Live GHL calendars: Kids 5-12 BJJ, Adult All Levels BJJ, Adult Fundamentals BJJ
- Open questions for Glenn/Bobby: Wed Ladies No-Gi time (6:00 vs 6:30 PM),
  Tue evening block times, trial-class days ("M,W,F,T or Sat" — is T Tue or Thu)

## Ask for Glenn

1. Provide the actual KB draft body for All In Jiu-Jitsu (the doc only has its
   mismatch report).
2. Provide KB drafts for Gracie Farmington Valley, Hammer Sports & Performance,
   Inverted Gear Academy.
3. Answer the All In open schedule questions above.

Once a draft lands: standard pipeline (KB-verify vs website + live GHL
calendars → /closebot-plan → build → test → park on sandbox, no prod attach
without Bobby's go).
