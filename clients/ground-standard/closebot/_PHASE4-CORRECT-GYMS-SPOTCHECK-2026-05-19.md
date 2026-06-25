# Phase 4 — Spot-check of the 10 correct Agent Node gyms (2026-05-19)

Method: architecture confirmed via `shared/logs/_gs_arch_audit.tsv` (all AGENT)
+ clean QA on record (sweep summary or QA-summary doc, PASS). Read-only; no
rebuilds, no API writes. Full re-test only if arch≠AGENT or no clean QA.

| Gym | Bot | Arch | QA on record | Action |
|---|---|---|---|---|
| 10th Planet Miami | bot_ZC2MREMJ87S77LH1 | AGENT | 10p-miami-qa-summary-v1.md + 12 eval dirs | none |
| Academy Scottsdale | bot_01MYV7I9IWMHYPCF | AGENT | _academyjjscottsdale_sweep_summary.txt (14 PASS) | none |
| Artistry BJJ | bot_WPGXC5YR7VT13RVY | AGENT | 19 eval run dirs all PASS-verified (no consolidated summary doc) | none (minor: write a summary doc when convenient) |
| Ballantyne Martial Arts | bot_SYX87T5XAAKPCUDE | AGENT | ballantynemartialarts-qa-summary-v2.md (+audit-v1) | none |
| Breathe Jiu-Jitsu | bot_3TG2JEKB8YHKZ711 | AGENT | _breathejiujitsu_sweep_summary.txt (15 PASS) | none |
| Centerline Jiu-Jitsu | bot_F2IMVLSJ61TQ4R8X | AGENT | _centerlinejiujitsu_sweep_summary.txt (15 PASS) | none |
| Champion Martial Arts | bot_GEGYNE5WQNOYH7UB | AGENT | championmartialarts-qa-summary-v1.md | none |
| Grit Jiu-Jitsu | bot_7H147LLL7WMR506K | AGENT | gritjiujitsu-qa-summary-v1.md | none |
| Academy Eden Prairie | bot_20P7NZ6ZMRY37GC4 | AGENT | _academyedenprairie_sweep_summary.txt (14 PASS) | none |
| Vacaville PROD (LIVE) | bot_F0VNPTPCIW88YI3J | AGENT | live, export-verified Agent Node this session | none — never touch |

**Verdict: all 10 correct gyms confirmed AGENT + clean QA on record. No
re-test required.** Only doc gap: Artistry BJJ has no consolidated QA-summary
markdown (its 19 eval runs are uniformly PASS-verified) — cosmetic, optional
follow-up. These 10 are the keep-set; they are excluded from all rename/rebuild
work.
