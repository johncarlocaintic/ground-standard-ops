# Paragon Simi Valley - Custom Values Pack

Source ID: src_SFJ08L818G37B5CP
GHL location: SO522NFKOtYUxfAzLbYW
Calendar IDs: NAMES-ONLY
academy_info source: v 1.1.2 paragon_simi_valley_closebot_kb_v1.1.0.txt (CloseBot-attached, vetted)
Review flags:
- All 10 calendars on this gym record are NAMES-ONLY (no live IDs). Every calendarId below uses the placeholder `<calendarId - fill from GHL UI>` until pulled from GHL.
- The vetted KB documents 5 unresolved schedule-time inconsistencies in its own Inconsistency Log (overlapping Adult Gi / Kids class slots, a Friday No-Gi time discrepancy, an unconfirmed Friday Muay Thai class, an unconfirmed Saturday Gi time, and a Kids vs. Youth Jiu-Jitsu end-time mismatch). None of these change the calendar routing below, only class start/end times - flagging for gym confirmation before the times are used in bot copy.
- KB names "Youth Jiu-Jitsu" as a program distinct from Kids Jiu-Jitsu (ages 8-12+) but gives it no specific age range, and no GHL calendar matches it by name. Marked "Not bookable online" in academy_info.
- "Private Lessons" is available upon request per the KB but has no GHL calendar. Marked "Not bookable online" in academy_info.
- Kids 6-9 BJJ and Kids 7-14 BJJ calendars overlap for ages 7-9 with no gym guidance on the split. Defaulted to Kids 6-9 BJJ for that overlap band - flagging for gym confirmation.
- Adult Gi BJJ is used as the default adult calendar because "Adult Jiu-Jitsu - Gi" is listed first in the KB's Classes & Programs section. This is not stated explicitly as the gym's preferred entry point - flagging for gym confirmation.
- Taylor Manning-Drake's Personal Calendar is a staff personal calendar, moved to UNMAPPED.

## 1 - academy_info

```
Business Information: Paragon Simi Valley is a Brazilian Jiu-Jitsu, Muay Thai, and Mixed Martial Arts academy in Simi Valley, California, offering programs from Fun Jitsu for ages 3-6 through advanced adult classes, with instructors giving specific direction so no student is lost and beginners paired with more experienced training partners.

Programs Offered:
- Brazilian Jiu-Jitsu (Gi and No-Gi)
- Muay Thai
- Mixed Martial Arts (MMA)
- Fun Jitsu (ages 3-6)
- Kids Jiu-Jitsu (ages 8-12+)
- Youth Jiu-Jitsu
- Adult Jiu-Jitsu (All Levels and Advanced tracks)
- Private Lessons

- Brazilian Jiu-Jitsu (Gi and No-Gi): traditional Gi and No-Gi grappling for all levels. Bookable via Adult Gi BJJ and Adult No-Gi BJJ.
- Muay Thai: striking classes through the week; Tuesday evening and Saturday morning are the full structured sessions recommended for a first trial. Bookable via Adult Muay Thai.
- Mixed Martial Arts (MMA): MMA training held Sunday late morning. Bookable via Adult Mixed Martial Arts.
- Fun Jitsu (ages 3-6): introductory Jiu-Jitsu for young children, Monday and Wednesday afternoons. Bookable via Kids 3-6 Fun Jitsu.
- Kids Jiu-Jitsu (ages 8-12+): Jiu-Jitsu for older kids, offered Monday, Wednesday, and Saturday. Bookable via Kids 6-9 BJJ and Kids 7-14 BJJ.
- Youth Jiu-Jitsu: a distinct program overlapping the Kids age range, with no confirmed age band in the KB. Not bookable online.
- Adult Jiu-Jitsu (All Levels and Advanced tracks): all-levels and advanced-practitioner Gi classes. Bookable via Adult All Levels BJJ and Adult Advanced BJJ.
- Private Lessons: available upon request; pricing and scheduling are discussed with staff. Not bookable online.

Trial classes are available for new students, with loaner gear provided so no equipment purchase is required before a first class. Membership pricing is not published; pricing and membership options are discussed with instructors during or after the free trial class.
```

## 2 - adult

```
Adult Gi BJJ, calendarId <calendarId - fill from GHL UI>.
Adult No-Gi BJJ, calendarId <calendarId - fill from GHL UI>
Adult Advanced BJJ, calendarId <calendarId - fill from GHL UI>
Adult All Levels BJJ, calendarId <calendarId - fill from GHL UI>
Adult Muay Thai, calendarId <calendarId - fill from GHL UI>
Adult Mixed Martial Arts, calendarId <calendarId - fill from GHL UI>
Adults default to Adult Gi BJJ calendarId <calendarId - fill from GHL UI> unless they explicitly ask for No-Gi, Advanced, All Levels, Muay Thai, or MMA, then use Adult No-Gi BJJ calendarId <calendarId - fill from GHL UI>, Adult Advanced BJJ calendarId <calendarId - fill from GHL UI>, Adult All Levels BJJ calendarId <calendarId - fill from GHL UI>, Adult Muay Thai calendarId <calendarId - fill from GHL UI>, or Adult Mixed Martial Arts calendarId <calendarId - fill from GHL UI>.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 3-6 Fun Jitsu calendarId <calendarId - fill from GHL UI> for age 3-6.
Use Kids 6-9 BJJ calendarId <calendarId - fill from GHL UI> for age 6-9.
Use Kids 7-14 BJJ calendarId <calendarId - fill from GHL UI> for age 10-14.
For the overlapping ages 7-9, default to Kids 6-9 BJJ calendarId <calendarId - fill from GHL UI> unless the family asks for the older kids class, then use Kids 7-14 BJJ calendarId <calendarId - fill from GHL UI>.
If under age 3, do not book, explain the youngest program is Kids 3-6 Fun Jitsu, suggest calling 805-744-5449, then stop responding.
Ages 15-17 have no kids calendar; use Adult Gi BJJ calendarId <calendarId - fill from GHL UI> (age 14 continues under Kids 7-14 BJJ above).
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Gi BJJ calendarId <calendarId - fill from GHL UI> unless they explicitly asked for No-Gi, Advanced, All Levels, Muay Thai, or MMA, then use Adult No-Gi BJJ calendarId <calendarId - fill from GHL UI>, Adult Advanced BJJ calendarId <calendarId - fill from GHL UI>, Adult All Levels BJJ calendarId <calendarId - fill from GHL UI>, Adult Muay Thai calendarId <calendarId - fill from GHL UI>, or Adult Mixed Martial Arts calendarId <calendarId - fill from GHL UI>. Children age 3-6 use Kids 3-6 Fun Jitsu calendarId <calendarId - fill from GHL UI>. Children age 6-9 use Kids 6-9 BJJ calendarId <calendarId - fill from GHL UI>, and children age 10-14 use Kids 7-14 BJJ calendarId <calendarId - fill from GHL UI>; for the overlapping ages 7-9 default to Kids 6-9 BJJ calendarId <calendarId - fill from GHL UI> unless the family asks for the older kids class. Under age 3, do not book that attendee, explain the youngest program is Kids 3-6 Fun Jitsu, and suggest calling 805-744-5449. Ages 15-17 have no kids calendar and use Adult Gi BJJ calendarId <calendarId - fill from GHL UI> (age 14 continues under Kids 7-14 BJJ).
```

## UNMAPPED - review

- Taylor Manning-Drake's Personal Calendar - staff personal calendar, internal only, never a trial target.
