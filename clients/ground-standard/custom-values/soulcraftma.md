# Soulcraft Martial Arts - Custom Values Pack

Source ID: src_E5JZN2XXAH892HOO
GHL location: KBQg8vC2U81xf9XZUU4O
Calendar IDs: VERIFIED-LIVE
academy_info source: SOULCRAFT MARTIAL ARTS - KB v1.0.2.txt (CloseBot-attached, vetted)

Review flags:
- KB gives no literal phone number, only "[Contact through website or in-person inquiry]". Every phone reference below uses the `<gym phone - fill>` / `<fill>` token. Replace with the real number before deploy.
- Adult HIIT Fitness classes carry no trial asterisk (*) in the KB schedule, unlike every other adult program. Confirmed it is still a named adult program with a matching calendar, so it is included as bookable, but verify with the gym that a first-timer can actually trial into it before treating it like the others.
- Kids Krav Maga's age band (7-12) came from the KB class schedule text, not from the calendar name (the calendar is just named "Kids Krav Maga" with no ages). Confirm 7-12 before relying on it for routing.
- Four adult calendars exist (BJJ, Krav Maga, Muay Thai, HIIT) and the KB never states a single default. Adult Fundamentals BJJ was picked as default since it carries the most trial-marked class slots. Confirm this is the right default with the gym or GS team.
- 14-17 year olds fall outside every kids calendar (BJJ tops out at 11, Krav Maga at 12), so they route to Adult Fundamentals BJJ regardless of which discipline they asked about. A 14-17 year old asking for Krav Maga or Muay Thai would still land on BJJ. Flag for review if a discipline-specific teen override is wanted.

## 1 - academy_info

```
Business Information: Soulcraft Martial Arts is a multi-discipline martial arts academy in Hamden, Connecticut, offering training for kids and adults in morning, midday, and evening classes throughout the week.

Programs Offered:
- Brazilian Jiu-Jitsu (BJJ): gi and no-gi training for kids and adults. Bookable via Kids 4-7 BJJ, Kids 8-11 BJJ, and Adult Fundamentals BJJ.
- Krav Maga: Israeli self-defense system for kids and adults. Bookable via Kids Krav Maga and Adult Krav Maga.
- Muay Thai Kickboxing: Thai boxing and striking training for adults. Bookable via Adult Muay Thai Kickboxing.
- MMA: Mixed Martial Arts training combining striking and grappling. Not bookable online, no matching calendar on file.
- HIIT Fitness: high-intensity interval training for adults. Bookable via Adult HIIT Fitness.

The trial class is completely free with no commitment required. Pricing is not published here. Instructors discuss membership options and pricing during or right after the free trial class.

Phone: <fill> (KB lists no phone number, only "contact through website or in-person inquiry").
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId fmbwgp01qFFjugoDwmQm.
Adult Krav Maga, calendarId L2hVOrs6BsH0OdTB67f7.
Adult Muay Thai Kickboxing, calendarId GAgPrfybA8hZBvH6FEvW.
Adult HIIT Fitness, calendarId JWJcU39uxbks0Gw0JkYT.
Adults default to Adult Fundamentals BJJ calendarId fmbwgp01qFFjugoDwmQm unless they explicitly ask for Krav Maga, then use Adult Krav Maga calendarId L2hVOrs6BsH0OdTB67f7, or Muay Thai Kickboxing, then use Adult Muay Thai Kickboxing calendarId GAgPrfybA8hZBvH6FEvW, or HIIT Fitness, then use Adult HIIT Fitness calendarId JWJcU39uxbks0Gw0JkYT.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-7 BJJ calendarId YEdRp0kPtX2sOsniDeCt for age 4-7.
Use Kids 8-11 BJJ calendarId 2aCiQYk3Oz4Rx1JuYwtH for age 8-11.
Use Kids Krav Maga calendarId 2l9JgOfeoqAN5oO0VYKn for age 7-12.
If under age 4, do not book, explain the youngest program is Kids 4-7 BJJ, suggest calling <gym phone - fill>, then stop responding.
For ages 14-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId fmbwgp01qFFjugoDwmQm.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId fmbwgp01qFFjugoDwmQm unless they explicitly ask for Krav Maga, then use Adult Krav Maga calendarId L2hVOrs6BsH0OdTB67f7, or Muay Thai Kickboxing, then use Adult Muay Thai Kickboxing calendarId GAgPrfybA8hZBvH6FEvW, or HIIT Fitness, then use Adult HIIT Fitness calendarId JWJcU39uxbks0Gw0JkYT. For each youth attendee, after saving youth_birthday calculate age. Use Kids 4-7 BJJ calendarId YEdRp0kPtX2sOsniDeCt for age 4-7. Use Kids 8-11 BJJ calendarId 2aCiQYk3Oz4Rx1JuYwtH for age 8-11. Use Kids Krav Maga calendarId 2l9JgOfeoqAN5oO0VYKn for age 7-12. If under age 4, do not book that attendee, explain the youngest program is Kids 4-7 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. For ages 14-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId fmbwgp01qFFjugoDwmQm.
```
