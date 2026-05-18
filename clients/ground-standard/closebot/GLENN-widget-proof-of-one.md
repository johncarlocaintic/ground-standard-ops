# Glenn handoff: GS widget directory — proof-of-one (allinjujitsu ONLY)

Owner: Idriss. Written 2026-05-19. Scope: ONE gym, allinjujitsu, nothing else.
Do not start Phase 2 or touch any other gym. This whole doc ends at a STOP.

## What we are doing, in plain English

Bobby's CloseBot test UI is too slow to sanity-test gym bots. The fix is a website
where you click a gym and chat its bot live in a chat bubble, and it can book a real
appointment into that gym's calendar. This handoff sets that up for ONE gym only so we
prove the whole chain works before doing the rest.

The chat widget is created INSIDE the gym's existing GHL source. Because it lives in
that source, the bot on that source answers and books into that source's real calendar.

## Hard safety rules (read before doing anything)

1. NEVER touch source `src_GDKORXSW4Q8RQUQ8` (Vacaville production, the only live one).
2. Work on allinjujitsu ONLY. Source `src_PQQCANSMZ8CS09UA` ("All in Jiu-Jitsu").
3. One bot per source at a time. To put the canon bot on the source you must first
   detach the old demo bot from it. Detach is reversible.
4. Read before you write. Run the read-only audit first and confirm reality matches
   this doc before any change.
5. STOP at every gate marked **STOP**. Message Idriss with what you see. Wait.
6. No em dashes anywhere. Plain language.
7. If a UI screen or API response does not look like this doc describes, do not
   improvise or guess. Screenshot it, write down what you see, STOP, ask Idriss.

## The facts for this one gym

- slug: `allinjujitsu`
- GHL source in CloseBot: `src_PQQCANSMZ8CS09UA`, shown as "All in Jiu-Jitsu"
- Canon bot to put live: `All In Jiu-Jitsu - Launch v2.2 [scope guard fix, multi-enrollee] (2026-05-18)`
- Old demo bot to detach first: `All in Jiu-Jitsu Membership Qualification (DEMO)`
- KB file: `clients/ground-standard/closebot/allinjujitsu-kb-v*.txt` (confirm exact filename in repo)
- Env to load for any script: chain-load root then GS:
  `node --env-file=.env --env-file=clients/ground-standard/.env <script>`
  Key used: `CB_GS_API_KEY`. Base `https://api.closebot.com`, header `X-CB-KEY`.

## Step 0 — Read-only reality check (no changes)

Run:
`node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_bot_source_audit.js`

Confirm all three before continuing:
- `All In Jiu-Jitsu - Launch v2.2 ...` shows `sources: GS Ads[src_4R4DUIQTMMX2NFPU]` or `(no sources)` (i.e. it is NOT mid-eval that you would disrupt — if unsure, ask Idriss).
- `All in Jiu-Jitsu Membership Qualification (DEMO)` shows `sources: All in Jiu-Jitsu[src_PQQCANSMZ8CS09UA]`.
- Exactly one bot is on VGA_PROD (Vacaville). Nothing else.

**STOP.** Send Idriss these three lines from the output. Wait for go.

## Step 1 — MANUAL in the CloseBot UI (you, with Idriss watching the first time)

These are UI-only. Confirm the order with Idriss before clicking.

1. Detach the old demo bot from the All in Jiu-Jitsu source.
2. Attach the canon `Launch v2.2` bot to the All in Jiu-Jitsu source.
   - Channel filter: chat widget / Live Chat ONLY. Do not include SMS, FB, IG, email.
   - Tag filter: leave empty (no required tags, no disallow beyond the default).
   - This channel scoping is verified to confine the bot to the widget only. It will
     not bleed to other channels.
3. Create a chat widget INSIDE the All in Jiu-Jitsu source.
4. Widget Allowed Domains: leave blank for now. The Vercel host is not locked yet
   (Idriss decides it in the site step). **STOP** here and tell Idriss the widget is
   created and you need the production host before whitelisting.
5. Find the widget embed snippet. Copy it EXACTLY as shown. Do not edit it. Paste it
   verbatim into a message to Idriss. We need to see its real shape before scripting.

**DISCOVER + REPORT, do not guess:** where exactly the "create widget" control lives,
and the exact embed snippet text. If anything differs from this doc, screenshot, STOP.

## Step 2 — Record the handoff facts

Create `clients/ground-standard/closebot/widget-sources.input.json` with one entry:

```json
{ "allinjujitsu": { "sourceId": "src_PQQCANSMZ8CS09UA", "token": "PASTE_OR_null" } }
```

If the embed snippet contains a token, put it in `token`. If you cannot tell what the
token is, set it to `null` and say so. Do not invent one.

## Step 3 — Scripted verify (Idriss runs or supervises this)

A new script `shared/scripts/closebot/cb_widget_attach_verify.js` does not exist yet.
Idriss writes it. Glenn does NOT write or run new scripts against the account without
Idriss. Your job stops at Step 2 plus the gate below.

## Step 4 — GATE: prove the chain end to end (with Idriss)

On the single deployed gym page:
1. Open it. The chat bubble appears.
2. Say hello. The bot replies.
3. Ask a question only the All In KB answers. The answer is KB-correct.
4. Book a trial as `Tester` with a known test email and phone. Confirm the appointment
   actually appears in the All In Jiu-Jitsu GHL calendar.
5. Delete that test appointment in GHL so the calendar is clean.

**STOP.** Send Idriss: the page URL, a transcript, and a screenshot of the booked then
deleted appointment. Do not proceed to any other gym. This handoff is complete here.

## What is still unknown (report findings, do not solve alone)

- Exact CloseBot UI path to create a widget inside a source.
- The real embed snippet shape (may not be the `cb.js?source=` pixel).
- Whether `GET /source/{id}` returns the widget token (Idriss probes this).
These get answered by reporting what you see, not by improvising.
