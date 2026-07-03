# OM Brazilian Jiu-Jitsu and Judo - Custom Values Pack

Source ID: src_VGIGZ52AQVQZKXS3
GHL location: dUOiYuuo9LBcUnDOxd1i
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 OM_BJJ_KB.txt (CloseBot-attached, vetted)
Review flags:
- No phone number appears anywhere in the vetted KB (only "owner's cell, same business number" and "book by phone at the gym," no digits given). A prior version of this file listed (631) 327-8094 as the gym phone; that number does not appear in the KB text and has been removed. Youth under-min routing below uses the literal placeholder `<gym phone - fill>` until a real number is confirmed and sourced from the KB.
- Ages 16-17 are not covered by any bookable youth calendar (Teens 10-15 BJJ tops out at 15). Routed to the adult calendar as a fallback, needs confirmation from the gym on whether that is correct.
- KB filename says v1.1.2 (v1.1.2 OM_BJJ_KB.txt) but the document header inside states Version 1.1.0. Noting the mismatch, not resolving it here.

## 1 - academy_info

```
Business Information: OM Brazilian Jiu-Jitsu and Judo is a Brazilian Jiu-Jitsu and Judo academy in Northport, New York, providing traditional martial arts training for kids and adults across BJJ, Judo, and JKD striking.

Programs Offered:
- Brazilian Jiu-Jitsu (BJJ): Gi and No-Gi training for all levels, adults and kids/teens.
- Judo: traditional Judo for kids, teens, and adults, often combined with BJJ in the same class.
- JKD (Jeet Kune Do) Striking: striking classes on Saturday and Sunday mornings. Not bookable online.
- Kids Program (ages 4-9): combined BJJ and Judo classes for young children.
- Teens and Preteens Program (ages 10-15): dedicated BJJ and Judo sessions.
- Open Mat: Sunday 10:00 AM open training for BJJ and Judo. Not bookable online.

The first class is always free for new students, no commitment required. Membership, drop-in, and private lesson pricing is not published; instructors go over pricing and the right program fit with new students during or right after the free trial class.
```

## 2 - adult

```
Adult Brazilian Jiu-Jitsu & Judo, calendarId 2ToifGdjcoxWP7R7SkYR.
Adult NoGi Brazilian Jiu-Jitsu, calendarId b7hgRBfkxz8fUPZRH28n.
Adults default to Adult Brazilian Jiu-Jitsu & Judo calendarId 2ToifGdjcoxWP7R7SkYR unless they explicitly ask for Adult NoGi Brazilian Jiu-Jitsu, then use Adult NoGi Brazilian Jiu-Jitsu calendarId b7hgRBfkxz8fUPZRH28n.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-9 BJJ calendarId ZaNk0DiLmFXvfkuspu0p for age 4-9.
Use Teens 10-15 BJJ calendarId r1MuiRLtvD8PIUJTHgwK for age 10-15.
If under age 4, do not book, explain the youngest program is Kids 4-9 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 16-17, no youth calendar covers this band. Use Adult Brazilian Jiu-Jitsu & Judo calendarId 2ToifGdjcoxWP7R7SkYR as the fallback. Flag for confirmation with the gym on whether 16-17 year olds train in the adult class or need a dedicated teen slot.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Brazilian Jiu-Jitsu & Judo calendarId 2ToifGdjcoxWP7R7SkYR unless they explicitly ask for Adult NoGi Brazilian Jiu-Jitsu calendarId b7hgRBfkxz8fUPZRH28n. After saving each youth attendee's youth_birthday, calculate age: use Kids 4-9 BJJ calendarId ZaNk0DiLmFXvfkuspu0p for age 4-9, use Teens 10-15 BJJ calendarId r1MuiRLtvD8PIUJTHgwK for age 10-15. If an attendee is under age 4, do not book that attendee, explain the youngest program is Kids 4-9 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. For age 16-17, no youth calendar covers this band, use Adult Brazilian Jiu-Jitsu & Judo calendarId 2ToifGdjcoxWP7R7SkYR as the fallback and flag for confirmation.
```
