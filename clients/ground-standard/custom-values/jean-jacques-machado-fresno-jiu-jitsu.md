# Jean Jacques Machado Fresno Jiu-Jitsu - Custom Values Pack

- Source ID: src_MYUPWHRRPEZ7KA7H
- GHL location: y4lPg3Fh8cnigzLgHoQD
- Calendar IDs: VERIFIED-LIVE
- academy_info source: ClickUp - clickup-kb/jean-jacques-machado-fresno.md
- Review flags:
  - ClickUp text has no phone number, only the street address. Used the literal placeholder `<gym phone - fill>` below - get the real number before publishing.
  - Three calendars on this source (Taylor Manning-Drake's Personal Calendar, Aliyah Alanis's Personal Calendar, Saphira Alanis's Personal Calendar) read as staff/instructor personal calendars, not client-bookable programs. Excluded from adult/youth/multiple mapping and listed under UNMAPPED - confirm with Bobby whether any of these should actually be client-facing.
  - No kids calendar covers ages 14-17, so that band routes to Adult Fundamental BJJ per the no-calendar rule.
  - ClickUp text lists a women's self-defense class with no matching calendar - marked "Not bookable online" in academy_info.
  - ClickUp text contains per-week pricing tiers and founding-member terms. Per policy all dollar amounts were stripped from academy_info; pricing is redirected to the free trial conversation instead.

## 1 - academy_info

```
Business Information: Jean Jacques Machado Fresno Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Fresno, California, training under Jean Jacques Machado's black belt lineage for over 24 years.

Programs Offered:
- Adult Fundamental BJJ
- Kids BJJ (ages 4-8)
- Kids BJJ (ages 9-13)
- Women's Self-Defense

ADULT FUNDAMENTAL BJJ
Fundamentals-focused Jiu-Jitsu class for adult students of all skill levels.

KIDS BJJ (AGES 4-8)
Jiu-Jitsu class for young children, capped at 6 students per class.

KIDS BJJ (AGES 9-13)
Jiu-Jitsu class for older kids and pre-teens.

WOMEN'S SELF-DEFENSE
Self-defense class built on practical Jiu-Jitsu skills for women. Not bookable online.

A free trial class is available for new students. Pricing is not published and is discussed with the team during or after the free trial class.
```

## 2 - adult

```
Adult Fundamental BJJ, calendarId N8raBAfnK699oIyhhnvp.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-8 BJJ calendarId 62MhfHHEC7wBjnm7GWOI for age 4-8.
Use Kids 9-13 BJJ calendarId PamSCLFVV2wFKaSOhGox for age 9-13.
If under age 4, do not book, explain the youngest program is Kids 4-8 BJJ, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 should use Adult Fundamental BJJ calendarId N8raBAfnK699oIyhhnvp (no kids calendar covers these ages).
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamental BJJ calendarId N8raBAfnK699oIyhhnvp. Children age 4-8 use Kids 4-8 BJJ calendarId 62MhfHHEC7wBjnm7GWOI. Children age 9-13 use Kids 9-13 BJJ calendarId PamSCLFVV2wFKaSOhGox. Under age 4 do not book, explain the youngest program is Kids 4-8 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. Ages 14-17 use Adult Fundamental BJJ calendarId N8raBAfnK699oIyhhnvp (no kids calendar covers these ages).
```

## UNMAPPED - review

- Taylor Manning-Drake's Personal Calendar, calendarId 2fPLLDmPMTeuCVuGRvPH
- Aliyah Alanis's Personal Calendar, calendarId GFTH5yvEFoqRiMsN5p0Z
- Saphira Alanis's Personal Calendar, calendarId GjgbcyQXDCbNKXGA75hy
