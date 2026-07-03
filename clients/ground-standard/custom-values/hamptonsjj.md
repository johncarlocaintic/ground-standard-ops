# Hamptons Jiu Jitsu South - Custom Values Pack

Source ID: src_3HPZKL5NULBRLNLX
GHL location: 7rOciO3DHa7ZfaXTZ0CC
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 South Hamptons_JJ_KB.txt (CloseBot-attached, vetted)

Review flags:
- Two KB files are indexed against this source (v1.1.2 South Hamptons_JJ_KB.txt and hamptonsjj_kb_v1.0.0.txt). Used the v1.1.2 file, the one the index returns as the current kbFilename. Confirm the older v1.0.0 file is not still live on the source.
- This supersedes an earlier draft of this pack that was built off the old v1.0.0 KB and treated Adult Muay Thai and Women's BJJ as bookable adult calendars. The vetted v1.1.2 KB explicitly states the gym does not offer Kickboxing or standalone fitness classes outside BJJ and MMA, and never mentions a women's-only class, so both calendars have been moved to UNMAPPED here. Flag this change for Bobby/Greg before it goes live.
- Gym's GHL calendars include "Adult Muay Thai" and "TRX Group Classes," but the vetted KB says the gym does not offer Kickboxing or standalone fitness outside BJJ and MMA. Neither calendar is corroborated by the KB. Excluded from academy_info and from the calendar values, listed under UNMAPPED. Flag for client and GHL cleanup.
- "Women's BJJ" calendar excluded under the standard women's-only UNMAPPED rule.
- KB lists "Youth GI Ages 8-13," but the matching GHL calendar is named "Kids 8-12 BJJ" (12, not 13). Used the calendar's own age band (8-12) for booking logic per instructions. Worth confirming the real upper age with the client.
- No dedicated teen calendar exists, so ages 14-17 route to Adult BJJ by the standard else-rule.
- KB gives a phone number and a city (Southampton, NY), so phone below is filled from the KB, not a placeholder.

## 1 - academy_info

```
Business Information: Hamptons Jiu Jitsu is a Brazilian Jiu Jitsu academy in Southampton, NY, established in 2016 and operating out of the back room of the Southampton Gym at 395 County Rd 39A.

Programs Offered:
- Brazilian Jiu Jitsu (Gi and No-Gi): core BJJ training for all ages and skill levels, beginners through advanced.
- Fundamentals GI: foundational Gi BJJ class for all levels. Not bookable online.
- Youth No-Gi: No-Gi BJJ for youth of all ages.
- Youth GI: Gi BJJ for kids, split into a 4-7 class and an 8-12 class.
- Adult MMA: mixed martial arts class for adults. Not bookable online.
- Adult No-Gi Judo: No-Gi Judo class for adults. Not bookable online.

Hamptons Jiu Jitsu does not offer Kickboxing, Karate, Aikido, or standalone fitness classes outside of BJJ and MMA programming. All classes accommodate beginners alongside more experienced students, there are no separate beginner-only slots.

Pricing is not published. Membership pricing depends on class frequency and training goals, and instructors go over pricing and membership options with prospects during or right after the free trial class. The trial class itself is completely free with no commitment required.

Contact: (631) 900-2780 or info@hamptonsjiujitsu.com.
```

## 2 - adult

```
Adult BJJ, calendarId 3Rt21MmCWcURorQxJilE.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-7 BJJ calendarId S5dIqvZ3DsqwUKOnRXw6 for age 4-7.
Use Kids 8-12 BJJ calendarId 1ZexVKGM176mU02DVr0L for age 8-12.
If under age 4, do not book, explain the youngest program is Kids 4-7 BJJ, suggest calling (631) 900-2780, then stop responding.
For ages 14-17, use Adult BJJ calendarId 3Rt21MmCWcURorQxJilE.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult BJJ calendarId 3Rt21MmCWcURorQxJilE. After saving contact youth_birthday, calculate age for each youth attendee. Use Kids 4-7 BJJ calendarId S5dIqvZ3DsqwUKOnRXw6 for age 4-7. Use Kids 8-12 BJJ calendarId 1ZexVKGM176mU02DVr0L for age 8-12. If under age 4, do not book that attendee, explain the youngest program is Kids 4-7 BJJ, suggest calling (631) 900-2780, then stop responding for that attendee. For ages 14-17, use Adult BJJ calendarId 3Rt21MmCWcURorQxJilE.
```

## UNMAPPED - review

- Women's BJJ, calendarId Q2hiWaEFNnhw5rccK3VP (women's-only, excluded by rule)
- Adult Muay Thai, calendarId SoGSt7H7OGmVv6rdghfH (not in the vetted KB's program list; KB says the gym does not offer Kickboxing or standalone offerings beyond BJJ and MMA, conflict, flag for client review)
- TRX Group Classes, calendarId ntkZyNnnCppOf46jMtId (non-trial fitness class, contradicts the KB's "no standalone fitness classes" line, conflict, flag for client review)
