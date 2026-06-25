# GS 17-Gym PIT Inventory

Last updated: 2026-05-14

**Notes:**
- Location IDs provided by Bobby 2026-05-13
- View Calendars scope granted on custom integration 2026-05-13
- championmartialarts: previous location ID was wrong (Champion Chiropractic of Pasadena) — corrected to Bobby's confirmed ID
- masondixon: PIT provided. Location ID + CB source confirmed live 2026-05-20 (was stale in this inventory).

| Slug | PIT | Location ID | Source ID | CB Source Name | In CB | KB Status | Bot Status |
|------|-----|-------------|-----------|----------------|-------|-----------|------------|
| masondixon | pit-ffa8f591-b1ab-45c7-ac47-574c14b67fd7 | UC4YCK5VFS9k9JX74NeV | src_WEF7GLL3UCZIR97M | Mason Dixon Jiu-Jitsu | yes | v1.1.1 in CB (file_K8E6900W9STUOHBZ) | pending — needs Agent Node rebuild (v1.0/1.1 [LEGACY], v1.2 [WRONG-ARCH DELETE]) |

> CORRECTION 2026-05-20: inventory said location ID pending + no source. BOTH live-verified: source `src_WEF7GLL3UCZIR97M` "Mason Dixon Jiu-Jitsu" (GHLS, key-match), PIT 200 vs loc UC4YCK5VFS9k9JX74NeV with 4 cals (Kids 4-7 MA, Kids 8-13 MA, Adult Striking, Adult Fundamentals BJJ). All 3 existing bots are classic + detached. Ready for Agent Node rebuild whenever.
| 10p-miami | pit-c6effbe1-d616-494c-8285-5b10dc24fbeb | 98Z8PDW1sSiYSGSzyqGl | src_MXT2RCPXUZNTOP0S | 10th Planet Miami | yes | pending | **LIVE 2026-05-20** (bot_ZC2MREMJ87S77LH1, concierge filter, 5 cals) |

> CORRECTION 2026-05-19: 10p-miami Source ID was `src_3QTZZXSBO968SUQQ` "10th Planet Orlando" (WRONG, different gym). Real source verified live by GHL-PIT cross-check (PIT auths vs loc 98Z8PDW1sSiYSGSzyqGl, 5 calendars match QA) = `src_MXT2RCPXUZNTOP0S` "10th Planet Miami" (GHLS). Row above updated.
| academyedenprairie | pit-2785933c-30b5-4de5-a7b2-cc94e9086681 | YzynD9APfmv7ed8RIk3K | src_OJO9E23V1JJSRJLN | Academy Eden Prairie | yes | pending | **LIVE 2026-05-20** (bot_20P7NZ6ZMRY37GC4, concierge filter, 4 cals) |

> CORRECTION 2026-05-19: inventory said NO source; live key-match proved source EXISTS = src_OJO9E23V1JJSRJLN "Academy Eden Prairie" (GHLS, key YzynD9APfmv7ed8RIk3K).
| academyjjscottsdale | pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46 | 8XPm2yy1DqYc7fDpSj4O | src_G95K8VC8HQTNWPGL | Academy of Jiu-Jitsu Scottsdale | yes | pending | **LIVE 2026-05-20** (bot_01MYV7I9IWMHYPCF, concierge filter, 3 cals) |

> CORRECTION 2026-05-19: inventory said NO source; aggressive /agency/source accumulation surfaced it = src_G95K8VC8HQTNWPGL "Academy of Jiu-Jitsu Scottsdale" (GHLS, key 8XPm2yy1DqYc7fDpSj4O). The earlier "NOT FOUND across 52 sources" note was the API window cap rotation, not absence.
| allinjujitsu | pit-51eb18df-f25f-49fa-a6c8-265246187c43 | 7jz3trWsyu4R0zBlnCRI | src_PQQCANSMZ8CS09UA | All in Jiu-Jitsu | yes | pending | pending |
| artistrybjj | pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad | 3SIWDTRfqtCBE9gSr1bY | src_D87BKGBV6H9K4WRS | Artistry BJJ | yes | KB attached | **LIVE 2026-05-20** (bot_WPGXC5YR7VT13RVY, concierge filter, 3 cals) |
| ballantynemartialarts | pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff | 2y7XT17KEqjIpnTvPvJB | src_5E8F1KTYKN51FWK5 | Ballantyne Martial Arts | yes | v5 in CB (indexed, attached) | **LIVE 2026-05-20** (bot_SYX87T5XAAKPCUDE, concierge filter, 7 cals; v4 KB detached) |

> VERIFIED 2026-05-20: src_5E8F1KTYKN51FWK5 key-matched via /agency/source?offset=0&limit=100 (key==2y7XT17KEqjIpnTvPvJB confirmed). Inventory source ID is CORRECT. Note: page=N param caps at 32 sources and misses this gym; must use offset+limit for full enumeration.
| bodegajj | pit-3ec407a4-50c0-4bca-ac31-68044abaee6c | 0svdYcor6p7eXPqx7hVA | src_GYUQQATOAUB6UFM3 | Bodega Jiu-Jitsu | yes | pending | pending |
| breathejiujitsu | pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e | USMxTUWMwAIetj1ka5u3 | src_J4AHQWBOVA6ZXV0Y | Breathe Jiu Jitsu | yes | pending | **LIVE 2026-05-20** (bot_3TG2JEKB8YHKZ711, concierge filter, 4 cals) |

> CORRECTION 2026-05-19: inventory said NO source; live key-match proved source EXISTS = src_J4AHQWBOVA6ZXV0Y "Breathe Jiu Jitsu" (GHLS, key USMxTUWMwAIetj1ka5u3).
| centerlinejiujitsu | pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7 | UWo67lKtFJYZCJ8LkD3O | src_QST1SHU18MPOOHEH | Centerline Jiu-Jitsu Chandler | yes | KB attached | **LIVE 2026-05-20** (bot_F2IMVLSJ61TQ4R8X, concierge filter, 5 cals) |

> CORRECTION 2026-05-20: inventory said NO source; full 52-source enumeration + PIT cross-check (200, 5 cals) proved source EXISTS = src_QST1SHU18MPOOHEH "Centerline Jiu-Jitsu Chandler" (GHLS, key UWo67lKtFJYZCJ8LkD3O).
| championmartialarts | pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185 | ffkMyOy6QOwqrvn4OvoK | src_EJODL02HM128RGZH | Champion Martial Arts | yes | KB attached | **LIVE 2026-05-20** (bot_GEGYNE5WQNOYH7UB, concierge filter, 6 cals) |

> CORRECTION 2026-05-20: inventory Source ID was src_C6IPQ7PFZB58DLIJ "Champion Chiropractic of Pasadena" (WRONG, different business — chiropractic, not the gym). Real source PIT-verified (PIT 200 vs loc ffkMyOy6QOwqrvn4OvoK, 6 martial-arts cals; CB source key-match) = src_EJODL02HM128RGZH "Champion Martial Arts" (GHLS). Both "Champion Chiropractic of Pasadena" AND "Champion Martial Arts" exist as separate CB sources — never use the chiropractic one.
| graciefarmingtonvalley | pit-3807906c-e578-4a83-bd57-ac93ab568a55 | 5yxX1tJAbq5vttIUwGzJ | src_8PI9YQ90JJ9TLVTN | Gracie Farmington Valley | yes | pending | pending |
| graciejj-sanjose | pit-de84de4b-9136-45b3-9a3a-1ad43706968f | wy55JSUKKC3h6TPHfHOo | src_257VE0Q8RX3IEDVD | Gracie Jiu Jitsu East San Jose | yes | pending | pending |
| gritjiujitsu | pit-39c05237-596c-43eb-84de-26a521df6e58 | JPFHqtf4KnkqVtiUU9Bk | src_6MS3RHIRTR8OEKMO | Grit Jiu-Jitsu | yes | KB attached | **LIVE 2026-05-20** (bot_7H147LLL7WMR506K, concierge filter, 4 cals) |
| hammersp | pit-a4ad12df-519f-4b6b-a340-98d62e29e5c1 | IB5NHYNn4F4ANpNt5NvX | src_V3KWGHDTV32QMNKP | Hammer Sports & Performance | yes | pending | pending |
| hamptonsjj | pit-9160ad3d-2b0f-4d5b-8e15-0c26fc872223 | 7rOciO3DHa7ZfaXTZ0CC | src_3HPZKL5NULBRLNLX | Hamptons Jiu-Jitsu South | yes | pending | pending |
| invertedgear | pit-5baba980-c1b1-4707-b433-a6b5bfd26164 | ajf9RVwQJUGwU900yGEq | src_O7P37VWAEHPFNCQ5 | Inverted Gear Academy | yes | pending | pending |

> CORRECTION 2026-05-19: invertedgear Source ID was `src_P6B5M60UZ6B3QDQR` (WRONG, would mis-launch). Real source verified live by GHL-location-key match = `src_O7P37VWAEHPFNCQ5` (GHLS, "Inverted Gear Academy"). Row above updated. General rule: verify every source by `/agency/source` key==GHL-location-id before attaching; this inventory has other stale source ids.

---

## Expanded 31-gym PIT list (added 2026-05-19)

Source: operator-provided list 2026-05-19. **One source error found + resolved by API test:** the list gave OM Brazilian Jiu Jitsu and Paragon Simi Valley the *same* PIT (`pit-aa7d0727-de0b-4905-ac61-3af7182d8f47`). API test (Bearer PIT vs each gym's GHL location) proved that PIT authenticates against OM BJJ's location `dUOiYuuo9LBcUnDOxd1i` (HTTP 200, 4 calendars) and is 403-denied on Paragon's `SO522NFKOtYUxfAzLbYW`. **PIT assigned to OM BJJ. Paragon's real PIT is MISSING — needs Bobby/source, do not fabricate.**

| Gym | PIT | Notes |
|---|---|---|
| 10th Planet Orlando Jiu Jitsu | pit-8ce706af-8ce9-4d61-b9e3-4f899920089c | |
| BLAB Training Laboratory | pit-51580826-8f53-4d49-92e6-bce59e0ad369 | non-gym (Training Laboratory) — confirm before any build |
| Champion Chiropractic of Pasadena | pit-2fde134f-79f0-4356-98c6-7509703aca83 | non-gym (chiropractic) — not a martial-arts bot |
| Cobrinha Southwest | pit-6bfb16bb-ffa3-473b-a21d-583b451f5f0c | |
| Connecticut Submission Grappling | pit-0efa16e3-bc44-476f-a71b-d16683c5ecd4 | |
| Granite Bay Jiu-Jitsu | pit-d5e74180-fefe-4c5f-8bbd-a2d4d6156ca8 | |
| Hamptons Jiu-Jitsu West | pit-c7c4b1a0-bafc-4a42-8d0d-3a41032419fa | distinct from Hamptons JJ South (built) — verify |
| Infinity BJJ | pit-4b9aec9d-84c0-4336-89b5-f75a33a01de9 | |
| Jean Jacques Machado Fresno Jiu-Jitsu | pit-35aeab8e-896b-4a35-b289-924b4484246c | |
| JitzLab Martial Arts | pit-ff967433-4672-4d3a-b6e5-8d865b955135 | |
| Jiu Jitsu Hub | pit-e299cf28-a4f0-45c0-bd8e-8ca1eb6ee3c0 | |
| Killer B Combat Sports Academy | pit-4d5cdc78-f3a6-420f-93a9-ebd07e298e78 | **11-batch gym 11** |
| Lucky Cat Grappling Co. | pit-58e0f6ab-4377-450a-a1d0-cd4712ae03b3 | |
| Montgomery Brazilian Jiu-Jitsu | pit-01d47e41-ce24-41ef-b334-41d7a2715a70 | **11-batch gym 7** |
| Mythic Martial Arts | pit-4d86d8a5-05b4-4be4-bcf1-e3538cbba478 | |
| OM Brazilian Jiu Jitsu | pit-aa7d0727-de0b-4905-ac61-3af7182d8f47 | **11-batch gym 3. API-CONFIRMED (loc dUOiYuuo9LBcUnDOxd1i, 4 cals).** Was duplicated w/ Paragon in source. |
| Paragon Simi Valley | **MISSING — source error** | **11-batch gym 2.** Source listed pit-aa7d0727 (OM BJJ's). Real Paragon PIT unknown — chase Bobby. Paragon GHL loc = SO522NFKOtYUxfAzLbYW. **CB source verified live: src_SFJ08L818G37B5CP "Paragon Simi Valley" (GHLS, key-match). LIVE 2026-05-20: bot_3CLH0PGK4HNLX144 (Agent Node v2.0 QA-PASSED), concierge filter. PIT still missing → GHL-side monitoring unavailable until Bobby provides Paragon's PIT.** |
| Range Brazilian Jiu-Jitsu NYC | pit-18bc827c-2f6e-4686-ab66-fa45dd47fd7d | |
| Ray Longo's Mixed Martial Arts | pit-70da2aa1-2805-402b-8e98-33e6f8227097 | **11-batch gym 5** |
| Rip Tide Brazilian Jiu Jitsu | pit-1a9fe41b-5d10-4ff2-9f6a-f074c34ace84 | |
| Roberts Family MMA | pit-76c54493-51f5-4f8a-8e6f-c38f9fda65a5 | **11-batch gym 9** |
| Signature of Jiu Jitsu | pit-d3ab70ad-ba7b-4e0a-b7af-d1db50ba15b0 | **11-batch gym 8** |
| Simple Man Martial Arts | pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757 | **11-batch gym 10** |
| Soulcraft Martial Arts | pit-14c01bae-9df8-4f61-b11c-bc6e95189d00 | |
| Speak Easy Jiu-Jitsu & Wrestling | pit-9bdccb3a-c14a-4dbb-ac72-d84154e5aefa | |
| Sugoi Submissions | pit-5a11741a-025f-49a3-9753-cad63aeb357c | **11-batch gym 4** |
| Tetris Jiu-Jitsu | pit-4530d325-8692-4f0e-9163-fc3f52f8e4aa | |
| Try A Martial Art Concierge | pit-adf972c4-44ac-4e15-a822-10a65b49a0f9 | concierge — confirm before any build |
| Universal Mixed Martial Arts | pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9 | **11-batch gym 6** |
| Verde Valley Brazilian Jiu Jitsu | pit-37b24d79-8c1d-4273-b2c1-817969c8297b | |
| Wisconsin National Karate | pit-b3b4b5c9-29dc-4a41-9ae0-d9b192433380 | |

**Dedup check:** other 29 PITs scanned — no further duplicates (only the OM/Paragon collision, resolved above).
