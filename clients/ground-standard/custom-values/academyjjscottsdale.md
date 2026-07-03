# Academy of Jiu-Jitsu Scottsdale - Custom Values Pack

- Source ID: src_G95K8VC8HQTNWPGL
- GHL location: 8XPm2yy1DqYc7fDpSj4O
- Calendar IDs: VERIFIED-LIVE 2026-07-04
- academy_info source: academyjjscottsdale_kb_v1.0.0.txt (CloseBot-attached, vetted)
- Review flags: (1) Adult BJJ Advanced and Fundamentals Live Training have no GHL calendars, so they are described as not bookable online per the GS no-calendar default. (2) No front desk phone number appears anywhere in the vetted KB text. The under-5 guard in youth and multiple below uses a placeholder pending a verified number.

## 1 - academy_info

```
Business Information: Academy of Jiu-Jitsu Scottsdale is a Brazilian Jiu-Jitsu academy in Scottsdale, Arizona, located in The Pavilions at Talking Stick Shopping Center. The Academy offers adult BJJ programs across beginner, intermediate, and advanced levels, plus Kids BJJ programs split into two age groups.

Programs Offered:
- Little Tigers BJJ (Ages 5 to 7)
- Tigers BJJ (Ages 8 to 13)
- Adult BJJ Fundamentals (Beginner to Intermediate, White Belt to Blue Belt path)
- Fundamentals Live Training (Saturday only, intermediate bridging class)
- Adult BJJ Advanced (Intermediate to Advanced curriculum)

LITTLE TIGERS BJJ
Kids BJJ program for children ages 5 to 7. No experience required.

TIGERS BJJ
Kids BJJ program for children ages 8 to 13. No experience required.

ADULT BJJ FUNDAMENTALS
Covers beginner and intermediate BJJ, including self-defense, foundational BJJ positions, techniques, and concepts. Structured as the path from White Belt to Blue Belt.

FUNDAMENTALS LIVE TRAINING
Saturday-only class that applies Fundamentals techniques in live, resistance-based training scenarios to bridge drilling and full-intensity sparring. Not bookable online.

ADULT BJJ ADVANCED
Covers a wide range of intermediate and advanced BJJ curriculum. Not bookable online.

A free trial class is available with no commitment required, bookable online at academyofJiu-Jitsuscottsdale.com or by contacting the front desk directly. Program options at booking are Adult, Youth, or Both. Membership pricing is not published. Membership options and pricing are reviewed with students based on individual training goals and schedule preferences, during or after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId 9jVZSK73p5tR2XjCeUU4.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 5-7 BJJ calendarId XkcxzmFl0EGXb3nKLKjN for age 5-7.
Use Kids 8-13 BJJ calendarId IqyIo2fAYXKhhQwc1E0d for age 8-13.
If under age 5, do not book, explain the youngest program is Kids 5-7 BJJ, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 should attend Adult Fundamentals BJJ calendarId 9jVZSK73p5tR2XjCeUU4.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId 9jVZSK73p5tR2XjCeUU4. Children age 5-7 use Kids 5-7 BJJ calendarId XkcxzmFl0EGXb3nKLKjN. Children age 8-13 use Kids 8-13 BJJ calendarId IqyIo2fAYXKhhQwc1E0d. Under age 5 do not book and suggest calling <gym phone - fill>. Ages 14-17 use Adult Fundamentals BJJ calendarId 9jVZSK73p5tR2XjCeUU4.
```

No unmapped calendars. All three calendars from the gym record (Adult Fundamentals BJJ, Kids 8-13 BJJ, Kids 5-7 BJJ) are used above.
