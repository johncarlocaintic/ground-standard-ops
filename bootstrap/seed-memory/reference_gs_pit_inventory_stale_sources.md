---
name: reference-gs-pit-inventory-stale-sources
description: GS pit-inventory.md (2026-05-14) has wrong CloseBot source ids; always verify source by GHL-location-key before attaching
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4e20689a-9bf2-4f46-93fc-f2560faa0330
---

`clients/ground-standard/ghl/pit-inventory.md` (dated 2026-05-14) has **proven-wrong CloseBot source ids**. Never attach a bot to a prod source using the inventory's Source ID column without live verification.

Verification method (read-only, works with `CB_GS_API_KEY`): `GET /agency/source?page=1..3` returns `{results:[{sourceId,key,category,name}]}`. The source `key` == the gym's GHL location id. Match `key` against the authoritative GHL location id, not the inventory's source id. Script: `shared/scripts/closebot/gs_batch1_source_verify.js`.

Confirmed corrections (2026-05-19):
- **invertedgear:** inventory says `src_P6B5M60UZ6B3QDQR`. REAL source = **`src_O7P37VWAEHPFNCQ5`** "Inverted Gear Academy" (GHLS, key `ajf9RVwQJUGwU900yGEq`). Inventory is wrong.
- allinjujitsu `src_PQQCANSMZ8CS09UA`, bodegajj `src_GYUQQATOAUB6UFM3`: live-confirmed correct.
- gritjiujitsu `src_6MS3RHIRTR8OEKMO`, hamptonsjj `src_3HPZKL5NULBRLNLX` (South, NOT West `src_8RHY7XBXZ50T5CXD`): not in the capped CB list window, but **cross-verified 2026-05-19** via GHL PIT triangulation. Each gym's own PIT authenticates (200) against its claimed GHL location id (grit `JPFHqtf4KnkqVtiUU9Bk`, hamptons `7rOciO3DHa7ZfaXTZ0CC`) and is 403-denied against the other gym's location (PITs are strictly location-bound). Since CB source.key == GHL location id, and pit-inv + May 17 CB dump both map those source ids to those keys, the mapping holds. Final CB confirm folds into the attach read-back.

Cross-check technique (reusable): hit `GHL /calendars/?locationId={loc}` with the gym's own PIT. 200 = that location belongs to that gym; 403 against another gym's loc = PIT is location-bound (proves identity). This is how the OM/Paragon PIT mixup was caught and how grit/hamptons were confirmed.

- **10p-miami:** inventory says `src_3QTZZXSBO968SUQQ` "10th Planet Orlando" (WRONG, not Miami). REAL source = **`src_MXT2RCPXUZNTOP0S`** "10th Planet Miami" (GHLS), verified 2026-05-19 by PIT cross-check (PIT auths vs loc `98Z8PDW1sSiYSGSzyqGl`, 5 cals match QA). Use src_MXT2RCPXUZNTOP0S.

- **academyedenprairie:** inventory said NO source; live key-match proved it EXISTS = `src_OJO9E23V1JJSRJLN` "Academy Eden Prairie" (GHLS, key YzynD9APfmv7ed8RIk3K).
- **breathejiujitsu:** inventory said NO source; live key-match proved it EXISTS = `src_J4AHQWBOVA6ZXV0Y` "Breathe Jiu Jitsu" (GHLS, key USMxTUWMwAIetj1ka5u3).
- **academyjjscottsdale:** inventory said NO source; live key-match (aggressive accumulation) proved it EXISTS = `src_G95K8VC8HQTNWPGL` "Academy of Jiu-Jitsu Scottsdale" (GHLS, key 8XPm2yy1DqYc7fDpSj4O). My first "NOT FOUND across 52 sources" was the API rotation cap, not absence. **Lesson: never conclude "not in CB" from /agency/source unless you have hit it many rounds AND the user has UI-confirmed absence.**

Pattern confirmed repeatedly: the inventory's "In CB = no / Source = —" is NOT reliable. Always run the live key-match (gs_batch1_source_verify-style) before deciding a gym has no source.

- **ballantynemartialarts:** inventory `src_5E8F1KTYKN51FWK5` — **CORRECT** (verified 2026-05-20). Key-matched via `/agency/source?offset=0&limit=100` (key=`2y7XT17KEqjIpnTvPvJB`, 7 cals). NOTE: `page=N` param caps at 32 sources and never returns this gym; `offset+limit` reaches all 52.

- **championmartialarts:** inventory `src_C6IPQ7PFZB58DLIJ` = "Champion Chiropractic of Pasadena" (WRONG — a chiropractic business, not the gym). REAL = **`src_EJODL02HM128RGZH`** "Champion Martial Arts" (GHLS), PIT-verified 2026-05-20 (PIT 200 vs loc ffkMyOy6QOwqrvn4OvoK, 6 martial-arts cals). BOTH sources coexist in CB — never attach the chiropractic one.
- **centerlinejiujitsu:** inventory said NO source. REAL = **`src_QST1SHU18MPOOHEH`** "Centerline Jiu-Jitsu Chandler" (GHLS, key UWo67lKtFJYZCJ8LkD3O), verified 2026-05-20 (full 52-enum + PIT 200, 5 cals).
- **logica:** logica-bot-spec.json claims `sourceId: src_0HFNJJIYASHOG06Y` — **PHANTOM**. No Logica source exists in CB at all (verified across all 52 sources by key `sKr1YeqWZyYKNQL6yqLf` AND by name). Bot spec source IDs are NOT trustworthy either. Logica is BLOCKED — needs Bobby to connect a real CB source before it can launch. Do not fabricate one.

**CRITICAL: `/agency/source?page=N` is unreliable for accounts with >32 sources.** Use `/agency/source?offset=0&limit=20` paginated (offset 0,20,40...) PLUS `page=N` rotation, accumulated together, to reach all 52. A single method misses gyms. `GET /source/{id}` direct lookup 404s even for real sources; always enumerate via list. Confirmed 2026-05-20 on Bobby's account (52 total sources). **Bot-spec source IDs are as unreliable as the pit-inventory ones — Logica's spec source was a phantom. Always live-key-verify before attach, for every gym, every time.**

Other already-known inventory errors: championmartialarts points at "Champion Chiropractic" (wrong). See [[project-gs-only-vacaville-on-prod]], [[project-vacaville-prod-filter-spec]], [[feedback-verify-before-diagnosing]].
