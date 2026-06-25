# GS CloseBot Session Summary — 2026-05-21 → 2026-05-22

## Scope: 8 Agent Node session-rebuilt bots — all QA-PASSED, parked on sandbox

| # | Gym | Bot ID | Version | QA verdict | QA summary |
|---|---|---|---|---|---|
| 1 | Royal Jiu-Jitsu Academy Queens | bot_4N8WBIF210AU944O | v0.0.2 | ✅ QA-PASSED | royaljj-qa-summary-v1.md |
| 2 | All In Jiu-Jitsu | bot_15WPBGYMS6HLGC5E | v0.0.2 | ✅ QA-PASSED | allinjujitsu-qa-summary-v1.md |
| 3 | Gracie Farmington Valley | bot_J7WW9BOARJK0NI9F | v0.0.3 (post bug-fix) | ✅ QA-PASSED + bug fixed | graciefarmingtonvalley-qa-summary-v2.md |
| 4 | Hammer Sports & Performance | bot_AFKR1QYFJ3VKYF3W | v0.0.2 | ✅ QA-PASSED (13/13) | hammersports-qa-summary-v2.md |
| 5 | Inverted Gear Academy | bot_FIWVSZBWNX546KKA | v0.0.2 | ✅ QA-PASSED | invertedgear-qa-summary-v2.md |
| 6 | Hamptons Jiu-Jitsu South | bot_WWB97FEM611TC5SY | v0.0.2 | ✅ QA-PASSED (4 NO_REPORTs reran via chain) | hamptonsjj-qa-summary-v2.md |
| 7 | Mason Dixon Jiu-Jitsu | bot_0HQBLZA2NO9T1ZFM | v0.0.3 (post bug-fix) | ✅ QA-PASSED + bug fixed | masondixon-qa-summary-v3.md |
| 8 | Gracie Jiu-Jitsu East San Jose | bot_UMEBUHOW9YQOLIHU | v0.0.2 | ✅ QA-PASSED (with minor kid_only UX nit) | graciejj-sanjose-qa-summary-v2.md |

**All 8 parked on sandbox `src_4R4DUIQTMMX2NFPU`. NOT on prod. Awaiting Bobby's soft-launch go.**

---

## Two real bot bugs found via chain cross-exam — both fixed + verified

### 1. Gracie FV — youth no-cal gate broken (14-17)
- **Symptom (v0.0.1):** 15yo Jayden Garza booked into "Kids 8-13 BJJ" calendar. Bot explicitly said "Jayden is 15, so he'll be in our Kids 8-13" before booking.
- **Fix (v0.0.3):** Appended age-cap rule to `variables.business.whyText`:
  > "CRITICAL AGE-CAP RULE: The Kids 8-13 Brazilian Jiu-Jitsu program caps at age 13. If a child is 14 or older, do NOT book them into Kids 8-13 or any other calendar — Gracie Farmington Valley has no online calendar for ages 14-17."
- **Verified (v0.0.3):** Bot now says "Since Jayden is 15, we don't have online booking for his age group" + team referral.

### 2. Mason Dixon — discipline switch absent
- **Symptom (v0.0.1):** Bot defaulted to Adult Fundamentals BJJ without asking BJJ vs Striking. Failed ~67% of adult inquiries (md_02 blocker).
- **Fix (v0.0.3):** Appended discipline-question rule to `whyText`:
  > "CRITICAL DISCIPLINE RULE: Mason Dixon offers TWO adult disciplines — Adult Fundamentals BJJ AND Adult Striking. BEFORE offering any adult booking times, you MUST ask: 'Are you interested in Adult Fundamentals BJJ or Adult Striking?'"
- **Verified (v0.0.3):** Bot now asks the discipline question at T1.

---

## Major lesson — PUT /bot/{id} { importKdl } silently drops

**Commit `07c05c3` (earlier the same day) used `PUT /bot/{id} { importKdl }` to update 19 launched bots. PUT returned 200 OK for all 19, but the API silently dropped `importKdl` because it's not in the `UpdateBotInput` swagger schema. None of the 19 launched bots actually received the JJ cap + handoff update.**

**Working pattern (verified on Royal JJ + all 8 session bots):**
```
1. GET /bot/{id}                              → find latest published version
2. GET /bot/{id}/steps?botVersion=X.X.X       → fetch botSteps JSON
3. Mutate JSON in memory (variables.business.whyText)
4. POST /bot/{id}/save { botSteps, layoutOnly: false }   → auto-bumps version
5. POST /bot/{id}/publish                     → makes it live
```

Logged in `tasks/lessons.md` 2026-05-22 + commit `b790446`.

**Implication for the broken 19 launched bots:** they need to be re-updated via the POST /save path. Separate work, separate session.

---

## All post-chain updates applied to the 8 session bots

| Update | Endpoint | Verification |
|---|---|---|
| JJ canonical capitalization (KDL) | POST /bot/{id}/save with regex-replaced botSteps | 7/8 PASS; Royal JJ NOOP (already clean from discovery test) |
| Handoff instruction (alert tag on out-of-scope) | POST /bot/{id}/save (same call as JJ cap) | All 8 verified via export round-trip |
| Gracie FV age-cap addendum | POST /bot/{id}/save (whyText append) | Marker confirmed in v0.0.3 |
| Mason Dixon discipline-question addendum | POST /bot/{id}/save (whyText append) | Marker + bot behavior confirmed in v0.0.3 |
| KB JJ canonical capitalization | PUT /library/files/{id} (FormData newFile) | 6 PASS + 1 CLEAN + Royal JJ retry (correct file_YO9KUJ56ZA1ACFYL) |

---

## Known platform issues (carry-over, not session-introduced)

- **Booking-tool-flake / mnd_05 false-closure pattern** (~1/3 non-det risk on adult happy path): bot announces booking but no GHL appointment lands. Same disposition as the parked 17 from prior sessions.
- **CloseBot API transient 504s + libuv async assertion crash on Windows** during peak load: source of some NO_REPORT clusters (Hamptons 4-persona cluster at 19:38-19:43Z). Not a bot defect.
- **Judge `production_safety_unknown` on opt-out / nonbookable runs**: when no GHL contact is created (expected behavior), judge can't verify. Cross-exam confirms these are false-positives.

---

## Session artifacts

- New scripts: `gs_jj_handoff_update_session_rebuilds.mjs`, `gs_kb_jj_update_session_rebuilds.mjs`, `gs_session_bot_bugfixes.mjs`, `sandbox_attach_gym.mjs`, `eval/rerun_chain.sh`, plus 6 sandbox_transition_*.mjs (clean-slate variants)
- All 6 chain QA summaries committed (Gracie FV through Gracie East SJ)
- All In QA summary already committed earlier
- Royal JJ QA summary from earlier — unchanged
- Critical lesson `2026-05-22 — PUT silent-fail` committed at `b790446`

---

## Next session todo (if Bobby green-lights soft-launch)

1. Per-gym: detach from sandbox + attach to prod source with testing-tag filter (per `closebot-build` Phase 10 soft-launch SOP)
2. Apply 2-3 real contacts each, watch live for 24h, then switch trigger filter to real campaign tag
3. Reapply commit `07c05c3` fixes to the 19 broken launched bots via the working POST /save path (separate work item)
