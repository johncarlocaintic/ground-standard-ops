# Speak Easy Jiu-Jitsu & Wrestling - Custom Values Pack

- Source ID: src_LEK8GJP7FUD9ZO0Z
- GHL location: Ork0MegEiVAXG63zBibK
- Calendar IDs: VERIFIED-LIVE
- academy_info source: ClickUp - clickup-kb/speakeasy-jiu-jitsu.md
- Review flags:
  - ClickUp text has no phone number anywhere on the page. Used `<gym phone - fill>` in sections 3 and 4 - get the real number from Bobby before this ships.
  - ClickUp text never states kids age bands - the SCHEDULE section is image-only (no OCR text). The 4-6 and 7-13 splits below come from the GHL calendar names in the data record, not from ClickUp prose. Confirm with Bobby these bands are correct.
  - ClickUp text lists pricing (Kids $110, Adults $160). Stripped per no-pricing policy; academy_info below redirects to the free trial instead.
  - Business name includes "& Wrestling" but the ClickUp page has no separate wrestling program description or calendar - noted only in the one-line business description, not as its own program.
  - No website URL anywhere in the ClickUp text. Contact email on file is speakeasybjjavl@gmail.com if useful to Bobby's team, but not added to academy_info since the source gave no instruction to include it there.

## 1 - academy_info

```
Business Information: Speak Easy Jiu-Jitsu & Wrestling is a jiu-jitsu and wrestling academy at 640 Merrimon Ave, Ste 201, Asheville, NC 28804.

Programs Offered:
- Adult Jiu-Jitsu: open to adult students. Bookable online.
- Kids Jiu-Jitsu: open to youth students, split by age group for booking. Bookable online.

A free trial class is available for new students. Membership pricing is not published; pricing is discussed with staff during or after the free trial class.
```

## 2 - adult

```
Adult Jiu-Jitsu, calendarId VTEHGLcqw74Xx9PlSstF.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids Jiu-Jitsu (4-6) calendarId YiWA27v7Uelx64OHUw7n for age 4-6.
Use Kids Jiu-Jitsu (7-13) calendarId ydgCn1aXMbLhyqKPTOXS for age 7-13.
If under age 4, do not book, explain the youngest program is Kids Jiu-Jitsu (4-6), suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 should use Adult Jiu-Jitsu calendarId VTEHGLcqw74Xx9PlSstF (no kids calendar covers these ages).
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Jiu-Jitsu calendarId VTEHGLcqw74Xx9PlSstF. Children age 4-6 use Kids Jiu-Jitsu (4-6) calendarId YiWA27v7Uelx64OHUw7n. Children age 7-13 use Kids Jiu-Jitsu (7-13) calendarId ydgCn1aXMbLhyqKPTOXS. Under age 4 do not book, explain the youngest program is Kids Jiu-Jitsu (4-6), suggest calling <gym phone - fill>, then stop responding for that attendee. Ages 14-17 use Adult Jiu-Jitsu calendarId VTEHGLcqw74Xx9PlSstF (no kids calendar covers these ages).
```
