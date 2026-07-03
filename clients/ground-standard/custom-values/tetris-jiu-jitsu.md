# Tetris Jiu-Jitsu - Custom Values Pack

Source ID: src_YAJ0LGX3P1KCVS3S
GHL location: GxMvMHm9meOwqYmZkCkG
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/tetris-jiu-jitsu.md
Review flags:
- Beginner class schedule is only described as "depends by age" in the ClickUp source, no day/time grid given - get the actual weekly schedule from Bobby if the bot needs it.
- Source lists two phone formats (Cell Number "(1) 689-2515012" and Business Phone Number "(689) 251-5012"). Used Business Phone Number (689) 251-5012 as the canonical literal phone below - confirm with Bobby if the cell number is meant to be different.
- Membership cost (159-179) and family discount (10% second student, 15% after a third) were in the source and stripped per the no-pricing rule.

## 1 - academy_info

```
Business Information: Tetris Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Orlando, Florida, located at 11951 International Drive, open daily from 6:30am to 9pm.

Programs Offered:
- Adult Fundamentals BJJ
- Kids 3-5 BJJ
- Kids 6-9 BJJ
- Kids 10-13 BJJ

Adult Fundamentals BJJ: Jiu-Jitsu class for adults, drop-ins welcome, no equipment needed beyond comfy clothes for the first visit.
Kids 3-5 BJJ: Jiu-Jitsu class for kids ages 3 to 5.
Kids 6-9 BJJ: Jiu-Jitsu class for kids ages 6 to 9.
Kids 10-13 BJJ: Jiu-Jitsu class for kids ages 10 to 13.

New students get a one week free trial class. Membership pricing is not published here and is discussed with the team at or after the trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId dZ3vf68qFTbKcI1Cj9rC.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 3-5 BJJ calendarId toWvotrh9lGOnnnV8EgG for age 3-5.
Use Kids 6-9 BJJ calendarId aH96rygec8hGRrrWBmpk for age 6-9.
Use Kids 10-13 BJJ calendarId MtiBXImAsSvoqs9Gp6Li for age 10-13.
If age is under 3, do not book online - call (689) 251-5012 to discuss.
For ages 14-17, use Adult Fundamentals BJJ calendarId dZ3vf68qFTbKcI1Cj9rC.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Fundamentals BJJ calendarId dZ3vf68qFTbKcI1Cj9rC. Kids age 3-5 use Kids 3-5 BJJ calendarId toWvotrh9lGOnnnV8EgG. Kids age 6-9 use Kids 6-9 BJJ calendarId aH96rygec8hGRrrWBmpk. Kids age 10-13 use Kids 10-13 BJJ calendarId MtiBXImAsSvoqs9Gp6Li. Ages 14-17 use Adult Fundamentals BJJ calendarId dZ3vf68qFTbKcI1Cj9rC. Under age 3, do not book online - call (689) 251-5012 to discuss.
```
