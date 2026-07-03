# Hamptons Jiu-Jitsu West - Custom Values Pack

Source ID: src_8RHY7XBXZ50T5CXD
GHL location: uEHuCfRCBv7viqsKBbYx
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 hamptons_jj_westhampton_kb.txt (CloseBot-attached, vetted)
Review flags:
- Business name in the KB ("Hamptons Jiu Jitsu Westhampton Beach") differs from the gym record name ("Hamptons Jiu-Jitsu West"). Confirm canonical name before go-live.
- Kids calendar age bands from calendar names (Kids 4-7 BJJ, Kids 7-12 BJJ) overlap at age 7 and do not match the KB's stated kids bands (4-7 and 8-13). Age 13 falls outside both the kids calendars (max 12) and the adult program (14+). Confirm correct age cutoffs with the gym.
- Wrestling, TRX, and Private Lessons have no matching GHL calendar. Marked not bookable online in this pack.
- No pricing figures included per house rule. KB also notes the source pricing PDF was unreadable, so no figures exist to redirect from anyway.
- This replaces a prior version of this file that referenced a different KB (Muay Thai/MMA programs, phone 631-900-2780). That KB is stale; the current vetted KB has no Muay Thai/MMA and phone +1 631-600-8712.

## 1 - academy_info

```
Business Information: Hamptons Jiu Jitsu Westhampton Beach is a Brazilian Jiu-Jitsu, wrestling, and TRX fitness academy in Westhampton Beach, NY, offering programs for kids and adults ages 4 and up.

Programs Offered:
- Adult Brazilian Jiu-Jitsu (Gi and NoGi, ages 14+): includes Fundamentals and Open Mat sessions, with Intro/Beginner classes on Mondays and Wednesdays.
- Kids Brazilian Jiu-Jitsu (ages 4-7 and 8-13): structured by age group, with a NoGi all-ages session on Fridays.
- Wrestling (ages 4+): grouped by age (4-10, 11-17) plus an all-ages Saturday session. Not bookable online.
- TRX Fitness: functional fitness and strength conditioning on Monday, Wednesday, and Saturday mornings. Not bookable online.
- Private Lessons: available across all programs, including self-defense and Zoom BJJ instruction with the head coach. Not bookable online.

A free trial class is available to all new prospective students, no commitment required. Pricing is not published here; membership and program pricing is discussed with instructors during or after the free trial class.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId hDWtANmj036NvdKuFSFr
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 4-7 BJJ calendarId X3y6elRvXkJYyxDfHDsp for age 4-7.
Use Kids 7-12 BJJ calendarId FbSNzVCyPdTcopLXeuTo for age 7-12.
Age 7 falls in both named bands; default age 7 to Kids 7-12 BJJ calendarId FbSNzVCyPdTcopLXeuTo unless the parent asks for the younger class, then use Kids 4-7 BJJ calendarId X3y6elRvXkJYyxDfHDsp.
If under age 4, do not book, explain the youngest program is Kids 4-7 BJJ, suggest calling +1 631-600-8712, then stop responding.
For ages 13-17, use Adult Fundamentals BJJ calendarId hDWtANmj036NvdKuFSFr, since no kids calendar covers those ages.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults use Adult Fundamentals BJJ calendarId hDWtANmj036NvdKuFSFr. For each child, after saving that child's youth_birthday, calculate age: use Kids 4-7 BJJ calendarId X3y6elRvXkJYyxDfHDsp for age 4-7, use Kids 7-12 BJJ calendarId FbSNzVCyPdTcopLXeuTo for age 7-12, defaulting age 7 to Kids 7-12 BJJ unless the parent asks for the younger class. If a child is under age 4, do not book that child, explain the youngest program is Kids 4-7 BJJ, suggest calling +1 631-600-8712, then stop responding for that attendee. For ages 13-17, use Adult Fundamentals BJJ calendarId hDWtANmj036NvdKuFSFr.
```
