# Vacaville Grappling Academy - Custom Values Pack

**Status**
- Source ID: `src_GDKORXSW4Q8RQUQ8`
- GHL location: `JFnXPPTB9Rkgyi0KOUv8`
- Calendar IDs: NAMES-ONLY
- academy_info source: `Vacaville_Grappling_Academy_CloseBot_KB_v2.3.2_DEPLOY.txt` (CloseBot-attached, vetted)
- Review flags:
  - Calendar list conflicts with the KB. The KB states verbatim "No Kids 3-5 BJJ program. The youngest program starts at age 7." and "No Kids 10-14 BJJ program. Ages 10-13 are in Kids 7-13; age 14+ is in Adult." Both calendars exist in the gym record anyway. Moved both to UNMAPPED and excluded from the youth and multiple values so bookings do not route into a program the KB says does not exist. Confirm with the gym before mapping either one.
  - "Adult Express No-Gi Fundamentals" is not named anywhere in the KB's Programs Offered list (the KB documents only "Adult No-Gi Submission Grappling," and separately notes there are no separate beginner-only sessions). Kept as a secondary adult calendar per the calendar list, but confirm it is a current, live class before treating it as bookable.
  - Age 14 sits inside the excluded Kids 10-14 BJJ name range. Values below follow the KB instead: everyone 14 and up, including teens, routes to Adult No-Gi Submission Grappling.
  - The KB has no literal phone number. It only says "text the front desk." Used the placeholder `<gym phone - fill>` in the youth and multiple values; fill in before deploying.
  - idStatus is NAMES-ONLY for this gym. Every calendarId below is the placeholder `<calendarId - fill from GHL UI>` and must be replaced with real IDs from the GHL UI before use.

## 1 - academy_info

```
Business Information: Vacaville Grappling Academy is a No-Gi Brazilian Jiu-Jitsu and Submission Grappling academy in Vacaville, California. Coach Nick Hernandez, a U.S. Air Force veteran and EMT/BLS provider, founded the academy with a focus on grappling fundamentals, a respectful learning environment, and self-defense applications.

Programs Offered:
- Kids 7-13 Jiu-Jitsu (ages 7-13)
- Adult No-Gi Submission Grappling (ages 14 and up)

KIDS 7-13 JIU-JITSU
No-Gi jiu-jitsu for kids ages 7 through 13. Classes run Monday through Thursday, 5:15 PM to 6:00 PM.

ADULT NO-GI SUBMISSION GRAPPLING
No-Gi submission grappling for ages 14 and up. Evening classes run Monday through Friday, 6:30 PM to 7:30 PM; early morning classes run Monday through Thursday, 6:30 AM to 7:30 AM. Teens 14-17 train in this class, with a parent as the booking contact since minors cannot book themselves.

All classes are No-Gi format; there are no gi (kimono) classes. Classes run Monday through Friday only, with no Saturday or Sunday classes. There is no current program for children under 7.

A free trial class is available at any class on the schedule, with no cost and no commitment required.
Membership pricing is not published. Pricing varies by training frequency and goals, and is discussed with new students during or right after the free trial class.
```

## 2 - adult

```
Adult No-Gi Submission Grappling, calendarId <calendarId - fill from GHL UI>.
Adult Express No-Gi Fundamentals, calendarId <calendarId - fill from GHL UI>.
Adults default to Adult No-Gi Submission Grappling calendarId <calendarId - fill from GHL UI> unless they explicitly ask for Adult Express No-Gi Fundamentals, then use Adult Express No-Gi Fundamentals calendarId <calendarId - fill from GHL UI>.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 7-13 Jiu-Jitsu calendarId <calendarId - fill from GHL UI> for age 7-13.
If under age 7, do not book, explain the youngest program is Kids 7-13 Jiu-Jitsu, suggest calling <gym phone - fill>, then stop responding.
For age 14-17, no kids calendar covers this range; use Adult No-Gi Submission Grappling calendarId <calendarId - fill from GHL UI>.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult No-Gi Submission Grappling calendarId <calendarId - fill from GHL UI> unless they explicitly ask for Adult Express No-Gi Fundamentals, then use Adult Express No-Gi Fundamentals calendarId <calendarId - fill from GHL UI>. Children age 7-13 use Kids 7-13 Jiu-Jitsu calendarId <calendarId - fill from GHL UI>. If under age 7, do not book, explain the youngest program is Kids 7-13 Jiu-Jitsu, suggest calling <gym phone - fill>, then stop responding. Ages 14-17 use Adult No-Gi Submission Grappling calendarId <calendarId - fill from GHL UI> since no kids calendar covers that range.
```

## UNMAPPED - review

- Kids 3-5 BJJ (id: null) - KB states verbatim "No Kids 3-5 BJJ program. The youngest program starts at age 7." Excluded as a stale or incorrect calendar; do not map without confirming with the gym.
- Kids 10-14 BJJ (id: null) - KB states verbatim "No Kids 10-14 BJJ program. Ages 10-13 are in Kids 7-13; age 14+ is in Adult." Excluded as a stale or incorrect calendar; do not map without confirming with the gym.
