> **STATUS: DRAFT — do not execute yet.** Blocked on **Part A** (the universal template must be finished so all four info/calendar sections read from custom values, with zero hardcoded gym data) and on Bobby's confirmation of the ~50-account list. Read and prep, but do not build on an unfinished template. Pushed 2026-07-03.

# GS Universal Bot Rollout — SOP (for Mark)

**The model in one line:** ONE universal bot template, and every gym-specific thing lives in **4 GHL custom values**. You never hand-edit the bot per gym. You fill 4 custom values per gym.
**Persona:** front to Bobby as **JC**. Never name Mark or anyone. Time expectation: ~**8h for all ~50** (~10 min/gym). Give an **EOD report** + **Slack updates**.
**Template bot:** `Martial Arts Studio - Template` (`bot_QMH9HO6O5DM5NAN1`).
**Logged:** 2026-07-03.

---

## 0. How it works

The template is an Agent Node bot. Content comes from three places:
- **Auto-fills from the subaccount, zero work:** `{{location.name/address/phone/email/website}}` + contact fields (`first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `youth_name`, `youth_birthday`).
- **4 GHL custom values, set per gym (THE JOB):**
  - `{{custom_values.academy_info}}` — short business/programs info.
  - `{{custom_values.adult}}` — adult calendars + calendar IDs (the "Choose Adult Calendar" content).
  - `{{custom_values.youth}}` — kids calendars mapped to age bands + IDs (the "Choose Calendar by Age" content), including the under-min and 14-17 rules.
  - `{{custom_values.multiple}}` — all calendars for multi-attendee booking (the "Choose Each Calendar" content).
- The bot resolves `{{custom_values.X}}` from whichever subaccount the conversation happens in, so **one template serves every gym**.

---

## 1. Part A — finish the universal template (one-time, do FIRST, get it signed off)

The template is currently mid-conversion: only `academy_info` is externalized; the three calendar sections still contain **Gracie Farmington Valley's hardcoded content + IDs**. Before any rollout:

1. Confirm with JC whether Bobby already finished this or it's ours to do.
2. In the template, change the body of each calendar section to reference the custom value instead of hardcoded text:
   - "Choose Adult Calendar" → `{{custom_values.adult}}`
   - "Choose Calendar by Age" → `{{custom_values.youth}}`
   - "Choose Each Calendar" → `{{custom_values.multiple}}`
3. In "Important business information," delete the leftover hardcoded Gracie business text so it relies only on `{{custom_values.academy_info}}`.
4. Result check: search the template KDL, there must be **zero** gym names and **zero** hardcoded calendar IDs left. If any remain, it's not finished.
5. This finished template is the "first build" to show Bobby before scaling.

---

## 2. Part B — per-gym procedure (the repeatable ~10 min, all in GHL)

You are NOT editing the bot. You are filling 4 custom values in the gym's GoHighLevel, then attaching the finished template.

For each gym:
1. Open the gym's **GHL → Settings → Custom Values**. Confirm the 4 keys exist (`academy_info`, `adult`, `youth`, `multiple`); create any missing.
2. Get the gym's **real calendar IDs** from GHL → Calendars (the API only exposes calendar NAMES, not IDs, so read the IDs here by hand).
3. Fill the custom values with THIS gym's content:
   - **academy_info:** short business/programs summary, written from the gym's uploaded docs. Keep it SHORT (long broke the bot before).
   - **adult:** each adult calendar as `<Name>, calendarId <ID>` (one per line).
   - **youth:** each kids calendar mapped to its real age range + ID, e.g. `Use Kids 6-8 BJJ calendarId <ID> for age 6-8.` Plus: under the gym's youngest age → don't book, tell them to call `{{location.phone}}`, stop. 14-17 → the gym's adult-beginner calendar. **Age bands differ per gym, use the gym's real calendars, never copy another gym's.**
   - **multiple:** all of the gym's calendars (adult + kids) so multi-attendee booking picks the right one.
4. Attach the finished template to the gym's source. Add the trigger tag Bobby uses + the `ai off` exclude. Ensure no old/duplicate/Template bot is left on that source.
5. Run the QA gate (Section 3). Mark done in the tracker.

---

## 3. Per-gym QA gate — do NOT mark done until this passes

Test each path and confirm each booking lands on the **correct calendar in that gym's GHL**:
- Adult books self.
- A kid in EACH age band → right kids calendar.
- A kid under the youngest age → refuses + points to phone, does not book.
- A 14-17 year old → routes to adult beginner.
- Multiple (parent + 2 kids of different ages) → each on the correct calendar.
- Contact fields save (name/email/phone/DOB, youth name/birthday).

---

## 4. Practice protocol (before the 50)

1. Get Part A done + JC-approved first.
2. Pick ONE practice gym. Fill its 4 custom values. Test on the **GS Ads sandbox source** (`src_4R4DUIQTMMX2NFPU`) first so no live gym gets test bookings.
3. Run the full Section 3 QA. Fix.
4. Show JC → JC shows Bobby → sign-off.
5. Then scale in small batches, QA each, keep the tracker current.

---

## 5. Tracking + cadence
Spreadsheet: `gym | source | academy_info | adult | youth | multiple | filter+ai off | QA passed | notes`. Slack updates through the day, EOD when the batch is done.

---

## 6. Landmines (do-not-repeat)
- **Do not leave any gym-specific content in the template** (Part A step 4). A leftover ID or gym name gets cloned to everyone.
- **Age bands are per-gym.** Build each gym's `youth` custom value from that gym's real calendars, not another gym's.
- **Calendar IDs are read from each gym's GHL by hand** (API gives names only).
- **youth_birthday "won't save":** Bobby said to "just remember" it. This looks like the old Vacaville bug where a **GHL workflow overwrote** Youth Name/Birthday with the literal word "Update." Check the gym's automations before accepting it as permanent.
- **Dirty sources:** 10th Planet Miami has 2 open bots; Gracie Farmington Valley has a stray open `Template` bot on its real source. Detach the extras before activating.
- **`ai off` missing fleet-wide:** add it to every source on activation.
- **academy_info short**, always.

---

## Open items to confirm (with JC / Bobby)
1. Is Part A (finished template referencing all 4 custom values) done by Bobby, or ours?
2. Are the `adult`/`youth`/`multiple` custom values already populated on the gyms, or just created empty? (Couldn't verify via API, token scope.)
3. The authoritative list of the ~50 subaccounts (CloseBot's list won't enumerate reliably).
