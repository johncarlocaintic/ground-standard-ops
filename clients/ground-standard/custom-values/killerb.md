# Killer B Combat Sports Academy - Custom Values Pack

**Source ID:** src_YJOFG6926ILNHH1R
**GHL location:** uIW84chF6pVm03ifxxlB
**Calendar IDs:** VERIFIED-LIVE
**academy_info source:** v1.1.2 killer_b_combat_kb.txt (CloseBot-attached, vetted)
**Review flags:**
- Phone is missing from the KB itself (the KB flags this as GAP-001). Youth and multiple values below use the literal placeholder `<gym phone - fill>`. Do not paste those two blocks until a real number is filled in.
- Kids MMA & Fitness is the only kids calendar on this source. Its name carries no age numbers, so the 5-12 band comes from the KB's "Kids Martial Arts" program description, not from the calendar name. Confirm with Bobby that this calendar actually serves ages 5-12.
- Age 13 falls in a gap: past the Kids MMA & Fitness band (5-12) and before the 14-17 adult-beginner routing. The KB does not address this age. Left uncovered in the youth block below; flag before using with a 13-year-old lead.
- No adult calendar is labeled "beginner" or marked as the gym's default program. Adult MMA was picked as the default/primary calendar and as the 14-17 fallback because it's listed first among the four adult calendars and matches the "Combat Sports Academy" name. Confirm the actual default with Bobby.
- The KB's "Jiu-Jitsu (BJJ)" program was matched to the "Adult Nogi Grappling" calendar for the Programs Offered list below since no calendar is named Jiu-Jitsu. Confirm they're the same class.

## 1 - academy_info

```
Business Information: Killer B Combat is a combat sports academy in Oakhurst, NJ, training students since 1998 from complete beginners to professional and UFC-roster athletes.

Programs Offered:
- Kids Martial Arts (ages 5-12)
- Boxing
- Kickboxing
- Jiu-Jitsu (Brazilian Jiu-Jitsu)
- MMA
- Sparring

Kids Martial Arts (ages 5-12): martial arts training for children ages 5 to 12, held Monday through Thursday at 5:00 PM and Saturday at 9:00 AM.
Boxing: fundamental and technical boxing training open to all skill levels, held Tuesday and Thursday at 5:00 PM.
Kickboxing: kickboxing classes at multiple time slots Monday through Saturday, suitable for all experience levels.
Jiu-Jitsu (Brazilian Jiu-Jitsu): ground-based grappling and submission training, held Monday through Thursday evenings.
MMA: mixed martial arts training integrating striking and grappling, held Tuesday and Thursday evenings and Saturday mornings.
Sparring: live sparring for students applying techniques in a live context, held Monday and Wednesday evenings and Saturday mornings. Not bookable online.

New prospects can attend any regularly scheduled class as a free introductory session, with no separate intro time slots and no commitment required. No prior martial arts experience is needed to start. Membership pricing is not published; instructors discuss pricing and membership plans with new students during or right after the free trial class.
```

## 2 - adult

```
Adult MMA, calendarId 3BmU4UVAN0xxbCF5AYfh.
Adult Nogi Grappling, calendarId 4MjOucx9Fp6wOjyaDKfk.
Adult Kickboxing, calendarId rRVZexebtr5kJ8Npr6gA.
Adult Boxing, calendarId rRujrlhmyqnimqt3XwI1.
Adults default to Adult MMA calendarId 3BmU4UVAN0xxbCF5AYfh unless they explicitly ask for Nogi Grappling, Kickboxing, or Boxing, then use Adult Nogi Grappling calendarId 4MjOucx9Fp6wOjyaDKfk, Adult Kickboxing calendarId rRVZexebtr5kJ8Npr6gA, or Adult Boxing calendarId rRujrlhmyqnimqt3XwI1.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids MMA & Fitness calendarId p3Kq0qmqfAjIIYkxRYqm for age 5-12.
If under age 5, do not book, explain the youngest program is Kids MMA & Fitness, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 use Adult MMA calendarId 3BmU4UVAN0xxbCF5AYfh.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult MMA calendarId 3BmU4UVAN0xxbCF5AYfh unless they explicitly ask for Nogi Grappling, Kickboxing, or Boxing, then use Adult Nogi Grappling calendarId 4MjOucx9Fp6wOjyaDKfk, Adult Kickboxing calendarId rRVZexebtr5kJ8Npr6gA, or Adult Boxing calendarId rRujrlhmyqnimqt3XwI1. Children age 5-12 use Kids MMA & Fitness calendarId p3Kq0qmqfAjIIYkxRYqm. Under age 5, do not book and suggest calling <gym phone - fill>. Ages 14-17 use Adult MMA calendarId 3BmU4UVAN0xxbCF5AYfh.
```

## UNMAPPED - review

- Adult Yoga, calendarId CWjbyZvjPfMGHPT9nMmF (not a KB-listed martial arts program)
- Adult BLAB Fitness, calendarId yMRdsSbJKZ0AOQFLUToz (not a KB-listed martial arts program)
- KB Personal Training Consultation, calendarId KPzlLNqM7E0MoqPrrlsl (private consult, not a group trial)
- Follow Up, calendarId N6tdiUmqoBQKluHgCppY (internal follow-up calendar, not a class)
- Women's Self Defense Seminar: Sunday 10/20, calendarId ZTQjZeeTnHwGzhiUBZlj (one-time dated seminar)
- JC Caintic's Personal Calendar, calendarId NqorYgFTASSqzlc7qBQ8 (staff personal calendar)
- Taylor Manning-Drake's Personal Calendar, calendarId t6UHWENoHSjHBaC7XqB0 (staff personal calendar)
- test calendar 1, calendarId SXhChbvtqSrYvD7hBFzd (test calendar)
