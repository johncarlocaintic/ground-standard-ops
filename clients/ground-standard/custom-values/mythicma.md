# Mythic Martial Arts - Custom Values Pack

Source ID: src_7MUL86MMID589JDK
GHL location: ZGEfUavlamRcX7EwYMbg
Calendar IDs: VERIFIED-LIVE
academy_info source: ClickUp - clickup-kb/mythic-muscle.md

Review flags:
- Business name mismatch: the GHL record calls this gym "Mythic Martial Arts", but the ClickUp source calls it "Mythic Muscle" (website mythicmusclegym.com, Instagram @MythicFightTeam). Confirm which name the bot should use when introducing itself.
- No phone number anywhere in the ClickUp source. The literal token `<gym phone - fill>` is used everywhere a callback number is needed. Replace before publish.
- No kids or teen calendars exist in the gym record or in the ClickUp schedule - only 3 adult calendars (Adult All Levels Jiu-Jitsu, Adult Kickboxing, Adult Foundations Jiu-Jitsu). This reads as an adults-only academy. Confirm with the gym before publishing.
- 14-17 routing: no kids calendar covers teens, so per the standard rule I mapped 14-17 to Adult Foundations Jiu-Jitsu, since the ClickUp text explicitly calls that one the beginners class. Not confirmed with the gym, flag for review.
- Adult default: I picked Adult Foundations Jiu-Jitsu as the default trial calendar because the ClickUp text names it the beginners class. Confirm the intended default with the gym.
- Source pricing stripped: the ClickUp page lists membership pricing, a drop-in rate, and a paid trial offer. All dollar amounts were removed per the no-pricing rule; academy_info only says pricing is discussed after the trial.
- No formal CloseBot KB is attached to this source yet (hasKB: false). academy_info below was distilled straight from the ClickUp page - turn it into an attached KB before go-live if the bot requires one.

## 1 - academy_info

```
Business Information: Mythic Martial Arts (branded Mythic Muscle, mythicmusclegym.com) is a no-gi Jiu-Jitsu and kickboxing academy in Tacoma, WA, running adult classes Monday through Saturday with an occasional Sunday open mat.

Programs Offered:
- Foundations Jiu-Jitsu: beginner no-gi grappling class, held weekday mornings and evenings.
- All Levels Jiu-Jitsu: open no-gi grappling class for all skill levels, held weekday evenings.
- Kickboxing: striking class with a bag-work format and a regular class, held weekday mornings and evenings.
- Community Pro Class: Saturday morning class. Not bookable online.
- MMA Team Training: invite-only team training, held Tuesday and Thursday evenings. Not bookable online.
- Open Mat: occasional Sunday session. Not bookable online.

New members can start with a short trial period through the website's trial signup button before deciding to join. Membership pricing is not published in this system and is discussed with the team at or after the trial. First-class basics: bring water, athletic shorts with no pockets or zippers, and a shirt that is not too loose. Sign-up is also available via Instagram at @MythicFightTeam.
```

## 2 - adult

```
Adult All Levels Jiu-Jitsu, calendarId iHv0IeohXJjgxEKo1tWu.
Adult Kickboxing, calendarId mrKqjJ5uwU16HSTlnxGy.
Adult Foundations Jiu-Jitsu, calendarId q12SczP72D0pvMF2QpnN.
Adults default to Adult Foundations Jiu-Jitsu calendarId q12SczP72D0pvMF2QpnN unless they explicitly ask for a different level or discipline, then use Adult All Levels Jiu-Jitsu calendarId iHv0IeohXJjgxEKo1tWu for all-levels jiu-jitsu or Adult Kickboxing calendarId mrKqjJ5uwU16HSTlnxGy for kickboxing.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
This academy has no kids or teen calendars mapped. If the contact is age 14-17, use Adult Foundations Jiu-Jitsu calendarId q12SczP72D0pvMF2QpnN. If under age 14, do not book, explain that programs at this academy are for adults, suggest calling <gym phone - fill>, then stop responding.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults (18+) default to Adult Foundations Jiu-Jitsu calendarId q12SczP72D0pvMF2QpnN unless they explicitly ask for a different level or discipline, then use Adult All Levels Jiu-Jitsu calendarId iHv0IeohXJjgxEKo1tWu for all-levels jiu-jitsu or Adult Kickboxing calendarId mrKqjJ5uwU16HSTlnxGy for kickboxing. Attendees age 14-17 use Adult Foundations Jiu-Jitsu calendarId q12SczP72D0pvMF2QpnN. For any attendee under age 14, do not book, explain that programs at this academy are for adults, suggest calling <gym phone - fill>, then stop responding.
```
