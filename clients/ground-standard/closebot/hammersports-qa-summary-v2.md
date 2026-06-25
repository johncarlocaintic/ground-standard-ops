# QA Summary — Hammer Sports & Performance
Bot: Hammer Sports - Launch v2.0 [Agent Node rebuild] (2026-05-19)
Bot ID: bot_AFKR1QYFJ3VKYF3W
Bot version at QA: v0.0.3 (post JJ cap + handoff fix to n10_intro)
Prod source: src_OKNBAOGCND99B5EM
Run date: 2026-05-21
Architecture: Agent Node ✓

---

## PERSONA RESULTS — full 13-persona sweep

| # | Persona | Verdict | Notes |
|---|---|---|---|
| 1 | adult_bjj_default | ✅ PASS (verified) | Adult BJJ booking confirmed |
| 2 | adult_nogi | ✅ PASS (verified) | discipline switch routed correctly to NoGi |
| 3 | adult_muay_thai | ✅ PASS (verified) | discipline switch routed correctly to Muay Thai |
| 4 | adult_wrestling | ✅ PASS (verified) | discipline switch routed correctly to Wrestling |
| 5 | adult_kettlebell | ✅ PASS (verified) | discipline switch routed correctly to Kettle Bell |
| 6 | kid_youth | ✅ PASS (verified) | Youth Martial Arts booking |
| 7 | teen | ✅ PASS (verified) | Teen Martial Arts booking |
| 8 | adult_and_kid | ✅ PASS (verified) | Multi-enrollee booking |
| 9 | minor_self_booking | ✅ PASS (verified) | Minor gate — no booking, guardian capture |
| 10 | under5_redirect | ✅ PASS (verified) | Under-5 phone redirect |
| 11 | pricing_deflect | ✅ PASS (verified) | Pricing redirected without figure |
| 12 | nonbookable_mma | ✅ PASS (verified) | MMA-only acknowledged, not booked |
| 13 | hostile_aggression | ✅ PASS (verified) | Opt-out handled gracefully |

**13/13 personas PASS.** Hammer is the most complex bot (5 adult disciplines + 2 kids bands + multi-enrollee + minor gate) and passed cleanly.

---

## NON-DETERMINISM CHECK (adult_bjj_default ×3)

> Original chain non-det skipped due to bash syntax error from mid-execution edit. Reruns performed via `rerun_chain_resume.sh`.

| Run | Verdict |
|---|---|
| 1 | ✅ PASS (verified) |
| 2 | ✅ PASS (verified) |
| 3 | ✅ PASS (verified) |

Non-det: **3/3 PASS** ✓

---

## TRANSCRIPT LINKS

- [adult_bjj_default](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260521_175632/report.md)
- [adult_nogi](shared/logs/eval/hammersports_hammersports_adult_nogi_20260521_180035/report.md)
- [adult_muay_thai](shared/logs/eval/hammersports_hammersports_adult_muay_thai_20260521_180326/report.md)
- [adult_wrestling](shared/logs/eval/hammersports_hammersports_adult_wrestling_20260521_180632/report.md)
- [adult_kettlebell](shared/logs/eval/hammersports_hammersports_adult_kettlebell_20260521_181027/report.md)
- [kid_youth](shared/logs/eval/hammersports_hammersports_kid_youth_20260521_181409/report.md)
- [teen](shared/logs/eval/hammersports_hammersports_teen_20260521_181734/report.md)
- [adult_and_kid](shared/logs/eval/hammersports_hammersports_adult_and_kid_20260521_182148/report.md)
- [minor_self_booking](shared/logs/eval/hammersports_hammersports_minor_self_booking_20260521_182628/report.md)
- [under5_redirect](shared/logs/eval/hammersports_hammersports_under5_redirect_20260521_183231/report.md)
- [pricing_deflect](shared/logs/eval/hammersports_hammersports_pricing_deflect_20260521_183605/report.md)
- [nonbookable_mma](shared/logs/eval/hammersports_hammersports_nonbookable_mma_20260521_183957/report.md)
- [hostile_aggression](shared/logs/eval/hammersports_hammersports_hostile_aggression_20260521_184218/report.md)

---

## NON-DET TRANSCRIPT LINKS (rerun chain)

- [adult_bjj_default run 1](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260521_221724/report.md)
- [adult_bjj_default run 2](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260521_222434/report.md)
- [adult_bjj_default run 3](shared/logs/eval/hammersports_hammersports_adult_bjj_default_20260521_222832/report.md)

---

## VERDICT: ✅ QA-PASSED

**13/13 personas PASS. Non-det 3/3 PASS.** Production safe.

Parked on sandbox. NOT on prod source `src_OKNBAOGCND99B5EM`.

Post-chain updates applied:
- JJ capitalization fix (KB: 1 variant fixed)
- Handoff instruction
- Discipline switch: 5-way (BJJ default + NoGi + Muay Thai + Wrestling + Kettle Bell) all proven routing correctly
