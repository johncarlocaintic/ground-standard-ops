# Verde Valley Brazilian Jiu Jitsu - Custom Values Pack

Source ID: src_K47SOW2TNDCLOE1Q
GHL location: flLWRNAOKZ1nVdaMA9oW
Calendar IDs: VERIFIED-LIVE
academy_info: BLOCKED

Review flags:
- academy_info has no usable source. ClickUp page is image-only (32 text chars, 1 image, schedule/pricing only live on verdevalleybjj.com and the ZenPlanner calendar). Get program, age band, and schedule facts straight from Bobby before filling section 1.
- No gym phone number available anywhere in the ClickUp source. Used the placeholder `<gym phone - fill>` in the under-5 guard in sections 3 and 4.
- 3 adult calendars exist (Adult Fundamentals BJJ, Adult Muay Thai, Adult Kickboxing). Picked Adult Fundamentals BJJ as the default since it is the base BJJ program, but this is an assumption, not confirmed by Bobby - flag before go-live.
- Kids calendars only run 5-13. Ages 14-17 have no dedicated calendar, so routed to the adult beginner calendar (Adult Fundamentals BJJ). Confirm this is the right landing spot for teens.

## 1 - academy_info
```
BLOCKED - no usable academy_info source (ClickUp page is image-only or missing). Get program/age/schedule details from Bobby, then fill this.
```

## 2 - adult
```
Adult Fundamentals BJJ, calendarId 0wHTbqcgHxHKvX6H9geM
Adult Muay Thai, calendarId R0htT7PehTZlDnvnMSL5
Adult Kickboxing, calendarId zc0Ll3m4Yh6Y6tMYaxCV
Adults default to Adult Fundamentals BJJ calendarId 0wHTbqcgHxHKvX6H9geM unless they explicitly ask for Adult Muay Thai calendarId R0htT7PehTZlDnvnMSL5 or Adult Kickboxing calendarId zc0Ll3m4Yh6Y6tMYaxCV.
```

## 3 - youth
```
After saving contact youth_birthday, calculate age.
Use Kids 5-7 BJJ calendarId 3VJURtbAc0td3yR4GXz3 for age 5-7.
Use Kids 8-13 BJJ calendarId NVk7zlwyhqQNHvJ9dRCy for age 8-13.
If under 5, this program does not take students that young yet - refer to <gym phone - fill>.
For ages 14-17, use Adult Fundamentals BJJ calendarId 0wHTbqcgHxHKvX6H9geM, since no kids calendar covers that age band.
```

## 4 - multiple
```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId 0wHTbqcgHxHKvX6H9geM unless they explicitly ask for Adult Muay Thai calendarId R0htT7PehTZlDnvnMSL5 or Adult Kickboxing calendarId zc0Ll3m4Yh6Y6tMYaxCV. For kids age 5-7, use Kids 5-7 BJJ calendarId 3VJURtbAc0td3yR4GXz3. For kids age 8-13, use Kids 8-13 BJJ calendarId NVk7zlwyhqQNHvJ9dRCy. If under 5, refer to <gym phone - fill>. For ages 14-17, use Adult Fundamentals BJJ calendarId 0wHTbqcgHxHKvX6H9geM.
```
