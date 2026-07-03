# Wisconsin National Karate - Custom Values Pack

Source ID: src_ZPCXMO7N5ZQ24LYG
GHL location: YMnOW9Bdxd39bimBy0zd
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/wisconsin-national-karate.md

Review flags:
- No phone number anywhere in the ClickUp source. The literal token `<gym phone - fill>` is used in the youth and multiple blocks below. Replace before publish.
- ClickUp text describes staff scheduling instructions for Krav Maga ("only offer Monday/Tuesday for people's first class," "avoid Wednesday/Thursday if possible") and specific Cardio Kickboxing time slots. Reworded as plain facts in academy_info per the no-instructional-language rule. Confirm the reworded version still matches current practice.
- ClickUp text lists a flat rate ($137 for all programs), a sub-$140/month membership range, and no military discount. All dollar amounts and pricing structure were stripped per the no-pricing rule; academy_info keeps only the free-trial redirect and the no-military-discount fact.
- Adult Beginner Karate 13+ picked as the default/primary adult calendar since the gym's name and the "13+" beginner framing suggest it's the entry program for teens and adults. Confirm the intended default with Bobby.
- Kids Beginner Karate 8-12 and Adult Beginner Karate 13+ hand off cleanly (12 to 13, no gap), so ages 13-17 all route to Adult Beginner Karate 13+.

## 1 - academy_info

```
Business Information: Wisconsin National Karate is a karate, kickboxing, and Krav Maga academy in New Berlin, WI, located at 3564 S Moorland Rd near Malone Park, easily accessible off I-43 via the Moorland Road exit.

Programs Offered:
- Kids Beginner Karate, ages 4-7
- Kids Beginner Karate, ages 8-12
- Adult Beginner Karate, ages 13+
- Adult Cardio Kickboxing
- Adult Contact Kickboxing
- Adult Krav Maga

Kids Beginner Karate (ages 4-7): entry-level karate class for young children.
Kids Beginner Karate (ages 8-12): karate class for older kids.
Adult Beginner Karate (ages 13+): karate class for teens and adults.
Adult Cardio Kickboxing: cardio-focused kickboxing class, with class options on Monday evening and Thursday evening.
Adult Contact Kickboxing: contact kickboxing class for adults.
Adult Krav Maga: self-defense class for adults; new students typically start their first class on a Monday or Tuesday, with Wednesday or Thursday available as a fallback if needed.

Pricing is not published here. All programs start with a free introductory session, and membership is month-to-month with plan options based on how often a member attends. Cost is discussed with the team at or after the free trial. No military discount is currently offered.
```

## 2 - adult

```
Adult Beginner Karate 13+, calendarId URvofb8u12hmMJnHCsJH.
Adult Cardio Kickboxing, calendarId 9IucceIbKIFtb79vFP89.
Adult Contact Kickboxing, calendarId c9NXkqRmjyrpv9Mg6vCm.
Adult Krav Maga, calendarId jYpJnBYaDrnq0EytfeXe.
Adults default to Adult Beginner Karate 13+ calendarId URvofb8u12hmMJnHCsJH unless they explicitly ask for Cardio Kickboxing, Contact Kickboxing, or Krav Maga, then use Adult Cardio Kickboxing calendarId 9IucceIbKIFtb79vFP89, Adult Contact Kickboxing calendarId c9NXkqRmjyrpv9Mg6vCm, or Adult Krav Maga calendarId jYpJnBYaDrnq0EytfeXe.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids Beginner Karate 4-7 calendarId PqgnnV3ysRQWe3VjtfiF for age 4-7.
Use Kids Beginner Karate 8-12 calendarId sRwBW1SoRXbaskKDqIeS for age 8-12.
If under age 4, do not book, explain the youngest program is Kids Beginner Karate 4-7, suggest calling <gym phone - fill>, then stop responding.
For age 13-17, use Adult Beginner Karate 13+ calendarId URvofb8u12hmMJnHCsJH.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Beginner Karate 13+ calendarId URvofb8u12hmMJnHCsJH unless they explicitly ask for Cardio Kickboxing, Contact Kickboxing, or Krav Maga, then use Adult Cardio Kickboxing calendarId 9IucceIbKIFtb79vFP89, Adult Contact Kickboxing calendarId c9NXkqRmjyrpv9Mg6vCm, or Adult Krav Maga calendarId jYpJnBYaDrnq0EytfeXe. After saving contact youth_birthday, calculate age. Kids age 4-7 use Kids Beginner Karate 4-7 calendarId PqgnnV3ysRQWe3VjtfiF. Kids age 8-12 use Kids Beginner Karate 8-12 calendarId sRwBW1SoRXbaskKDqIeS. Under age 4, do not book, explain the youngest program is Kids Beginner Karate 4-7, suggest calling <gym phone - fill>, then stop responding. Ages 13-17 book via Adult Beginner Karate 13+ calendarId URvofb8u12hmMJnHCsJH.
```
