# Centerline Jiu-Jitsu Chandler - Custom Values Pack

Source ID: src_QST1SHU18MPOOHEH
GHL location: UWo67lKtFJYZCJ8LkD3O
Calendar IDs: VERIFIED-LIVE
academy_info source: centerlinejiujitsu_kb_v1.0.0.txt (CloseBot-attached, vetted)
Review flags:
- Phone number is not present anywhere in the vetted KB text. A previous version of this pack listed (480) 756-2323 sourced from ClickUp, but that number is not in the CloseBot-attached KB, which is the only allowed source for academy_info facts under the current build rule. academy_info and the youth/multiple "call the gym" lines now use the placeholder `<gym phone - fill>` - get the real number confirmed and re-add it before deploy.
- Program-to-calendar mapping for Pre-School/Kids/Youth BJJ is inferred from age progression (Pre-School = youngest, Kids = next, Youth = oldest) since the KB's program names do not literally match the GHL calendar names (Kids 3-4, Kids 5-7, Kids 8-13). Confirm this pairing before treating it as canon.
- Adult Women's Only Jiu-Jitsu has a live GHL calendar but is categorized UNMAPPED under the women's-only rule and excluded from the bookable adult value, and is marked "Not bookable online" in academy_info for the same reason. (A previous version of this pack folded it into the adult default/explicit-ask rule - that no longer applies under the current categorization rule.)
- The 14-17 age band has no dedicated kids calendar (oldest kids band tops out at 13), so it routes to the Adult Fundamentals BJJ calendar per the default rule.

## 1 - academy_info

```
Business Information: Centerline Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Chandler, Arizona. The academy offers BJJ programs for all ages, from pre-school children to adults, across beginner, intermediate, advanced, and competition tracks.

Programs Offered:
- Adult BJJ (All Levels Co-Ed, Beginner-Intermediate, Intermediate-Advanced): open-level and structured adult classes, all experience levels welcome.
- Women's Only Jiu-Jitsu: all levels welcome. Not bookable online.
- Pre-School Jiu-Jitsu: BJJ for the youngest children.
- Kids BJJ: BJJ for younger children.
- Youth BJJ: BJJ for older children and teens.
- Black Belt Club / Advanced Youth: advanced training for youth students. Not bookable online.
- Competition Class: training for students pursuing competition. Not bookable online.

A free trial class is available for new students. New students join a regular class directly on their first visit, there are no separate intro-only sessions. Membership pricing is not published; pricing is discussed with new students during or right after the free trial class, based on program fit.

Phone: <gym phone - fill> (not listed in the vetted KB)
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId 6GgOZ3Fw1Eru9aEM4V6R.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 3-4 BJJ calendarId trznGNLODaoyw4ReGMQy for age 3-4.
Use Kids 5-7 BJJ calendarId HukJUft8a0vg85EOyZeI for age 5-7.
Use Kids 8-13 BJJ calendarId rLSTJLC2nbbn84HAXbml for age 8-13.
If under age 3, do not book, explain the youngest program is Kids 3-4 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 14-17, use Adult Fundamentals BJJ calendarId 6GgOZ3Fw1Eru9aEM4V6R.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId 6GgOZ3Fw1Eru9aEM4V6R. After saving each child's youth_birthday, calculate age: use Kids 3-4 BJJ calendarId trznGNLODaoyw4ReGMQy for age 3-4, use Kids 5-7 BJJ calendarId HukJUft8a0vg85EOyZeI for age 5-7, use Kids 8-13 BJJ calendarId rLSTJLC2nbbn84HAXbml for age 8-13. If any child is under age 3, do not book that child, explain the youngest program is Kids 3-4 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. For age 14-17, use Adult Fundamentals BJJ calendarId 6GgOZ3Fw1Eru9aEM4V6R.
```

## UNMAPPED - review

- Adult Women's Only Jiu-Jitsu, calendarId HE9KhI3OHci7Ct8DcHXo (women's-only, excluded from booking values)
