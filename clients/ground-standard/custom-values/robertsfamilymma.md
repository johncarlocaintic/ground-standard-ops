# Roberts Family MMA - Custom Values Pack

Source ID: src_E4ZQBA8ABFBDK5RM
GHL location: aTIcApLzaP3lirDWJfKW
Calendar IDs: VERIFIED-LIVE
academy_info source: v1.1.2 roberts_family_mma_kb.txt (CloseBot-attached, vetted)
Review flags:
- Phone number is missing from the KB ("Phone: [To be provided by client]"). Using the literal placeholder `<gym phone - fill>` everywhere a phone number is called for.
- Two age bands each have two different calendars: age 5-10 has both Kids 5-10 BJJ and Kids 5-10 Wrestling; age 11-17 has both Teens 11-17 BJJ and Kids 11-17 Wrestling. The KB only documents BJJ as the youth program, so the bot needs to ask which class the lead wants and default to BJJ if undecided.
- KB programs with no matching GHL calendar (not bookable online): Kids Striking, Adult All-Levels BJJ (Gi), Adult All-Levels BJJ (No-Gi), Open Training, Female Only Jiu-Jitsu.

## 1 - academy_info

```
Business Information: Roberts Family MMA is a mixed martial arts academy in Orange, MA, training children and adults of all experience levels in Brazilian Jiu-Jitsu, Thai Boxing, and Boxing, plus a weekly Female Only Jiu-Jitsu class.

Programs Offered:
- Kids Brazilian Jiu-Jitsu (Ages 5-17): kids BJJ, Monday and Wednesday evenings.
- Kids Striking (Ages 5-17): striking-based training for kids, Tuesday and Thursday. Not bookable online.
- Adult Thai Boxing: Thai Boxing for adults, Monday and Wednesday evenings.
- Adult Boxing: boxing for adults, Tuesday and Thursday evenings.
- Adult Fundamentals BJJ (Gi): Gi BJJ fundamentals for adults, Monday and Wednesday evenings.
- Adult All-Levels BJJ (Gi): Gi BJJ for adults of all levels, Monday and Wednesday evenings. Not bookable online.
- Adult Fundamentals BJJ (No-Gi): No-Gi BJJ fundamentals for adults, Tuesday and Thursday evenings.
- Adult All-Levels BJJ (No-Gi): No-Gi BJJ for adults of all levels, Tuesday and Thursday evenings. Not bookable online.
- Open Training: Friday open mat, members only. Not bookable online.
- Female Only Jiu-Jitsu (All Ages): weekly women's class, Sunday afternoons. Not bookable online.

Membership pricing varies based on the number of classes attended per week and individual training goals. Instructors discuss pricing and membership options during or right after the free trial class, which is completely free with no commitment required. Pricing is not published here; it is discussed at or after the free trial.
```

## 2 - adult

```
Adult Fundamentals BJJ, calendarId M0e98oYSS3OhOibzw0a4.
Adult Fundamentals No-Gi BJJ, calendarId 3STGgKnHu55zhtcr1cUg.
Adult Boxing, calendarId kwXNyHeQheAHP1wH5wst.
Adult Thai Boxing, calendarId tALj3XaYaItIMsEurjzZ.
Adults default to Adult Fundamentals BJJ calendarId M0e98oYSS3OhOibzw0a4 unless they explicitly ask for Adult Fundamentals No-Gi BJJ calendarId 3STGgKnHu55zhtcr1cUg, Adult Boxing calendarId kwXNyHeQheAHP1wH5wst, or Adult Thai Boxing calendarId tALj3XaYaItIMsEurjzZ, then use that calendarId instead.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
Use Kids 5-10 BJJ calendarId UMhkQHI9icuipqq9ivS2 for age 5-10.
Use Kids 5-10 Wrestling calendarId pWmMHvpwPWvmp1DLXCkT for age 5-10.
Use Teens 11-17 BJJ calendarId huSRlv9vhFd9Q7E9z45k for age 11-17.
Use Kids 11-17 Wrestling calendarId GXWxp7hi6BI2dWGsd9Qc for age 11-17.
For either band, ask whether the lead wants Brazilian Jiu-Jitsu or Wrestling before booking, and default to the BJJ calendarId above if they have no preference.
If under age 5, do not book, explain the youngest program is Kids 5-10 BJJ, suggest calling <gym phone - fill>, then stop responding.
Ages 11-17 are already covered by the Teens 11-17 BJJ and Kids 11-17 Wrestling calendars above, so no separate 14-17 routing is needed.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to Adult Fundamentals BJJ calendarId M0e98oYSS3OhOibzw0a4 unless they explicitly ask for Adult Fundamentals No-Gi BJJ calendarId 3STGgKnHu55zhtcr1cUg, Adult Boxing calendarId kwXNyHeQheAHP1wH5wst, or Adult Thai Boxing calendarId tALj3XaYaItIMsEurjzZ, then use that calendarId instead. After saving each youth attendee's youth_birthday, calculate age. For age 5-10, ask whether they want Kids 5-10 BJJ calendarId UMhkQHI9icuipqq9ivS2 or Kids 5-10 Wrestling calendarId pWmMHvpwPWvmp1DLXCkT and default to BJJ if undecided. For age 11-17, ask whether they want Teens 11-17 BJJ calendarId huSRlv9vhFd9Q7E9z45k or Kids 11-17 Wrestling calendarId GXWxp7hi6BI2dWGsd9Qc and default to BJJ if undecided. If any attendee is under age 5, do not book that attendee, explain the youngest program is Kids 5-10 BJJ, suggest calling <gym phone - fill>, then continue booking the remaining attendees.
```
