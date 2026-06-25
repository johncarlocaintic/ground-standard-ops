# Logica Jiu-Jitsu — KB Verification (2026-05-18)

**Method:** No Glenn draft. Legacy KB v1.1.3 (`Logica_JJ_KB_v1.1.3_DEPLOY.txt`, CB library `file_6C1SVLFJPFVBYU24`, built 2026-04-16 from client MAP intake doc) used as starting material, verified vs live site `logicajiujitsu.com` + live GHL calendars. Source `src_0HFNJJIYASHOG06Y`, GHL location `sKr1YeqWZyYKNQL6yqLf`.

## Verified / corrections (not fabricated)
- No-Gi BJJ academy, Chattanooga TN, CLA methodology — confirmed by live site + legacy KB.
- Free trial — confirmed by live site ("schedule your free trial session") AND legacy KB (INCONSISTENCY 04 resolved: free trial is the confirmed conversion anchor). Consistent with GS trial-always rule.
- Contact (phone (423) 565-4549, email logicajiujitsu@gmail.com, 810 Dodson Ave Chattanooga TN 37406) — from client-confirmed legacy KB (FLAG 01 resolved v1.1.2); retained, not fabricated. Live homepage fetch did not surface contact (form-gated) — no contradiction.
- **Facility status corrected:** legacy KB (Apr 2026) described construction ongoing + a planned grand reopening. Live site (May 2026) presents a "modern state-of-the-art facility" currently operational, no construction/reopening mention. Clean KB drops the stale construction/reopening language and states the facility is operational.
- Internal appendix (FLAGS 01-10, INCONSISTENCY log, CHANGELOG — incl. the only $ figures, which live in the internal CHANGELOG) explicitly marked "NOT FOR BOT INGESTION" in the legacy doc and is fully excluded from the clean KB. Bot-facing sections carry zero pricing figures (already redirect-only).

## Live GHL calendars
| Calendar | ID | Active | Disposition |
|---|---|---|---|
| Adult Foundations BJJ | qULhIvCYkrLYo5lg3VPG | ✅ | BOOKABLE — adult (single discipline, Foundations = beginner trial entry) |
| Youth Jiu-Jitsu (8-13) | Lek30992aw6Ang5riW7K | ✅ | BOOKABLE — kids 8-13 |
| Free Consultation | kiieIViftkqALXhvf25I | ✅ | NON-BOOKABLE — consult/sales, internal |
| Logica 2.0 Grand Re-Opening | CZFbDdH9TOR8RXMd1Abh | ✅ | NON-BOOKABLE — one-off reopening event, not a recurring trial (live site shows facility already operational; trial = Foundations/Youth). FLAG for Bobby. |
| Women's Self Defense 6-Week Challenge | 01n9JfRtruHEdbBSD1rm | ❌ | EXCLUDED (inactive) |
| Kids (8-13) 6-Week Intro Challenge | KDPjfgwChsLZ5q5klM1c | ❌ | EXCLUDED (inactive) |
| Adults 6-Week Intro Challenge | QuPJ1MGzRTs7za3fQZKy | ❌ | EXCLUDED (inactive) |
| Adult All Levels BJJ | bDbjywX9j0oGe7wigHb1 | ❌ | EXCLUDED (inactive); All Levels is intermediate, not a beginner trial anyway |

## Structure
Single adult discipline (No-Gi BJJ; Foundations = beginner trial entry) → NO discipline switch. One kids band: Youth Jiu-Jitsu 8-13. No teen calendar; kids cap at 13, adults 18+ → ages 14-17 are a no-calendar band → `cb_youth_nocal_gate_inject.js` required. Under-8 → no calendar, academy referral (423) 565-4549. Universal minor gate.

## Known gaps (flag for Bobby — non-blocking)
- "Logica 2.0 Grand Re-Opening" calendar: confirm it is a one-off event and NOT the intended trial calendar (treated non-bookable; trial = Adult Foundations BJJ / Youth Jiu-Jitsu).
- Kids age band 8-13 from legacy KB + GHL calendar name; live site did not specify — confirm.
- Under-8: no calendar (Youth starts at 8) → no online booking, academy phone referral.
- 14-17: no calendar (kids end at 13) → minor, guardian capture, team follow-up, no booking (youth no-cal gate).
- Facility/reopening status: clean KB states operational per live site; confirm no current closure/transition.
