# Inverted Gear Academy — KB Verification (2026-05-18)

**Method:** No Glenn draft. Followed the All In / Hammer precedent: legacy KB (`Inverted Gear Academy KB.3.txt`, CloseBot library `file_8KC5WQGHUNIF53YH`, v1.0.0 dated 2026-01-27) used as STARTING MATERIAL ONLY, verified against the live academy website + live GHL calendars.

## Sources
- Legacy KB: `clients/ground-standard/closebot/_invertedgear-legacy-kb-REFERENCE.txt`
- Live academy site: https://www.invertedgearacademy.com (contact page fetched 2026-05-18)
- Live GHL calendars: source `src_O7P37VWAEHPFNCQ5`, location `ajf9RVwQJUGwU900yGEq`

## Corrections applied (verified, not fabricated)
- **Website:** legacy KB listed `invertedgear.com` and even flagged it as "(gear and equipment purchases)". That domain is the separate Inverted Gear apparel/equipment brand (same founders). The actual academy site is **invertedgearacademy.com**. Corrected in the clean KB.
- **Phone/email (legacy KB had none):** live contact page → phone **(484) 657-4674** (alt 484-559-8900), email **academy@invertedgear.com**. Added.
- **Trial:** live site confirms "schedule a free trial class" — consistent with legacy KB trial section and the GS trial-always rule.

## Open flag (relay to Bobby — genuine conflict, NOT resolved by fabrication)
- **Address conflict.** Legacy KB (2026-01): "1114 W Broad St, Bethlehem, PA 18018" with very specific building directions (Mobility Doc upstairs, Raspberry St rear entrance). Live contact page (2026-05): "804 N Gilmore St., Allentown, PA 18109". A third-party listing showed Bethlehem. Cannot determine which is current without the client. The clean KB therefore does NOT assert a single street address — it states the academy is in the Lehigh Valley area and directs callers to (484) 657-4674 for exact directions. Bot bookings are GHL-calendar-driven and unaffected. **Bobby to confirm the current address.**

## Live GHL calendars (truth for what the bot can book)
| Calendar | ID | Active | Disposition |
|---|---|---|---|
| Adult Fundamentals BJJ | 2ePcQUWj9vMYsVxjBAi9 | ✅ | BOOKABLE — adult (single discipline, no switch) |
| Cubs 4-6 BJJ | d0BgipZ6s6H9VnLFDnKr | ✅ | BOOKABLE — kids 4-6 |
| Juniors 7-12 BJJ | B3K3EDv4UGNVuN30kHLD | ✅ | BOOKABLE — kids 7-12 |
| Taylor Manning-Drake's Personal Calendar | 0EqbxE7IzBLS5xSt4x6E | ✅ | NON-BOOKABLE — staff personal, internal |
| JC Caintic's Personal Calendar | T71rxUdgtjilE1G6t88X | ✅ | NON-BOOKABLE — staff personal, internal |
| GS SEO's Personal Calendar | pEFncqXKVdaZXWqYvIFJ | ✅ | NON-BOOKABLE — staff personal, internal |
| Demo Calendar | q6l7sQt0A6xPUHoO4KyT | ❌ INACTIVE | EXCLUDED |

## Structure
Single-discipline BJJ: 1 adult calendar (NO discipline switch). 2 kids bands (Cubs 4-6, Juniors 7-12). NO teen calendar → ages 13-17 are a no-calendar band → requires `cb_youth_nocal_gate_inject.js` (same gap class as Gracie FV). Under-4 → no calendar, gym referral (484) 657-4674. Universal minor gate.

## Known gaps (flag for Bobby — non-blocking)
- Address conflict Bethlehem vs Allentown (above) — confirm current location.
- Kids age bands from legacy KB (Cubs 4-6, Juniors 7-12); live site did not specify — confirm.
- Under-4: youngest is Cubs (4-6); no calendar below 4 → no online booking, refer to (484) 657-4674.
- 13-17: no teen/youth calendar for that band → minor, capture guardian, team follow-up, no booking (youth no-cal gate).
