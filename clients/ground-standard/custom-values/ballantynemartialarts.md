# Ballantyne Martial Arts - Custom Values Pack

Source ID: src_5E8F1KTYKN51FWK5
GHL location: 2y7XT17KEqjIpnTvPvJB
Calendar IDs: VERIFIED-LIVE
academy_info source: ballantyne_kb_v5.txt (CloseBot-attached, vetted)

Review flags:
- Phone number is not in the vetted KB (KB text reads "Phone: [To be provided]"). Used the literal token `<gym phone - fill>` in the youth value everywhere a phone is needed. Get the real number and replace before deploy. Do not pull phone numbers from any other draft or legacy KB file, only the CloseBot-attached KB is a valid source.
- Two adult calendars (Adult BJJ, Adult Kickboxing) with no stated priority in the KB or gym record. Defaulted to Adult BJJ as primary (first listed in the gym record). Confirm with the gym which program should be the default booking for an adult who has no preference.
- Kids age bands overlap by discipline, not a clean age ladder: ages 6-8, 9-11, and 12-13 each have both a BJJ option and a Kickboxing option running at the same time. The youth value asks the family which discipline they want before picking a calendar for those ages. This is a new pattern (first gym with two parallel kids disciplines) - flagging so it becomes the standard approach for any future gym with overlapping kids bands.
- Ages 16-17 sit in a gap: the oldest kids calendar tops out at 15 (Kids 12-15 Kickboxing) and the KB defines adult as 18+. No calendar or KB text covers 16-17 directly. Routed 16-17 to the adult default rule as the closest reasonable fit. Confirm with the gym whether 16-17 year olds should instead go into the teen Kickboxing class.

## 1 - academy_info

```
Business Information: Ballantyne Martial Arts is a Kickboxing and Brazilian Jiu-Jitsu academy in Charlotte, NC. The adult program blends Kickboxing and Aikido, and kids programs start at age 4.

Programs Offered:
- Adult BJJ (ages 18+): traditional Brazilian Jiu-Jitsu with sport and self-defense training.
- Adult Kickboxing (ages 18+): a blend of Kickboxing and Aikido for well-rounded self-defense.
- Kids 4-5 Kickboxing (ages 4-5): entry-level kickboxing, no BJJ option at this age.
- Kids 6-8 BJJ (ages 6-8): Brazilian Jiu-Jitsu for young kids.
- Kids 6-11 Kickboxing (ages 6-11): kickboxing for kids.
- Kids 9-13 BJJ (ages 9-13): Brazilian Jiu-Jitsu for older kids.
- Kids 12-15 Kickboxing (ages 12-15): kickboxing for teens, also the default class for ages 14-15 since no BJJ program covers that range.

Trial classes are completely free, up to two per person, with no commitment required. Membership pricing is not published in advance and is discussed with staff during or after the free trial class.
```

## 2 - adult

```
Adult BJJ, calendarId UuXMOPOwKhNud9yLzS5R.
Adult Kickboxing, calendarId WonEcKFNdjTGOV49Q7X6.
Adults default to Adult BJJ calendarId UuXMOPOwKhNud9yLzS5R unless they explicitly ask for Adult Kickboxing, then use Adult Kickboxing calendarId WonEcKFNdjTGOV49Q7X6.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-5 Kickboxing calendarId T5YY96EolJOXyJJ4Z8B1 for age 4-5.
For age 6-8, ask the family if they want BJJ or Kickboxing. Use Kids 6-8 BJJ calendarId m0HIutky2Bq4F78Ts7S5 for BJJ. Use Kids 6-11 Kickboxing calendarId 5UF8XiSGfcmEW882LNlR for Kickboxing.
For age 9-11, ask the family if they want BJJ or Kickboxing. Use Kids 9-13 BJJ calendarId BXEKr1tRYEMU3pCaCsyd for BJJ. Use Kids 6-11 Kickboxing calendarId 5UF8XiSGfcmEW882LNlR for Kickboxing.
For age 12-13, ask the family if they want BJJ or Kickboxing. Use Kids 9-13 BJJ calendarId BXEKr1tRYEMU3pCaCsyd for BJJ. Use Kids 12-15 Kickboxing calendarId BiNf7iqTQvqvpUfvmLGF for Kickboxing.
Use Kids 12-15 Kickboxing calendarId BiNf7iqTQvqvpUfvmLGF for age 14-15.
If under age 4, do not book, explain the youngest program is Kids 4-5 Kickboxing, suggest calling <gym phone - fill>, then stop responding.
For age 16-17, no kids calendar covers this range. Route to the adult default: Adult BJJ calendarId UuXMOPOwKhNud9yLzS5R unless they explicitly ask for Adult Kickboxing calendarId WonEcKFNdjTGOV49Q7X6.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult BJJ calendarId UuXMOPOwKhNud9yLzS5R unless they explicitly ask for Adult Kickboxing calendarId WonEcKFNdjTGOV49Q7X6. For age 4-5, use Kids 4-5 Kickboxing calendarId T5YY96EolJOXyJJ4Z8B1. For age 6-8, ask BJJ or Kickboxing: Kids 6-8 BJJ calendarId m0HIutky2Bq4F78Ts7S5, or Kids 6-11 Kickboxing calendarId 5UF8XiSGfcmEW882LNlR. For age 9-11, ask BJJ or Kickboxing: Kids 9-13 BJJ calendarId BXEKr1tRYEMU3pCaCsyd, or Kids 6-11 Kickboxing calendarId 5UF8XiSGfcmEW882LNlR. For age 12-13, ask BJJ or Kickboxing: Kids 9-13 BJJ calendarId BXEKr1tRYEMU3pCaCsyd, or Kids 12-15 Kickboxing calendarId BiNf7iqTQvqvpUfvmLGF. For age 14-15, use Kids 12-15 Kickboxing calendarId BiNf7iqTQvqvpUfvmLGF. If any attendee is under age 4, do not book that attendee, explain the youngest program is Kids 4-5 Kickboxing, suggest calling <gym phone - fill>, then continue booking the rest of the group. For age 16-17, no kids calendar applies, route that attendee under the adult default rule above.
```
