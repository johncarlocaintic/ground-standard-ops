# 10th Planet Jiu-Jitsu Miami - Custom Values Pack

Source ID: src_MXT2RCPXUZNTOP0S
GHL location: 98Z8PDW1sSiYSGSzyqGl
Calendar IDs: VERIFIED-LIVE
academy_info source: v1_1_4_10th_Planet_Miami_KB.txt (CloseBot-attached, vetted)
Review flags:
- No phone number anywhere in the vetted KB (Contact section only lists address + website, and the FAQ just says "reach out to the front desk"). Used the literal token <fill> in academy_info and in the youth under-3 line. Needs a real number from Bobby/GS before this pack goes live.
- Kids Striking calendar (99dJQKbLGwdDbAlK31mn) has no age band in its name, unlike Kids 3-6 BJJ and Kids 7-13 BJJ. Left it out of the age-routing values in sections 3 and 4 and moved it to UNMAPPED - review below.
- KB lists several adult sub-programs with no matching GHL calendar (Afternoon All Levels, Adults Advanced, All Levels Adult Jiu-Jitsu, Adults All Levels Competition Class, MMA Class, Open Mat, Pro Training). All marked "Not bookable online" in academy_info.

## 1 - academy_info

```
Business Information: 10th Planet Jiu-Jitsu Miami is a Brazilian Jiu-Jitsu (10th Planet no-gi) academy in Miramar, FL, offering Jiu-Jitsu and striking programs for all ages under the 10th Planet no-gi, submission-focused system.

Programs Offered:
- Kids Jiu-Jitsu (Tiny Tots and Kids Class, ages 3-13): foundational no-gi Jiu-Jitsu split into a 3-6 age group and a 7-13 age group.
- Kids Striking: stand-up striking class for kids.
- Adult Jiu-Jitsu Fundamentals: no-gi Jiu-Jitsu fundamentals for adult beginners.
- Adult Jiu-Jitsu All Levels / Advanced: all-levels and advanced no-gi Jiu-Jitsu for adults. Not bookable online.
- Kickboxing (Adult Striking): stand-up striking class for adults.
- Adults All Levels Competition Class: competition-prep Jiu-Jitsu class for adult students. Not bookable online.
- MMA Class: mixed martial arts class combining grappling and striking. Not bookable online.
- Open Mat: unstructured drop-in rolling session, Sunday. Not bookable online.
- Pro Training: invite-only advanced training session. Not bookable online.

Pricing is not published. Membership pricing depends on weekly class frequency and training goals, and is discussed by instructors during or right after the free trial class, which is free with no commitment required.

Phone: <fill> (not listed in the vetted KB).
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId ylk5gbihjmLKsgcqX9RN
Adult Striking, calendarId arh3msnuCtEZBdyV2sD6
Adults default to Adult Fundamentals BJJ calendarId ylk5gbihjmLKsgcqX9RN unless they explicitly ask for Adult Striking, then use Adult Striking calendarId arh3msnuCtEZBdyV2sD6.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 3-6 BJJ calendarId do1v2YwQuDU5tGychmXs for age 3-6.
Use Kids 7-13 BJJ calendarId 7l3EvYO9s9f4LtebWksV for age 7-13.
If under age 3, do not book, explain the youngest program is Kids 3-6 BJJ, suggest calling <fill>, then stop responding.
For age 14-17, use Adult Fundamentals BJJ calendarId ylk5gbihjmLKsgcqX9RN.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId ylk5gbihjmLKsgcqX9RN unless they explicitly ask for Adult Striking, then use Adult Striking calendarId arh3msnuCtEZBdyV2sD6. Use Kids 3-6 BJJ calendarId do1v2YwQuDU5tGychmXs for age 3-6. Use Kids 7-13 BJJ calendarId 7l3EvYO9s9f4LtebWksV for age 7-13. If under age 3, do not book, explain the youngest program is Kids 3-6 BJJ, suggest calling <fill>, then stop responding. For age 14-17, use Adult Fundamentals BJJ calendarId ylk5gbihjmLKsgcqX9RN.
```

## UNMAPPED - review

- Kids Striking, calendarId 99dJQKbLGwdDbAlK31mn - no age band in the calendar name (compare Kids 3-6 BJJ / Kids 7-13 BJJ). Cannot assign it an age route without confirming from Bobby/GS whether it serves the 3-6 group, the 7-13 group, or both. Excluded from the adult/youth/multiple values above; it still counts as a bookable program in academy_info since the calendar itself exists.
