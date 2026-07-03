# Champion Martial Arts and Fitness - Custom Values Pack

Source ID: src_EJODL02HM128RGZH
GHL location: ffkMyOy6QOwqrvn4OvoK
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 Champion_Martial_Arts_CloseBot_KB_v1_1_0.txt (CloseBot-attached, vetted)
Review flags:
- Phone number is not present anywhere in the vetted KB text (only address and website are given). academy_info and the youth/multiple "call the gym" lines use the placeholder `<gym phone - fill>` - get the real number confirmed and add it before deploy.
- The KB text opens with a canonical override note (dated 2026-05-21, Bobby): Youth Judo ages 5-12, Youth Jiu-Jitsu ages 7-12, Adult Judo ages 13+, Adult Brazilian Jiu-Jitsu ages 13+, and "we no longer offer Karate or Strength & Conditioning." This contradicts the KB body (Section 4), which still lists Shotokan Karate and gives different age minimums (BJJ 12+, Judo 5+). The override was treated as authoritative here since it is explicitly labeled canonical, is the more recent instruction, and matches the gym record exactly - only 4 calendars exist (Adult Judo, Youth Jiu-Jitsu, Adult BJJ, Youth Judo), with no Karate calendar at all. Shotokan/Karate content was dropped from academy_info as a result. Confirm with Bobby that this is still current.
- Two adult calendars exist (Adult Judo, Adult Brazilian Jiu-Jitsu) with no calendar-side default stated. Defaulted to Adult Brazilian Jiu-Jitsu, since the KB's own numbered program list (Section 4) presents it as item 1 (Judo is item 3, after Karate was removed from the list). Flagging since this is the first gym with two co-equal adult calendars and no explicit default rule existed before this build - confirm the choice.
- Youth age bands overlap: Youth Judo covers ages 5-12 and Youth Jiu-Jitsu covers ages 7-12, so ages 7-12 fall in both, split by discipline rather than by age. Routed by asking the lead which discipline the child wants when the child is 7-12. Flagging since the standard youth-band template assumes non-overlapping bands.
- A previous version of this pack sourced the phone number and youth age bands from the deployed bot KDL rather than the KB. That data is not in the vetted KB text and has been dropped from this rebuild per the current rule that the KB is the only allowed academy_info source.

## 1 - academy_info

```
Business Information: Champion Martial Arts and Fitness is a martial arts academy in Pasadena, TX. The academy trains students in Judo and Brazilian Jiu-Jitsu across youth and adult programs in an 8,000 sq ft facility.

Programs Offered:
- Youth Judo (ages 5-12): kids Judo class taught by USA Judo registered instructors.
- Youth Jiu-Jitsu (ages 7-12): kids Brazilian Jiu-Jitsu class.
- Adult Judo (ages 13+): Judo class taught by USA Judo registered instructors, recreational and competitive tracks.
- Adult Brazilian Jiu-Jitsu (ages 13+): Carlson Gracie BJJ lineage, recreational and competitive tracks.

Champion Martial Arts offers a free trial to new students. Pricing is not published; pricing and membership options are discussed with instructors during or after the free trial class based on training goals and class frequency.

Phone: <gym phone - fill> (not listed in the vetted KB)
```

## 2 - adult

```
Adult Brazilian Jiu-Jitsu, calendarId JmUzoadMqyHXNCncJJRu.
Adult Judo, calendarId G57e8ocnwCA6uEdo0h1q.
Adults default to Adult Brazilian Jiu-Jitsu calendarId JmUzoadMqyHXNCncJJRu unless they explicitly ask for Adult Judo, then use Adult Judo calendarId G57e8ocnwCA6uEdo0h1q.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Youth Judo calendarId SgP4SBEaw92iNA6sQtxa for age 5-12.
Use Youth Jiu-Jitsu calendarId HbwXZCkFyizUYjKr5lqx for age 7-12.
Ages 7-12 are covered by both Youth Judo and Youth Jiu-Jitsu, which are different disciplines, not different age bands - ask which discipline the child wants and route to the matching calendar.
If under age 5, do not book, explain the youngest program is Youth Judo, suggest calling <gym phone - fill>, then stop responding.
Adult programs start at age 13, so ages 13-17 route straight to the adult calendars: default Adult Brazilian Jiu-Jitsu calendarId JmUzoadMqyHXNCncJJRu unless they explicitly ask for Adult Judo, then use Adult Judo calendarId G57e8ocnwCA6uEdo0h1q.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Brazilian Jiu-Jitsu calendarId JmUzoadMqyHXNCncJJRu unless they explicitly ask for Adult Judo, then use Adult Judo calendarId G57e8ocnwCA6uEdo0h1q. After saving each youth attendee's youth_birthday, calculate age: use Youth Judo calendarId SgP4SBEaw92iNA6sQtxa for age 5-12, or Youth Jiu-Jitsu calendarId HbwXZCkFyizUYjKr5lqx for age 7-12 (ages 7-12 overlap between the two disciplines - ask which discipline that attendee wants). If any attendee is under age 5, do not book that attendee, explain the youngest program is Youth Judo, suggest calling <gym phone - fill>, then stop responding for that attendee. Ages 13-17 route straight to the adult calendars using the same adult default rule above.
```
