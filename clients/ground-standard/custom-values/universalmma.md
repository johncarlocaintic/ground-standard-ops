# Universal Mixed Martial Arts - Custom Values Pack

Source ID: src_4C7CIFW27LLW2TCH
GHL location: MkbS4Ud2oAGBtbpVkzyi
Calendar IDs: VERIFIED-LIVE
academy_info source: v.1.1.2universal_mma_knowledge_base.txt (CloseBot-attached, vetted)
Review flags:
- Phone number is not in the vetted KB. The KB's own Flag 2 notes the phone (and email) were never provided by the client and placeholders are required before deploy. academy_info and the youth/multiple "call the gym" lines use `<gym phone - fill>`.
- The gym record's two calendars are named "Kids Martial Arts" and "Adult Martial Arts" with no age range in the calendar name itself. The age bands used below (kids 4-12, adult 13+) come from the KB's Children's Martial Arts (ages 4-12) and Adult Martial Arts (ages 13+, no upper limit) program descriptions, matched one to one to these two calendars. Confirm the match is correct since it is name-inferred, not calendar-stated.
- The KB states the adult program starts at age 13, so ages 13-17 are routed to the adult calendar here rather than a 14-17 split. Flagging since this is narrower than the age band used for youth routing in some other packs in this set.
- KB Flag 1 excludes a "$99 - Unlimited" figure from the source PDF per client instruction (ambiguous whether it applied to martial arts membership or the Afterschool package). No dollar figures appear anywhere below as a result.
- KB notes a child performing exceptionally well may be moved into the adult class at instructor discretion regardless of age. Not encoded into booking logic below since it is a discretionary in-person call, not a bookable rule.

## 1 - academy_info

```
Business Information: Universal Mixed Martial Arts is a martial arts academy in South Richmond Hill, NY, offering martial arts training for children and adults plus afterschool and summer programs.

Programs Offered:
- Children's Martial Arts (ages 4-12): structured martial arts curriculum at a beginner-appropriate intensity, weekday evenings and Saturday mornings.
- Adult Martial Arts (ages 13+, no upper age limit): the same curriculum as the children's program at a higher intensity, weekday evenings and Saturday afternoon.
- Health & Fitness (adults only): cardio, strength training, yoga, and HIIT classes. Not bookable online.
- Weapons Class (children and adults combined): weapons training session. Not bookable online.
- Sparring Class (children and adults combined): sparring technique and application session. Not bookable online.
- Afterschool Program: homework assistance first, plus martial arts training three times a week, academic reinforcement, late pickup to 8 PM, and school-closure-day coverage. Not bookable online.
- Martial Arts Summer Program: full-day (7 AM to 8 PM) program combining martial arts, academics, and group activities during summer break. Not bookable online.
- Birthday Party Rentals: Saturday afternoons, by arrangement. Not bookable online.

A free trial class is available with no commitment required. Pricing is not published; instructors discuss membership options and pricing during or after the free trial class based on the student's goals, age group, and desired class frequency.

Phone: <gym phone - fill> (not listed in the vetted KB)
```

## 2 - adult

```
Adult Martial Arts, calendarId zBdJGEC5m2PdxXOP1gmO.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids Martial Arts calendarId ZfTveExmW5cGwD1a1cAQ for age 4-12.
If under age 4, do not book, explain the youngest program is Kids Martial Arts, suggest calling <gym phone - fill>, then stop responding.
For ages 13-17, use Adult Martial Arts calendarId zBdJGEC5m2PdxXOP1gmO, since the KB states the adult program begins at age 13 and no kids calendar covers those ages.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Martial Arts calendarId zBdJGEC5m2PdxXOP1gmO. After saving each youth attendee's youth_birthday, calculate age: use Kids Martial Arts calendarId ZfTveExmW5cGwD1a1cAQ for age 4-12. If any attendee is under age 4, do not book that attendee, explain the youngest program is Kids Martial Arts, suggest calling <gym phone - fill>, then stop responding for that attendee. For ages 13-17, use Adult Martial Arts calendarId zBdJGEC5m2PdxXOP1gmO.
```
