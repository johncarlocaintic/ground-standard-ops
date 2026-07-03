# Signature of Jiu-Jitsu - Custom Values Pack

Source ID: src_HHSREAS1NVHJMDSR
GHL location: UOoHf3aLtbRc8fc68KiS
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 Signature_of_Jiu-Jitsu_KB.txt (CloseBot-attached, vetted)
Review flags:
- No phone number anywhere in the KB. Youth gate below uses the literal placeholder `<gym phone - fill>` - needs a real number before launch.
- Kids calendars top out at age 14 (Kids 11-14 BJJ). Ages 15-17 have no dedicated kids calendar in this gym's record, so they route to the adult calendar - flagging for review in case a teens band should exist instead.
- Women's Class and Private Lessons are named in the KB but have no matching GHL calendar - marked not bookable online in academy_info.

## 1 - academy_info

```
Business Information: Signature of Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Belmont, CA, offering Gi and No-Gi training for adults, women, and children in a safe, respectful, and inclusive environment.

Programs Offered:
- Adult Brazilian Jiu-Jitsu (Gi and No-Gi): fundamentals-level training for adult students.
- Women's Brazilian Jiu-Jitsu: dedicated class led by Yasmin Santana, Fridays 5:30-6:30 PM. Not bookable online.
- Kids Brazilian Jiu-Jitsu (ages 5-7, 8-10, 11-14): age-grouped classes running Monday through Friday afternoons and Saturday mornings.
- Private Lessons: one-on-one instruction at all levels. Not bookable online.

A free trial class is available to new students, 45 minutes long, with no equipment required and no commitment. Membership pricing is not published here; instructors discuss pricing options with each student during or right after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId dvEQWeLqOk0DnIYZ6VD6.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 5-7 BJJ calendarId p8shns2lFfc1Dxzv1jfx for age 5-7.
Use Kids 8-10 BJJ calendarId Iuv6iiN568vKWQ0lWmlI for age 8-10.
Use Kids 11-14 BJJ calendarId FwPYPuwmeTEPnW86Gpa6 for age 11-14.
If under age 5, do not book, explain the youngest program is Kids 5-7 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 14, use Kids 11-14 BJJ calendarId FwPYPuwmeTEPnW86Gpa6. For ages 15-17, no kids calendar covers this range; use Adult Fundamentals BJJ calendarId dvEQWeLqOk0DnIYZ6VD6.
```

## 4 - multiple

```
Book each attendee by their own rules. For adults, use Adult Fundamentals BJJ calendarId dvEQWeLqOk0DnIYZ6VD6. For kids age 5-7, use Kids 5-7 BJJ calendarId p8shns2lFfc1Dxzv1jfx. For kids age 8-10, use Kids 8-10 BJJ calendarId Iuv6iiN568vKWQ0lWmlI. For kids age 11-14, use Kids 11-14 BJJ calendarId FwPYPuwmeTEPnW86Gpa6. If any attendee is under age 5, do not book that attendee, explain the youngest program is Kids 5-7 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. For attendees age 15-17, no kids calendar covers this range; use Adult Fundamentals BJJ calendarId dvEQWeLqOk0DnIYZ6VD6.
```
