# Hammer Sports & Performance - Custom Values Pack

**Source ID:** src_OKNBAOGCND99B5EM
**GHL location:** IB5NHYNn4F4ANpNt5NvX
**Calendar IDs:** VERIFIED-LIVE
**academy_info source:** v1.1.2 Hammer_Sports_KB.txt (CloseBot-attached, vetted)
**Review flags:**
- KB has no phone number or email address on file (its own Flag 5). Youth under-age and multiple under-age gates below use the placeholder token `<gym phone - fill>`. Bobby needs to supply the real number.
- Four adult calendars exist (Adult Brazilian Jiu-Jitsu, Adult No-Gi Brazilian Jiu-Jitsu, Adult Muay Thai (Kickboxing), Adult Wrestling) plus Kettle Bell Workout, and the KB does not state which one is the default/beginner track. Adult Brazilian Jiu-Jitsu is used as the default below because BJJ is listed first among the gym's disciplines in the KB's business description. Flagging this pick for Bobby to confirm or override.
- Youth Wrestling, High School Wrestling, Girls Only Wrestling, MMA, and Open Mat are named in the KB's schedule/programs section but have no matching GHL calendar, marked "Not bookable online" in academy_info.
- Personal Training Consultation Call, Coach Josh Private Session, and Taylor Manning-Drake's Personal Calendar are internal/non-trial calendars, moved to UNMAPPED.

## 1 - academy_info

```
Business Information: Hammer Sports & Performance is a martial arts and athletic performance gym in Hazlet, NJ, serving both competitive fighters and hobbyist practitioners with programs for kids, teens, and adults.

Programs Offered:
- Little Hammer Kids Martial Arts (ages 5-12)
- Teen Martial Arts (ages 13 through high school)
- Adult Brazilian Jiu-Jitsu (Gi and No-Gi)
- Adult Muay Thai / Kickboxing
- Adult Wrestling
- Kettlebell Conditioning
- Youth and High School Wrestling
- MMA
- Open Mat

Little Hammer Kids Martial Arts (ages 5-12): kids classes cover Brazilian Jiu-Jitsu, Wrestling, MMA, and Kickboxing across the week.
Teen Martial Arts (ages 13 through high school): a dedicated teen program running alongside the adult schedule.
Adult Brazilian Jiu-Jitsu: offered in Gi and No-Gi formats, with multiple sessions per week.
Adult Muay Thai / Kickboxing: Muay Thai classes are booked under the Kickboxing category on the scheduling platform.
Adult Wrestling: wrestling training for adults.
Kettlebell Conditioning: athletic conditioning sessions for all fitness levels.
Youth Wrestling, High School Wrestling, and Girls Only Wrestling: not bookable online.
MMA: blends striking and grappling, runs multiple times a week. Not bookable online.
Open Mat: unstructured training time for members. Not bookable online.

A free trial class is available for new students with no commitment required. Membership pricing is not published. Pricing varies by program and training frequency and is discussed with staff during or right after the free trial class.
```

## 2 - adult

```
Adult Brazilian Jiu-Jitsu, calendarId LVXGgBrnpysMvL5SeXO4
Adult No-Gi Brazilian Jiu-Jitsu, calendarId 7lDnZI0guVOkAPRC4WOg
Adult Muay Thai (Kickboxing), calendarId GguRLKLUnTL4vwKOI3vi
Adult Wrestling, calendarId HPHCI7asG4MIs1gHKtp4
Kettle Bell Workout, calendarId fliTy42M3zCzQVPv3RWO
Adults default to Adult Brazilian Jiu-Jitsu calendarId LVXGgBrnpysMvL5SeXO4 unless they explicitly ask for No-Gi, then use Adult No-Gi Brazilian Jiu-Jitsu calendarId 7lDnZI0guVOkAPRC4WOg. For Muay Thai or kickboxing use Adult Muay Thai (Kickboxing) calendarId GguRLKLUnTL4vwKOI3vi. For wrestling use Adult Wrestling calendarId HPHCI7asG4MIs1gHKtp4. For kettlebell conditioning use Kettle Bell Workout calendarId fliTy42M3zCzQVPv3RWO.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Youth Martial Arts calendarId 42uFk8DjUKX49nbN6egp for age 5-12.
Use Teen Martial Arts calendarId dyKieKPgrZTSlvJXckqs for age 13-17.
If under age 5, do not book, explain the youngest program is Youth Martial Arts, suggest calling <gym phone - fill>, then stop responding.
Ages 14-17 continue using Teen Martial Arts calendarId dyKieKPgrZTSlvJXckqs.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Brazilian Jiu-Jitsu calendarId LVXGgBrnpysMvL5SeXO4 unless they explicitly asked for No-Gi, then use Adult No-Gi Brazilian Jiu-Jitsu calendarId 7lDnZI0guVOkAPRC4WOg. Muay Thai or kickboxing uses Adult Muay Thai (Kickboxing) calendarId GguRLKLUnTL4vwKOI3vi. Wrestling uses Adult Wrestling calendarId HPHCI7asG4MIs1gHKtp4. Kettlebell conditioning uses Kettle Bell Workout calendarId fliTy42M3zCzQVPv3RWO. Children age 5-12 use Youth Martial Arts calendarId 42uFk8DjUKX49nbN6egp. Children age 13-17 use Teen Martial Arts calendarId dyKieKPgrZTSlvJXckqs. Under age 5, do not book that attendee and suggest calling <gym phone - fill>. Ages 14-17 continue using Teen Martial Arts calendarId dyKieKPgrZTSlvJXckqs.
```

## UNMAPPED - review

- Personal Training Consultation Call, calendarId Z65Qdz3OuP7KIyBiDrbn (sales/PT consult, internal)
- Coach Josh Private Session, calendarId hek6PGsySuxxtCkiK4gA (private session, internal)
- Taylor Manning-Drake's Personal Calendar, calendarId rW8JVwGrxnm5ovXbLRNA (staff personal, internal)
