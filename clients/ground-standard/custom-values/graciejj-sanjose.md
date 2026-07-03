# Gracie Jiu Jitsu East San Jose - Custom Values Pack

- Source ID: src_257VE0Q8RX3IEDVD
- GHL location: wy55JSUKKC3h6TPHfHOo
- Calendar IDs: VERIFIED-LIVE
- academy_info source: v1.1.2 Gracie_JJ_San_Jose_KB.txt (CloseBot-attached, vetted)
- Review flags:
  - KB v1.2.0 carries open Appendix A action items from the client: business hours have a source conflict (text Q&A vs schedule screenshot, schedule screenshot used here), the GSPro live-schedule link was never supplied, there is no formal conduct/anti-bullying policy yet, and special-needs/allergy accommodation wording is unresolved. None of this affects the values below, but flag before quoting hours or policy specifics elsewhere.
  - This pack replaces an older version of this file that was sourced from a different, non-attached draft KB (v1.0.0 DRAFT, phone 669-600-0528). That draft is no longer the source of truth. This version uses only the KB currently attached to the CloseBot source (v1.2.0, phone 408-781-5943). Confirm with Bobby if the 669 number was ever live and needs to be retired anywhere else.
  - The KB does not name "Kids 7-13 BJJ" as a described program in Section 4 (Programs & Class Types); kids training is only implied through the kids belt-promotion and attendance-tracking sections. The calendar name from the GHL record is used as-is for booking; no kids program description was invented for academy_info.
  - 14-17 routing: no kids calendar covers ages 14-17 (the only kids band is 7-13), so this pack routes 14-17 to Adult Gracie Combatives per the standard fallback rule. The KB does not explicitly confirm this age routing, flagging for review before paste.

## 1 - academy_info

```
Business Information: Gracie Jiu-Jitsu East San Jose (also known as Gracie JJ San Jose) is a Gracie Jiu-Jitsu academy in San Jose, CA, following the Gracie Combatives curriculum with an emphasis on self-defense.

Programs Offered:
- Gracie Combatives
- Master Cycle
- Cardio Kickboxing
- Kickboxing / Filipino Martial Arts
- Black Belt Club
- Reflex Development

GRACIE COMBATIVES
The foundational self-defense program, taught as if every student is a complete beginner. New students get a 10-minute intro session at the start of their first class and a loaner uniform.

MASTER CYCLE
Advanced program for students progressing through or past Gracie Combatives. Not bookable online.

CARDIO KICKBOXING
Fitness-focused kickboxing class, held Saturday mornings. Not bookable online.

KICKBOXING / FILIPINO MARTIAL ARTS
Combined class held Tuesday and Thursday evenings. Not bookable online.

BLACK BELT CLUB
Class for advanced students, held Wednesday evenings. Not bookable online.

REFLEX DEVELOPMENT
Reaction-based training class, held Thursday evenings and Saturday afternoons. Not bookable online.

New students receive a 10-calendar-day free trial with a loaner uniform provided at no upfront cost, and no equipment is needed for the first class. Membership pricing is not published. Pricing varies based on the training schedule and goals a student chooses, and is discussed with instructors during or right after the free trial class.
```

## 2 - adult

```
Adult Gracie Combatives, calendarId t6qNhkiOoAddJddLytLa.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 7-13 BJJ calendarId XfVsX7id0etaN8pOhDnf for age 7-13.
If under age 7, do not book, explain the youngest program is Kids 7-13 BJJ, suggest calling (408) 781-5943, then stop responding.
Ages 14-17 should use Adult Gracie Combatives calendarId t6qNhkiOoAddJddLytLa.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Gracie Combatives calendarId t6qNhkiOoAddJddLytLa. After saving contact youth_birthday, calculate age: use Kids 7-13 BJJ calendarId XfVsX7id0etaN8pOhDnf for age 7-13. If under age 7, do not book, explain the youngest program is Kids 7-13 BJJ, suggest calling (408) 781-5943, then stop responding. Ages 14-17 use Adult Gracie Combatives calendarId t6qNhkiOoAddJddLytLa.
```
