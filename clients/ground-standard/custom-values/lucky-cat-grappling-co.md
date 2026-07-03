# Lucky Cat Grappling Co. - Custom Values Pack

Source ID: src_JBEJTC6W5MPHW14C
GHL location: TJAcBUGmOm82juMCt4hk
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/lucky-cat-grappling-co.md

Review flags:
- No phone number in the ClickUp source. Youth under-min guard below uses placeholder `<gym phone - fill>`.
- No website listed in the ClickUp source, so none is included below.
- Women's Class (Sat 9am) and Private Lessons have no calendar in the record. Marked "Not bookable online" in academy_info.
- Only 2 calendars on file (Adult Fundamentals BJJ, Kids 6-13 BJJ). Both map cleanly to adult/kids, no UNMAPPED calendars.

## 1 - academy_info

```
Business Information: Lucky Cat Grappling Co. is a jiu jitsu and grappling academy at 205 Park Ave, Manalapan, NJ 07726. Class offerings include Jiu Jitsu, Stand-Up, Judo, Sumo, and no-gi Grappling, with drop-ins welcome.

Programs Offered:
- Adult Fundamentals BJJ: adult jiu jitsu class, Monday and Tuesday evenings, beginner friendly.
- Kids BJJ, ages 6-13: youth grappling class.
- Women's Class: Saturdays at 9am, women only. Not bookable online.
- Private Lessons: by appointment, any age. Not bookable online.

Hours: Monday 5-8pm, Tuesday through Thursday 530-830pm, Friday closed except by-appointment privates, Saturday 9am-12pm, Sunday 9-11am.

Pricing is not published. Membership and package pricing is discussed with a team member at or after the free trial. First class is always free for new students, and private intro sessions are available by appointment.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId Pwrl1F6cZvsCqEdtQB5Y.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 6-13 BJJ calendarId eIWF26tAooKPyM8eYd2f for age 6-13.
For age under 6, do not book online. Contact <gym phone - fill> to discuss options.
For age 14-17, use Adult Fundamentals BJJ calendarId Pwrl1F6cZvsCqEdtQB5Y.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId Pwrl1F6cZvsCqEdtQB5Y. Kids age 6-13 use Kids 6-13 BJJ calendarId eIWF26tAooKPyM8eYd2f. Kids under age 6 are not bookable online, contact <gym phone - fill> to discuss options. Teens age 14-17 book via Adult Fundamentals BJJ calendarId Pwrl1F6cZvsCqEdtQB5Y.
```
