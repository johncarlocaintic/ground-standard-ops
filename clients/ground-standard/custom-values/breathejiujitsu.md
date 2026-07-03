# Breathe Jiu-Jitsu - Custom Values Pack

- Source ID: src_J4AHQWBOVA6ZXV0Y
- GHL location: USMxTUWMwAIetj1ka5u3
- Calendar IDs: VERIFIED-LIVE
- academy_info source: breathejiujitsu_kb_v1.0.0.txt (CloseBot-attached, vetted)
- Review flags:
  - Phone number is not in the vetted KB or the gym record. Wrote `<gym phone - fill>` in the youth under-min line. Get the real number from the gym before publish.
  - Two adult calendars (Adult Basics Gi BJJ, Adult Basics No-Gi BJJ) with no signal on which is primary. Defaulted to Gi as primary since Gi is the traditional baseline for BJJ. Confirm before publish.
  - Ages 14-17 have no matching kids calendar (Kids 7-13 caps at 13), so they route to the adult default (Adult Basics Gi BJJ) per the standard rule. Confirm this is the intended handling for that age band.
  - Adult Women's Only Brazilian Jiu-Jitsu is excluded from the adult/youth/multiple values per standard categorization (women's-only = UNMAPPED). See below if the gym wants it re-added with explicit-ask routing.

## 1 - academy_info

```
Business Information: Breathe Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Yaphank, NY. It offers BJJ training for adults and children of all experience levels, from first-time students to competitive athletes.

Programs Offered:
- Adult Brazilian Jiu-Jitsu
- Kids Brazilian Jiu-Jitsu
- Competition Class

Adult Brazilian Jiu-Jitsu: BJJ training for adults at all experience levels. No prior experience required.
Kids Brazilian Jiu-Jitsu: BJJ for children, grouped by age, with structured, safe instruction that builds discipline, technique, and confidence.
Competition Class: advanced training for students pursuing competition. Not bookable online; availability and eligibility are confirmed directly with the academy.

A free trial class is available for new students, with no commitment required. No prior martial arts experience is needed to start. Membership pricing is not published. Pricing varies based on training goals and the number of classes per week. Instructors discuss membership options and pricing during or right after the free trial class.
```

## 2 - adult

```
Adult Basics Gi BJJ, calendarId p3OHyjTlpZQu5CVtvjLC.
Adult Basics No-Gi BJJ, calendarId xS4lIvfEk8OKtTbXNFr7.
Adults default to Adult Basics Gi BJJ calendarId p3OHyjTlpZQu5CVtvjLC unless they explicitly ask for No-Gi, then use Adult Basics No-Gi BJJ calendarId xS4lIvfEk8OKtTbXNFr7.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-6 BJJ calendarId aOOG8H6Zdnfks33KzKbY for age 4-6.
Use Kids 7-13 BJJ calendarId KE4BOOChS7TOP6QLigQV for age 7-13.
If under age 4, do not book, explain the youngest program is Kids 4-6 BJJ, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 are not covered by a kids calendar, so use Adult Basics Gi BJJ calendarId p3OHyjTlpZQu5CVtvjLC.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Basics Gi BJJ calendarId p3OHyjTlpZQu5CVtvjLC unless they explicitly ask for No-Gi, then use Adult Basics No-Gi BJJ calendarId xS4lIvfEk8OKtTbXNFr7. Children age 4-6 use Kids 4-6 BJJ calendarId aOOG8H6Zdnfks33KzKbY. Children age 7-13 use Kids 7-13 BJJ calendarId KE4BOOChS7TOP6QLigQV. Under age 4, do not book and suggest calling <gym phone - fill>. Ages 14-17 use Adult Basics Gi BJJ calendarId p3OHyjTlpZQu5CVtvjLC.
```

## UNMAPPED - review

- Adult Women's Only Brazilian Jiu-Jitsu, calendarId aBuKmIdEEaoQwAUzUkM9 (women's-only, excluded from adult/youth/multiple values per standard categorization).
