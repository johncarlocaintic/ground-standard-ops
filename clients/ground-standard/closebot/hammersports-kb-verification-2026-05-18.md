# Hammer Sports & Performance — KB Verification (2026-05-18)

**Method:** No Glenn draft existed (only a mapping-table row in `tasks/glenn_kb_doc.txt`). Followed the All In precedent: legacy KB v1.1.0 (built from a client PDF, retrieved from CloseBot library `file_FJSCWM869KY77CNV`) used as STARTING MATERIAL ONLY, then verified against the live website + live GHL calendars.

## Sources
- Legacy KB v1.1.0: `clients/ground-standard/closebot/_hammer-legacy-kb-v1.1.2-REFERENCE.txt`
- Live website: https://www.hammertrained.com (fetched 2026-05-18)
- Live GHL calendars: source `src_OKNBAOGCND99B5EM`, location `IB5NHYNn4F4ANpNt5NvX`

## Legacy Appendix-A flags — resolution
- **FLAG 4 (free trial not in source PDF): CLOSED.** Live site explicitly invites "schedule a trial class." Free trial is real and consistent with the GS universal trial-always rule.
- **FLAG 5 (no phone/email in source PDF): CLOSED.** Live site: phone **(732) 795-5626**, email **hammernation135@gmail.com**. Written into clean KB.
- **FLAG 6 (Sat/Sun classes launching 3/21-3/22/2026): CLOSED.** Those dates are now past; stale "starting 3/2X/2026" qualifiers removed from the clean KB.
- FLAG 1/2/3 were internal pricing/qualifier notes in Appendix A — Appendix A is internal-only and excluded from the bot KB per content standards.

## Live GHL calendars (truth for what the bot can book)
| Calendar | ID | Active | Disposition |
|---|---|---|---|
| Youth Martial Arts | 42uFk8DjUKX49nbN6egp | ✅ | BOOKABLE — kids 5-12 (Little Hammer) |
| Teen Martial Arts | dyKieKPgrZTSlvJXckqs | ✅ | BOOKABLE — teens 13-17 |
| Adult Brazilian Jiu-Jitsu | LVXGgBrnpysMvL5SeXO4 | ✅ | BOOKABLE — adult, Gi (default discipline) |
| Adult No-Gi Brazilian Jiu-Jitsu | 7lDnZI0guVOkAPRC4WOg | ✅ | BOOKABLE — adult, No-Gi |
| Adult Muay Thai (Kickboxing) | GguRLKLUnTL4vwKOI3vi | ✅ | BOOKABLE — adult, striking |
| Adult Wrestling | HPHCI7asG4MIs1gHKtp4 | ✅ | BOOKABLE — adult, wrestling |
| Kettle Bell Workout | fliTy42M3zCzQVPv3RWO | ✅ | BOOKABLE — adult, conditioning (flag for Bobby) |
| Personal Training Consultation Call | Z65Qdz3OuP7KIyBiDrbn | ✅ | NON-BOOKABLE — sales/PT consult, internal |
| Coach Josh Private Session | hek6PGsySuxxtCkiK4gA | ✅ | NON-BOOKABLE — private, internal |
| Taylor Manning-Drake's Personal Calendar | rW8JVwGrxnm5ovXbLRNA | ✅ | NON-BOOKABLE — staff personal, internal |
| Adult No-Gi | vXplvwPxKVBLJoTrLdSj | ❌ INACTIVE | EXCLUDED — superseded by "Adult No-Gi Brazilian Jiu-Jitsu" |

## Known gaps (flag for Bobby — non-blocking, do NOT fabricate)
- Kids/teen age ranges not specified on the live site; taken from legacy KB (Little Hammer 5-12, Teen 13 through HS → treated 13-17). Confirm.
- Kettle Bell Workout treated as a bookable adult conditioning trial because it has an active GHL calendar. Confirm intended as a trial offering vs members-only.
- Under-5: youngest program is Little Hammer (5-12); no calendar below 5 → no online booking, refer to gym (732) 795-5626.
- MMA appears in programs/schedule but has NO dedicated GHL calendar → non-bookable online; KB acknowledges it exists, no flow path.
