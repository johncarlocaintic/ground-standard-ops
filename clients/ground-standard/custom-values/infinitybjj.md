# Infinity BJJ - Custom Values Pack

Source ID: src_DQ8YCXJJ1YIWVTRA
GHL location: PpWSnRcgMSUfHOX5Y5Qp
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 Infinity_BJJ_Maryland_Knowledge_Base_v1_0_1.txt (CloseBot-attached, vetted)
Review flags:
- KB's own validation log scores it 78/100 (Grade C) and states it is "NOT recommended for live deployment until all [PLACEHOLDER] fields are resolved."
- KB's free-trial/pricing paragraph is reused boilerplate, credited in the KB footer to "Pricing Response Logic Reference: Ballantyne Martial Arts KB v3.0.0 (logic framework only)," while the KB's own Trial Class Information section lists the trial policy for this gym, including whether a free trial exists at all, as an unconfirmed [PLACEHOLDER]. Confirm the actual trial offer with the gym before relying on the paragraph below.
- Three schedule inconsistencies are flagged inside the KB itself and remain unresolved: Saturday Open Mat end time (2pm in text vs 3pm in the schedule graphic), Friday 7:30-8:30pm class level (All Levels vs Beginners), and the Tuesday 6pm Beginners Nogi class end time (not listed in either source).
- Email is a KB placeholder, not provided in source materials. Phone (667-288-0048) is confirmed in the KB and used as the literal value below.
- Adult Strength (Timonium Strength Club) is by-appointment only per KB, "contact the gym directly by phone or through the website" - excluded from the adult/youth/multiple values and moved to UNMAPPED.
- Kids Jiu-Jitsu (5-11) is the only youth calendar. Ages 12-13 fall in a gap the standard under-min/14-17 template does not address. Routed ages 12-17 together to Adult Fundamentals BJJ as a placeholder - confirm with the gym or Bobby whether a teen-specific path is actually needed.
- 10 Round Tuesday and Open Mat are named in the KB with no matching GHL calendar, marked "Not bookable online" in academy_info.

## 1 - academy_info

```
Business Information: Infinity Jiu-Jitsu Maryland is a Brazilian Jiu-Jitsu, Judo, and strength conditioning academy in Timonium, Maryland, offering programs for children and adults at all skill levels.

Programs Offered:
- Adult Brazilian Jiu-Jitsu (Gi and Nogi): beginner through advanced classes offered on weekday mornings and evenings.
- Adult Judo: all-levels classes with an invite-only competition track.
- Kids Jiu-Jitsu, Judo, and Wrestling: combined gi, nogi, judo, and wrestling classes for children, plus invite-only competition classes.
- Timonium Strength Club: by-appointment strength conditioning, booked directly with the gym. Not bookable online.
- 10 Round Tuesday: Tuesday evening conditioning and sparring class. Not bookable online.
- Open Mat: Saturday free-practice session. Not bookable online.

A free trial class is offered with no commitment required. Pricing is not published; membership pricing is discussed with instructors during or right after the free trial class, based on class frequency and training goals.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId uwytlYCsp8UCztqdZx39.
Adult Judo, calendarId LDhB1RHJR7jxyJp560Mm.
Adults default to Adult Fundamentals BJJ calendarId uwytlYCsp8UCztqdZx39 unless they explicitly ask for Judo, then use Adult Judo calendarId LDhB1RHJR7jxyJp560Mm.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids Jiu-Jitsu (5-11) calendarId IznM2rIrbaT3Ag0GZGKd for age 5-11.
If under age 5, do not book, explain the youngest program is Kids Jiu-Jitsu (5-11), suggest calling 667-288-0048, then stop responding.
For age 12-17, no youth calendar covers this range, use Adult Fundamentals BJJ calendarId uwytlYCsp8UCztqdZx39.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId uwytlYCsp8UCztqdZx39 unless they explicitly asked for Judo, then use Adult Judo calendarId LDhB1RHJR7jxyJp560Mm. Children age 5-11 use Kids Jiu-Jitsu (5-11) calendarId IznM2rIrbaT3Ag0GZGKd. If any attendee is under age 5, do not book that attendee, explain the youngest program is Kids Jiu-Jitsu (5-11), suggest calling 667-288-0048, then stop responding for that attendee. For attendees age 12-17, no youth calendar covers this range, use Adult Fundamentals BJJ calendarId uwytlYCsp8UCztqdZx39.
```

## UNMAPPED - review

- Adult Strength, calendarId vHN8Ua7tvvfq2tzODFBJ (Timonium Strength Club per KB, by-appointment only, contact gym directly by phone or website, not part of the standard trial-class booking flow)
