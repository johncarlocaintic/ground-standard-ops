# The Academy Eden Prairie - Custom Values Pack

Source ID: src_OJO9E23V1JJSRJLN
GHL location: YzynD9APfmv7ed8RIk3K
Calendar IDs: VERIFIED-LIVE
academy_info source: academyedenprairie_kb_v1.0.0.txt (CloseBot-attached, vetted)
Review flags:
- Phone number is not present in the vetted KB text (gs_attached_kb.json), which is the only allowed source for this pack. Youth/multiple blocks below use the placeholder `<gym phone - fill>`. Note: an older version of this pack (previously at this path) listed 952-377-8111 sourced from a separate verification doc not in scope here - confirm that number against GHL/the live website before using it, then replace the placeholder.
- Two adult calendars exist (BJJ and Muay Thai) with no signal in the KB for which is primary. Defaulted adult routing to Adult Fundamentals BJJ - confirm with client if Muay Thai should be the default instead.
- Kids calendars stop at age 12 (bands are 4-7 and 8-12), so there is no dedicated 13-17 kids calendar. This pack routes 13-17 to the adult BJJ calendar per the standard teen-gap rule - confirm this is acceptable for younger teens (13) specifically, since the older pack version instead treated 13-17 as fully non-bookable pending gym confirmation.

## 1 - academy_info

```
Business Information: The Academy Eden Prairie is a multi-discipline martial arts academy in Edina, MN (southwest Minneapolis metro area), offering Muay Thai, Gi Jiu-Jitsu, No-Gi Jiu-Jitsu, MMA, and Kids Martial Arts programs for ages 4 through adult.

Programs Offered:
- Kids Martial Arts Ages 4-7 (Gi and No-Gi Jiu-Jitsu): foundational class for the youngest students.
- Kids Martial Arts Ages 8-12 (Gi and No-Gi Jiu-Jitsu): foundational class for older kids.
- Gi Jiu-Jitsu, Adult (Foundations and All Levels tracks): traditional kimono-based grappling.
- No-Gi Jiu-Jitsu, Adult (Foundations, All Levels, Mixed Levels, Open Mat): grappling without a kimono.
- Muay Thai, Adult (Foundations, All Levels, Mixed Levels, Sparring): striking-based martial art.
- Women's Only No-Gi Jiu-Jitsu (Thursdays 6:30-7:30 PM): dedicated class for women, no experience required. Not bookable online.
- MMA (advanced/invite-only, minimum 2 months training required): combines grappling and striking. Not bookable online.

A free trial class is available with no commitment required. Membership pricing is not published; instructors discuss pricing and program fit directly with each student during or after the free trial class.
```

## 2 - adult

```
Adult Fundamentals Muay Thai, calendarId p48GI5EsZTeUACjr4pEp
Adult Fundamentals BJJ, calendarId uq9u3Lqt9ZSODkZ119vm
Adults default to Adult Fundamentals BJJ calendarId uq9u3Lqt9ZSODkZ119vm unless they explicitly ask for Adult Fundamentals Muay Thai, then use Adult Fundamentals Muay Thai calendarId p48GI5EsZTeUACjr4pEp.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-7 BJJ calendarId bwhgiSxA4yYBcDNWA5me for age 4-7.
Use Kids 8-12 BJJ calendarId b8xLd6VXetZhDQT6jdZs for age 8-12.
If under age 4, do not book, explain the youngest program is Kids 4-7 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 13-17, no kids calendar covers this range, so use Adult Fundamentals BJJ calendarId uq9u3Lqt9ZSODkZ119vm.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId uq9u3Lqt9ZSODkZ119vm unless they explicitly ask for Adult Fundamentals Muay Thai, then use Adult Fundamentals Muay Thai calendarId p48GI5EsZTeUACjr4pEp. For youth, after saving each child's youth_birthday, calculate age: use Kids 4-7 BJJ calendarId bwhgiSxA4yYBcDNWA5me for age 4-7, use Kids 8-12 BJJ calendarId b8xLd6VXetZhDQT6jdZs for age 8-12. If a child is under age 4, do not book that child, explain the youngest program is Kids 4-7 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. For age 13-17, no kids calendar covers this range, so use Adult Fundamentals BJJ calendarId uq9u3Lqt9ZSODkZ119vm.
```
