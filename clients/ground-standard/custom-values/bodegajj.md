# Bodega Jiu-Jitsu - Custom Values Pack

- Source ID: src_GYUQQATOAUB6UFM3
- GHL location: 0svdYcor6p7eXPqx7hVA
- Calendar IDs: VERIFIED-LIVE
- academy_info source: v1.1.2 bodega_jiu_jitsu_kb_v1_1_0.txt (CloseBot-attached, vetted)
- Review flags:
  - Kids 9-12 BJJ and Kids 6-14 BJJ overlap on ages 9-12 (Kids 6-14 BJJ's range fully contains Kids 9-12 BJJ's). Routed the overlap to the more specific Kids 9-12 BJJ calendar; ages 6-8 and 13-14 route to Kids 6-14 BJJ. Confirm this split is correct with the gym before this pack goes live.
  - KB v1.1.2 carries two open client-action items from its own changelog: adult pricing disclosure preference not yet confirmed, and no cancellation/pause policy on file. Neither changes the values below, since pricing stays unpublished either way, but worth a check-in with the gym.

## 1 - academy_info

```
Business Information: Bodega Jiu-Jitsu is a No-Gi Brazilian Jiu-Jitsu academy in Maplewood, New Jersey, founded in late 2022 by Kyvann Gonzalez and Chas Makk.

Programs Offered:
- Adult Grappling (No-Gi Brazilian Jiu-Jitsu)
- Youth Jiu-Jitsu Program (ages 7-13)

ADULT GRAPPLING (NO-GI BJJ)
No-Gi Brazilian Jiu-Jitsu for adults at every skill level, 100% live training. Beginners start in a "Genesis" class built for students with no prior experience.

YOUTH JIU-JITSU PROGRAM (AGES 7-13)
Structured BJJ training for kids ages 7-13, with individual exceptions evaluated case by case. Builds confidence, discipline, and focus. Currently in a Founding Member launch phase for Spring 2026.

A free trial class is available for both adult and youth programs, with no commitment required.
No prior martial arts experience is needed to start.
Membership pricing is not published. Pricing depends on training frequency and goals and is discussed with instructors during or after the free trial class.
```

## 2 - adult

```
Adult No-Gi Brazilian Jiu-Jitsu, calendarId wIgLDLmgL5lPY0pqIgTM.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 9-12 BJJ calendarId H6mtYnRcrDaQrPEOCrwL for age 9-12.
Use Kids 6-14 BJJ calendarId eQkMthNv6VgQ7W56E3VL for age 6-8 and 13-14.
If under age 6, do not book, explain the youngest program is Kids 6-14 BJJ, suggest calling (908) 201-3863, then stop responding.
For ages 15-17, use Adult No-Gi Brazilian Jiu-Jitsu calendarId wIgLDLmgL5lPY0pqIgTM.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult No-Gi Brazilian Jiu-Jitsu calendarId wIgLDLmgL5lPY0pqIgTM. After saving contact youth_birthday, calculate age for each youth attendee: use Kids 9-12 BJJ calendarId H6mtYnRcrDaQrPEOCrwL for age 9-12, and Kids 6-14 BJJ calendarId eQkMthNv6VgQ7W56E3VL for age 6-8 and 13-14. If under age 6, do not book that attendee, explain the youngest program is Kids 6-14 BJJ, suggest calling (908) 201-3863, then stop responding for that attendee. For ages 15-17, use Adult No-Gi Brazilian Jiu-Jitsu calendarId wIgLDLmgL5lPY0pqIgTM.
```
