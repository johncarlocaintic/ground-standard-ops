# GS 16-Gym PIT Inventory

Last updated: 2026-05-11
Discovery script: `shared/scripts/closebot/gs_discover_16_gyms.js`

**Notes:**
- `In CB` = CloseBot source already exists (GHL connected). Location ID extracted from CB OAuth JWT.
- `In CB?` = script matched but name needs human verification (see flags below).
- `no` = not found in first 20 CB sources. CB pagination is broken — offset param has no effect, always returns same first page. Gyms marked "no" may actually be in CB but unreachable programmatically.
- GHL PITs return 403 on all probe endpoints (contacts, calendars, custom-fields) — scoped to SMS/conversations only. Location IDs for "no" gyms need to come from GHL UI directly.

**Flags needing verification:**
- `championmartialarts` → CB matched "Champion Chiropractic of Pasadena" — likely WRONG. "champion" keyword hit the chiro clinic. Correct source TBD.
- `10p-miami` → CB matched "10th Planet Orlando Jiu Jitsu" — slug says Miami, name says Orlando. Confirm if same school.
- `hamptonsjj` → matched "Hamptons Jiu-Jitsu South". There is also "Hamptons Jiu-Jitsu West" (src_8RHY7XBXZ50T5CXD). Confirm which is the right one.

---

| Slug | PIT | Location ID | Source ID | CB Source Name | In CB | KB Status | Bot Status |
|------|-----|-------------|-----------|----------------|-------|-----------|------------|
| 10p-miami | pit-c6effbe1-d616-494c-8285-5b10dc24fbeb | eG7RPB7bx4Z0FvH6V05M | src_3QTZZXSBO968SUQQ | 10th Planet Orlando Jiu Jitsu | yes — VERIFY NAME | pending | pending |
| academyedenprairie | pit-2785933c-30b5-4de5-a7b2-cc94e9086681 | — | — | — | no | pending | pending |
| academyjjscottsdale | pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46 | — | — | — | no | pending | pending |
| allinjujitsu | pit-51eb18df-f25f-49fa-a6c8-265246187c43 | — | — | — | no | pending | pending |
| artistrybjj | pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad | 3SIWDTRfqtCBE9gSr1bY | src_D87BKGBV6H9K4WRS | Artistry BJJ | yes | pending | pending |
| ballantynemartialarts | pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff | 2y7XT17KEqjIpnTvPvJB | src_5E8F1KTYKN51FWK5 | Ballantyne Martial Arts | yes | pending | pending |
| bodegajj | pit-3ec407a4-50c0-4bca-ac31-68044abaee6c | — | — | — | no | pending | pending |
| breathejiujitsu | pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e | — | — | — | no | pending | pending |
| centerlinejiujitsu | pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7 | — | — | — | no | pending | pending |
| championmartialarts | pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185 | xOfGMRrO6MukHe8uQsxh | src_C6IPQ7PFZB58DLIJ | Champion Chiropractic of Pasadena | yes — VERIFY MATCH | pending | pending |
| graciefarmingtonvalley | pit-3807906c-e578-4a83-bd57-ac93ab568a55 | — | — | — | no | pending | pending |
| graciejj-sanjose | pit-de84de4b-9136-45b3-9a3a-1ad43706968f | wy55JSUKKC3h6TPHfHOo | src_257VE0Q8RX3IEDVD | Gracie Jiu Jitsu East San Jose | yes | pending | pending |
| gritjiujitsu | pit-39c05237-596c-43eb-84de-26a521df6e58 | JPFHqtf4KnkqVtiUU9Bk | src_6MS3RHIRTR8OEKMO | Grit Jiu-Jitsu | yes | pending | pending |
| hammersp | pit-a4ad12df-519f-4b6b-a340-98d62e29e5c1 | — | — | — | no | pending | pending |
| hamptonsjj | pit-9160ad3d-2b0f-4d5b-8e15-0c26fc872223 | 7rOciO3DHa7ZfaXTZ0CC | src_3HPZKL5NULBRLNLX | Hamptons Jiu-Jitsu South | yes — VERIFY (also West exists) | pending | pending |
| invertedgear | pit-5baba980-c1b1-4707-b433-a6b5bfd26164 | — | — | — | no | pending | pending |
