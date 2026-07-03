# Sugoi Submissions - Custom Values Pack

Source ID: src_JPK476A1ODXA5YGB
GHL location: 13FZuBUiLGp1WVpWYz3b
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 sugoi_submissions_kb.txt (CloseBot-attached, vetted)

Review flags:
- KB has no literal phone number ("Call or text: the gym" only, no digits given). Phone is a placeholder `<gym phone - fill>` in both academy_info and the youth value. Get the real number before deploying.
- 7 distinct calendars map to plain "adult" (no age band): one flagship (Adult Fundamentals BJJ) plus six day/time-specific Gi and No-Gi slots. Two of them are identically named "Adults Jiu-Jitsu (Gi) | Mon 6:00 PM" with two different calendar IDs (l50RnmkpX4Ml6yzMfiRO and qXpRZV3D3IDaCs2TwqYr) - looks like a duplicate calendar in GHL, needs cleanup on their end.
- KB describes one youth program, "Kids Jiu-Jitsu (Ages 4-12)," but GHL actually has two separate age bands: 4-8 and Teens 9-15. Used the "Fundamentals" calendar in each band as the default booking ID; the day-specific duplicates in each band (3 more in the 4-8 band, 2 more in the 9-15 band) are not wired into the value below. Confirm with the client whether the bot should route by requested day instead of always defaulting to Fundamentals.
- Ages 16-17 are not covered by any kids or teens calendar (Teens tops out at 15). Routed to the adult default per the rule, but this should be confirmed - a 16 or 17 year old walking in on the adult calendar may need a judgment call from staff.
- Wrestling for Jiu-Jitsu, Mobility & Movement for Jiu-Jitsu, and Open Mat & Competition Rounds each exist as 3 separate calendars with 3 different IDs (same name, different ID every time). All excluded from the booking values below since the KB marks Mat Mobility and Open Mat as not trial-eligible, and Wrestling is a supplementary add-on class, not a standalone trial program. The tripled IDs likely need dedup in GHL.
- Women's Jiu-Jitsu (Gi) has a live calendar but is excluded from the values below per the standard women's-only-goes-to-UNMAPPED rule.

## 1 - academy_info

```
Business Information: Sugoi Submissions is a Brazilian Jiu-Jitsu and grappling academy in Corpus Christi, TX. It is a family-first academy built around a safe, clean, community-driven training environment for adults and kids.

Programs Offered:
- Brazilian Jiu-Jitsu (Gi): adult fundamentals, positional control, submissions, and live training.
- No-Gi Jiu-Jitsu + Wrestling: no-gi grappling blended with wrestling fundamentals, takedowns, and mat control.
- Kids Jiu-Jitsu (Ages 4-12): confidence, discipline, and grappling skill for kids in a family-first setting.
- Women's Only Jiu-Jitsu: a supportive, technical class for women.
- Mat Mobility: mobility and recovery sessions to reduce injury risk and improve movement. Not eligible for the free intro class.
- Open Mat (Gi / No-Gi): open rolling and training rounds with the team. Not eligible for the free intro class.

The first class is free with no commitment required. New students can attend any regularly scheduled class except Open Mat and Mat Mobility, and booking requires at least 24 hours notice. Pricing is not published here - membership plans and rates are discussed with instructors during or after the free trial class, based on each student's goals and schedule. Contact: <gym phone - fill>.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId HDi7QEsiQLBPZa3q7lWw.
Adults Jiu-Jitsu (Gi) | Mon 6:00 PM, calendarId l50RnmkpX4Ml6yzMfiRO.
Adults Jiu-Jitsu (Gi) | Mon 6:00 PM, calendarId qXpRZV3D3IDaCs2TwqYr.
Adults Jiu-Jitsu (Gi - Fundamentals) | Wed 6:00 PM, calendarId XV26rqByLpep4q4JaE2q.
Adults Jiu-Jitsu (Gi) | Thu 6:00 PM, calendarId SrmtHt2zDPAYTLBKhTlM.
Adults Jiu-Jitsu (Gi) | Sat 9:00 AM, calendarId THb6WnYb6rZ71WqZgEiY.
Adults Jiu-Jitsu (No-Gi) | Tue 6:00 PM, calendarId 5RzBFFDCC6lfjvV5kNpi.
Adults default to Adult Fundamentals BJJ calendarId HDi7QEsiQLBPZa3q7lWw unless they explicitly ask for No-Gi, then use Adults Jiu-Jitsu (No-Gi) | Tue 6:00 PM calendarId 5RzBFFDCC6lfjvV5kNpi. If they name a specific day or time instead, match it to the calendar above for that day; for Monday 6:00 PM Gi, use calendarId l50RnmkpX4Ml6yzMfiRO.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-8 Fundamentals Jiu-Jitsu calendarId 9txY0SGOngIPvHeqgfEv for age 4-8.
Use Teens 9-15 Fundamentals Jiu-Jitsu calendarId ERl4iddht0BH08ViscJM for age 9-15.
If under age 4, do not book, explain the youngest program is Kids Jiu-Jitsu (Ages 4-8), suggest calling <gym phone - fill>, then stop responding.
For age 14-15, use Teens 9-15 Fundamentals Jiu-Jitsu calendarId ERl4iddht0BH08ViscJM. For age 16-17, no kids or teens calendar covers this range, so use Adult Fundamentals BJJ calendarId HDi7QEsiQLBPZa3q7lWw.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId HDi7QEsiQLBPZa3q7lWw unless they explicitly ask for No-Gi, then use Adults Jiu-Jitsu (No-Gi) | Tue 6:00 PM calendarId 5RzBFFDCC6lfjvV5kNpi. After saving contact youth_birthday, calculate age. Use Kids 4-8 Fundamentals Jiu-Jitsu calendarId 9txY0SGOngIPvHeqgfEv for age 4-8. Use Teens 9-15 Fundamentals Jiu-Jitsu calendarId ERl4iddht0BH08ViscJM for age 9-15. If under age 4, do not book, explain the youngest program is Kids Jiu-Jitsu (Ages 4-8), suggest calling <gym phone - fill>, then stop responding. For age 14-15, use Teens 9-15 Fundamentals Jiu-Jitsu calendarId ERl4iddht0BH08ViscJM. For age 16-17, use Adult Fundamentals BJJ calendarId HDi7QEsiQLBPZa3q7lWw.
```

## UNMAPPED - review

- Mobility & Movement for Jiu-Jitsu | Fri 7:00 PM, calendarId 4s04b1Gbb0i2YAIaDJWL (non-trial per KB)
- Mobility & Movement for Jiu-Jitsu | Fri 7:00 PM, calendarId Q09UnCiZA8BppguKZAYh (duplicate)
- Mobility & Movement for Jiu-Jitsu | Fri 7:00 PM, calendarId qCmdqkbkzifHhHtK3ffF (duplicate)
- Wrestling for Jiu-Jitsu | Tue 7:00 PM, calendarId 5w7o3wyI9hnOO50x8ZMj (supplementary, non-trial)
- Wrestling for Jiu-Jitsu | Tue 7:00 PM, calendarId 70GuDvy2tUyu8MYIgq4S (duplicate)
- Wrestling for Jiu-Jitsu | Tue 7:00 PM, calendarId y8OR896e2Rt4TD4aKL7p (duplicate)
- Open Mat & Competition Rounds | Sat 10:00 AM, calendarId ET6zon1A5fwAJ6muzu5g (open mat / competition, non-trial)
- Open Mat & Competition Rounds | Sat 10:00 AM, calendarId TQsPR5krGMVTBliXh9bz (duplicate)
- Open Mat & Competition Rounds | Sat 10:00 AM, calendarId gHhKGa0lNdBsnt46lBgN (duplicate)
- Women's Jiu-Jitsu (Gi) | Fri 6:00 PM, calendarId taZe8y9cM82ZinaS7uoh (women's-only)
- Teens Jiu-Jitsu (Ages 9-15) | Mon 7:00 PM, calendarId 3JcxUKNU37BVluWVGFU0 (day-specific duplicate of the 9-15 band, not used as the value default)
- Teens Jiu-Jitsu (Ages 9-15) | Thu 7:00 PM, calendarId bGPOWC8F9yYonE6vD60u (day-specific duplicate of the 9-15 band, not used as the value default)
- Kids Jiu-Jitsu (Ages 4-8) | Fri 5:15 PM, calendarId mLelxEPQoygJOffXnKzr (day-specific duplicate of the 4-8 band, not used as the value default)
- Kids Jiu-Jitsu (Ages 4-8) | Mon 5:15 PM, calendarId nee31AwjPdhW79JguU98 (day-specific duplicate of the 4-8 band, not used as the value default)
- Kids Jiu-Jitsu (Ages 4-8) | Wed 5:15 PM, calendarId xpMiU0QOubieUsFYq4nF (day-specific duplicate of the 4-8 band, not used as the value default)
