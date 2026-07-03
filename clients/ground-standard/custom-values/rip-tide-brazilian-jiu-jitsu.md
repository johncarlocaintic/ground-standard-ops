# Rip Tide Brazilian Jiu Jitsu - Custom Values Pack

Source ID: src_N2KZAVZ9HLUS59OK
GHL location: 4nsJoE7atCoFfoft7e4p
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/riptide-bjj.md
Review flags:
- Business name spelling differs between sources: gym record lists "Rip Tide Brazilian Jiu Jitsu" (two words), ClickUp source lists "Riptide Brazilian Jiu Jitsu" (one word). Used the record name for the file title, ClickUp spelling in academy_info. Confirm correct spelling with Bobby.
- City and state are not stated anywhere in the ClickUp text (only a street address is given). The business phone area code (302) and the website domain (brazilianjiujitsudelaware.com) point to Delaware, but this is not an explicit statement in the source. Marked as fill.
- Two adult calendars exist (Adult Fundamentals BJJ and Adult Fundamentals Muay Thai). Defaulted adults to BJJ since the gym is branded around BJJ. Confirm this default with Bobby.
- Age 13 falls in a gap between the Kids 4-12 band and the 14-17 adult-beginner route. The ClickUp source does not address this age directly; no rule was invented for it.

## 1 - academy_info

```
Business Information: Riptide Brazilian Jiu Jitsu is a Brazilian Jiu-Jitsu, Muay Thai, and MMA academy located at 17314 N Village Main Blvd #51 in <fill - city, state>. Website: https://www.brazilianjiujitsudelaware.com/

Programs Offered:
- Adult BJJ (Gi and No-Gi, alternating weekly) - trial bookable via Adult Fundamentals BJJ.
- Kids BJJ, ages 4-12 (Gi and No-Gi) - trial bookable via Kids 4-12 BJJ.
- Muay Thai, ages 8 and up including adults - trial bookable via Adult Fundamentals Muay Thai.
- MMA - Not bookable online.
- Takedown Class - Not bookable online.
- Open Mat - Not bookable online.

Riptide Brazilian Jiu Jitsu offers a free trial class for new students. Pricing is not published online and is discussed with a team member during or after the trial.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId xzTvDYhoTjjiPLSKs0eq
Adult Fundamentals Muay Thai, calendarId 78EHKedA3oDDDlHj9dkY
Adults default to Adult Fundamentals BJJ calendarId xzTvDYhoTjjiPLSKs0eq unless they explicitly ask for Muay Thai, then use Adult Fundamentals Muay Thai calendarId 78EHKedA3oDDDlHj9dkY.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-12 BJJ calendarId NoylWhxjiZQLJ6nhBXWy for age 4-12.
If age is under 4, do not book online. Redirect to (302) 219-4720.
For age 14-17, no kids calendar covers this range. Use the adult beginner calendar, Adult Fundamentals BJJ calendarId xzTvDYhoTjjiPLSKs0eq.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId xzTvDYhoTjjiPLSKs0eq unless they explicitly ask for Muay Thai, then use Adult Fundamentals Muay Thai calendarId 78EHKedA3oDDDlHj9dkY. Kids age 4-12 use Kids 4-12 BJJ calendarId NoylWhxjiZQLJ6nhBXWy. Kids under 4 are not bookable online, redirect to (302) 219-4720. Ages 14-17 have no kids calendar coverage, book them using the adult beginner calendar, Adult Fundamentals BJJ calendarId xzTvDYhoTjjiPLSKs0eq.
```
