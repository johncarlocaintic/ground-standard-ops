# Gracie Farmington Valley - Custom Values Pack

Source ID: src_LGA6WCCJSAEE8X6R
GHL location: 5yxX1tJAbq5vttIUwGzJ
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/gracie-farmington-valley.md
Review flags:
- Two adult calendars exist (Adult Fundamentals BJJ, Adult All Levels Cardio Kickboxing). Defaulted the primary to Adult Fundamentals BJJ since the ClickUp text frames the Jiu-Jitsu membership as the core program and cardio kickboxing as the add-on bundle. Confirm this default with the client.
- No kids or teen calendar covers ages 14-17 (kids bands stop at 8-13). Routed 14-17 to Adult Fundamentals BJJ per the standard rule. Confirm this is acceptable for younger teens.
- The ClickUp page mentions a future "striking" class that will shift the Jiu-Jitsu schedule once it launches. No calendar exists for it yet, so it is left out of academy_info. Revisit once a striking calendar is created.
- ClickUp address lists the town as Canton, CT 06019. The gym brands itself as serving the "Farmington Valley" region rather than a town by that name, so academy_info uses Canton, CT as the literal city/state.
- Original ClickUp text contains membership prices ($175, $149, $225 bundle). All dollar amounts were stripped from academy_info per the no-pricing rule; do not reintroduce them into any bot-facing content.

## 1 - academy_info

```
Business Information: Gracie Farmington Valley is a Brazilian Jiu-Jitsu academy in Canton, CT, serving the Farmington Valley community, offering Jiu-Jitsu classes for kids and adults plus an adult cardio kickboxing program. Located at 15 Cheryl Dr d, Canton, CT 06019, phone 860-500-3829, website graciefarmingtonvalley.com.

Programs Offered:
- Adult Fundamentals BJJ (Gi and No-Gi)
- Adult Cardio Kickboxing
- Kids BJJ ages 4-5
- Kids BJJ ages 6-7
- Kids BJJ ages 8-13

Adult Fundamentals BJJ covers Gi and No-Gi Jiu-Jitsu, with morning and evening class times through the week.
Adult Cardio Kickboxing meets two nights a week as a striking-based cardio class.
Kids BJJ ages 4-5 is the entry Jiu-Jitsu fundamentals class for the youngest students.
Kids BJJ ages 6-7 continues Jiu-Jitsu fundamentals for early elementary kids.
Kids BJJ ages 8-13 is the advanced Jiu-Jitsu class for older kids.

Pricing is not published here. All programs start with a trial class, and cost is discussed with the team after that first visit.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId NrtxDxqI0cvLSOil1JIk.
Adult All Levels Cardio Kickboxing, calendarId O4eTDlBuKizeHMusaNLg.
Adults default to Adult Fundamentals BJJ calendarId NrtxDxqI0cvLSOil1JIk unless they explicitly ask for Adult All Levels Cardio Kickboxing, then use Adult All Levels Cardio Kickboxing calendarId O4eTDlBuKizeHMusaNLg.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-5 BJJ calendarId 5dbeoaCIpxsgP5hqYeDH for age 4-5.
Use Kids 6-7 BJJ calendarId kkOVsc9JUgacdZD4YEVr for age 6-7.
Use Kids 8-13 BJJ calendarId fkxupMrT52curLV5Q7Ht for age 8-13.
If under age 4, do not book, explain the youngest program is Kids 4-5 BJJ, suggest calling 860-500-3829, then stop responding.
For age 14-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId NrtxDxqI0cvLSOil1JIk.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId NrtxDxqI0cvLSOil1JIk unless they explicitly ask for Adult All Levels Cardio Kickboxing, then use Adult All Levels Cardio Kickboxing calendarId O4eTDlBuKizeHMusaNLg. After saving contact youth_birthday, calculate age. Use Kids 4-5 BJJ calendarId 5dbeoaCIpxsgP5hqYeDH for age 4-5. Use Kids 6-7 BJJ calendarId kkOVsc9JUgacdZD4YEVr for age 6-7. Use Kids 8-13 BJJ calendarId fkxupMrT52curLV5Q7Ht for age 8-13. If under age 4, do not book, explain the youngest program is Kids 4-5 BJJ, suggest calling 860-500-3829, then stop responding. For age 14-17, no kids calendar covers this range, use Adult Fundamentals BJJ calendarId NrtxDxqI0cvLSOil1JIk.
```
