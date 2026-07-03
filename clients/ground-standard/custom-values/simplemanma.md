# Simple Man Martial Arts - Custom Values Pack

Source ID: src_XZH7NHD2M8NF0EQL
GHL location: aKQzZVFXhecYncsbvsOH
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 SimplMan_Martial_Arts_Consolidated_Knowledge_Base_v1_1_0.txt (CloseBot-attached, vetted)

Review flags:
- KB has no phone number for this gym (owner and gym phone were excluded per the KB's own sensitive-information check). Used the literal token `<gym phone - fill>` everywhere a phone is needed. Get the real number before this pack goes live.
- "Youth 7-17 Wrestling" (calendarId Uav8SaATEF0cTcZ5Lli5) is a different discipline than the BJJ kids programs and its age range overlaps both youth BJJ calendars. Age alone can't tell a bot whether a family wants BJJ or Wrestling, so it is left UNMAPPED and excluded from the youth/multiple routing below.
- Two youth BJJ calendars overlap: "Youth 4-12 BJJ" and "Youth 9-12 BJJ" both cover ages 9-12. Assumed the split is 4-8 on the 4-12 calendar and 9-12 on the 9-12 calendar (the more specific one wins). Confirm this split in the GHL UI before launch.
- Age 13 falls in a gap: kids BJJ calendars top out at 12, and the standard 14-17 fallback rule doesn't mention 13. Extended the adult-fundamentals fallback down to cover 13-17. Flag for confirmation.
- The KB says the Kids Program is "coming soon" and "not currently active," but the GHL record already has two live Youth BJJ calendars. That's a conflict between the vetted KB and the live calendar data. Needs client confirmation on whether kids booking should actually be live.

## 1 - academy_info

```
Business Information: Simple Man Martial Arts is a No-Gi Brazilian Jiu-Jitsu academy in Austin, TX, affiliated with B-Team JJ and led by world-class competitors in a family-first, inclusive training environment.

Programs Offered:
- All-Level No-Gi Jiu-Jitsu: open to all skill levels, covers both fundamental and advanced concepts.
- Fundamental No-Gi: the recommended starting point for beginners, runs Monday through Friday at 6:00 PM.
- Pro Class (Advanced): invitation-based, limited to advanced students, requires a mat fee that is not covered by the free trial offer. Not bookable online.
- Wrestling: runs Friday evenings, open to members.
- Community Open Mat (Sunday): open to members and grapplers from other gyms, no affiliation required. Not bookable online.
- Kids Program: in development per the current KB, will be coached by Anthony Salvatore, not yet active. Not bookable online.
- Women's Only Classes: planned for the future, not yet active. Not bookable online.
- Private Lessons: available, rate set individually by each instructor. Not bookable online.

A free trial class is available for all programs except the Pro Class, which requires a mat fee not covered by the trial offer. Membership pricing is not published; instructors discuss pricing and program fit during or after the free trial class.
```

## 2 - adult

```
Adult All Levels BJJ, calendarId BCTZsRG4rfYKJelmvYj7
Adult Fundamentals BJJ, calendarId q23lf3m5qdJKpk3L3nB0
Adults default to Adult Fundamentals BJJ calendarId q23lf3m5qdJKpk3L3nB0 unless they explicitly ask for Adult All Levels BJJ, then use Adult All Levels BJJ calendarId BCTZsRG4rfYKJelmvYj7.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Youth 4-12 BJJ calendarId aTPMDz4APpqhvGW6Dj2L for age 4-8.
Use Youth 9-12 BJJ calendarId 5rFjXTmY6T0Tg5bjcaaw for age 9-12.
If under age 4, do not book, explain the youngest program is Youth 4-12 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 13-17, no kids BJJ calendar covers this range, use Adult Fundamentals BJJ calendarId q23lf3m5qdJKpk3L3nB0.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId q23lf3m5qdJKpk3L3nB0 unless they explicitly ask for Adult All Levels BJJ, then use Adult All Levels BJJ calendarId BCTZsRG4rfYKJelmvYj7. For each youth attendee, after saving their youth_birthday, calculate age: use Youth 4-12 BJJ calendarId aTPMDz4APpqhvGW6Dj2L for age 4-8, use Youth 9-12 BJJ calendarId 5rFjXTmY6T0Tg5bjcaaw for age 9-12, and for ages 13-17 use Adult Fundamentals BJJ calendarId q23lf3m5qdJKpk3L3nB0. If any attendee is under age 4, do not book that attendee, explain the youngest program is Youth 4-12 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee only.
```

## UNMAPPED - review

- Youth 7-17 Wrestling, calendarId Uav8SaATEF0cTcZ5Lli5 - non-BJJ youth program, age range overlaps both youth BJJ calendars, cannot be routed by age alone. Excluded from adult/youth/multiple values.
