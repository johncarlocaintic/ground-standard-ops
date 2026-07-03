# GS Custom Values — status + how to use (for Mark)

**Updated 2026-07-04.**

## What this is
The rollout puts all gym-specific content into **4 GHL custom values** per subaccount (`academy_info`, `adult`, `youth`, `multiple`), read by the one universal template bot. This folder has everything to fill them.

- **`GS-Custom-Values-Packs.docx`** — open this. One section per gym, four copy-paste blocks each. Paste each block into the matching custom value in that gym's GHL (Settings > Custom Values). The status line and Review flags are notes, not payload. Read the "How to use" page at the top.
- **`custom-values/<gym>.md`** — the same packs as markdown, one file per gym (source for the doc).
- **`clickup-kb/<gym>.md`** — the raw reference pulled from Bobby's ClickUp "Client Information Center > Account FAQs", the source the academy_info was written from. Use these if you need to double-check a fact.
- **`sop-universal-bot-rollout.md`** — the procedure (template model, per-gym steps, QA gate).

## Where academy_info came from
- **31 gyms** — from the vetted KB already attached in CloseBot.
- **14 gyms** — from Bobby's ClickUp Account FAQs page. **Pricing was stripped** (no dollar amounts in bot content, per GS rule); redirect to the free trial instead.
- All facts trace to one of those two sources. Nothing invented.

## Ready vs blocked
- **41 gyms are ready to paste** (academy_info + live calendar IDs).
- **3 gyms are BLOCKED — need info from Bobby** (their ClickUp page is image-only or missing): **Cobrinha Southwest, JitzLab Martial Arts, Verde Valley BJJ**. Their packs carry a BLOCKED marker in the academy_info block. Do not paste that block; calendar values are still usable.
- **4 gyms need GHL access from Bobby** before they can be set up: **Paragon Simi Valley, Royal Jiu-Jitsu Queens, SOMA MVMT, Connecticut Submission Grappling**. Connecticut's pack is written but its calendar IDs are placeholders until access lands.
- **Logica** — no CloseBot source connected; not buildable yet.

## Before you paste — confirm the Review flags
Each pack has a **Review flags** section. Where a gym has 2+ adult calendars, overlapping kid age bands, an age gap (e.g. 13 not covered), a name mismatch (e.g. GHL "Mythic Martial Arts" vs ClickUp "Mythic Muscle"), or a `<gym phone - fill>` / `<calendarId - fill>` placeholder, that's flagged. **Confirm those with JC before publishing that gym.** Placeholders must be filled from the gym's GHL first.

## Still open with Bobby
- **Access:** Paragon, Royal Queens, SOMA, Connecticut (re-issue).
- **Info:** Cobrinha, JitzLab, Verde Valley.
