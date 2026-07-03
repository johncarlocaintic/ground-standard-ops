# Granite Bay Jiu-Jitsu - Custom Values Pack

Source ID: src_TRYQUFQOZOWQ6KX7
GHL location: Y1HpU2tGL4AVGzladJEs
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/granite-bay-jj.md
Review flags:
- Only one adult calendar (Adult BJJ) exists, so there is no default-selection call to make there.
- Striking privates (kickboxing/Muay Thai) are mentioned in the ClickUp page but have no matching calendar in the record. Marked "Not bookable online" in section 1 and left out of the booking sections below.
- No calendar covers ages 14-17. Routed 14-17 to the adult calendar (Adult BJJ) per rule, since there is no separate "beginner" adult calendar to send them to instead.
- The ClickUp page's "new summer schedule" note (4:15/5:00/5:45/6:30 time slots, ages 4-6/7-9/10-15/16+) describes class times, not calendar age bands. Used the GHL calendar names (4-5, 6-8, 9-13) as the source of truth for age routing instead of the schedule note.
- All membership pricing, the family-discount amount, the guest gift-card amount, and the drop-in fee from the ClickUp page were stripped per the no-pricing rule. Only the free-trial and human-redirect framing was kept in section 1.

## 1 - academy_info

```
Business Information: Granite Bay Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Granite Bay, California, located at 9705 Village Center Dr and reachable at 916.587.1411.

Programs Offered:
- Kids 4-5 BJJ: youth grappling class for ages 4-5.
- Kids 6-8 BJJ: youth grappling class for ages 6-8.
- Kids 9-13 BJJ: youth grappling class for ages 9-13.
- Adult BJJ: adult grappling class, gi through fall, winter, and spring, no-gi from June through August.
- Striking privates (kickboxing, Muay Thai): private lessons only, not a group class. Not bookable online.

New students get a free trial week, and Saturday 9 AM class is a free ongoing drop-in open to all levels. Pricing is not published here. Membership cost is discussed at or after the free trial, or a team member can go over it directly.
```

## 2 - adult

```
Adult BJJ, calendarId tuC290WgqL9UJTJW7sn0.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-5 BJJ calendarId 6F8imYCgsbmGuAtx4DpH for age 4-5.
Use Kids 6-8 BJJ calendarId bGAmFzsVi4ourqDmFHjP for age 6-8.
Use Kids 9-13 BJJ calendarId rIXLICxayzBrnLwokl2t for age 9-13.
If under age 4, do not book, explain the youngest program is Kids 4-5 BJJ, suggest calling 916.587.1411, then stop responding.
For age 14-17, no kids calendar covers this range, use Adult BJJ calendarId tuC290WgqL9UJTJW7sn0.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult BJJ calendarId tuC290WgqL9UJTJW7sn0. After saving each youth attendee's youth_birthday, calculate age: use Kids 4-5 BJJ calendarId 6F8imYCgsbmGuAtx4DpH for age 4-5; use Kids 6-8 BJJ calendarId bGAmFzsVi4ourqDmFHjP for age 6-8; use Kids 9-13 BJJ calendarId rIXLICxayzBrnLwokl2t for age 9-13. If an attendee is under age 4, do not book that attendee, explain the youngest program is Kids 4-5 BJJ, suggest calling 916.587.1411, then stop responding for that attendee. Route any attendee aged 14-17 to Adult BJJ calendarId tuC290WgqL9UJTJW7sn0.
```
