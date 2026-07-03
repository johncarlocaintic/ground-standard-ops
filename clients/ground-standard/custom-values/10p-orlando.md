# 10th Planet Orlando Jiu Jitsu - Custom Values Pack

Source ID: src_3QTZZXSBO968SUQQ
GHL location: eG7RPB7bx4Z0FvH6V05M
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/10th-planet-orlando.md

Review flags:
- Business is titled "10th Planet Orlando" in ClickUp and "10th Planet Orlando Jiu Jitsu" in the GHL record, but the address on file (195 S Westmonte Dr #1108) is in Altamonte Springs, FL, not Orlando. Used the GHL record's full name for the pack title; flag for Bobby on whether the bot should say Orlando or Altamonte Springs when asked for the location.
- No kids or teen calendars exist in the gym record - only 2 adult calendars (Adult Fundamentals BJJ, Adult Fundamentals Muay Thai). Reads as an adults-only academy. Confirm with the gym before publishing.
- 14-17 routing: no kids calendar covers teens, so per the standard rule I mapped 14-17 to Adult Fundamentals BJJ, the discipline listed first in the ClickUp source. Not confirmed with the gym, flag for review.
- Adult default: picked Adult Fundamentals BJJ over Adult Fundamentals Muay Thai since jiu-jitsu is listed first in the ClickUp text and is the 10th Planet flagship discipline. Confirm the intended default with the gym.
- ClickUp lists two phone numbers, a Business Phone Number (407) 900-9607 and a Cell Number (407) 517-8070. Used the business line everywhere a literal phone is needed; flag if the gym prefers the cell number for bot handoffs.
- Source pricing stripped: the ClickUp page lists a membership fee with a stated future increase, a drop-in rate, and a private-lesson rate. All dollar amounts removed per the no-pricing rule; academy_info only says pricing is discussed at or after the free trial.
- MMA and Private Lessons are named in the ClickUp text with no matching GHL calendar. Marked "Not bookable online" in academy_info.

## 1 - academy_info

```
Business Information: 10th Planet Orlando Jiu Jitsu is a no-gi Jiu-Jitsu, Muay Thai, and MMA academy in Altamonte Springs, FL, located at 195 S Westmonte Dr #1108. Website: 10thplanetorlando.com.

Programs Offered:
- No-Gi Jiu-Jitsu: core no-gi grappling program. Bookable via Adult Fundamentals BJJ.
- Muay Thai Kickboxing: striking program. Bookable via Adult Fundamentals Muay Thai.
- MMA: mixed martial arts training. Not bookable online.
- Private Lessons: one-on-one instruction with the head instructor, by arrangement. Not bookable online.

New students can try a free trial day in any class they want. Membership pricing is not published; the team discusses pricing and membership options at or after the free trial.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId LHn0KaaWxEdSmTerzHLN.
Adult Fundamentals Muay Thai, calendarId r9wD4rKbrkACS7Vou3Vg.
Adults default to Adult Fundamentals BJJ calendarId LHn0KaaWxEdSmTerzHLN unless they explicitly ask for Muay Thai, then use Adult Fundamentals Muay Thai calendarId r9wD4rKbrkACS7Vou3Vg.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
This academy has no kids or teen calendars mapped. If the contact is age 14-17, use Adult Fundamentals BJJ calendarId LHn0KaaWxEdSmTerzHLN. If under age 14, do not book, explain that programs at this academy are for adults, suggest calling (407) 900-9607, then stop responding.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults (18+) default to Adult Fundamentals BJJ calendarId LHn0KaaWxEdSmTerzHLN unless they explicitly ask for Muay Thai, then use Adult Fundamentals Muay Thai calendarId r9wD4rKbrkACS7Vou3Vg. Attendees age 14-17 use Adult Fundamentals BJJ calendarId LHn0KaaWxEdSmTerzHLN. For any attendee under age 14, do not book, explain that programs at this academy are for adults, suggest calling (407) 900-9607, then stop responding.
```
