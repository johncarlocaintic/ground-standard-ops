# JitzLab Martial Arts - Custom Values Pack

Source ID: src_SFCOGWZKLSLCYE1C
GHL location: NRmCTqXRSfGz53SSuJGK
Calendar IDs: VERIFIED-LIVE
academy_info: BLOCKED
Review flags:
- No ClickUp page exists for this gym (clickupFile is absent, not just image-only). There is no usable academy_info source. Get program/age/schedule details from Bobby before this pack can be filled in.
- Four adult calendars exist (Adult Brazilian Jiu-Jitsu, Adult All Levels Gi, Adult All Levels No Gi, Adult MMA) and none is named "beginner" or "fundamentals". Defaulted the primary to Adult Brazilian Jiu-Jitsu since it is the only unqualified BJJ program name. Confirm this default with Bobby.
- "Youth MMA" and "Youth Advanced Jiu-Jitsu" have no age band in the calendar name and cannot be placed in the age-based youth routing. Moved to UNMAPPED - confirm the intended age ranges with Bobby.
- "JC Caintic's Personal Calendar" is a staff personal calendar, not a class. Moved to UNMAPPED.
- Kids calendars with usable age bands (Youth Jiu-Jitsu 4-7, Youth Jiu-Jitsu 8-12) leave age 13 uncovered, past the 8-12 band and short of the 14-17 adult-beginner fallback. Left uncovered in the youth block below; flag before booking a 13-year-old lead.
- No phone number is available from any allowed source (no academy_info source). Placeholder `<gym phone - fill>` used everywhere a phone number is needed.

## 1 - academy_info

```
BLOCKED - no usable academy_info source (ClickUp page is image-only or missing). Get program/age/schedule details from Bobby, then fill this.
```

## 2 - adult

```
Adult Brazilian Jiu-Jitsu, calendarId JAnxWMYvVr9zSU0qKDAi.
Adult All Levels Gi, calendarId Z5OABVm0qsJ4S6mcrfUe.
Adult All Levels No Gi, calendarId ULy2RsZhA8wZgKiMWNIq.
Adult MMA, calendarId dHWrgirOkg9gBFdb6SKc.
Adults default to Adult Brazilian Jiu-Jitsu calendarId JAnxWMYvVr9zSU0qKDAi unless they explicitly ask for Adult All Levels Gi, Adult All Levels No Gi, or Adult MMA, then use Adult All Levels Gi calendarId Z5OABVm0qsJ4S6mcrfUe, Adult All Levels No Gi calendarId ULy2RsZhA8wZgKiMWNIq, or Adult MMA calendarId dHWrgirOkg9gBFdb6SKc respectively.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Youth Jiu-Jitsu (4-7) calendarId u91WbqiAkAm6OlonOKJY for age 4-7.
Use Youth Jiu-Jitsu (8-12) calendarId ob2un3GZZ1BquJkBlk2s for age 8-12.
If under age 4, do not book, explain the youngest program is Youth Jiu-Jitsu (4-7), suggest calling <gym phone - fill>, then stop responding.
Age 13 is not covered by any kids calendar. Flag this before booking a 13-year-old and check with Bobby.
For age 14-17, no kids calendar covers this range, use Adult Brazilian Jiu-Jitsu calendarId JAnxWMYvVr9zSU0qKDAi.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Brazilian Jiu-Jitsu calendarId JAnxWMYvVr9zSU0qKDAi unless they explicitly ask for Adult All Levels Gi, Adult All Levels No Gi, or Adult MMA, then use Adult All Levels Gi calendarId Z5OABVm0qsJ4S6mcrfUe, Adult All Levels No Gi calendarId ULy2RsZhA8wZgKiMWNIq, or Adult MMA calendarId dHWrgirOkg9gBFdb6SKc respectively. After saving each youth attendee's youth_birthday, calculate age: use Youth Jiu-Jitsu (4-7) calendarId u91WbqiAkAm6OlonOKJY for age 4-7; use Youth Jiu-Jitsu (8-12) calendarId ob2un3GZZ1BquJkBlk2s for age 8-12. If an attendee is under age 4, do not book that attendee, explain the youngest program is Youth Jiu-Jitsu (4-7), suggest calling <gym phone - fill>, then stop responding for that attendee. Age 13 is not covered by any kids calendar for any attendee at that age; flag before booking. Route any attendee aged 14-17 to the adult default, Adult Brazilian Jiu-Jitsu calendarId JAnxWMYvVr9zSU0qKDAi.
```

## UNMAPPED - review

- Youth MMA, calendarId HSyKX4uh1klUvALFwrvU (no age band in the calendar name, cannot be placed in age-based youth routing without client confirmation)
- Youth Advanced Jiu-Jitsu, calendarId SHb2hrkIPZXJfiOhbmM0 (no age band in the calendar name, appears skill-gated/advanced, likely non-trial)
- JC Caintic's Personal Calendar, calendarId KcwatmjEo6hUaWlF9wFM (staff personal calendar, not a class)
