# Montgomery Brazilian Jiu-Jitsu - Custom Values Pack

Source ID: src_4VEFF108BZ7GDG4K
GHL location: jzXRITAw6MM4hJZkG9A0
Calendar IDs: VERIFIED-LIVE
academy_info source: v.1.1.2Montgomery_BJJ_CloseBot_KB_v1_0_1.txt (CloseBot-attached, vetted)
Review flags:
- KB has no phone number anywhere in the source text. Used the literal token `<gym phone - fill>` in the youth no-book fallback. A prior version of this file had a phone number ((609) 577-4445) that does not appear in the KB at all - that was a fabricated fact and has been removed. Get the real number confirmed before deploy and replace every `<gym phone - fill>` instance.
- Ages 14-17 have no dedicated kids calendar (bands stop at 7-13). Routed per rule to Adult Fundamentals BJJ, which the KB confirms welcomes all experience levels.

## 1 - academy_info

```
Business Information: Montgomery Brazilian Jiu-Jitsu is a Brazilian Jiu-Jitsu academy in Montgomery, New Jersey, serving the Montgomery Township and Somerset County community since 2017 with Gi and No-Gi training for adults and kids.

Programs Offered:
- Brazilian Jiu-Jitsu Gi, adult beginner through all-levels classes.
- Brazilian Jiu-Jitsu No-Gi, adult beginner through all-levels classes.
- Kids Brazilian Jiu-Jitsu, Gi and No-Gi, ages 3 to 13, self-defense and bully-proofing focus.
- Leg Locks and ADCC No-Gi specialty classes for adults. Not bookable online.
- Open Mat for adults, Friday evenings. Not bookable online.

Montgomery BJJ offers one free trial class for prospective students, no commitment required. New members also receive two free weeks at sign-up, separate from the trial. Membership pricing is not published; pricing and plan options are discussed with instructors during or after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId 59I9RtWqB7vimQZZYBdr.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids Brazilian Jiu-Jitsu (3-6) calendarId 5A25XDYECvtokbzfeaMT for age 3-6.
Use Kids Brazilian Jiu-Jitsu (7-13) calendarId 6wFCGH31Qm14muq997ic for age 7-13.
If under age 3, do not book, explain the youngest program is Kids Brazilian Jiu-Jitsu (3-6), suggest calling <gym phone - fill>, then stop responding.
For ages 14 to 17, use Adult Fundamentals BJJ calendarId 59I9RtWqB7vimQZZYBdr.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Fundamentals BJJ calendarId 59I9RtWqB7vimQZZYBdr. After saving each youth attendee's youth_birthday, calculate age: use Kids Brazilian Jiu-Jitsu (3-6) calendarId 5A25XDYECvtokbzfeaMT for age 3-6, use Kids Brazilian Jiu-Jitsu (7-13) calendarId 6wFCGH31Qm14muq997ic for age 7-13, and for ages 14 to 17 use Adult Fundamentals BJJ calendarId 59I9RtWqB7vimQZZYBdr. If under age 3, do not book, explain the youngest program is Kids Brazilian Jiu-Jitsu (3-6), suggest calling <gym phone - fill>, then stop responding.
```
