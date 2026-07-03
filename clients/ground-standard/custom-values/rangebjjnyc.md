# Range Brazilian Jiu-Jitsu NYC - Custom Values Pack

Source ID: src_4AYG1NDG21O56S0D
GHL location: fEEhq2iBrGi5zBNhi0FC
Calendar IDs: VERIFIED-LIVE
academy_info source: range_bjj_closebot_kb_v1_2_1.txt (CloseBot-attached, vetted)
Review flags:
- KB is marked "Status: DRAFT - Email pending" as of its last update (April 1, 2026) - confirm with client the facts are final before long-term reliance.
- KB describes the 9-13 to adult transition as based on size and experience at age 13, not a hard cutoff. The youth calendar value below routes strictly by the calendar's own age band (9-13), and sends 14-17 to the adult calendar since no kids calendar covers that range. Flagging in case staff want a judgment-call exception instead of the strict band.

## 1 - academy_info

```
Business Information: Range BJJ is a Brazilian Jiu Jitsu academy in New York, NY, led by Eduardo, a 4th Degree Black Belt, with a curriculum progressing from Fundamentals through Intermediate and Advanced.

Programs Offered:
- Fundamentals (adult): beginner BJJ, no sparring, technique sequences built progressively.
- Little Warriors (kids 5-8): introductory BJJ in a structured, age-appropriate environment.
- Teenage Warriors (kids 9-13): BJJ training for ages 9 to 13.
- Intermediate: for white belts with 1+ stripe, adds sparring. Not bookable online.
- Advanced: for white belts with 2+ stripes. Not bookable online.
- Study Hall: open-format session for all levels, Wednesdays at 12pm. Not bookable online.
- Open Mat: free-rolling session, Saturdays at 11:30am. Not bookable online.
- No-Gi (NOGI): offered Wednesdays and Fridays for adults and kids. Not bookable online.

Free trial classes are available to people who live in New York City and are actively looking for a school to join, not for visitor or tourist drop-ins. The trial is free with no commitment, and every lead is eligible for one free trial class. Loaner Gi, rash guard, and belt are provided. Pricing is not published here - membership options and pricing are discussed with instructors during or right after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId Ck7s0a1s29Te6EXs7awS.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 5-8 BJJ calendarId 1zJwobkf3UV9KHGP6CI2 for age 5-8.
Use Kids 9-13 BJJ calendarId NE7UJOspnpnw8Oeksb2F for age 9-13.
If under age 5, do not book, explain the youngest program is Little Warriors (ages 5-8), suggest calling 646-699-4448, then stop responding.
For age 14-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId Ck7s0a1s29Te6EXs7awS.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Fundamentals BJJ calendarId Ck7s0a1s29Te6EXs7awS. For kids age 5-8, use Kids 5-8 BJJ calendarId 1zJwobkf3UV9KHGP6CI2. For kids age 9-13, use Kids 9-13 BJJ calendarId NE7UJOspnpnw8Oeksb2F. If any attendee is under age 5, do not book that attendee, explain the youngest program is Little Warriors (ages 5-8), suggest calling 646-699-4448, then stop responding for that attendee. For attendees age 14-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId Ck7s0a1s29Te6EXs7awS.
```
