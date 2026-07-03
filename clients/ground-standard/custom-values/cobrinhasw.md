# Cobrinha Southwest - Custom Values Pack

Source ID: src_5CYE17SU5GEX2DYV
GHL location: S2jwCVmB5BFUKw19Gsqn
Calendar IDs: VERIFIED-LIVE
academy_info: BLOCKED

Review flags:
- academy_info is BLOCKED - the ClickUp page (clickup-kb/cobrinha-southwest-las-vegas.md) is image-only, no usable text beyond a street address. Get program/age/schedule facts from Bobby before this bot ships.
- No phone number exists anywhere in the ClickUp source. Placeholder token used everywhere a phone number is needed.
- Two adult calendars (Adult Brazilian Jiu-Jitsu, Adult Muay Thai). Defaulted primary to Adult Brazilian Jiu-Jitsu (matches the academy's BJJ-brand name). Confirm this is the intended default.
- Two kids calendars share the 7-13 age band, split by discipline (Kids 7-13 BJJ, Kids 7-13 Muay Thai Kickboxing). Defaulted to the BJJ calendar to match the adult default. Confirm this is the intended default.
- No adult calendar is explicitly marked "beginner" or "fundamentals" for a 14-17 fallback route. Used the adult default (Adult Brazilian Jiu-Jitsu) as the 14-17 route. Confirm.

## 1 - academy_info

```
BLOCKED - no usable academy_info source (ClickUp page is image-only or missing). Get program/age/schedule details from Bobby, then fill this.
```

## 2 - adult

```
Adult Brazilian Jiu-Jitsu, calendarId MDpeuNxJg912s8QfCdec.
Adult Muay Thai, calendarId dX0kDgNH8ifZfcQgOb7I.
Adults default to Adult Brazilian Jiu-Jitsu calendarId MDpeuNxJg912s8QfCdec unless they explicitly ask for Adult Muay Thai, then use Adult Muay Thai calendarId dX0kDgNH8ifZfcQgOb7I.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 3-6 BJJ calendarId PlY5tkoEGYpdsBFshaOB for age 3-6.
For age 7-13, default to Kids 7-13 BJJ calendarId r3yhoibYwzWXvb81upAq unless they explicitly ask for Muay Thai Kickboxing, then use Kids 7-13 Muay Thai Kickboxing calendarId dKbbd1PBbVHFMo1HFq3Y.
If under age 3, do not book, explain the youngest program is Kids 3-6 BJJ, suggest calling <gym phone - fill>, then stop responding.
No kids calendar covers ages 14-17. Route 14-17 to the adult default, Adult Brazilian Jiu-Jitsu calendarId MDpeuNxJg912s8QfCdec.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Brazilian Jiu-Jitsu calendarId MDpeuNxJg912s8QfCdec unless they explicitly ask for Adult Muay Thai, then use Adult Muay Thai calendarId dX0kDgNH8ifZfcQgOb7I. After saving each youth attendee's youth_birthday, calculate age: use Kids 3-6 BJJ calendarId PlY5tkoEGYpdsBFshaOB for age 3-6; for age 7-13, default to Kids 7-13 BJJ calendarId r3yhoibYwzWXvb81upAq unless they explicitly ask for Muay Thai Kickboxing, then use Kids 7-13 Muay Thai Kickboxing calendarId dKbbd1PBbVHFMo1HFq3Y. If an attendee is under age 3, do not book that attendee, explain the youngest program is Kids 3-6 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. Route any attendee aged 14-17 to the adult default, Adult Brazilian Jiu-Jitsu calendarId MDpeuNxJg912s8QfCdec.
```
