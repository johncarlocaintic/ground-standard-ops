# Ray Longo's MMA - Custom Values Pack

Source ID: src_XM58ZT2N3E8A1UDT
GHL location: MPmczU9WX0pOwJwZGEff
Calendar IDs: VERIFIED-LIVE
academy_info source: ray_longos_mma_kb_v1.2.2.txt (CloseBot-attached, vetted)
Review flags:
- Phone number missing from the KB. The v1.2.2 changelog claims "Phone and Email now confirmed," but no phone or email value actually appears in Business Information or in Appendix Item 1 (only the website got resolved there). Used the literal placeholder `<gym phone - fill>` below - needs a real number confirmed against this KB (a phone number exists in an earlier version of this custom-values file but it is not sourced from the current vetted KB text, so it was dropped here per sourcing rule).
- No youth calendar covers ages 13-17 (Youth 4-6 and Youth 7-12 are the only two bands). Routed ages 13-17 to Adult Intro to Mixed Martial Arts as the closest beginner-friendly adult option. This is an assumption, not stated in the KB - confirm with client before relying on it.
- Kickboxing Drills and Sparring appear in the KB's program list but have no matching calendar in the gym record. Marked "Not bookable online" in academy_info. Sparring is also Members Only per the KB, so it should never be offered to a prospect anyway.

## 1 - academy_info

```
Business Information: Ray Longo's MMA is a mixed martial arts academy in Garden City, New York, training students of all levels from beginner intro classes through advanced sessions.

Programs Offered:
- MMA (Mixed Martial Arts): full mixed martial arts training, open to new students at the intro level.
- Kickboxing: offered at multiple times through the week, open to new students.
- Kickboxing Drills: technique-focused drills session, open to new students. Not bookable online.
- Boxing / Introductory Boxing: boxing training for new and beginner students.
- Brazilian Jiu-Jitsu (Gi): traditional BJJ training with the gi.
- Brazilian Jiu-Jitsu (No-Gi): BJJ training without the gi, offered multiple times weekly.
- Sparring: advanced session, members only. Not bookable online.
- Youth MMA: martial arts training for younger students, offered Monday, Wednesday, and Friday.

New contacts start with an intro class before moving into membership. Pricing is not published here - membership options and pricing are discussed with instructors during or right after the free intro class, based on the student's goals and how many classes a week they want. The intro class is free with no commitment required.
```

## 2 - adult

```
Adult Intro to Mixed Martial Arts, calendarId 81bFEgxMnAsFQYYdcI5d.
Adult Kickboxing, calendarId ByfwxvYu2GUxBnq8vkQX.
Adult Brazilian Jiu-Jitsu, calendarId ECNwYUVxkria28gHCHgw.
Adult No-Gi Brazilian Jiu-Jitsu, calendarId jjnRviO00HolFttyEmwq.
Adult Boxing, calendarId kWCavL0cMP2rY7g2iDad.
Adults default to Adult Intro to Mixed Martial Arts calendarId 81bFEgxMnAsFQYYdcI5d unless they explicitly ask for Kickboxing, Brazilian Jiu-Jitsu, No-Gi Brazilian Jiu-Jitsu, or Boxing, then use that program's calendarId listed above.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Youth 4-6 Martial Arts calendarId 0v5kYtLcKVIAWdkczBG3 for age 4-6.
Use Youth 7-12 Martial Arts calendarId ULSNj8GpMWwQypdL0RQg for age 7-12.
If under age 4, do not book, explain the youngest program is Youth 4-6 Martial Arts, suggest calling <gym phone - fill>, then stop responding.
For age 13-17, no youth calendar covers this range, so use Adult Intro to Mixed Martial Arts calendarId 81bFEgxMnAsFQYYdcI5d.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Intro to Mixed Martial Arts calendarId 81bFEgxMnAsFQYYdcI5d unless they explicitly ask for Kickboxing calendarId ByfwxvYu2GUxBnq8vkQX, Brazilian Jiu-Jitsu calendarId ECNwYUVxkria28gHCHgw, No-Gi Brazilian Jiu-Jitsu calendarId jjnRviO00HolFttyEmwq, or Boxing calendarId kWCavL0cMP2rY7g2iDad. After saving each youth attendee's youth_birthday, calculate age. Use Youth 4-6 Martial Arts calendarId 0v5kYtLcKVIAWdkczBG3 for age 4-6. Use Youth 7-12 Martial Arts calendarId ULSNj8GpMWwQypdL0RQg for age 7-12. If any attendee is under age 4, do not book that attendee, explain the youngest program is Youth 4-6 Martial Arts, suggest calling <gym phone - fill>, then stop responding for that attendee. For attendees age 13-17, no youth calendar covers this range, so use Adult Intro to Mixed Martial Arts calendarId 81bFEgxMnAsFQYYdcI5d.
```
