# All In Jiu-Jitsu - Custom Values Pack

- Source ID: src_PQQCANSMZ8CS09UA
- GHL location: 7jz3trWsyu4R0zBlnCRI
- Calendar IDs: VERIFIED-LIVE 2026-07-04
- academy_info source: v1.1.2 All_In_Jiu_Jitsu_CloseBot_KB_v1_1.txt (CloseBot-attached, vetted)
- Review flags: (1) No front desk phone number appears anywhere in the vetted KB text - the KB itself flags this as Inconsistency 8, "Not provided, update before deployment." The under-5 guard in youth and multiple below uses a placeholder pending a verified number. (2) The KB's own Inconsistency 2 states no teen or 13-17 age bracket is defined anywhere in the source. Age 13 sits in the gap between the Kids 5-12 calendar and the 14-17-to-adult route below and has no explicit handling; confirm placement for a 13-year-old with the gym before this pack goes live. (3) Two files are attached to this source (v1.1.2 All_In_Jiu_Jitsu_CloseBot_KB_v1_1.txt and an older All_In_Jiu_Jitsu_CloseBot_KB.txt). This pack is distilled from the v1.1.2 text only, as the higher version. Confirm CloseBot is serving that file and not the older one.

## 1 - academy_info

```
Business Information: All In Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Green Brook, New Jersey, also offering No-Gi grappling, MMA fundamentals, and youth martial arts for ages 5 to 12.

Programs Offered:
- Beginner's No Gi
- All Level No Gi
- Beginner's MMA
- Ladies No Gi
- Live Training
- Open Mat
- Kids Gi (Ages 5-12)
- Kids No Gi (Ages 5-12)

BEGINNER'S NO GI
Foundational No-Gi grappling class for students with little to no prior experience.

ALL LEVEL NO GI
No-Gi grappling class open to students at all experience levels.

BEGINNER'S MMA
Introductory Mixed Martial Arts class for students new to combat sports. Not bookable online.

LADIES NO GI
No-Gi grappling class for women. Not bookable online.

LIVE TRAINING
Sparring-focused session for applying techniques. Not bookable online.

OPEN MAT
Unstructured session where students drill and roll on techniques of their choice. Not bookable online.

KIDS GI (AGES 5-12)
Brazilian Jiu-Jitsu for children ages 5 to 12 using the traditional Gi.

KIDS NO GI (AGES 5-12)
Grappling for children ages 5 to 12 without the Gi.

A free trial class is available with no commitment required, with up to 5 trial students accommodated per day. Membership pricing is not published. Instructors discuss all pricing options and membership plans with the student during or right after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId gicbjCQ004KHLYVYlPfw.
Adult All Levels BJJ, calendarId fqS7MHeEhy2dtc11h7AM.
Adults default to Adult Fundamentals BJJ calendarId gicbjCQ004KHLYVYlPfw unless they explicitly ask for All Levels training, then use Adult All Levels BJJ calendarId fqS7MHeEhy2dtc11h7AM.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 5-12 BJJ calendarId deuaXkSEzYGTm5zbRp1c for age 5-12.
If under age 5, do not book, explain the youngest program is Kids 5-12 BJJ, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 should attend Adult Fundamentals BJJ calendarId gicbjCQ004KHLYVYlPfw.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId gicbjCQ004KHLYVYlPfw unless they explicitly ask for All Levels training, then use Adult All Levels BJJ calendarId fqS7MHeEhy2dtc11h7AM. Children age 5-12 use Kids 5-12 BJJ calendarId deuaXkSEzYGTm5zbRp1c. Under age 5 do not book and suggest calling <gym phone - fill>. Ages 14-17 use Adult Fundamentals BJJ calendarId gicbjCQ004KHLYVYlPfw.
```
