# Mason Dixon Jiu-Jitsu - Custom Values Pack

Source ID: src_WEF7GLL3UCZIR97M
GHL location: UC4YCK5VFS9k9JX74NeV
Calendar IDs: VERIFIED-LIVE
academy_info source: mason_dixon_kb_v2.0.0.txt (CloseBot-attached, vetted)
Review flags:
- KB does not name a default adult program. Defaulted to Adult Fundamentals BJJ as the primary adult calendar. Confirm with the gym or Bobby before this locks in as the standing rule.

## 1 - academy_info

```
Business Information: Mason Dixon Jiu-Jitsu is a No-Gi Brazilian Jiu-Jitsu and Muay Thai academy in Chambersburg, Pennsylvania, serving students of all backgrounds from complete beginners to experienced practitioners.

Programs Offered:
- Adult No-Gi Brazilian Jiu-Jitsu
- Adult Striking (Muay Thai)
- Kids Martial Arts, ages 4-7
- Kids Martial Arts, ages 8-13
- Private Training
- Open Mat

ADULT NO-GI BRAZILIAN JIU-JITSU
Technique-based grappling with no Gi uniform, for ages 14 and up. Open to complete beginners and experienced grapplers.

ADULT STRIKING (MUAY THAI)
Muay Thai striking using fists, elbows, knees, and shins, for ages 14 and up. Welcoming to beginners, challenging for experienced strikers.

KIDS MARTIAL ARTS, AGES 4-7
Combined Jiu-Jitsu and striking curriculum for younger kids. Sessions are 30 minutes.

KIDS MARTIAL ARTS, AGES 8-13
Same combined curriculum at a more advanced pace. Sessions are 1 hour.

PRIVATE TRAINING
One-on-one coaching in No-Gi Jiu-Jitsu or Muay Thai. Not bookable online; details are discussed with the coach after a trial class.

OPEN MAT
Free rolling after adult Jiu-Jitsu classes, plus a Friday evening session. Not bookable online, this is a drop-in for current students.

Anyone 14 or older trains in adult classes. Teens 14-17 can attend adult classes but must be enrolled with a parent or guardian involved in sign-up; the academy does not book unaccompanied minors online.

A free trial class is available for new students with no cost and no commitment. Membership pricing is not published. It varies by program and training frequency, and instructors go over pricing and membership options with the student during or right after the free trial class.
```

## 2 - adult

```
Adult Striking, calendarId Nm3MgApQroVomSkUwXxd.
Adult Fundamentals BJJ, calendarId fOMhL9TQ3i5KKw9VOYQN.
Adults default to Adult Fundamentals BJJ calendarId fOMhL9TQ3i5KKw9VOYQN unless they explicitly ask for striking or Muay Thai, then use Adult Striking calendarId Nm3MgApQroVomSkUwXxd.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-7 Martial Arts calendarId 7s5mdmENiQ99WUAHVfn7 for age 4-7.
Use Kids 8-13 Martial Arts calendarId Jjf0FN9wdLDYPD6uaG9v for age 8-13.
If under age 4, do not book, explain the youngest program is Kids 4-7 Martial Arts, suggest calling (717) 402-8999, then stop responding.
Ages 14-17 should attend Adult Fundamentals BJJ calendarId fOMhL9TQ3i5KKw9VOYQN.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId fOMhL9TQ3i5KKw9VOYQN unless they explicitly asked for striking or Muay Thai, then use Adult Striking calendarId Nm3MgApQroVomSkUwXxd. Children age 4-7 use Kids 4-7 Martial Arts calendarId 7s5mdmENiQ99WUAHVfn7. Children age 8-13 use Kids 8-13 Martial Arts calendarId Jjf0FN9wdLDYPD6uaG9v. Under age 4 do not book and suggest calling (717) 402-8999. Ages 14-17 use Adult Fundamentals BJJ calendarId fOMhL9TQ3i5KKw9VOYQN.
```
