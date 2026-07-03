# Royal Jiu Jitsu Academy Queens - Custom Values Pack

Source ID: src_R9BDT0U16EJ6LA29
GHL location: 73OIwejXGNK43fe5yojU
Calendar IDs: NAMES-ONLY
academy_info source: ClickUp - clickup-kb/royal-jiu-jitsu-queens.md
Review flags:
- All 7 calendars on this gym record are NAMES-ONLY (no live IDs). Every calendarId below uses the placeholder `<calendarId - fill from GHL UI>` until pulled from GHL.
- No phone number is present anywhere in the ClickUp page. Placeholder `<gym phone - fill>` used in the youth and multiple sections below, needs a real number before this pack goes live.
- The ClickUp page uses three different name variants for this gym: page title "Royal Jiu-Jitsu Queens", "Full Business Name" field "Royal Jiujitsu Queens", and the GHL record name "Royal Jiu Jitsu Academy Queens". Used the GHL record name for this file's title and the page-title spelling in academy_info.
- All membership pricing (unlimited/contract tiers for adults and kids, family/military discounts, drop-in day pass) was stripped per the no-pricing rule. Only the free-trial and human-redirect framing was kept in section 1.
- "Kids BJJ" has no age band in its name and cannot be placed in the age-based youth routing. Moved to UNMAPPED - confirm the intended age range with the client before this program can be added to section 3.
- "Demo Calendar" is not a bookable class program, moved to UNMAPPED.
- Three adult calendars exist (Adult Fundamentals BJJ, Adult Advanced BJJ, Adult All Levels BJJ). Defaulted the primary to Adult Fundamentals BJJ as the standard beginner entry point for a first trial. Confirm this default with the client.
- Kids calendars with usable age bands (Kids 6-9 BJJ, Kids 10-14 BJJ) leave ages 15-17 uncovered. Routed to Adult Fundamentals BJJ per the standard 14-17 fallback rule, flagging for client confirmation since age 14 already sits inside Kids 10-14 BJJ.

## 1 - academy_info

```
Business Information: Royal Jiu-Jitsu Queens is a Brazilian Jiu-Jitsu academy in Queens, New York, located at 82-77 116th St, Queens, NY 11418 (royaljiujitsuqueens.com).

Programs Offered:
- Adult Fundamentals BJJ: beginner-friendly BJJ class for adults.
- Adult Advanced BJJ: BJJ class for experienced adult students.
- Adult All Levels BJJ: mixed-level BJJ class for adults.
- Kids 6-9 BJJ: youth BJJ class for ages 6-9.
- Kids 10-14 BJJ: youth BJJ class for ages 10-14.
- Kids BJJ (general): an additional kids class exists in GHL with no age band in its name. Not bookable online until the age range is confirmed.
- Private lessons: available on request, not a group class. Not bookable online.

Royal Jiu-Jitsu Queens offers a free one-week trial for new students. Pricing is not published here. Membership cost is discussed at or after the free trial, or a team member can go over it directly.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId <calendarId - fill from GHL UI>.
Adult Advanced BJJ, calendarId <calendarId - fill from GHL UI>.
Adult All Levels BJJ, calendarId <calendarId - fill from GHL UI>.
Adults default to Adult Fundamentals BJJ calendarId <calendarId - fill from GHL UI> unless they explicitly ask for Adult Advanced BJJ or Adult All Levels BJJ, then use Adult Advanced BJJ calendarId <calendarId - fill from GHL UI> or Adult All Levels BJJ calendarId <calendarId - fill from GHL UI> respectively.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 6-9 BJJ calendarId <calendarId - fill from GHL UI> for age 6-9.
Use Kids 10-14 BJJ calendarId <calendarId - fill from GHL UI> for age 10-14.
If under age 6, do not book, explain the youngest program is Kids 6-9 BJJ, suggest calling <gym phone - fill>, then stop responding.
For age 15-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId <calendarId - fill from GHL UI> (age 14 continues under Kids 10-14 BJJ above).
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId <calendarId - fill from GHL UI> unless they explicitly ask for Adult Advanced BJJ or Adult All Levels BJJ, then use Adult Advanced BJJ calendarId <calendarId - fill from GHL UI> or Adult All Levels BJJ calendarId <calendarId - fill from GHL UI> respectively. After saving each youth attendee's youth_birthday, calculate age. Use Kids 6-9 BJJ calendarId <calendarId - fill from GHL UI> for age 6-9. Use Kids 10-14 BJJ calendarId <calendarId - fill from GHL UI> for age 10-14. If an attendee is under age 6, do not book that attendee, explain the youngest program is Kids 6-9 BJJ, suggest calling <gym phone - fill>, then stop responding for that attendee. Route any attendee aged 15-17 to Adult Fundamentals BJJ calendarId <calendarId - fill from GHL UI> (age 14 continues under Kids 10-14 BJJ above).
```

## UNMAPPED - review

- Kids BJJ - no age band in the calendar name, cannot be placed in age-based youth routing without client confirmation.
- Demo Calendar - not a bookable class program, internal/sales use only.
