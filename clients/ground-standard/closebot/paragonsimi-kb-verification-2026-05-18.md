# Paragon Simi Valley — KB Verification (2026-05-18)

**Method:** Legacy KB v1.1.0 (`paragon_simi_valley_closebot_kb_v1.1.0.txt`, CB library `file_OFQEJOJ4OOVXZMQY`, 2026-02-28) as starting material, verified vs live site paragonsimivalley.com + live GHL calendars. Source `src_SFJ08L818G37B5CP`, GHL location `SO522NFKOtYUxfAzLbYW`.

## Verified / corrections
- Multi-discipline academy, Simi Valley CA — confirmed by live site + GHL.
- Phone (805) 744-5449, address 4210 E Los Angeles Ave Suite D — match.
- **Email paragonsv@yahoo.com** — added from live site (legacy KB had none).
- Free trial — confirmed live site + legacy KB; consistent with GS trial-always rule.
- Internal **inconsistency log** (schedule conflicts, lines 7-44) excluded — not bot-facing.
- Procedural "REQUIRED INFORMATION FOR TRIAL CLASS BOOKING" section excluded (instructional; the bot flow collects these via nodes per CONTENT STANDARDS).
- Kids age bands aligned to **live GHL calendars** (authoritative): Fun Jitsu 3-6, Kids 7-14 BJJ. Legacy KB's "Kids 8-12+" / separate "Youth Jiu-Jitsu" ambiguity (INCONSISTENCY 5) is resolved by GHL: there is one kids BJJ calendar (7-14) + Fun Jitsu (3-6). Live site says "ages 4+" (loose marketing) — GHL bands used.

## Live GHL calendars
| Calendar | ID | Active | Disposition |
|---|---|---|---|
| Adult Gi BJJ | tXUikVuCUy8KaHZCxC9u | ✅ | BOOKABLE — adult (default discipline) |
| Adult No-Gi BJJ | EywP00tCh2wlXmnIekZm | ✅ | BOOKABLE — adult |
| Adult Muay Thai | YVbgt1gmdm2CpKMnHS1T | ✅ | BOOKABLE — adult |
| Adult Mixed Martial Arts | FN0tQiwHjyigzUmdihJd | ✅ | BOOKABLE — adult |
| Kids 3-6 Fun Jitsu | ddmOhTfUkXV1RdDKOfpY | ✅ | BOOKABLE — kids 3-6 |
| Kids 7-14 BJJ | AFoWlffSZq18isEuVqwO | ✅ | BOOKABLE — kids 7-14 |
| Taylor Manning-Drake's Personal Calendar | WYz8CdK5jGEJ13xW0mW5 | ✅ | NON-BOOKABLE — staff personal, internal |
| Kids 6-9 BJJ | 7vZi4GhfxeiXTPSPbRTs | ❌ | EXCLUDED (inactive) |
| Adult Advanced BJJ | YQDaxE0GhSrFaUnqBF2P | ❌ | EXCLUDED (inactive); advanced, not a beginner trial |
| Adult All Levels BJJ | vg23tU8G6NRpdxlLlHnu | ❌ | EXCLUDED (inactive) |

## Structure
4 adult disciplines (Gi BJJ default / No-Gi BJJ / Muay Thai / MMA) → N-way `cb_discipline_switch_inject.js`. 2 kids bands: Fun Jitsu 3-6, Kids 7-14 BJJ. Kids cap at 14, adults 18+ → ages 15-17 are a no-calendar band → `cb_youth_nocal_gate_inject.js`. Under-3 → no calendar, gym referral (805) 744-5449. Universal minor gate.

## Known gaps (flag for Bobby — non-blocking)
- Kids bands from live GHL (Fun Jitsu 3-6, Kids 7-14); legacy KB had a Kids-vs-Youth ambiguity (resolved to GHL). Confirm.
- 15-17: no calendar (kids end at 14) → minor, guardian capture, team follow-up, no booking (youth no-cal gate).
- Under-3: no calendar (Fun Jitsu starts at 3) → no online booking, gym (805) 744-5449.
- Advanced Gi / private lessons: not online trial bookings (KB-acknowledged, no flow path).
