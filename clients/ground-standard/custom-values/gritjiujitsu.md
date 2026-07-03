# Grit Jiu-Jitsu - Custom Values Pack

- Source ID: src_6MS3RHIRTR8OEKMO
- GHL location: JPFHqtf4KnkqVtiUU9Bk
- Calendar IDs: VERIFIED-LIVE
- academy_info source: v 1.1.2 grit_jiujitsu_knowledge_base.txt (CloseBot-attached, vetted)
- Review flags:
  - The vetted KB (status OK, attached to this source) has no business phone number, only an address; website is marked [TO BE PROVIDED] in the KB text. Used the literal placeholder `<gym phone - fill>` below - get the real number before publishing.
  - A previous version of this pack used a phone number, (509) 392-4548, sourced from an older non-attached draft KB and gritbjj.com. That number is not present in the currently attached vetted KB, so per the vetted-KB-only rule it has been dropped here. Confirm with the client whether that number is correct and should be added into the attached KB, then patch it in.
  - KB lists a Teens JitZ program (ages 13-15) but no GHL calendar exists for it, and the KB's own Inconsistency 5 leaves the 13-15 routing (Teens JitZ vs Adult JitZ Essentials) unresolved. Per the no-calendar rule, ages 14-17 route to Adult Fundamentals BJJ below.
  - The two kids calendars overlap in age (Kids 4-13 BJJ vs Kids 5-13 Muay Thai). Age alone does not choose between them for ages 5-13 - the bot needs the attendee's discipline preference first.
  - KB carries 6 unresolved schedule-time inconsistencies pending client confirmation (class times only; does not affect the calendar routing below).

## 1 - academy_info

```
Business Information: Grit Jiu-Jitsu & Muay Thai is a Brazilian Jiu-Jitsu and Muay Thai academy in Spokane Valley, Washington, training kids, teens, and adults in Gi and No-Gi BJJ plus Muay Thai striking.

Programs Offered:
- Kids BJJ
- Teens JitZ
- Adult BJJ Fundamentals
- Adult BJJ Inter/Advance
- Kids Muay Thai
- Adult Muay Thai
- Women's JitZ
- Breakfast Club, Lunch Rollz, and Open Mat

KIDS BJJ
Runs Monday through Thursday for ages 4-13, with Fundamental, Intermediate, and Advance/Competition tracks.

TEENS JITZ
Dedicated BJJ track for ages 13-15, running parallel to the adult evening schedule. Not bookable online.

ADULT BJJ FUNDAMENTALS
Beginner Gi and No-Gi Jiu-Jitsu for ages 14 and up, all levels.

ADULT BJJ INTER/ADVANCE
No-Gi progression class for students past Fundamentals. Not bookable online.

KIDS MUAY THAI
Short-format striking fundamentals for ages 5-13, Monday, Wednesday, and Friday.

ADULT MUAY THAI
Fundamental and Inter/Advance striking for ages 14 and up. Sparring classes require a mouth guard and shin guards; neither is needed for intro classes.

WOMEN'S JITZ
A dedicated Jiu-Jitsu session for women, held Wednesday evenings. Not bookable online.

MORNING AND OPEN MAT SESSIONS
Breakfast Club JitZ runs Monday, Thursday, and Friday mornings, Lunch Rollz on Wednesday, and Open Mat on Saturday. Not bookable online.

A free trial class is available for new students with no commitment required. No prior martial arts experience is needed to start. Membership pricing is not published. Pricing varies based on weekly class count and training goals, and is discussed with instructors during or right after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId 6arbkYsRDvZX2NYGw3Vk.
Adult Muay Thai, calendarId eWs78zyvrQeaqPKvIfdD.
Adults default to Adult Fundamentals BJJ calendarId 6arbkYsRDvZX2NYGw3Vk unless they explicitly ask for Muay Thai, then use Adult Muay Thai calendarId eWs78zyvrQeaqPKvIfdD.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-13 BJJ calendarId D5HRfFd5QtI3G2D7Ug4S for age 4-13.
Use Kids 5-13 Muay Thai calendarId CEe34zvSRoAr3ao7Ktdc for age 5-13 only when the child explicitly asked for Muay Thai.
If under age 4, do not book, explain the youngest program is Kids 4-13 BJJ, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 should use Adult Fundamentals BJJ calendarId 6arbkYsRDvZX2NYGw3Vk (no kids calendar covers these ages).
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId 6arbkYsRDvZX2NYGw3Vk unless they explicitly asked for Muay Thai, then use Adult Muay Thai calendarId eWs78zyvrQeaqPKvIfdD. Children age 4-13 use Kids 4-13 BJJ calendarId D5HRfFd5QtI3G2D7Ug4S. Children age 5-13 who explicitly asked for Muay Thai use Kids 5-13 Muay Thai calendarId CEe34zvSRoAr3ao7Ktdc. Under age 4 do not book, explain the youngest program is Kids 4-13 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. Ages 14-17 use Adult Fundamentals BJJ calendarId 6arbkYsRDvZX2NYGw3Vk (no kids calendar covers these ages).
```
