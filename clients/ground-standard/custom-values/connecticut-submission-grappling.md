# Connecticut Submission Grappling - Custom Values Pack

Source ID: src_HRSQZF9XI3T6ARJJ
GHL location: xhLnrLQPaJlXbrf5rDNp
Calendar IDs: PLACEHOLDER
academy_info source: ClickUp - clickup-kb/connecticut-submission-grappling.md
Review flags:
- Gym record has 0 calendars (calCount 0). No calendar access yet - fill all calendar IDs from GHL once access is granted. Every calendarId below is the literal placeholder `<calendarId - fill from GHL UI>`.
- No phone number anywhere in the ClickUp source. The literal token `<gym phone - fill>` is used everywhere a callback number is needed.
- ClickUp source describes no kids or teen program at all - only Foundations and All Levels, both adult-facing. Confirm with Bobby whether this academy runs any youth classes before treating it as adults-only.
- 14-17 routing: since no youth calendar exists or is described, mapped 14-17 to Foundations as the adult beginner fallback, matching the standard rule used elsewhere. Not confirmed with the gym.
- Adult default: picked Foundations over All Levels because the source calls Foundations the class for new grapplers and names Monday-Thursday 6 pm (Foundations) as the ideal slot for new leads, capacity 4 per class.
- Saturday session (10:30-12 pm) has no class-type label in the source - flagged `<fill>` in section 1, and moved to UNMAPPED below pending confirmation.
- Open Mat (Friday, Sunday) and the Friday Women's Only Training are community/non-trial sessions per the standard UNMAPPED categories - moved to UNMAPPED below, no calendars exist for them yet either way.
- Source has no pricing at all (page is schedule + policy text only), so nothing needed to be stripped.

## 1 - academy_info

```
Business Information: Connecticut Submission Grappling is a no-gi jiu jitsu academy in Bridgeport, CT, offering 100% live training scaled to each athlete's experience level. The gym does not teach any other martial art.

Programs Offered:
- Foundations
- All Levels
- Open Mat (Friday, Sunday)
- Women's Only Training (Friday)
- Saturday Session (10:30-12 pm)

Foundations - beginner-friendly no-gi grappling class for students with up to two years of experience, built around live rounds focused on two positions with low variability. Not bookable online.
All Levels - higher-variability no-gi grappling class with standing engagement, recommended for more experienced grapplers; trial students should have some prior grappling experience. Not bookable online.
Open Mat (Friday, Sunday) - open sparring session for the community, held Friday evening and Sunday midday. Not bookable online.
Women's Only Training (Friday) - free training session for women. Not bookable online.
Saturday Session (10:30-12 pm) - class type not specified in the ClickUp source - <fill>. Not bookable online.

New leads are best steered to the Monday-Thursday 6 pm Foundations class, capacity 4 new leads per class. A trial is available for new students; membership pricing is not published in this system and is discussed with a coach at or after the trial. First-class basics: arrive 15 minutes early to sign the waiver, wear shorts and a t-shirt or rash guard with no pockets or metal fixtures, no jewelry, trimmed fingernails, cover any open cuts. Contact: ctgrapple@gmail.com | ctgrapple.com | <gym phone - fill>.
```

## 2 - adult

```
No calendar access yet - fill all calendar IDs from GHL once access is granted.

Foundations, calendarId <calendarId - fill from GHL UI>.
All Levels, calendarId <calendarId - fill from GHL UI>.
Adults default to Foundations calendarId <calendarId - fill from GHL UI> unless they explicitly ask for All Levels, then use All Levels calendarId <calendarId - fill from GHL UI>.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
This academy has no kids or teen calendars mapped - no youth program is described in the ClickUp source at all. If the contact is age 14-17, use Foundations calendarId <calendarId - fill from GHL UI> as the adult beginner fallback. If under age 14, do not book, explain that programs at this academy are for adults, suggest calling <gym phone - fill>, then stop responding.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults (18+) default to Foundations calendarId <calendarId - fill from GHL UI> unless they explicitly ask for All Levels, then use All Levels calendarId <calendarId - fill from GHL UI>. This academy has no kids or teen calendars mapped. Attendees age 14-17 use Foundations calendarId <calendarId - fill from GHL UI> as the adult beginner fallback. For any attendee under age 14, do not book, explain that programs at this academy are for adults, suggest calling <gym phone - fill>, then stop responding.
```

## UNMAPPED - review

- Open Mat (Friday, Sunday) - community/non-trial sparring session, no calendar in the record.
- Women's Only Training (Friday) - free non-trial community session, no calendar in the record.
- Saturday Session (10:30-12 pm) - class type not named in the source, cannot categorize as adult or kids until confirmed with Bobby.
