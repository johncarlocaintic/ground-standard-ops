# Inverted Gear Academy - Custom Values Pack

Source ID: src_O7P37VWAEHPFNCQ5
GHL location: ajf9RVwQJUGwU900yGEq
Calendar IDs: VERIFIED-LIVE
academy_info source: Inverted Gear Academy KB.3.txt (CloseBot-attached, vetted)

Review flags:
- KB has no phone number anywhere in the text. academy_info and the youth calendar block use `<gym phone - fill>` as a placeholder. Get the real number from the client before deploy.
- 3 calendars are staff personal calendars (Taylor Manning-Drake's, JC Caintic's, GS SEO's Personal Calendar) - excluded from adult/youth/multiple, listed under UNMAPPED.
- Advanced (Gi, No-Gi, Saturday) and Ladies-Only classes exist in the KB but have no dedicated GHL calendar - marked "Not bookable online" in academy_info.
- Age 13 falls in a gap between the Juniors band (7-12) and the 14-17 adult route. Defaulted to Juniors 7-12 until the client confirms the correct placement - flagged below and in the youth block.

## 1 - academy_info

```
Business Information: Inverted Gear Academy is a Brazilian Jiu-Jitsu academy in Bethlehem, PA, offering fundamental and advanced BJJ training for adults and kids through constraint-led drills, positional games, and controlled sparring. Phone: <gym phone - fill>.

Programs Offered:
- Fundamentals BJJ (adult, all levels): daily drill-and-games class covering core BJJ fundamentals.
- Advanced BJJ (Gi and No-Gi): builds on fundamentals with sparring for experienced students. Not bookable online.
- Ladies-Only BJJ: women's class held Saturday mornings. Not bookable online.
- Juniors BJJ (ages 7-12): kids class held on weekdays.
- Cubs BJJ (ages 4-6): kids class held on weekdays.

A free trial class is available with no commitment, one trial per person, and trial students attend a regular scheduled class. Pricing is not published here. Specific membership pricing is discussed with instructors during or after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId 2ePcQUWj9vMYsVxjBAi9.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Cubs 4-6 BJJ calendarId d0BgipZ6s6H9VnLFDnKr for age 4-6.
Use Juniors 7-12 BJJ calendarId B3K3EDv4UGNVuN30kHLD for age 7-12.
If under age 4, do not book, explain the youngest program is Cubs BJJ (ages 4-6), suggest calling <gym phone - fill>, then stop responding.
Age 13 is not covered by the Juniors band (7-12) or the adult 14-17 route. Until confirmed with the client, treat age 13 as Juniors 7-12 calendarId B3K3EDv4UGNVuN30kHLD.
For ages 14-17, use Adult Fundamentals BJJ calendarId 2ePcQUWj9vMYsVxjBAi9.
```

## 4 - multiple

```
Book each attendee by their own rules. Adult attendees use Adult Fundamentals BJJ calendarId 2ePcQUWj9vMYsVxjBAi9. After saving each youth attendee's birthday, calculate age: use Cubs 4-6 BJJ calendarId d0BgipZ6s6H9VnLFDnKr for age 4-6, use Juniors 7-12 BJJ calendarId B3K3EDv4UGNVuN30kHLD for age 7-12, treat age 13 as Juniors 7-12 calendarId B3K3EDv4UGNVuN30kHLD until confirmed with the client, and use Adult Fundamentals BJJ calendarId 2ePcQUWj9vMYsVxjBAi9 for ages 14-17. If any youth attendee is under age 4, do not book that attendee, explain the youngest program is Cubs BJJ (ages 4-6), suggest calling <gym phone - fill>, and stop responding for that attendee.
```

## UNMAPPED - review

- Taylor Manning-Drake's Personal Calendar, calendarId 0EqbxE7IzBLS5xSt4x6E - staff personal calendar, not a program.
- JC Caintic's Personal Calendar, calendarId T71rxUdgtjilE1G6t88X - staff personal calendar, not a program.
- GS SEO's Personal Calendar, calendarId pEFncqXKVdaZXWqYvIFJ - internal SEO calendar, not a program.
