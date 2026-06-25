---
name: Martial Arts Multi-Kid Contact Design
description: Adult = GHL contact. Kids never contacts. Multi-kid packed comma-separated in single Youth Name/Birthday field — don't split into synthetic Kid 2/3 fields
type: feedback
originSessionId: 44892c1f-edef-4b2d-b157-910ea7c52c1a
---
Martial arts bots (GSA gym clients) must follow this contact model:

1. **Adult/guardian = the GHL contact.** First name, last name, DOB, email, phone — collected for the adult, written to `contact.*` root fields.
2. **Kids are NEVER GHL contacts.** Kid info lives in custom fields on the parent's contact record.
3. **Vacaville (and Bobby's templated snapshot across all gyms) has ONLY `Youth Name` [TEXT] and `Youth Birthday` [DATE] — singular fields.** No structural support for N kids.
4. **Multi-kid handling: pack with commas in the single Youth Name/Birthday field.** E.g. `Alice Smith, Bob Smith, Charlie Smith`. Each kid still gets its own calendar booking (different programs/ages), but the contact record holds the combined string.
5. **Do NOT request Bobby add synthetic `Youth Name 2/3` fields.** Schema is a templated snapshot across 40+ gyms — changing it for one client creates divergence.

**Why:** JC confirmed this is Bobby's setup (April 20, 2026). The templated GHL snapshot is the source of truth; bot design conforms to it, not the other way around.

**How to apply:** when building/auditing any GSA martial arts bot, the kid info flow should:
- Collect each kid into a separate intermediate variable (`kid1_name`, `kid2_name`, etc.)
- At end of flow, concatenate with `", "` and write once to `contact.youth_name`
- Same pattern for `contact.youth_birthday`

The common subtle bug: writing all kids to `contact.youth_name` directly with `SkipIfNotBlank: false` — each kid overwrites the previous, and only the last kid's data persists on the parent contact. Per-kid bookings still succeed because the value is correct at booking time, but the contact record ends up wrong.
