# Artistry BJJ - Custom Values Pack

Source ID: src_D87BKGBV6H9K4WRS
GHL location: 3SIWDTRfqtCBE9gSr1bY
Calendar IDs: INVENTORY-2026-05-13 (live pull failed, HTTP 401 - not GHL-verified)
academy_info source: Artistry_BJJ_KB_v1.1.0_CLEAN.txt (CloseBot-attached, vetted)
Review flags:
- Calendar IDs come from a 2026-05-13 inventory pull, not a live GHL pull (live pull failed with HTTP 401). Verify all three IDs against the GHL UI before this pack goes live.
- The vetted v1.1.0 KB has no phone number anywhere in it (it was dropped from the earlier v1.0.0 draft). Every phone placeholder below is <gym phone - fill> - get the number from the gym before deploy. Do not reuse the old (346) 514-4811 draft number without re-confirming it against the vetted KB or artistrybjj.com.
- KB defines no age bracket for 14-17 year olds (Kids Gi BJJ tops out at 13). Routed 14-17 to the adult Fundamentals BJJ calendar as a fallback - confirm this with the gym.
- Gym record has one "Adult Fundamentals BJJ" calendar covering both the KB's "Adult No-Gi BJJ" and "Adult Gi BJJ" programs - there is no separate Gi/No-Gi split in GHL.

## 1 - academy_info

```
Business Information: Artistry BJJ is a Brazilian Jiu-Jitsu and MMA academy in Houston, TX (East Houston), family-oriented and built around confidence, discipline, and resilience for kids and adults.

Programs Offered:
- Adult No-Gi BJJ
- Adult Gi BJJ
- Adult MMA
- Kids Gi BJJ (ages 5-13)
- Kids Striking
- Open Mat (Saturday)

Adult No-Gi BJJ - no-gi grappling technique and live training for adults. Bookable via the Adult Fundamentals BJJ calendar.
Adult Gi BJJ - gi BJJ for adults using the traditional kimono. Bookable via the Adult Fundamentals BJJ calendar.
Adult MMA - structured MMA training focused on self-defense applications. Bookable via the Adult Fundamentals MMA calendar.
Kids Gi BJJ (ages 5-13) - gi BJJ for kids ages 5 to 13, builds confidence and discipline. Bookable via the Kids 5-13 BJJ calendar.
Kids Striking - striking classes for kids. Not bookable online.
Open Mat (Saturday) - unstructured drilling and rolling session. Not bookable online.

A one-week free trial is available for new students with no commitment required. New students join regular classes directly and are paired with experienced training partners. Membership pricing is not published - pricing and membership options are discussed with students during or after the free trial, based on individual training goals and schedule.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId zekzktAAbiO3xmvaOVIj.
Adult Fundamentals MMA, calendarId SSs1T9pdl8wdidH4EJxn.
Adults default to Adult Fundamentals BJJ calendarId zekzktAAbiO3xmvaOVIj unless they explicitly ask for Adult Fundamentals MMA, then use Adult Fundamentals MMA calendarId SSs1T9pdl8wdidH4EJxn.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 5-13 BJJ calendarId iUxOoSFF7RF8uP9VpN9b for age 5-13.
If under age 5, do not book, explain the youngest program is Kids 5-13 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 14-17, no dedicated teen or kids calendar covers this range - use Adult Fundamentals BJJ calendarId zekzktAAbiO3xmvaOVIj as the adult beginner fallback.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId zekzktAAbiO3xmvaOVIj unless they explicitly ask for Adult Fundamentals MMA, then use Adult Fundamentals MMA calendarId SSs1T9pdl8wdidH4EJxn. After saving contact youth_birthday, calculate age. Use Kids 5-13 BJJ calendarId iUxOoSFF7RF8uP9VpN9b for age 5-13. If under age 5, do not book, explain the youngest program is Kids 5-13 BJJ, suggest calling <gym phone - fill>, then stop responding. For age 14-17, no dedicated teen or kids calendar covers this range - use Adult Fundamentals BJJ calendarId zekzktAAbiO3xmvaOVIj as the adult beginner fallback.
```
