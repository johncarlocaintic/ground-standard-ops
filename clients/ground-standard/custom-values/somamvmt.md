# SOMA MVMT - Custom Values Pack

Source ID: src_R05QT50QS4PTYDBG
GHL location: dIyjbKFHzS4MRBKtd7oQ
Calendar IDs: NAMES-ONLY
academy_info source: ClickUp - clickup-kb/soma-mvmt.md

Review flags:
- Calendar IDs are NAMES-ONLY - the only calendarId below is a placeholder token, fill from GHL UI before use.
- Only one calendar exists on this gym record, "SOMA MVMT Introduction Class," and its name carries no age band. The ClickUp page describes a general functional-fitness studio, not a youth program - cannot confirm from the record or the ClickUp text whether SOMA MVMT serves minors at all. Confirm with the gym before build.
- No phone number is in the ClickUp source - phone placeholders in the youth and multiple blocks need a manual fill.
- No minimum bookable age is stated in the ClickUp source - "<youngest bookable age - fill, confirm with gym>" and "the youngest program is <fill>" are left as placeholders below.
- The ClickUp text describes three class formats (general fitness class, Saturday M.A.D. class, Sunday Steel Mace Flow) with no calendar of their own in the record. Marked "Not bookable online" in section 1.
- The ClickUp text's booking link (somamvmt.studio.xplor.co) is a separate Xplor scheduling site, not GHL. Excluded from the values below; only the GHL Introduction Class calendar is used for bot bookings.
- All fee/pricing references in the ClickUp text (drop-in fee refund policy, membership options link) were stripped per the no-pricing rule. Only the free-trial and human-redirect framing was kept in section 1.

## 1 - academy_info

```
Business Information: SOMA MVMT is a functional fitness studio in Maplewood, New Jersey, located at 6 W Parker Ave.

Programs Offered:
- Group Fitness Class: 60-minute coach-led session with warm-up, strength training, metabolic conditioning, and a cool-down with recovery and breathwork, capped at 12 people per class. Not bookable online.
- M.A.D. Class: Saturday specialty class. Not bookable online.
- Steel Mace Flow: Sunday specialty flow class. Not bookable online.
- Introduction Class: first visit for new members before joining regular classes.

Pricing is not published here. Drop-in and membership options are discussed with a coach at or after the Introduction Class.
```

## 2 - adult

```
SOMA MVMT Introduction Class, calendarId <calendarId - fill from GHL UI>.
```

## 3 - youth

```
After saving contact youth_birthday, calculate age.
No dedicated youth calendar exists for this gym - the record has only one calendar, SOMA MVMT Introduction Class, with no age band in its name. Confirm with the gym whether this calendar is open to youth before using it for a youth booking.
If under age <youngest bookable age - fill, confirm with gym>, do not book, explain the youngest program is <fill>, suggest calling <gym phone - fill>, then stop responding.
For age 14-17, no kids calendar covers this range, so use SOMA MVMT Introduction Class calendarId <calendarId - fill from GHL UI>.
```

## 4 - multiple

```
Book each attendee by their own rules. Adults default to SOMA MVMT Introduction Class calendarId <calendarId - fill from GHL UI>. No dedicated youth calendar exists for this gym - confirm with the gym whether the Introduction Class is open to youth before booking a minor through it. If under age <youngest bookable age - fill, confirm with gym>, do not book, explain the youngest program is <fill>, suggest calling <gym phone - fill>, then stop responding. Ages 14-17 use SOMA MVMT Introduction Class calendarId <calendarId - fill from GHL UI>.
```
