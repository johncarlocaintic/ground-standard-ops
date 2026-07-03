# Jiu Jitsu Hub - Custom Values Pack

- Source ID: src_TWKA5GBSRLE9KNMH
- GHL location: G7rWa7SAMDd63Y7vSznt
- Calendar IDs: VERIFIED-LIVE
- academy_info source: ClickUp - clickup-kb/jiu-jitsu-hub.md
- Review flags:
  - Adults Kickboxing (14+, Tue/Thu) and the Sunday adult open mat have no matching GHL calendar in this record - marked "Not bookable online" in academy_info.
  - ClickUp text sets no explicit minimum age for Adult Fundamentals BJJ. Since Kids 7-13 BJJ stops at 13, ages 14-17 default to the adult calendar per the standard no-calendar rule - confirm with Bobby this is acceptable for younger teens.
  - ClickUp text mentions private lessons (Josh Wyland, Corbin LaPorte) with no matching calendar - left out of academy_info for brevity; flag if Bobby wants it added as "Not bookable online."
  - ClickUp text contains membership tiers, day-pass cost, registration fee, and family/military/student discount amounts. Per policy all dollar amounts were stripped from academy_info; pricing is redirected to the free trial conversation instead.
  - Phone number (540) 449-9397 and address (Georgetown, Texas) are both present in the ClickUp text and used as literal facts below.

## 1 - academy_info

```
Business Information: Jiu Jitsu Hub is a no-gi jiu jitsu academy in Georgetown, Texas, founded by brown belt competitor Josh Wyland and built around a team-focused, amenity-rich facility with an athlete lounge and free towel and water service.

Programs Offered:
- Little Warriors (ages 4-6): no-gi jiu jitsu, Wednesday and Thursday 4:45-5:30 pm.
- Kids Jiu Jitsu (ages 7-13): no-gi jiu jitsu, Monday-Friday 5:30-6:30 pm.
- Adults Jiu Jitsu (all levels): Monday-Friday 6:30-7:30 pm, Wednesday is the beginner-friendly class and Tuesday leans toward wrestling for jiu jitsu.
- Adults Kickboxing (age 14+): Tuesday and Thursday 7:30-8:30 pm. Not bookable online.
- Adult Open Mat: Sunday 4-6 pm, free and open to the public. Not bookable online.

A free trial class is available for any new student; staff recommend Monday or Wednesday for the best turnout but will accommodate any day that works. Membership pricing is not published; pricing is discussed with staff during or after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId J11Jp8lM9DhQvITJYO8o.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-6 BJJ calendarId GZ0vD1Qpj8APFYzuVnKc for age 4-6.
Use Kids 7-13 BJJ calendarId tUpoIQXe0veeDS3qsRdo for age 7-13.
If under age 4, do not book, explain the youngest program is Kids 4-6 BJJ (Little Warriors), suggest calling (540) 449-9397, then stop responding.
Ages 14-17 should use Adult Fundamentals BJJ calendarId J11Jp8lM9DhQvITJYO8o (no kids calendar covers these ages).
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId J11Jp8lM9DhQvITJYO8o. Children age 4-6 use Kids 4-6 BJJ calendarId GZ0vD1Qpj8APFYzuVnKc. Children age 7-13 use Kids 7-13 BJJ calendarId tUpoIQXe0veeDS3qsRdo. Under age 4 do not book, explain the youngest program is Kids 4-6 BJJ (Little Warriors), suggest calling (540) 449-9397, then stop responding for that attendee. Ages 14-17 use Adult Fundamentals BJJ calendarId J11Jp8lM9DhQvITJYO8o (no kids calendar covers these ages).
```
