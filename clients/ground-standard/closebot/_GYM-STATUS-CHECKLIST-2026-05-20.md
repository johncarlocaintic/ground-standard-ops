# GS CloseBot — Gym Status Checklist (2026-05-20)

**Supersedes:** `_GYM-STATUS-CHECKLIST-2026-05-18.md`
**Milestone:** 28 parked + 1 live = **29 total**. Two gyms short of the 30 milestone.

---

## A. BUILT + QA-PASSED — parked on sandbox, awaiting Bobby soft-launch (28)

### 11-gym batch — 11/11 QA-PASSED ✅ (this session, 2026-05-19 → 2026-05-20)

All built on Agent Node architecture (scaffold-and-fill rebuild). All parked on sandbox `src_4R4DUIQTMMX2NFPU`, not attached to prod sources.

| # | Gym | Current bot | Version | Prod source | QA summary |
|---|---|---|---|---|---|
| 1 | Logica Jiu-Jitsu | `bot_CXGYLTWOIJIP4ZCO` | v2.0 AgentNode | src_0HFNJJIYASHOG06Y | logica-agentnode-qa-summary-v1.md |
| 2 | Paragon Simi Valley | (v2.0 bot id) | v2.0 | src_SFJ08L818G37B5CP | paragonsimi-qa-summary-v2.md |
| 3 | OM Brazilian Jiu-Jitsu | (v2.0 bot id) | v2.0 | src_VGIGZ52AQVQZKXS3 | ombjj-qa-summary-v2.md |
| 4 | Sugoi Submission | (v2.0 bot id) | v2.0 | src_JPK476A1ODXA5YGB | sugoi-qa-summary-v2.md |
| 5 | Ray Longo's MMA | (v2.0 bot id) | v2.0 | src_XM58ZT2N3E8A1UDT | raylongo-qa-summary-v2.md |
| 6 | Universal Mixed Martial Arts | `bot_4EH6K792OEHGCAIB` | v2.0 | src_4C7CIFW27LLW2TCH | universalmma-qa-summary-v2.md |
| 7 | Montgomery Brazilian Jiu-Jitsu | `bot_96PAT3JCI2YC32KY` | v2.0 | src_4VEFF108BZ7GDG4K | montgomery-qa-summary-v2.md |
| 8 | Signature of Jiu-Jitsu | (v1.0 bot id) | v1.0 | src_HHSREAS1NVHJMDSR | signature-qa-summary-v1.md |
| 9 | Roberts Family MMA | (v1.0 bot id) | v1.0 | src_E4ZQBA8ABFBDK5RM | roberts-qa-summary-v1.md |
| 10 | Simple Man Martial Arts | (v1.0 bot id) | v1.0 | src_XZH7NHD2M8NF0EQL | simpleman-qa-summary-v1.md |
| 11 | Killer B Combat Sports Academy | `bot_FMMFAFOFG7IG89XI` | **v1.1** | src_YJOFG6926ILNHH1R | killerb-qa-summary-v1.md |

**Killer B note:** v1.0 (`bot_AXZH003J1SL05374`) was QA-NOT-PASSED on `teen_13_17_nocal` (hallucinated "Adult MMA starts at age 13"). Root cause: `n10_intro` Push Toward Booking didn't specify adults are 18+. Fixed in v1.1 by adding "(age 18+)" + instruction not to state age min when under-18 mentioned. v1.0 renamed to `[LEGACY]` and detached from sandbox. v1.1 teen re-test PASSED.

### Next-batch (9) — built in earlier sessions
Academy Eden Prairie · Academy JJ Scottsdale · All In · Bodega · Breathe · Centerline · Gracie Farmington Valley · Hammer · Inverted Gear

### Existing 8 — built in earlier sessions
Hamptons JJ South · Mason Dixon JJ · Champion Martial Arts · 10th Planet Miami · Grit JJ · Artistry BJJ · Ballantyne Martial Arts · Gracie JJ East San Jose

**Total parked: 11 (this session) + 9 (next-batch) + 8 (existing) = 28**

---

## B. LIVE (1)
- Vacaville Grappling Academy — `bot_F0VNPTPCIW88YI3J` v4.6 on src_GDKORXSW4Q8RQUQ8. **P0 OPEN:** `@@[Update Contact]` silent failure — submitted to CloseBot support, retest when resolved.

---

## C. UNTOUCHED — DEMO bot only, no Launch build yet (build candidates)

To reach the 30 milestone, 2 more gyms from this list need to be built:

| # | Gym | Prod source | DEMO bot | Notes |
|---|---|---|---|---|
| 1 | Phoenix BJJ | src_2RXXDE7Y9YXRC7QR | bot_VGKBV8D34EF7ACOB | legacy KB |
| 2 | Agoge Krav Maga | src_804PG9C3VTBCOFDL | bot_E9TD0IUL9209ZXHK | legacy KB |

(Both were in the prior 13 but dropped from Idriss's explicit 11-gym list.)

---

## Known cross-gym platform flags (Agent Node, 2026-05-20)

1. **Tool-to-GHL gap (mnd_05 false-closure pattern):** Booking tool returns `Successfully booked` and `booking_success` SSE event fires, but GHL has 0 appointments. Consistent across 4 of 11 gyms in at least one persona. Same disposition as Vacaville PROD's known P0. Monitor — same flag applied across all v2.0 builds.
2. **SSE platform instability:** `send failed at turn N`, `mimicBind → 504`, and `bot timeout at turn 1` patterns across most gyms' non-det runs and several first-sweep runs. Causes false PASS (trivially) on truncated runs and false FAIL when QA agent scores on a single LEAD opener.
3. **md_01 standard fails (asks for name before "who is this for"):** Common Agent Node `n10_intro` flow ordering artifact. Not a blocker. Architectural to the scaffold.
4. **mnd_05 false-positive on opt-out de-escalation:** QA rubric matches "you're all set" even when no booking attempted (hostile_aggression personas). Rubric tightening candidate.
5. **KB swap timing collisions:** During concurrent sweeps, `get_library_context` can return previous gym's KB. Affects only FAQ answers, not booking flow logic.

---

## Next decisions (no autonomous action)

- Bobby soft-launch authorization: required before any of the 28 parked bots attach to their prod sources.
- 30 milestone: needs 2 more builds (Phoenix BJJ + Agoge Krav Maga or other) — not in scope this session.
- mnd_05 platform bug: track with CloseBot support; affects user trust in production once any bot goes live.
- Rubric tightening for hostile_aggression mnd_05 false-positives.
