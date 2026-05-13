# Lessons Learned
*Append-only. New entries go at the TOP. Never edit old entries — they are the historical record.*
*When a pattern repeats 3+ times or proves fundamental → graduate to CLAUDE.md or a skill.*

---

## KB build pipeline — operational patterns established (2026-05-14)

Six KBs built this session (Gracie Farmington Valley, Gracie JJ East San Jose, Grit JJ & Muay Thai, Hammer Sports, Hamptons JJ, Inverted Gear Academy). Patterns that apply to every future KB build:

**Mismatch table ships with the KB — always.**
User corrected mid-session: the ClickUp vs website mismatch table must be included in the same response as the KB draft. Do not wait to be asked. Saved to memory `feedback_kb_mismatch_after_build.md`. Two-column format when sources are clean; split into two tables when ClickUp itself has internal conflicts (grid vs text note).

**Live schedule links are frequently broken.**
Schedule.hjj.live, Gymdesk links, bjjlink.com all returned 404 or empty shell pages during Hamptons JJ build. Do not treat external schedule links as reliable. Use ClickUp grid image as primary; flag currency as a critical gap.

**Cancel/Freeze screenshots = member personal data. Exclude entirely.**
Hamptons JJ ClickUp had a cancel/freeze log screenshot with member names and dates. Correct action: exclude entirely — don't reference the screenshot, don't extract any data from it, don't note its existence in the KB.

**Voicemail scripts at top of ClickUp pages = operational content. Exclude from KB.**
Several ClickUp PDFs open with a voicemail script block. This is staff-facing operational content. Never include in the KB.

**Internal ClickUp conflicts are common and must be surfaced.**
Hammer Sports and Grit both had schedule grids that disagreed with text notes in the same PDF. These are not ClickUp-vs-website mismatches — they are source credibility issues. Flag both versions explicitly in Section 11 and in the mismatch table under a separate "Internal ClickUp Conflicts" heading. Use the grid as primary when no other indication is given.

---

## Two recurring KB instructional language patterns — now standardized (2026-05-09)

Found these same issues in both the Academy Eden Prairie and Academy of Jiu-Jitsu Scottsdale KB builds. They are likely present in all existing GSA KBs not yet reviewed.

**Pattern 1 — "See Section X" cross-references**
Example: `"Open Mat is invite only — see Section 5 for requirements."`
Why it's a problem: The bot reads this as an instruction to look somewhere else. It inlines the reference as a directive rather than providing the fact.
Fix: Delete the cross-reference. Inline the actual fact where it's needed.
`"Open Mat is invite only. Requires coach invite."` ← correct

**Pattern 2 — Pricing bypass via "discussed directly with staff"**
Example: `"Pricing details are discussed directly with instructors and staff."`
Why it's a problem: Gives the bot a resolution path — "talk to staff" — that bypasses the trial booking node entirely. The bot will tell leads to contact someone rather than routing them to the booking flow.
Fix: Remove the "discussed with staff" clause. Pricing section should only state that pricing is not published and that a free trial is available.
`"Membership pricing is not published. A free trial class is available with no commitment required."` ← correct

**Pattern 3 — Imperative hygiene / policy lines**
Example: `"Shower before class."` / `"Wash your gi after every class."`
Why it's a problem: Phrased as commands. Bot may output these as directives to leads.
Fix: Restate as declarative policy facts.
`"Showering before class is required."` / `"Gi uniforms are washed after every class."` ← correct

Apply these checks to every KB before deploy. They will not be caught by a simple regex scan — requires line-by-line reading.

---

## EOD reports must always use bullet format (2026-05-08)

First EOD produced this session used flat unformatted lines. User corrected immediately — every body line must be prefixed with `•`. Updated `eod-report` SKILL.md to enforce this. Memory saved. Apply regardless of skill state.

---

## Declared "/duplicate works" from a 30-min N=2 success window without verifying anything below the surface (2026-05-04) 🔑

**What happened:** Probed CloseBot `POST /bot/{id}/duplicate` at 19:38 UTC. Bot replied to "Hi" in 5.3s with persona-aware text. Queried `GET /bot/{id}` and saw `personaIds: ["pers_..."]`. Declared in writing: "/duplicate inherits persona, KDL graph, settings". Built a standardization recommendation around that claim.

User pushed for stress testing before standardizing. N=5 parallel duplicates: 0/5 inherited persona, 0/5 responded. N=3 sequential after cleanup: 0/3 inherited persona, 0/3 responded. Direct field-by-field diff between source bot and fresh duplicate showed `personaIds`, `tools`, and `sources` ALL empty in the duplicate. The "success" was a 30-minute window earlier in the day. The earlier 14:13 UTC deploy probe had ALREADY shown personaIds empty in a /duplicate result, which I overlooked.

**What I actually verified during the success window vs what I claimed:**
- Verified: `personaIds` field populated (one field check), bot replied to one "Hi" message
- Claimed: "duplicate inherits persona, KDL graph, settings, works at all levels"
- Did NOT verify: botSteps content equality, multi-turn flow, end-to-end booking, per-node settings, tool registration at any level beyond the top-level array, full conversation completion, source-attached behavior

**Why this happened:** Two compounding errors. (1) Confused "looks right at the surface" with "works end-to-end" by extrapolating a single-turn reply into a confidence claim about all subsystems. (2) Picked the most favorable data window (the 19:38 probes) and ignored contradicting earlier data (the 14:13 deploy probe with empty personaIds was already in the logs).

**Rule going forward:** before declaring an API path or feature "works", prove all of:
1. Direct content equality where applicable (e.g. botSteps diff, not just "personaIds is non-empty")
2. End-to-end functional run (multi-turn conversation, real booking, real GHL artifact verification)
3. Repeatability across N>=5 samples in varied conditions (sequential AND parallel, different times of day)
4. Active search for contradicting historical data BEFORE making the claim, not after pushback

A "200 OK + one reply" is not validation. It is a hint that the path may work, and the only honest thing to say is "preliminary single-sample positive, not yet stress-tested." The claim "this works" requires the four things above.

**Cost:** ~2 hours of unnecessary investigation rabbit holes (vendor-blame, parallelism hypothesis, account-clutter hypothesis) that all collapsed once the actual stress test exposed the lie. User caught the overconfidence and forced the right test.

---

## Vacaville bot overhaul — 3-day investigation, 5 bugs fixed, methodology reusable (2026-04-29 to 2026-05-01) 🔑

**What happened:** Started with multi_kid_family + comprehensive_happy_path hallucinating bookings (~1/3 conversations affected, 0 actual GHL appointments while bot claimed "you're all set"). 3 days of structured investigation surfaced 5 distinct bugs. Final state: 5/6 personas PASS, only kid_only md_06 downstream still broken.

**Bugs diagnosed and fixed:**
1. `Unaccompanied Minor Referral` ScenarioCustom hijacking parent-with-kid flows (LLM judge ignoring compound description gates) — removed and rebuilt as `Lead Is Self-Enrolling Minor` with threshold 8 + tightened "field {{contact.X}}" syntax
2. `n10_intro` staying active 7+ turns and fabricating booking confirmations from inside intro — added "DO NOT DISCUSS BOOKING OR AVAILABLE SLOTS IN THIS NODE" instruction, intro now exits in 2-3 turns
3. Test contamination of Vacaville production GHL via misconfigured `MIMIC_SOURCE_ID` default — built hard guardrail in orchestrator + sweep that requires `ALLOW_PROD_MIMIC=true` to bypass
4. Bot skipping first_name persistence when "Testing" placeholder existed — added MUST clause + randomized firstName pool to break "Tester ≈ Testing" LLM ambiguity
5. Verifier name-morph blind spot — built 3-tier match (primary / email-fingerprint fallback / tag fallback) + cross-run collision guard

**Methodology that worked:** 3-source cross-reference per failure (transcript + CloseBot SSE events + GHL ground-truth). When all three agreed, diagnosis was solid. When they disagreed, the disagreement WAS the bug. This methodology now saved as memory `feedback_closebot_logs_standard.md`.

**Test infrastructure built (reusable for other clients):**
- Source-routing guardrail in orchestrator + sweep
- Randomized identity tester
- 3-tier verifier
- 6-persona sweep (~22 min end-to-end)
- N-times repeater for non-determinism testing
- Calendar audit + cleanup scripts
- Per-bot sweep script template

**Lesson:** when a bot has multiple recurring failures across personas, the dominant pattern is upstream architecture (intro leaking responsibility, scenarios hijacking, source-routing misconfigured) rather than node-specific bugs. Fix architecture first, downstream bugs become visible and isolatable.

**Reports:** `clients/ground-standard/vacaville_bot_overhaul_report.md` (technical) + `vacaville_bot_summary_for_bobby.docx` (client-facing).

---

## Theorized from error string instead of verifying — 2× in one session (2026-04-30)

**What happened:** Investigating why `comprehensive_happy_path` booked 0 appointments. The bot's `check_availability` calls returned "Could not find a calendar with ID 'GWdabDvAgRFHZGsBN9Fq'." I labeled the ID "stale," invented a story about Vacaville production IDs replaced over time, and recommended updating both the bot KDL and the `tasks/todo.md` Key IDs table. After JC corrected the source mislabeling (the bot is on GS Ads source, not VGA prod), I doubled down with a new fabricated story — "Vacaville prod IDs hardcoded but bot now sourced from GS Ads sandbox." JC sent a GS Ads UI screenshot showing both `GWdabDvAgRFHZGsBN9Fq` (Kids 7-13) and `KKR9rxFq16DS0fykxXMa` (Adult No-Gi) as active GS Ads calendars right now. The IDs are not stale. The actual root cause of the "not found" error remains unverified.

**Why this happened:** I treated the error string as ground truth without querying GHL `/calendars` directly. Then when corrected, I generated a second plausible-sounding explanation instead of stopping to verify. Confident fiction reads like progress but costs the user more time than admitting uncertainty.

**Lesson:** Never construct a "the cause is X" claim from an error message alone. The next action after any unexplained error is to hit the underlying system (GHL list-calendars, CloseBot export, GHL fetch-contact) and observe ground truth. If verification can't be done quickly, say "unverified hypothesis — would need to check Y" rather than presenting theory as finding.

**Saved as memory:** `feedback_verify_before_diagnosing.md`.

---

## Vacaville sweep — 6 personas, 4 distinct bot bugs surfaced (2026-04-29T12:30Z) 🔑

**What happened:** Ran a 6-persona sweep against Vacaville test bench `bot_J56AWZ5TYQI9HKJS` v0.0.16 to validate it before broader use. Each persona exercised a different rubric slice. Results:

| Persona | Verdict | Notable |
|---|---|---|
| `cooperative_scheduler` | PASS | 2 real bookings, full capture (yesterday) |
| `kid_only` | PASS | Minor referral flow worked end-to-end |
| `multi_kid_family` | FAIL | Routing correct, **HALLUCINATED bookings** |
| `adult_only` | PASS | 1 real booking, ⚠️ silent **day-switch (Wed→Thu)** |
| `hostile_aggression` | PASS | Aggression handoff fired correctly |
| `comprehensive_happy_path` | FAIL | Edge cases nailed, **HALLUCINATED bookings** |

**Four distinct bugs surfaced:**

1. **Booking hallucination** when info arrives in bulk OR multiple enrollees. Bot improvises "you're all set" without calling `@@[Book Appointments]`. Customer-trust breaker. mnd_05 violation. Root cause: Agent Node soft-instructions don't prevent shortcutting when bot has "enough info" without going through structured collection.
2. **Day-switching regression** (logged earlier this week): bot agreed Wed, booked Thu, claimed Wed in confirmation. Same n30_book pattern keeps recurring.
3. **Phone capture broken** (logged earlier): every test contact across 2 days has `phone: undefined` regardless of format. Not a format issue — LLM selectively drops phone from Update Contact tool calls.
4. **Verifier blind spots** for non-standard contact identities: aggression handoff leaves contact as default "testing -", kid-only morphs contact to parent. Verifier needs scenario-specific fallbacks.

**Working as designed (proven across multiple personas):**
- Saturday handling (firm "no")
- Kids 3-5 age-out (firm "no")
- Pricing pressure (deflects, doesn't cave)
- Aggression handoff (tags + ends)
- Minor referral data model (kid → youth_*, parent → main contact)
- Single-adult booking
- Multi-kid age routing (5yo age-out, 9yo Kids 7-13, 14+yo Adult)

**Generalization:** behaviorally-correct conversation isn't sufficient evidence of operational success. The bot can SOUND right while skipping every tool call. Verifier-against-GHL is mandatory; transcript-only QA is a false-positive factory.

**Implication:** before declaring any bot "good to go," sweep across personas that vary on (a) info-collection cadence (sequential vs bulk) and (b) enrollee count (one vs many). These two dimensions surface the most bugs.

---

## CloseBot ScenarioCustom misfires when Description doesn't anchor on the LEAD's specific variable (2026-04-29T12:35Z) ⚠️

**What happened:** Unaccompanied Minor Referral scenario fired during a multi-kid PARENT enrollment. Description was: "Lead is not a consenting adult and is under 18 with no parent or guardian identified as the booking party." The LLM evaluator saw kid DOBs (2010, 2016, 2020) in conversation context, interpreted "minor involved" as "lead is the minor," and fired. Result: parent's booking flow was hijacked, no appointments created, contact was incorrectly tagged `unaccompanied_minor` + `parent referral lead`.

**Fix:** rewrote Description to explicitly anchor on `{{contact.date_of_birth}}` (the LEAD's DOB, not generic conversation context):
> "{{contact.date_of_birth}} is set and indicates the contact themselves is under 18 years old today (born 2008 or later) AND must not have {{contact.tags}} 'interested - adult'."

After fix: re-ran multi-kid persona; scenario correctly did NOT fire (parent DOB year 1988 ≠ 2008+). kid-only persona still fires correctly (kid DOB year 2014 ≥ 2008).

**Pattern:** every ScenarioCustom Description must reference the SPECIFIC variable that disambiguates the trigger condition from adjacent cases. Generic "is X" language is fragile because the LLM evaluator interprets context broadly. Anchor on `{{contact.date_of_birth}}`, `{{contact.tags}}`, `{{contact.<custom_field>}}` — whatever uniquely distinguishes the case.

**Detection heuristic:** when reviewing a scenario, ask: "is there a specific contact variable whose value definitively determines whether this should fire? If yes, the description must reference it explicitly. If no, the trigger is fragile."

**Threshold note:** also raised from 6 → 7 to require stronger evidence. Combined with the variable anchor, eliminates the misfire.

---

## CloseBot phone field rejects NANP-invalid formats — use real area code + 555 fictional exchange (2026-04-29T11:55Z)

**What happened:** Across 6 test contacts created over 2 days, every single one had `phone: undefined` despite the persona providing a phone number. Investigated — turns out:
- Old format `555-XXX-XXXX`: invalid NANP (555 is reserved as fictional area code, not a valid area code at all)
- Real leads in Vacaville GHL have phones in E.164 format like `+16096613601`

Fix in `shared/scripts/closebot/eval/tester.js` `generateTestIdentity()`:
```js
const usAreaCodes = ['415', '510', '650', '707', '925']; // Bay Area
const area = usAreaCodes[Math.floor(Math.random() * usAreaCodes.length)];
const subscriber = String(100 + Math.floor(Math.random() * 100)).padStart(4, '0');
phone: `+1${area}555${subscriber}`  // e.g. +14155550150
```

This generates a format-valid, NANP-conformant, fictionally-reserved number (NANP reserves 555-0100 to 555-0199 as the "fictional" exchange when paired with a real area code).

**However:** even with the fixed format, phone STILL doesn't save in GHL test runs. So format was a real issue but not the only one. The LLM is selectively dropping `phone` from its Update Contact tool calls. Separate bug to investigate via SSE event capture.

**Memory updated:** `feedback_test_identity_randomization.md` — phone format change.

---

## CloseBot support's "empty ScenarioCustom Description" theory was wrong (2026-04-29T03:50Z)

**What happened:** CloseBot live support told JC the runtime silence on freshly-created Agent Node bots was caused by ScenarioCustom nodes having empty Description fields (specifically the legacy `ns06_knowledge_gap_handoff` had `Description ""`). Tested by deploying v0.0.15 with the empty-Description scenario removed AND v0.0.15.1 with both removal + saveTools registration. Both still silent at turn 1.

**Real root cause:** `POST /bot { importKdl }` endpoint produces dead-on-arrival bots when the KDL has Method (Agent) nodes — confirmed across 3 deploy attempts today and the original 2026-04-25 incident. The existing test bench (`bot_J56AWZ5TYQI9HKJS`) only runs because it was created via the `POST /bot/{id}/duplicate` workaround before the broken backend landed.

**Pattern:** vendor support theories need empirical validation before being treated as authoritative. They might be diagnosing a different symptom than the one we're hitting.

**Implication:** for any new Agent Node bot work, fresh-create-via-importKdl is a dead path. Either UI-edit the existing working bot, or use the duplicate endpoint to copy a working bot. KDL changes can only be applied via UI (no in-place flow update API per the 2026-04-24 lesson).

---

## Eval verifier needs scenario-specific identity fallbacks (2026-04-29T09:30Z)

**What happened:** verifier originally searched GHL by `identity.email` / `identity.phone` / `identity.fullName` from the synthetic test identity in `tester.js`. This worked for cooperative_scheduler (contact stays as the test identity). But:

- **kid-only persona:** contact gets morphed into the parent during the minor-referral flow. Email becomes `sarah.{{lastName}}@example.com`, name becomes `Sarah {{lastName}}` — none match the kid-shaped test identity.
- **aggression-handoff persona:** contact never gets enriched (handoff fires before any data collection). Default name stays `testing -`, no email/phone.

**Fix:** added recency+tag fallback to `verifier.js`'s `findContact()`. After identity-based search returns empty, the verifier:
1. Fetches the 30 most recent contacts from GHL (sorted desc by date)
2. Filters by run-window (`runStartMs - 60s` to `runEndMs + 60s`)
3. Looks for contacts with minor-referral tags (`unaccompanied_minor`, `parent referral lead`)
4. Returns the most recent match

Orchestrator now passes `runWindow` into the verifier.

Also added `md_06` override: when GHL shows minor-referral data is correctly persisted (youth_name + youth_birthday + tags + zero appointments), QA's md_06 fail/flag → pass.

**Pattern:** verifier searches need to know what kind of test ran. Different scenarios produce different "endpoint" contact shapes. A single search-by-identity strategy is insufficient.

**Open follow-up:** add aggression-handoff fallback (search recent contacts for `aggression detected - human handoff` tag within run window).

---

## QA-only verdicts lie about bookings — verify against GHL before trusting (2026-04-28T11:00Z) 🔑

**What happened:** Vacaville eval run scored `FAIL` on `mnd_05` (false closure) — QA agent flagged "you're all set" without seeing booking-tool success in transcript. Cross-checked GHL: Tester Nolan's contact `RWrF4ESRLJxqHWTAdcJR` had two real appointments (Adult No-Gi Mon 5/4 6:30 AM + Parker Nolan Kids 7-13 Mon 5/4 5:15 PM) and tag `appointment booked`. The closure was real; the QA flag was a false positive.

**Root cause:** GPT-4o QA agent only sees the transcript — it can't see CloseBot tool-call success/failure unless we surface it. Bot's "you're booked" is judged on its face, not against ground truth.

**Fix shipped (2026-04-28):** Added `shared/scripts/closebot/eval/verifier.js` to the eval pipeline. After QA scores transcript, verifier:
1. Looks up GHL contact by email → phone → fullName (using identity from tester.js)
2. Pulls contact details (tags, custom fields) and `/contacts/{id}/appointments`
3. Overrides `mnd_05` fail → pass when ≥1 appointment exists
4. Overrides `md_02` (DOB collected) fail → pass when DOB-shaped custom field is populated
5. Recomputes `blocker_fails`/`overall_verdict` from rubric levels
6. Writes `verified_score.json` + `ghl_facts.json` next to `score.json`

**Pattern:** **Behavioral scores from LLM QA are not factual claims about the world.** Anything that hits an external system (booking, tag, contact field write) needs a verifier step that pulls ground truth and overrides the LLM verdict. Treat the QA agent as "did the bot SAY the right thing", treat the verifier as "did the right thing actually HAPPEN".

**Detection heuristic:** any rubric checkpoint phrased as "X must succeed" or "no false confirmation of X" is a verifier candidate. Pure conversational checks (tone, hedge language, prohibited words) stay with QA.

**Generalization:** when scoring an LLM-driven system that takes real-world actions, the eval needs two passes — behavioral (transcript-only) + factual (ground-truth lookup). One alone is insufficient.

---

## GPT QA agents have weak date arithmetic — pre-compute the facts (2026-04-28T11:05Z) ⚠️

**What happened:** Vacaville eval rubric checkpoint `md_03` (route under-7 kids to age-out, not booking) flagged a fail when persona's kid Parker Nolan's DOB was March 15, 2017 → age 9 as of 2026-04-28 (well above the 7-year minimum). QA agent miscalculated and assumed under-7. False fail.

**Root cause:** GPT-4o (and similar) is unreliable at multi-step date math under pressure. Asking it to parse "March 15, 2017", subtract from today's date, and apply a rubric rule in one pass produces inconsistent results.

**Fix shipped (2026-04-28):** Added `computeAgeAnnotations(transcript, runDate)` to verifier.js. Orchestrator runs it before QA, scans lead messages for DOB patterns (`YYYY-MM-DD`, `MM/DD/YYYY`, `Month DD, YYYY`), and injects a deterministic block into the QA prompt:

```
CALCULATED AGES (deterministic — trust these over your own date math):
- T7: DOB 2017-03-15 → age 9 as of 2026-04-28
```

QA agent now references the pre-computed value instead of doing the math itself.

**Pattern:** **Don't ask LLMs to do arithmetic the eval depends on. Pre-compute deterministic facts and inject them as authoritative inputs.** Same logic applies to: date math, currency conversion, percentage rounding, time-of-day comparisons. If a rubric verdict hinges on a numeric computation, do the computation in code first.

**Detection heuristic:** if a rubric checkpoint mentions "ages X-Y", "before date", "more than N", "less than N" — bake the calculation into the orchestrator and inject the result. Don't rely on the LLM.

---

## Phone numbers in bot output may be in the KB — grep before crying hallucination (2026-04-28T11:10Z)

**What happened:** Investigated suspected hallucination of phone "707-232-2500" in Vacaville bot output. Initial reflex was "Agent Node hallucinated a phone number." Grepped KB — number is in `clients/ground-standard/closebot/kb/vacaville_v2_3_2.md` lines 69, 72, 243. Bot was correctly retrieving from KB, not fabricating.

**Pattern:** Before declaring "the bot hallucinated X", run a grep across the KB(s) attached to the bot's source. If X is in there, it's grounding, not hallucination — the question becomes whether the KB SHOULD contain X (separate problem).

**Detection heuristic:** any "the bot is making up Y" claim → 30-second grep across the bot's source KBs first. Skips the entire prompt-engineering rabbit hole when the answer is "we put it there."

---

## Vacaville multi-kid data model — appointment titles are the source of truth, not contact fields (2026-04-24) 🔑

**What happened:** Spent part of a session architecting solutions for the "multi-kid mixed-program family" problem (7yo Kids 7-13 + 14yo Adult No-Gi siblings on one parent contact). Was about to add `contact.youth_birthday` writes, consider splitting kids into separate contacts, etc. Then JC surfaced a GHL audit (`clients/ground-standard/ghl/raw/2026-04-24_multi_kid_audit/`) that flipped the premise.

**The audit data (94 appointments across 62 contacts, 36 youth-tagged, 47 youth_name-populated):**
- `contact.youth_name` custom field: **zero real kid names**. 47 rows with literal `"Update"` (legacy artifact, probably CSV import or old workflow default), 29 rows `null`. Our KDL's `n79_write_youth_name` writes to a field nothing reads from.
- `contact.youth_birthday` (DATE): single slot, cannot hold multiple.
- **AJ Frere contact** (`THXMSkCwSmE6D2hILO6E`) demonstrates the ACTUAL working pattern: one parent contact, two appointments on two DIFFERENT calendars (Kids 7-13 + Adult No-Gi), each title = `{Kid Name} ({Program})`. Same day, both showed.
- Zero contacts show 7+14 sibling bookings — but that's a coverage gap (the bot flow for it exists: n41 → n42 → n43/n44, just never exercised), not an architecture gap.

**Takeaway for CloseBot / GHL design on martial-arts gym clients:**
- **Per-kid identity lives in APPOINTMENT TITLES, not contact fields.** GHL's appointments table naturally supports N-per-contact with different calendars. Don't re-invent per-kid custom fields.
- **Kid DOBs as session variables is correct.** They drive routing (age switch → correct calendar) and don't need to persist in contact fields. Coach Nick reads appointment titles + calendar names to identify who's who.
- **Don't fight the existing ops pattern by trying to normalize data into contact fields.** It's already working for parent + 1 kid. Multi-kid is just N iterations of the same pattern.

**Implication:** always audit LIVE GHL data before designing CloseBot flows that try to persist non-built-in fields. The schema might have fields that LOOK like they matter (e.g. youth_name) but are actually vestigial. Live data tells the truth that docs and intuition don't.

**Detection heuristic:** when a client has a custom field with an ambiguous purpose, pull 30+ live contacts and check the value distribution. If 90%+ are null or a single literal default string, the field is dead and any bot write to it is wasted work.

---

## CloseBot API has NO in-place flow update — `PUT /bot/{id}` silently ignores `importKdl` (2026-04-24) ⚠️

**What happened:** Tried to patch a single AIExpression on `bot_YN0X0DR7R6A1ZGKH` without redeploying. Probed `PUT /bot/{id}` with `{importKdl: kdl}` — returned 200, response body looked like a successful metadata update. But export readback showed the old AIExpression unchanged. PUT silently ignored the unknown `importKdl` field.

**Probed endpoints, all failed:**
| Call | Result |
|---|---|
| `PUT /bot/{id}` + `{importKdl}` | 200 but ignored (no flow change) |
| `PUT /bot/{id}` + `{kdl}` | 200 but ignored |
| `POST /bot/{id}/save` + `{importKdl}` | 500 |
| `POST /bot/{id}/save` + `{kdl}` | 500 |
| `POST /bot/{id}/save` + `{botSteps: kdl}` | 500 |
| `POST /bot/{id}/import` | 404 |
| `POST /bot/{id}/importKdl` | 404 |
| `POST /bot/{id}/kdl` | 404 |

**Reality:** `PUT /bot/{id}` is metadata-only (name, folder, favorite per docs "Update a Bot"). `POST /bot/{id}/save` takes `botSteps` in an undocumented internal JSON shape, NOT KDL. The CloseBot UI's Save button constructs that JSON internally — there is no public KDL-based in-place flow update.

**Two real paths for flow changes:**
1. **UI edit** — open the node in the Job Flow Editor, edit the field, save. Same bot ID, zero archival overhead. Best for single-field changes.
2. **Full new-bot deploy** — `POST /bot` with `importKdl` creates a NEW bot ID. Archive the old one per the Iteration Archival Rule (detach + rename to [LEGACY] + clear tag filter). Use this for multi-node or structural KDL changes.

**Implication for `feedback_iteration_source_detach.md` memory:** the "exception: in-place via PUT with importKdl" clause is unreachable via the API. Only reachable via the UI. Memory left as-is since the UI path satisfies the spirit of the rule (same bot ID, no archival), but the API-level fallback doesn't exist.

---

## Vacaville v3.19 n15 Misroute — AI Comparator with Raw User Quote Flipped ~50% (2026-04-24) ⚠️

**What happened:** After adding MaxAttempts 0 (unlimited) + the minor-age-gate nodes in v3.19, tests t01/t07/t10/t15 (adult-only personas) all exhibited the same pattern: n07_whofor_switch correctly tagged them `adult`, but downstream at n15_book_this_adult_check the AI Comparator re-evaluated and routed FALSE → n20_kid1_info (kid intake). Bot then hallucinated a confirmation like "All set, Monday at 6:30 PM" without the booking node firing. 4/16 real FAIL, all from this single bug.

**Root cause:** n15's AIExpression was `"The adult contact is training themselves, alone or alongside their kid(s). Reference: {{nodes.n06_whofor_ask.result[0]}}"` — the AI was semantically re-reading the raw user answer from n06 to decide a question that n07 had already deterministically answered upstream. With longer data-collection conversations (MaxAttempts 0) and additional context from the new minor-gate node, the AI drifted. Same KDL as v3.18, same expression, but the context it evaluated in had shifted and the probability tipped to FALSE on adult-only paths ~50% of the time.

**Fix:** Change the AIExpression to reference the DETERMINISTIC upstream signal (`{{contact.tags}}`) instead of the raw user quote. n08_tag_adult applies tag "adult"; n10_tag_both applies both "adult" AND "youth". Kid-only tags as "youth" alone. New expression keys on presence of "adult" in tags — mechanical check, negligible AI drift surface.

**Pattern:** **Do not use AI Comparators to re-evaluate decisions already made deterministically upstream.** If the graph has already routed through a Switch or applied a distinguishing tag/variable, downstream comparators should reference THAT signal (`{{contact.tags}}`, `{{nodes.X.result}}`, `{{contact.<field>}}`), not the original raw user input. Raw-input re-evaluation is fragile and drifts with context.

**Detection heuristic:** whenever an AI Comparator's AIExpression contains `{{nodes.<some_switch_or_ask>.result}}` AND the same ID is further up the flow as a decision point that already branched, it is probably redundant or will drift. Prefer deterministic refs.

---

## CloseBot saveTools — `type` uses PascalCase className, `options.$type` uses snake_case (2026-04-24) ⚠️

**What happened:** v4.0 deploy script called `POST /bot/{id}/saveTools` with `{ type: 'smart_faq', enabled: true, options: {} }` and got `400: "Tool 'smart_faq' does not exist."` Corrected payload worked: `{ type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }`.

**Pattern:** The `type` field at the top level is the display/class name (PascalCase, matches `nodeDescriptors.tools[].className`). The `options.$type` field is the JSON discriminator (snake_case). Both are required and must match.

**Confirmed type/$type pairs:**
| `type` | `options.$type` |
|---|---|
| SmartFAQ | smart_faq |
| Email | email_followup |
| SummarizeConversation | save_conversation |
| TranscribeConversation | transcribe_conversation |

The `type` value is the UI-facing name; `$type` is the internal discriminator. Mismatching either returns 400.

---

## Agent Node Bots Strip `prohibitedWords` Even Through PUT importKdl (2026-04-24) ⚠️

**What happened:** v3 bots could restore `prohibitedWords` via `PUT /bot/{id}` with `importKdl` after initial create stripped them. On the v4.0 Agent Node bot (`bot_P3WU0IFASM9DDPWA`), the same PUT-importKdl trick did not restore — export still showed `prohibitedWords` with no values after both the PUT and a republish.

**Implication:** Agent Node bots require manual UI restoration of prohibited words under Settings > Prohibited Words. There is currently no API workaround.

**Compensating controls (same as before):** conversationReason guardrails, KB facts, Smart FAQ. For Vacaville v4.0 the four words (waiver, insurance, regulations, compliance) must be re-entered in the UI after every deploy until CloseBot fixes the strip.

---

## CloseBot SSE Stream Closes Server-Side After mimicBind — Harness Must Auto-Reconnect (2026-04-23) ⚠️

**What happened:** The original adversarial test harness opened a single SSE connection (`GET /bot/{id}/testSession/messages/{leadId}`), then sent the first message, then waited for bot replies. 8 of 20 tests consistently returned T1 timeout — zero bot replies — even though the CloseBot UI showed the bot HAD responded. We spent several hours suspecting connection issues, LLM failures, or wrong source attachments.

**Root cause:** CloseBot closes the SSE stream server-side almost immediately after `PUT /bot/{id}/testSession/{leadId}` (the mimicBind step). The original harness connected once, the stream died, and all subsequent bot replies were sent to a dead reader. The diagnostic script (`gs_sse_diagnostic.js`) confirmed 0 events received in 75 seconds even for "working" test openers.

**Fix:** Replace the single-connection SSE reader with an auto-reconnecting reader that loops continuously with a 10ms gap. Add a 600ms pre-send delay so the connection is established before the first message is sent. The reconnecting reader ensures there is always a live listener when the bot emits a reply, regardless of when the stream closes and reopens.

**Key code pattern:**
```js
async function connect() {
  while (!stopped) {
    const res = await fetch(`${CB}/bot/${botId}/testSession/messages/${leadId}`, {
      headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' }
    });
    // ... read loop delivers events, then falls through when stream closes
    if (!stopped) await new Promise(r => setTimeout(r, 10)); // reconnect gap
  }
}
connect(); // fire and forget — runs in background
await new Promise(r => setTimeout(r, 600)); // pre-send delay
```

**Before/after:** 8/20 consistent timeouts → 18+/20 completing full conversations after the fix.

**Note:** t11 and t17 were also timing out initially and were suspected to be a KB-attachment issue (VGA KB not on GS Ads source). After the SSE fix AND deploying to a fresh bot (v3.18), both now run and complete. Whether it was the SSE fix, the fresh bot, or KB access is unclear — but the SSE fix was the root cause of the 8-test block.

---

## "Free Trial" Language Rule: Context-Dependent — Bot Confirming When Asked Is Acceptable (2026-04-23)

**Rule established by JC (2026-04-23):**
- Bot must NOT proactively use "free trial" language early in the conversation or as an unprompted opener.
- Bot CAN say "the first class is free" or similar if the contact directly asks ("are there trial classes available?", "is there a free class?").
- Bot cannot lie, so if the contact asks, it must confirm. This is acceptable.
- The risk is only when we volunteer the "free trial" framing ourselves, especially early.

**Current `conversationReason` rule:** "Call it a 'first class', never a 'free trial'." — this governs proactive language. Does not prevent honest confirmation when asked.

**Implication for harness:** `early-free-trial` regression check in `gs_test_v3_adversarial.js` should only flag when the bot introduces free-class language WITHOUT being asked. Context-blind regex will produce false positives. Manual review needed to distinguish proactive vs. reactive.

---

## ns03 Military Scenario Was Never Built — t07 Routes to Knowledge Gap Fallback (2026-04-23)

**What happened:** t07 (active duty military persona) was written expecting a dedicated `ns03_military` scenario. The KDL has no `ns03` node at all. When Chief Williams mentioned "active duty Navy" and eventually declined to share personal info, the bot fell into `ns06_knowledge_gap_handoff` (the generic fallback).

**Bot behavior was acceptable** — "Coach Nick will give you a call" is a reasonable response. But no military-specific handling (e.g., military discount awareness, acknowledgment of service) was in play.

**Fix needed:** Add active duty / military content to the KB and Smart FAQ. No need for a dedicated scenario if the KB answers the questions. Suggested FAQ entries: "Do you offer military discounts?" and "I'm active duty — can I still train?" If a discount or special program exists, KB should state it. If not, state that explicitly.

---

## Drive-Time Estimates Are a Hallucination Risk — Add to KB as an Explicit "Don't Know" (2026-04-23)

**What happened:** t12 (contact from Davis) asked "how long is the drive from Davis?" Bot replied: "It's about 25-30 minutes from Davis depending on traffic." The KB has no drive-time content. The bot fabricated a plausible estimate.

**Why it matters:** Drive times vary by route, traffic, and starting location. A wrong estimate could cause a no-show or create a trust problem if the contact feels misled.

**Fix:** Add a Smart FAQ entry or KB section explicitly stating: "We cannot provide drive time estimates. Use Google Maps or your preferred navigation app for directions from your location to 310 E Monte Vista Ave # B, Vacaville, CA 95688." This gives the bot a factual answer instead of filling the gap with a guess.

---

## CloseBot Over-Prompting: conversationReason + ExtraPrompt Became a Landfill (April 23, 2026) ⚠️

**What I did:** Across Vacaville v3.1 → v3.15, every regression caught by the adversarial harness (hallucination, wrong phrase, failed negation) got solved by adding a new rule to `conversationReason` or to the n81 Conversation-node ExtraPrompt. Ended at **~900 words in `conversationReason`** (14 policy sections: HARD FACTS, VOICE, WHEN YOU DON'T KNOW, AI DISCLOSURE, PRICING, PHONE NUMBER, BOOKING TRUTH, BOOKING LANGUAGE, MINORS, WRESTLING, WRONG SPORT, AGE RANGE, WHAT DOES NOT EXIST, DISTANCE, SMS REACTIONS, MERGE TOKENS, GOAL) **+ a ~150-word ExtraPrompt on `n81_openqa`** restating pricing + WHEN YOU DON'T KNOW + banned phrases. The same rules were simultaneously in the KB, in Smart FAQ, and in Prohibited Words. Triple-to-quadruple duplication across tiers.

**Symptom this caused:** On the first turn of any policy-adjacent question (pricing, instructor, class size, drive time), the bot defaults to compliance-shaped deflection — "I don't currently have that." On T2, when the user re-asks, KB retrieval finally wins and the bot answers correctly. The "deflect then recover" pattern shows up repeatedly across v3.15 sweep transcripts (t11, t12, t06). Negative rules dominated the positive task; duplication raised rule salience above task salience; the safest next token for an LLM carrying 900 words of "don't / never / avoid" is a compliance-shaped refusal, not a KB lookup.

**Root cause:** I treated prompt engineering as accumulative defense — each regression became a new rule in the easiest field to edit (`conversationReason`) rather than being routed to the config tier designed for it. The docs specify clear separation of concerns and I violated it.

**Field-to-purpose map (per `developers.closebot.com` + `references/closebot_docs_reference.md`):**

| Content type | Correct home | What it is NOT for |
|---|---|---|
| Goal of the conversation | `conversationReason` (short — Bryce's examples are a few sentences) | Not a policy dump |
| Facts about the business | KB + Smart FAQ | KB is facts only — no instructional language |
| Compliance-level vocabulary bans | Prohibited Words | Not ExtraPrompt, not persona |
| Per-node interpretation nuance | ExtraPrompt on THAT node (single sentence, per Bryce's examples) | Not a place to restate global rules |
| Tone / voice directives | Persona "How to Respond" — single-sentence directives | **Persona is SHARED across clients**, so never put client-specific voice here; it pushes client voice back into `conversationReason`, which is all the more reason to keep that field tight |
| Flow / algorithm behavior (e.g., "when you don't know, do X then Y") | A **Scenario** (e.g., `ns06_knowledge_gap_handoff`) | Not prose in the persona |

**Constraint I missed:** Persona is one shared resource across all clients. Any Vacaville-specific voice line I thought about moving to Persona "How to Respond" would contaminate other clients' bots. That constraint makes `conversationReason` more load-bearing, which makes keeping it tight even more important.

**Rule going forward (now in CLAUDE.md CLOSEBOT Pre-flight):** The tier map above is **proven, standardized practice** — apply it without re-consulting docs each time. But for anything *novel* (a field/combination/technique we haven't standardized), consult `developers.closebot.com` + `references/closebot_docs_reference.md` first and propose rather than iterating blind. The v3.x landfill happened because I iterated prompt fields by trial and error in territory the docs had already solved — Bryce's documented Conversation-node ExtraPrompt examples are literally one sentence; I wrote 150-word ones because I never checked.

**What to do for Vacaville:** Separate v3.16 cleanup task — trim `conversationReason` to goal+voice only (~50 words), delete the n81 ExtraPrompt (the content is already in KB + `ns06_knowledge_gap_handoff`), re-audit KB for instructional leakage. Not doing it yet — JC wants the rule established and documented first before making changes.

**Graduation status:** Rule is now in CLAUDE.md. Architecture doc updated. Memory entry created. This lesson entry is the motivating case.

---

## CloseBot KB Attachments Are Cumulative — Always Detach/Delete Stale Versions (April 22, 2026) ⚠️

When you call `POST /library/files/{fileId}/source/{sourceId}`, it **adds** the file to the source without touching previously-attached files. There is no "replace" semantic. Uploading a new KB version and attaching it leaves ALL prior versions still attached. CloseBot's RAG then does retrieval across all of them simultaneously — if they contain contradictory info (e.g., v2.1 lists Kids 3-5, v2.3 doesn't), the bot will confidently hallucinate from whichever retrieval wins.

**How we discovered:** Vacaville v3.7 tests showed bot claiming *"we've got a Kids 3-5 BJJ program"* and *"We do have Saturday classes"* — both programs don't exist per Kurt's confirmation. Investigation revealed **6 Vacaville KB versions simultaneously attached** to both source IDs (v2.1.0, v2.1.1, v2.1.2, v2.2.0 x2, v2.3.0). The bot merged them.

**How to fix:**
- Before uploading a new KB version: list all library files, filter by client name, detach or delete prior versions via `DELETE /library/files/{fileId}` (delete) or `DELETE /library/files/{fileId}/source/{sourceId}` (detach only).
- Verify with `GET /library/files/{fileId}` — the `sources` field shows what's attached. NOTE: the list-all endpoint `GET /library/files` sometimes returns stale `sources: []` for recently-modified files (indexing delay); trust the direct-ID fetch.
- `DELETE` the file entirely is safest — detach-only is sometimes not honored by the backend.
- Bake into every KB-deploy script: "upload new → attach → list & delete predecessors."

**Graduation:** Belongs in `CLAUDE.md` `VERIFIED API CAPABILITIES` under CloseBot. Add after v3 ships.

---

## KB Changelog Text Bleeds Into Bot Responses via RAG (April 22, 2026) ⚠️

The Vacaville KB v2.3.0 had a changelog block at the top (human-facing version notes) mentioning removed programs: *"Removed Kids 3-5 BJJ... Added explicit Kids 3-5 schedule (Mon-Fri 3:45 PM + Sat 9:00 AM)..."* The changelog was there for developers to see what changed version-to-version. But CloseBot's retrieval doesn't distinguish "commentary about facts" from "facts" — the RAG engine embedded those strings and when a contact asked about Saturday classes, retrieval returned passages from the changelog, and the bot said *"I don't have the current Saturday schedule in front of me"* (implying Saturday exists).

**How we discovered:** After deleting all 6 stale KB versions (per the lesson above), bot on v3.8 STILL hedged on Saturday/Kids 3-5. Inspecting the v2.3.0 file, the changelog at the top contained *every dead-program string* we had just carefully purged from the body. Stripping the changelog (v2.3.1) left a clean 2-program document.

**Rule going forward:** Knowledge bases deployed to CloseBot should be **pure context/facts only** — no version history, no changelog, no "removed X / added Y" block, no internal notes. Store version history in:
- The source-control commit message
- A separate `*.internal.md` or `CHANGELOG.md` kept OUT of the CloseBot library
- Or the file's `Description` field in CloseBot (not indexed for retrieval)

**Applies to:** every client KB we deploy. Retroactively check existing KBs for changelog/version blocks and strip them.

**Graduation:** Add to `CLAUDE.md` `CRITICAL BUILD STANDARDS` — "KB files are pure context; no changelog or internal commentary."

---

## CloseBot v3 Build Discoveries — Source/KB/Node Limits (April 21, 2026)

**1. KB is per-source, not per-bot.** Files in `/library/files` are attached to SOURCES (`/library/files/{id}/source/{srcId}`), not to bots. When you attach a new bot to a source, the KB files already on that source are automatically available. Do NOT try to attach KB to a bot directly — that endpoint doesn't exist.

**2. GS Ads ≠ VGA production source.** `src_4R4DUIQTMMX2NFPU` (GS Ads, 22 custom fields) is the ads sub-account used in early testing. `src_GDKORXSW4Q8RQUQ8` (Vacaville Grappling Academy, 73 custom fields) is the real production source with the Vacaville KB and all custom fields attached. The v2 FIXED v2 bot was attached to GS Ads, meaning it ran WITHOUT the Vacaville KB. v3 is correctly attached to the VGA source.

**3. CloseBot node type names are case-sensitive and undocumented.** The "Stop Responding" UI node is `End` in KDL, NOT `StopResponding`. Wrong type = publish fails with "Node type X is not a known node type." Pattern to debug: use `GET /bot/nodeDescriptors` → `atomicNodes[]` → `className` for the correct KDL type name.

**4. Max 5 custom ScenarioCustom nodes per bot.** Hard limit enforced at publish time. If exceeded: "Too many custom scenarios attached to bot (max 5)". Plan your 5 slots carefully — scenarios are for cases where the flow must ROUTE away (e.g., tag+stop or re-intro-then-continue). Cases that just need a different RESPONSE (wrong sport, distance concern) can be covered by Persona instructions in `__CONFIG__.conversationReason` instead.

**5. Conversation node can only route to EOC.** `Conversation id="X" { Next handle="someOtherNode" }` fails at publish. Conversation nodes are passive (wait for contact to ask questions) and always exit to EOC. If you need a node that generates AI content AND routes to another node, use `Statement` with `UseAI true` instead. Statement nodes can route anywhere.

**6. KB PUT field name is `newFile`, not `file`.** `PUT /library/files/{id}` (replace file content) requires form field `newFile`, not `file`. Using `file` returns 400 "The newFile field is required."

**7. Chat Summary field for Vacaville is `contact.concierge_conversation` (LARGE_TEXT).** No `ai_summary` field on the VGA source. The existing `concierge_conversation` field is purpose-built for conversation context for human handoff — use it for Chat Summary tool output.

**8. v3 test harness requires BOTH env files.** `gs_test_v3_agents.js` uses `CB_GS_API_KEY` (from `clients/ground-standard/.env`) AND `OPENAI_API_KEY` (from root `.env`). Running with only the GS env file causes gptReply to throw silently at T2 — agents appear to complete T1 then the Promise.all catch handler resolves them as failures with empty label/turns/nodes. Run with: `node --env-file=.env --env-file=clients/ground-standard/.env`.

**9. AttachSource `channels` is a string array, not object array.** `POST /bot/{id}/source/{sourceId}` — per Swagger `AttachSourceInput`, `channels: string[]`, not `{name,id}[]`. Passing objects returns 400 with misleading cascade: `"input": ["The input field is required."]` + `"$.channels[0]": ["The JSON value could not be converted to System.String"]`. `tags` is the object form with `{name, approveDeny, id}`. Correct: `{ tags: [{name,approveDeny:true,id}], channels: ["Live_Chat"], enabled: true }`. 204 = success.

---

## Behavioral Corpus Study from GHL — Scope-Filter BEFORE You Analyze (April 21, 2026) ✅ WIN

**What happened:** JC wanted to scrape real SMS conversations from Bobby's Vacaville Grappling GHL sub-account to study how leads actually behave — opener phrasing, objection patterns, drop reasons, linguistic texture — so CloseBot flows can be designed against observed reality instead of assumptions. Pulled 100 conversations first pass, then 204 tag-filtered, then 412 scope-filtered. The third pull was the right one. First two were polluted.

**Why this matters:** the bot has a narrow engagement scope (fresh inbound leads only — Bobby won't let it touch existing members yet). If you study ALL conversations, your findings include admin traffic, member banter, and alumni re-engagement — flows the bot will NEVER run. Pattern observations from an unfiltered corpus lead to over-designed bots with irrelevant branches.

**Repeatable methodology for any client conversation study:**

1. **Discover tags first.** Paginate `/contacts/?locationId=X&limit=100` via `meta.nextPageUrl`. Aggregate `contact.tags[]` across ALL contacts (not a sample — tag distribution is long-tailed). Note: `locations/{id}/tags` endpoint returned 401 on Vacaville PIT — don't rely on it; aggregate from contacts instead.
2. **Ask the client what tags define bot scope.** Don't guess. Bobby's exclusion list for Vacaville was `booked, member, alumni, spam, staff, service, showed, unsubscribed, spam likely` — some obvious, some not (e.g. `showed` meaning "already walked in" took explicit instruction).
3. **Pull only eligible contacts' conversations.** Per-contact: `/conversations/search?locationId=X&contactId=Y&limit=10` → then `/conversations/{id}/messages` for each. Writes one markdown per thread with LEAD/TEAM direction labels + timestamps.
4. **Study loads-in one-pass reading, not automation.** The patterns come from reading the text, not from sentiment analysis or token frequency. Budget 1–2 hours of actual reading.

**Key behavioral findings (Vacaville, 226 lead-reply transcripts):**
- **SMS reactions (`TYPE_SMS_REACTION`) must be ignored as input** — "Liked '...'" / "Loved '...'" are NOT content replies. Treating them as answers advances the flow incorrectly. Major flow-break risk.
- **Two-burst messaging is the norm** — users fire thought 1, then 2 within 60s. Debounce before replying.
- **Top two killable drops: location + age/program fit.** Ask city/ZIP + child age EARLY to save 20+ late-cycle drops per batch.
- **Closers offer a specific slot, not permission to book.** "Wed 5:15 work for you?" beats "ready to book?"
- **~45% of fresh leads never reply at all.** The silent population is itself a pattern (first-touch timing, sequence length) worth separate study.
- **Template-merge failures escape to production** — `"Dear First_name,"` went out verbatim in one thread. QA guard: reject any outbound containing literal `{{`, `First_name`, `Last_name`.

**Artifacts produced:**
- `shared/scripts/ghl/pull_vacaville_fresh_leads.js` — the correct scope-gated puller (the earlier `pull_vacaville_conversations.js` and `pull_vacaville_by_tag.js` scraped the wrong slice and should not be used again for study).
- `clients/ground-standard/closebot/vacaville/transcripts_fresh_leads/` — 412 raw transcripts.
- `clients/ground-standard/closebot/vacaville/conversation_study.md` — the written study with scope banner + 8 sections covering opener archetypes, drop categories, linguistic texture, edge cases, close patterns, design rules, out-of-scope flows, and gaps.

**Rule going forward:** for any client behavioral study, the first question is *"what tags define the bot's engagement scope?"* — not *"pull everything."* Unfiltered corpora produce over-designed bots. This methodology should replicate cleanly to other GS gyms and any future client work.

**Graduation candidate:** if this pattern replicates on 1–2 more clients, promote the puller + study-template to a skill (`/conversation-corpus-study` or similar) so future sessions don't reinvent it.

---

## Pattern: Docs-Site → Single Reference MD via Parallel WebFetch (April 21, 2026)

**What happened:** JC asked for a "deep dive" on https://docs.closebot.com/en/ — everything, synthesized into one MD file for CloseBot agent-building context. Result: `references/closebot_docs_reference.md` (~24 sections, full node/tool/setting reference). Worked well enough that JC flagged it as a win worth capturing.

**The pattern (reusable for any public docs site — Retell, GHL, n8n, etc.):**

1. **Map first, fetch second.** One WebFetch on the root with prompt: *"List every section, subsection, link, and topic on this documentation site. Include the full navigation/sitemap/table of contents."* Gets you collection URLs + article counts.
2. **Fan out on collection pages in parallel** (one tool-call block, ~12 fetches). Each returns the article list + URLs for that collection.
3. **Batch article content in parallel** — groups of ~12 per message. Keep to related topics per batch so the output is coherent to skim mid-flight. CloseBot doc set was ~60 articles across 5 batches.
4. **Prompt for verbatim, not summary** — *"Extract the FULL content verbatim — every section, every step, every detail. Preserve headings, lists, and specifics. Do not summarize."* WebFetch still compresses but produces far more useful per-setting detail.
5. **Synthesize into ONE file, not per-article dumps.** Group by *how a builder would use it* (architecture → sources → personas → every node → every tool → settings → KB → troubleshooting → API → cheatsheet → build checklist), not by the docs site's own navigation.
6. **De-prioritize billing/account/widget sections** when the goal is "build the thing." Summarize briefly, don't expand. Saves ~40% of the writing time.

**Why it works:**
- Parallel WebFetch is *fast* — 60 articles in ~5 batches = ~5 minutes wall-time.
- The synthesis stage (Write tool) is the bottleneck, not the fetches.
- Single-file output is what JC actually uses at agent-build time — one file to attach as context, not 60.

**How to apply:**
- Use this pattern any time JC asks for a "deep dive" / "everything" / "master reference" on a public docs site.
- Land the output in `references/` alongside `stack_api_reference.md` and `closebot_docs_reference.md`.
- Register the new file in `CLAUDE.md` REFERENCE section so future sessions can find it.
- Add a **Quick Decision Cheatsheet** + **Build-Time Checklist** at the end — those are what he actually opens mid-build.

**Candidates to apply this to next:** Retell AI docs, GoHighLevel V2 API docs, n8n docs, Sympana Connector docs.

---

## CloseBot Test Session → Real GHL Booking — Full Working Pattern (April 21, 2026) ✅ VERIFIED

**End-to-end proven:** API test session creates a real GHL appointment. Sequence:

1. `POST /bot/{botId}/testSession` body `{}` → returns `{leadId, sourceId: "src_test_XXX"}`
2. **`PUT /bot/{botId}/testSession/{leadId}` body `{"mimicSourceId": "src_XXX"}`** → 200, returns `{sessionId}`
3. `GET /bot/{botId}/testSession/messages/{leadId}` (SSE stream) — open BEFORE sending messages
4. `POST /bot/{botId}/testSession/message` body `{leadId, message}` — drive conversation
5. When Booking node fires with mimic bound → writes real appointment to GHL calendar

**Proof:** 2026-04-21, adult-booking scripted test (GPT-driven persona) against `bot_MHAFTF25QVPIQLUI` attached to GS Ads source. PUT mimicSourceId bound. Conversation drove through adult flow. `n16_book_adult_nogi` fired → new GHL appointment `w3xhbGMqE64QEsQUBHJ5` "Sammy Johnson" on Adult No-Gi Submission Grappling calendar.

**The two-step setup is documented in the OpenAPI spec at `https://megastream25-api.closebot.com/swagger/v1/swagger.json`** (UpdateSessionInput schema has the `mimicSourceId` field). Alex's verbal guidance was right about the parameter, just incomplete about the separate PUT endpoint.

**Critical gotchas:**
- **Phone numbers need area codes** (US format like `415-555-0142`). Missing area code confuses the bot's phone-confirmation node.
- **GPT-driven persona > scripted persona** — scripted replies can't handle bot clarification questions. Use `gpt-4o-mini`.
- **MAX_TURNS=15, BOT_TIMEOUT_MS=40000** are safe defaults. 10 turns stopped just short of booking for the adult path.
- **End-detection: strict wrap-up only.** Don't match "let me check the schedule" — that's booking-in-progress, not wrap-up.
- **AI age-arithmetic bug still exists** on kid booking paths (n21_kid1_age_switch misclassifies ages). Avoid kid-booking tests until age switch is rewritten.
- **Swagger spec is the source of truth.** Save `shared/logs/closebot_swagger.json` locally for fast schema lookup.

---

## CloseBot Test Sessions DO Write to GHL — Requires `mimicSourceId` (April 21, 2026)

**What happened:** Previous lesson claimed "test sessions don't touch real GHL — booking nodes fire silently." This was **wrong**. The actual constraint: test sessions require a `mimicSourceId` body parameter on `POST /bot/{id}/testSession` to link the session to a real source. Without it, CloseBot allocates an ephemeral `src_test_XXX` source with no GHL linkage, so Booking nodes fire into the void and no appointment gets created.

**Source:** JC's conversation with Alex (CloseBot dev) during a group support call. Verbatim from the recording: *"Check your API call when you set up your test session and make sure you pass it a body parameter for mimicSourceId. You have to give it the source ID just like you do in the test when you pick the source ID so it knows how to attach to that calendar. Conversation has nothing to do with it, right? It just needs that source ID to link to the calendar."*

**Correct call:**
```js
POST /bot/{id}/testSession
body: { mimicSourceId: "src_XXXXXXXX" }
```
Returns `{ leadId, sourceId }` where `sourceId` should now match the real source, not `src_test_XXX`.

**Rules going forward:**
- **Every API-driven test session must include `mimicSourceId`** (capital S, capital I — case-sensitive).
- The source must already be attached to the bot (`POST /bot/{id}/source/{src}`).
- For Booking nodes to resolve calendars, `CalendarName` in the KDL can be either the display name OR the GHL calendar ID. Dev recommendation when testing via API: **use the GHL calendar ID** (avoids name-resolution ambiguity across sources).
- Conversation path doesn't matter — what matters is the source/calendar linkage. If `mimicSourceId` is set and the bot reaches Booking, the appointment will fire.
- **Supersedes the earlier "test mode doesn't write to GHL" lesson.** That observation was a symptom of the missing parameter, not the true behavior.

---

## CloseBot Exposes GHL Source Schema Without PIT — Agency Source Endpoints (April 20, 2026)

**What happened:** Needed to inspect Vacaville Grappling Academy's GHL custom field schema, tags, and calendars to diagnose a multi-kid bug in the REBUILD TEST bot. Bobby hadn't shared Vacaville PIT credentials. JC's theory: if Vacaville is already a source in Bobby's CloseBot agency (it is — every school using CloseBot is), CloseBot's API should expose the schema. Tested end-to-end. Theory was correct.

**Endpoints discovered (all authenticated with `X-CB-KEY` — same key as bot management):**

| Endpoint | Returns |
|---|---|
| `GET /agency` | Agency metadata (id, name, members) |
| `GET /agency/source?page=N` | Paginated source list, 20/page. Each source has `sourceId`, `key` (GHL location ID), `name`, `category`, `accessToken` (OAuth JWT — often expired in dump), `connected`, `bots` (array of attached bot IDs) |
| `GET /agency/source/{id}/tags` | All GHL tags for that sub-account |
| `GET /agency/source/{id}/fields` | `{contact: [...], location: [...], customValue: [...]}` — complete custom field schema with `name`, `dataType`, `fieldKey` |
| `GET /agency/source/{id}/calendars` | All bookable calendars |
| `GET /agency/source/{id}/channels` | Comm channels: WhatsApp, GMB, Live_Chat, SMS, Email, FB, IG, Custom |

**Source attach/detach on a bot:**
- `POST /bot/{bot_id}/source/{source_id}` — body `{tags: [], channels: [], input: {}}` → 204. The `input: {}` looks redundant but is required by the .NET DTO binding.
- `DELETE /bot/{bot_id}/source/{source_id}` → 200. Confirmed working.

**Failed / non-working paths (save future probes):**
- `PATCH /bot/{id}` → 405, `PUT /bot/{id}` → 200 but silently ignores `sources` field + creates unpublished version bump (leaves clutter), `POST /bot/{id}/save` → 500 on all tried body shapes.
- `/source/{id}`, `/sources`, `/crmSource`, `/integrations`, `/locations` → all 404 at root.
- GHL API direct via source `accessToken`: **all 401** — token was expired (JWT `exp` 2 days prior). CloseBot refreshes internally but doesn't expose a refresh endpoint. **Do not plan around this as a PIT substitute.**

**Rules going forward:**
- **When diagnosing a GSA gym bot and you don't have that school's GHL PIT, use `GET /agency/source/{src}/fields|tags|calendars|channels`** — this works for any school already connected to Bobby's CloseBot agency.
- **Vacaville's GHL sub-account is a templated snapshot Bobby uses across schools.** Many custom fields are scaffolded but unused per client. Don't assume every field = required data collection.
- **Pagination is `?page=N` (0-indexed), 20/page.** `?offset` and `?limit` are ignored.

---

## Vacaville Rebuild Bot — Multi-Kid Overwrite Bug (April 20, 2026)

**What happened:** JC flagged that the REBUILD TEST bot (`bot_MHAFTF25QVPIQLUI`) seemed to treat kids as primary contacts. Pulled `/bot/{id}/export` and inspected the KDL. Architecture was actually correct at high level — adult is always the GHL contact (`contact.first_name`, `contact.last_name`, `contact.email`, etc. are collected for the adult in n11–n14). Kid info writes to `contact.youth_name` and `contact.youth_birthday` on the parent's contact.

**Actual bug:** all three kid flows (`n20_kid1_info`, `n41_kid2_info`, `n51_kid3_info`) write to the SAME variables `contact.youth_name` and `contact.youth_birthday` with `SkipIfNotBlank: false` (overwrite mode). Each subsequent kid overwrites the previous. Net effect:
- Per-kid calendar bookings work correctly (value is correct at booking time, passed to `{{contact.youth_name}}` in the Booking node Description).
- BUT the PARENT'S contact record ends up with only the LAST kid's name + DOB. First two kids disappear from the contact.

**Schema constraint (from Vacaville /fields dump):** only `Youth Name` [TEXT] and `Youth Birthday` [DATE] — singular. No `Youth Name 2/3`. Bobby's templated snapshot doesn't support N kids structurally.

**JC's fix direction (decided):** pack multiple kid names comma-separated in the single `Youth Name` field. Same for birthdays. Implementation is to (a) collect each kid into its own variable (`kid1_name`, `kid2_name`, `kid3_name`), (b) at end of flow concatenate with commas, (c) write once to `contact.youth_name`. Do NOT modify the schema — that's templated across 40+ Bobby's gyms.

**Rules going forward:**
- **Martial arts bot schema = one contact = the adult/guardian. Kids are NEVER GHL contacts.** Kid data lives in custom fields on the adult contact.
- **If the schema has only singular kid fields, multi-kid goes into ONE field comma-separated** — not split across synthetic "Kid 2 Name" fields, because the client's GHL snapshot doesn't have them.
- **When diagnosing a "kids as contacts" complaint, check variable-write targets per kid.** Overwrite on the same variable key is the subtle failure mode that looks correct during single-kid testing.

---

## AI Comparators Can't Reliably Do Precise Age Arithmetic (April 20, 2026)

**What happened:** During the autonomous Vacaville bot rebuild, I needed the bot to recognize when a kid was exactly age 6 (no program available for that age). Initial design used a single 4-case AISwitch (3-5, 7-13, 10-14, age-6). The AI classifier inconsistently routed age-6 kids — sometimes into a valid-program case, sometimes into age-6. Two iteration attempts (v2 and v3) tried to fix this with dedicated pre-check Comparators using `UseAI true` and `AIExpression "kid is exactly 6 years old based on DOB {{contact.youth_birthday}}"`.

**v2 result:** Comparator returned FALSE even for DOB that made the kid age 6. AI couldn't reliably compute age from DOB + current date. Bot fell through to 3-case AISwitch (age-6 case removed) — generic punt.

**v3 result:** Rewrote AIExpression with explicit year reference ("current year is 2026"). Added age-6 case back to AISwitch as safety net. Age-6 correctly handled. BUT a 5-year-7-month old (born Sept 2020) was misclassified as "turning 6 soon, no program" — false positive. AI over-triggered on near-boundary ages.

**Root cause:** AI models struggle with precise day/month boundary arithmetic. They reason correctly at year-level ("born 2020 → ~5-6 years old") but mangle the "exactly N vs N-1 vs N+1" boundary without reliable reference dates and explicit subtraction logic.

**What was done:** Reverted to v1 — 4-case AISwitch including age-6, no pre-check Comparators. Age-6 kids get a graceful "let me follow up" punt when the classifier misroutes them. Acceptable: no compliance violation, no hallucinated class, concierge picks up.

**Rules going forward:**
- For precise boundary classification, **capture the boundary variable explicitly** (ask for age directly, not derive from DOB). More reliable at the cost of one extra question.
- AI Comparators work well for **fuzzy classification** (interested/not, yes/no, broad buckets) and poorly for **precise numeric boundaries**.
- When an AI-based check **regresses a previously-working case**, revert rather than piling more fixes. Belt-and-suspenders AI logic compounds errors.
- **If a bug is rare and graceful, document + ship.** Don't chase perfection when iteration creates new bots in a client account (delete-API broken).

---

## CloseBot Lean Rebuild Pattern — 176 → 53 Nodes, Zero Compliance Violations (April 20, 2026)

**What happened:** JC green-lit an autonomous overnight build of a new Vacaville bot from scratch. Old DEMO bot was 176 nodes, convoluted, unproven. Fresh rebuild used a "primary + additional enrollees" architecture with 3 top-level paths (adult / kid-only / both) and shared subflows for kid info + "anyone else?" junctions, capped at 2 adults and 3 kids with concierge-handoff for overflow. Resulting bot `bot_MHAFTF25QVPIQLUI` is 53 nodes (70% reduction) and passed an 8-persona SSE test suite with **0 compliance violations across ~110 conversation turns** — pricing redirect held, no kickboxing, no standalone wrestling, no discount percentages.

**Process that worked:**
1. **Write the Job Description first** (~450 words). Covers persona, verbatim approved pricing redirect, phone-only-if-asked rule, silver tongue fallback, friction handling via KB, minor-booking rules, no booking language outside Booking node. Good JD = short node prompts.
2. **Architect on Mermaid level before KDL.** 3 paths + shared subflows + caps with overflow branches. Total node count predictable from the shape.
3. **Generate KDL directly.** No intermediate markdown spec needed. Descriptive IDs (`n01_source`, `n16_book_adult_nogi`) work fine — CloseBot doesn't require UUIDs.
4. **Import via `POST /bot { name, importKdl }` + `POST /bot/{id}/publish {}`** — both endpoints solid. ~30 seconds end-to-end per iteration.
5. **Multi-persona SSE test suite** (`shared/scripts/closebot/run_multi_persona_test.js`) — 8 personas covering happy paths + edge cases + compliance traps. Regex hard-rule checker catches violations per bot reply automatically. Log + structured JSON output.
6. **Test sessions don't touch real GHL.** Booking nodes fire but silently fall through in test mode (no calendar slots). Factor this into pass criteria — booking-complete is not directly observable in test mode.

**Rules going forward:**
- **The lean rebuild pattern (3 paths + shared subflows + capped "anyone else?") is reusable across GSA gym bots.** Different gym = different KB + calendars, same architecture.
- **KB v2.1.0 pattern** (strip $, wrestling-as-technique, approved pricing redirect verbatim) applies to every GSA gym KB, not just Vacaville.
- **Writing the Job Description as a first-class artifact** meaningfully reduces node-level prompt complexity. The bot's behavior is shaped globally by JD; nodes just do data collection and routing.
- **Test-mode divergence from production** is predictable — booking doesn't complete, conversation wraps early. Don't chase "booking confirmed" signals in test sessions; measure what you can measure (compliance, routing, persona adherence).

---

## Claude Account Switching — Built a Broken Abstraction (April 20, 2026)

**What happened:** Built `top-secret/switch.sh` (the `claude-use` bash function) + encrypted per-account token backups in `top-secret/credentials/` + `restore.sh` to "seamlessly switch Claude accounts across machines." JC later asked to verify which account was active in a running session. Investigation revealed:

1. **`claude-use` cannot hot-swap an active session.** It only sets `CLAUDE_CONFIG_DIR` for new sessions. The OAuth token is read into memory at session start; no reauth hook exists. The "seamless mid-session switch" was architecturally impossible.
2. **The encrypted token backup is structurally broken.** Empirical test: decrypted all three account `.credentials.json.secret` files, hit `api.anthropic.com/api/oauth/profile` with each access token. All three returned HTTP 401 — the tokens had expired the previous day. Anthropic access tokens are short-lived (~24h). To keep the backup useful, you'd have to re-encrypt daily. The whole portability premise was fiction.
3. **The real account-switching path works natively inside the Antigravity Claude Code extension:** `/logout` in chat → browser re-login. ~30 seconds. No scripts needed.
4. **`.env` encryption (`.env.secret` at repo root) IS legitimate** — diff confirmed byte-for-byte match with live `.env`. API keys have no web re-auth path and genuinely need git-portable encryption.

**Root cause of the failure:** Built the solution before testing the assumption. Assumed token backup → portability without checking token lifetime. Assumed mid-session switch was possible without checking Claude Code's auth architecture.

**What was done:**
1. Deleted `top-secret/switch.sh`, `top-secret/restore.sh`, `top-secret/credentials/` (all six encrypted token blobs).
2. Removed `source /d/CLAUDE/Work/top-secret/switch.sh` from `~/.bashrc`.
3. Updated CLAUDE.md CLAUDE ACCOUNTS section — replaced `claude-use` commands with `/logout` + re-login instructions.
4. Kept the git-secret infrastructure (`.gitsecret/`) — still serves `.env.secret` which works.

**Rules going forward:**
- **Test the premise before building the plumbing.** Short empirical tests (decrypt + API call, diff, time-the-workflow) settle architectural questions faster than reasoning in circles. When Claude flips between "it works" and "it's useless," that's a signal to stop reasoning and start measuring.
- **Account switching in Claude Code = `/logout` + re-login.** Nothing else. Works inside Antigravity extension.
- **Verify active account** via `~/.claude.json` `oauthAccount.emailAddress` or the `/api/oauth/profile` endpoint — the credential file is ground truth, the in-session Bash `CLAUDE_CONFIG_DIR` env var is not.
- **Encrypt only what has no web re-auth path.** API keys (GHL, Retell, CloseBot, n8n) yes. OAuth access tokens no — they expire faster than you can re-encrypt.

---

## Workspace GitHub Sync — What Was Missing and Why (April 19, 2026)

**What happened:** The git repo only tracked what was inside its own folder. A large number of important files had been living outside the repo at the workspace root and were never pushed to GitHub:
- claude.ai scraper + recon scripts
- exported Claude conversation threads + recon index
- ZIP archives of Claude.ai project memory
- custom Claude skills (NOT built into Claude — would have been permanently lost if the machine died)
- reference materials (employee skills, etc.)
- machine setup scripts
- `top-secret/switch.sh` — already in Work/, duplicate at root

Additionally, `CLAUDE/Work/` was a manual USB copy of the repo — not a separate repo, just a safety copy made when JC wasn't sure if GitHub was synced. Now that the real `Work/` is confirmed on GitHub, that USB copy is just noise.

**Root cause:** No one had ever audited what was inside `Work/` vs what was at the workspace root. The mental model was "everything is pushed" but git only tracks what's inside its own directory.

**What was done:**
1. Moved all missing files into `Work/`
2. Renamed vague folders: `Additional Stuff/` → `references/`, root `scripts/` + `claude-export/` + `Web Scraper/` → `scraper/`, setup scripts → `setup/`
3. Removed 2 duplicate files
4. Pushed everything to GitHub
5. Updated CLAUDE.md folder structure + stack API reference path

**Rule going forward:** Before ending any laptop session, run `git -C Work/ status` from the workspace root to catch any untracked files. If anything important is sitting outside `Work/`, move it in before pushing.

**Also confirmed:** `stack_api_reference.md` is now in the repo at `references/stack_api_reference.md` — no longer machine-specific.

---

## Documentation System — Four-Tier Structure (April 19, 2026)

**Eureka moment.** Prior sessions had inconsistent docs because status and architecture were mixed in the same sections. Partial mid-session updates created gaps — e.g. comparison table updated to "WORKING ✅" but the section body still said "Script to Build."

**Root cause:** Updating docs incrementally mid-session instead of doing a consistency pass at the end.

**The four-tier system going forward:**

| Tier | File | Rule |
|---|---|---|
| Always read | `CLAUDE.md` | Stable architecture + ground rules. Only grows when something is proven fundamental. |
| Always read | `tasks/todo.md` | Fully rewritten at session end. ~40 lines max. Current state + one immediate next action. |
| Read on demand | `tasks/lessons.md` | Append-only. New entries at TOP. Never edit old entries. This is the compounding knowledge record. |
| Graduation target | Skills / `CLAUDE.md` | When a lesson proves out across 3+ real cases, graduate it up. |

**Rule for status docs (bot_tester_status.md etc.):**
- Pinned "Current Status" block at the very top — 3–5 lines, the ONLY part that gets updated mid-session
- Rest of the doc is reference/history — append entries, never rewrite existing sections

**Git is the history layer** — what changed and when. `lessons.md` is the *why* layer — what failed, what we learned, what the rule is. Never duplicate git history in markdown.

**Escalation path (enforced going forward):**
Failure → `lessons.md` entry → pattern repeats → `CLAUDE.md` ground rule → complex procedure → skill → sub-agent

**Why this matters long-term:** Every lesson logged is a building block. Lessons that survive multiple real tests graduate to standards. Standards that are complex to execute become skills. Skills that span multiple clients become sub-agents. This is how the architecture becomes provably stable — not because it was designed right, but because it was tested, failed, fixed, and locked in.

---

## Multi-Session Coordination Rules

### Parallel Sessions Can Create Security Gaps (April 2026)

**What happened:** JC ran two Claude Code sessions simultaneously. Session 1 was setting up git-secret encryption infrastructure. Session 2 was creating the `top-secret/` account switcher with OAuth credential files. Session 2 had no awareness that Session 1 was building encryption, so it created sensitive `.credentials.json` files without encrypting them — and never pushed to GitHub. The files sat locally, untracked and unencrypted.

**The root cause:** Claude Code sessions are fully isolated. Each session only knows its own conversation history. There is no cross-session awareness.

**Rule going forward:**
1. **Infrastructure first, always.** Security/encryption setup must be fully complete and pushed to GitHub before any session creates sensitive files that depend on it.
2. **Before creating any sensitive file**, check `git-secret list` to confirm the encryption system is active. If it's not, stop and set it up first.
3. **At the end of any session that creates new files**, always run `git status` to catch untracked files before leaving.
4. **Never run parallel sessions on security-sensitive work.** One session at a time when encryption, credentials, or keys are involved.

**How to catch it:** Run `git status` — any untracked files in sensitive folders (`top-secret/`, `clients/*/`) are a red flag.

---

## Claude Behavior Rules

### Do Not Pivot Mid-Task Without Flagging It (April 2026)

**What happened:** JC asked about `.env.encrypted` using git-secret. Claude explained it correctly, JC said "hook me up with this." Claude then silently delivered a plain text locked note instead — a completely different solution — without flagging the change. JC only caught it after the fact.

**Rule:** If Claude decides mid-task that a different approach is better, it must **stop, flag the pivot explicitly, and get confirmation before proceeding.** Never silently substitute a different solution for what was asked.

**How to apply:** When you catch yourself about to do something different from what was explicitly requested, say: "Before I do this, I'm considering a different approach — here's why. Do you want me to proceed with the original plan or this instead?"

---

## Workspace & Git Rules

### git-secret Setup — COMPLETE on Laptop (April 19, 2026)

**Status:** Fully implemented and pushed to GitHub. Main PC still needs setup (next session).

**What's encrypted and on GitHub** (in JC's source workspace, not this one — this repo ships .env via out-of-band transfer instead):
- `.env` (root API keys)
- `clients/ground-standard/.env`
- per-account `.credentials.json` + `.claude.json` files

GPG key fingerprint and backup details kept private to JC.
**GPG key file on laptop:** `~/jc-gpg-private-key.asc`

**To set up main PC (one-time steps):**
1. Install git-secret manually to `~/bin/` — see the manual build process below
2. `git pull` — gets all `.secret` files
3. `gpg --import ~/jc-gpg-private-key.asc` — paste key from locked note into a temp file first
4. `git secret reveal` — decrypts everything

**Manual git-secret install on Windows Git Bash (no make available):**
Download source from https://github.com/sobolevn/git-secret, manually concatenate the src/ shell files into a single script, install to `~/bin/git-secret`, add `~/bin` to PATH in `~/.bashrc`.

---

### SessionStart Setup Check Hook (April 19, 2026)

**What it does:** Every session start, the hook checks if git-secret is installed AND the GPG key is imported. If either is missing, it creates a flag file `~/.claude_setup_needed`. If both are present, it deletes the flag.

**UserPromptSubmit integration:** On every message, the hook checks for the flag file. If found, it injects a systemMessage forcing Claude to warn JC immediately before doing any other work.

**Why this is reliable:** The systemMessage injection via UserPromptSubmit is confirmed working (same mechanism as farewell detection). The flag file uses `~/.claude_setup_needed` (home directory) for cross-platform reliability on Windows Git Bash.

**Self-healing:** Once setup is complete on a machine, the next SessionStart automatically removes the flag. No manual cleanup needed.

**GPG fingerprint checked:** `8B6AD0EB010EFBFE` (last 16 chars — unique to JC's key)

**Test procedure:**
1. Part 1 (UserPromptSubmit): `touch ~/.claude_setup_needed` → send any message → Claude should warn immediately → `rm ~/.claude_setup_needed`
2. Part 2 (SessionStart delete): leave flag present → open new session → flag should auto-delete → send message → no warning
3. Part 3 (SessionStart create): `mv ~/bin/git-secret ~/bin/git-secret.bak` → open new session → flag should be created → send message → warning fires → `mv ~/bin/git-secret.bak ~/bin/git-secret`

---

### CLAUDE.md Must Stay Machine-Agnostic (April 2026)

**Problem:** CLAUDE.md originally had hardcoded absolute paths (`D:\CLAUDE\Work`, later `C:\Users\LENOVO\...`). When pushed to GitHub and pulled on a different machine, these paths break and mislead Claude on the receiving machine.

**Decision:** CLAUDE.md must never contain machine-specific absolute paths. Rules going forward:
- Use `{repo root}` in diagrams and headers — Claude understands this means "wherever the repo lives"
- All script commands use relative paths (`node --env-file=.env shared/scripts/...`) — these already work on any machine
- The ENVIRONMENT section only states OS family and Node version — not drive letters or install locations
- The only allowed exception: paths to files that genuinely only exist on one machine (e.g. `D:\DL\context\` on main PC) — these must be explicitly labeled as machine-specific

**How to catch violations:** If you ever see a drive letter (`C:\`, `D:\`, `E:\`) or a username (`LENOVO`, `JC`, etc.) in CLAUDE.md, that line needs to be rewritten with a relative path.

---

## Platform Corrections

### CloseBot V2 — Phase 1 Discovery Complete (April 2026)

**We were using wrong endpoint paths — many "broken" endpoints actually work with correct paths:**

| Wrong path used | Correct path |
|---|---|
| `GET /bot/node-descriptors` | `GET /bot/nodeDescriptors` (camelCase) |
| `POST /bot/ai-create` | `POST /bot/ai` |
| `GET /bot/{id}/versions/{v}/steps` | `GET /bot/{id}/steps?botVersion=X` |
| `PATCH /bot/{id}` | `PUT /bot/{id}` |

**Confirmed working endpoints:**
- `POST /bot` with `importKdl` — creates bot with full node flow, auto-assigns default persona ✅
- `POST /bot/ai` — generates KDL from plain English description (no persona auto-assigned) ✅
- `POST /bot/{id}/publish` — empty body `{}` ✅
- `POST /bot/{id}/duplicate` ✅
- `PUT /bot/{id}` — updates name/metadata (not personaIds) ✅
- `GET /bot/{id}/steps?botVersion=X` ✅
- `GET /bot/nodeDescriptors` — 27 node types ✅
- `POST /bot/{botId}/testSession` — creates test lead + source ✅
- `POST /bot/{botId}/testSession/message` — sends message, returns 204 ✅
- `GET /bot/{botId}/testSession/messages/{leadId}` — **SSE stream**, not REST ✅

**Confirmed broken (server-side bugs, not path errors):**
- `DELETE /bot/{id}` — HTTP 500, use UI
- `POST /bot/{id}/save` — HTTP 500, cannot update nodes after creation

**SSE stream pattern:**
```
GET /bot/{botId}/testSession/messages/{leadId}   ← open FIRST, keep alive
POST /bot/{botId}/testSession/message { leadId, message }  ← then send
```
Events: `connected`, `ping` (every 30s), `message-sent` (sender: lead|bot)

**Bot creation workflow (2 calls):**
```
POST /bot { name, importKdl }  →  POST /bot/{id}/publish {}
```

**Test bot cleanup needed in Bobby's UI (DELETE API broken):**
- `TEST-AI-DO-NOT-USE` (bot_JAABWZ5N6TA176UV)
- `TEST-PUBLISH-SAVE-DO-NOT-USE` (bot_S9QJZE7I6NSBHAF6)
- `TEST-PUBLISH-SAVE-DO-NOT-USE-UPDATED (Copy)` (bot_8MKSO03ZR5XZ4RE3)
- `TEST-SHELL-DO-NOT-USE` (bot_6Z9LJNV03U25HTCW)

**KDL format:** Fully documented in `D:\DL\context\stack_api_reference.md`
**Skill design:** `D:\CLAUDE\Work\tasks\closebot_skill_design.md`

### GHL — Pipelines and Workflows Are UI-Only
- Cannot create pipelines, pipeline stages, or workflow automations via API.
- Pre-create in the GHL UI, then fetch IDs via API for subsequent operations.
- `Version: 2021-07-28` header required on every request — omitting it causes silent failures.

### Retell AI — Prompts Live on the LLM, Not the Agent
- Always create LLM first (`POST /create-retell-llm`), then agent (`POST /create-agent`).
- To update a prompt, `PATCH /update-retell-llm/{llm_id}` — NOT the agent endpoint.

### N8N — No Direct Execute Endpoint
- `POST /rest/workflows/{id}/run` returns 401 with API keys.
- Only way to trigger externally: use a Webhook trigger node and `POST` to the webhook URL.

---

## Build Standards (Hard Rules)

- **Knowledge bases = facts only.** No instructional language ("you must", "always say", "respond with") — causes bot execution failures.
- **No pricing in any bot-facing content.** Redirect to human or booking link.
- **No booking language before the GHL Booking node** in CloseBot flows.
- **CloseBot scenario descriptions: under 25 words.**
- **Sales flows use NEPQ methodology.**
- **Validate every KB before delivery:** check for instructions, dollar signs, placeholder text, sensitive data, source bleed between clients.

---

## Workflow Preferences

- Do not start a phase until the previous one is confirmed working by JC.
- Do not assume API credentials are available — ask which keys are ready before writing any script.
- Every script must be tested against a sandbox/test account before touching live client data.
- If API behavior is uncertain, stop and ask. Do not guess or hallucinate endpoints.

---

## Boundaries — When to Step In

- Only flag problems, blockers, or similar cases when JC explicitly says he's stuck or confused on something
- Do NOT proactively scan the build for all potential future problems and document them unprompted
- JC may be able to figure those out himself — let him try first
- When JC flags an issue: document the resolution, provide next steps, that's it
- Do not extend the scope of a problem-solving moment beyond what was asked

---

## Communication Preferences

- Keep explanations simple, avoid overly technical jargon, speak in plain English.
- Short and direct responses preferred — no trailing summaries repeating what was just done.

---

## CloseBot Patterns

### GHL "Manual Activation" triggers — how to build them
Build specs that say "manual activation" or "manual seasonal activation" mean: the client fires the campaign themselves when they decide to. In GHL, build this as **Contact Tag Added** with a campaign-specific activation tag. The client goes into GHL, filters a Smart List by relevant contacts (e.g. by postcode), selects all, and applies the tag. That fires the workflow automatically for each contact.
- GHL does NOT connect to external systems (BOM, weather services, monitoring platforms) natively
- "Manual" = human applies a tag in GHL to the right segment of contacts
- Always pre-build the Smart List so the client can filter contacts quickly when needed

### GHL date-based / interval triggers
"Annual from job date" or "quarterly interval" = use GHL's **Date/Time trigger** with a custom date field + offset in days. Requires the date field to exist on contacts and be populated when the triggering event happens (e.g. job completed). Annual = +365 days, quarterly = +90 days.

### GHL "system age" triggers
GHL cannot calculate system age dynamically. Use a **Solar Install Date** custom date field + Date/Time trigger with +1825 days (5 years). Alternative: manual Smart List campaign filtered by install date.

### GHL external system triggers (solar monitoring etc.)
GHL cannot detect external events (output drops, sensor alerts). Needs n8n webhook: external system → n8n → GHL tag applied → workflow fires. If no monitoring API exists, fall back to quarterly Date/Time trigger.

---

### Source tag filters — standard setup
Every CloseBot job flow uses two tag filters on its connected GHL source:
- **Must Contain:** a bot-specific trigger tag (e.g. `lead replied - enquiry & storm lead responder`) — GHL workflow applies this tag when the contact replies, which is what activates CloseBot
- **Does Not Contain:** `ai off` — the kill switch. Apply `ai off` to any contact to immediately disable CloseBot without touching the workflow.

---

## Skills & Learning System

- Skills with `status: unverified` in frontmatter are installed but not battle-tested. Treat as drafts.
- After using an unverified skill: note what worked, what needed adjustment. Graduate to `status: verified` once confirmed reliable.
- Two-Claude method: when building a new skill, test it separately before treating it as reliable.

---

## CloseBot SSE Tester — Confirmed Working (April 19, 2026)

### WIN: Programmatic bot testing via CloseBot API is fully working
No browser needed. No GHL widget URL needed. Pure API + SSE stream. This is the preferred approach for testing CloseBot bots going forward.

Script: `shared/scripts/closebot/run_sse_test.js`
Run: `CB_TEST_BOT_ID=bot_xxx node --env-file=.env --env-file=clients/{client}/.env shared/scripts/closebot/run_sse_test.js`

**How it works:**
1. `POST /bot/{id}/testSession` → creates isolated test lead (doesn't affect real contacts)
2. `GET /bot/{id}/testSession/messages/{leadId}` → open SSE stream (keep alive)
3. `POST /bot/{id}/testSession/message` → send message, bot replies via SSE stream
4. GPT-4o-mini reads bot reply + full conversation history → generates natural human response
5. Repeat for N turns. Log full transcript.

### Critical: CloseBot SSE event format is non-standard
CloseBot does NOT use the standard SSE `event:` field. All events come as `data: {...}` only, with the type embedded in the JSON:
```
data: {"type":"message-sent","sender":"bot","message":"..."}   ← bot reply
data: {"type":"connected"}                                      ← stream ready
data: {"type":"ping","timestamp":"..."}                         ← keepalive every 30s
data: {"type":"logs","logs":[...]}                              ← AI debug info (tokens, model, prompt)
data: {"type":"action","action":{...}}                          ← node traversal
data: {"type":"activity","activity":{...}}                      ← goal checks
```
Parser must check `parsed.type` in the JSON, not `event:` line.

### Bot reply timing
Bot replies typically take 8–16s per CloseBot's internal logs. Apparent "timeout" in early script runs was caused by a race condition (see below), not slow replies. Use 60s timeout — that's more than enough.

### Race condition bug (fixed April 19, 2026)
**Symptom:** Script reported timeout on Turn 4 even though CloseBot showed an 8s reply time.
**Root cause:** The drain-mode pump loop (4s extra wait after first reply) kept running after the Turn 3 promise resolved. When Turn 4's reply arrived, the orphaned Turn 3 pump consumed it from the reader — Turn 4's pump found nothing.
**Fix:** Replaced per-turn pump loops with a single continuous background pump feeding a queue. `collectBotReply()` just pulls from the queue with a timeout. One reader, one pump, no race conditions.

### GPT-4o-mini is already the lead voice
The script uses GPT-4o-mini to generate all LEAD messages from Turn 2 onwards — same approach as the Playwright tester. Full conversation history is passed each turn so GPT stays contextually accurate. The opening message is hardcoded (needed to kick off the conversation with a clear intent).

### Bonus: `logs` SSE events expose CloseBot internals
Each bot response emits a `logs` event with: AI model used, prompt sent, response generated, token counts, purpose (scenario/responding/parsing). This is available for future use — can be used to build richer eval reports (e.g. which nodes fired, which scenarios triggered, token cost per test).

---

## Bot Testing Framework — Playwright + GHL Chat Widget (April 18, 2026)

### What Was Built
A fully automated bot conversation tester using Playwright (browser automation) that:
- Opens a GHL website with a live chat widget
- Clicks the widget open
- Sends a scripted conversation scenario message by message
- Waits for and reads bot responses after each message
- Logs the full transcript with timestamps to `shared/logs/`
- Takes a final screenshot at test completion

**Script location:** `shared/scripts/playwright/run_bot_test.js`
**Test portal URL:** `https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg`
**GHL account used:** LeadGen Listings (sandbox — not a client account)

---

### Why This Approach
Started by exploring a GHL Conversations API approach to inject fake inbound messages. Hit a hard wall: GHL's API ignored the `direction: inbound` parameter and logged all injected messages as outbound, meaning the "Customer Replied" workflow trigger never fired. The widget approach was JC's original instinct — validated as the correct path.

---

### Issues Encountered and How They Were Resolved

**1. GHL preview URL requires login? — Wrong.**
Assumed the `app.gohighlevel.com/v2/preview/...` URL was behind auth. JC confirmed it's publicly accessible. Tested in a separate browser with no login — widget loads and works for anyone.

**2. Chat widget is a Web Component with nested Shadow DOM.**
The widget is `<chat-widget>` — a custom element. Its internals are in a shadow root, not directly queryable. Standard Playwright selectors failed. Resolution: traverse the shadow root via `page.evaluateHandle()` and `page.evaluate()` directly in the browser context.

**3. Chat window not opening on first click.**
First click hit the `#lc_text-widget` container div, not the actual button `#lc_text-widget--btn`. The prompt bubble was dismissed instead of the chat window opening. Resolution: target `#lc_text-widget--btn` specifically for the open action.

**4. `chat-message` elements returning empty — wrong DOM layer.**
Initial approach queried `chat-pane.shadowRoot.querySelectorAll('chat-message')`. Returned nothing. Root cause: `chat-message` elements are slotted — they live in `chat-pane`'s **light DOM**, not its shadow root. Resolution: query `pane.querySelectorAll('chat-message')` directly (no `.shadowRoot`).

**5. Direction detection (bot vs user) was broken.**
Tried checking element attributes and classes directly — none reliable. Resolution: check each `chat-message` element's **shadow HTML** for `bubble incoming` (bot) or `bubble outgoing` (user). Typing indicator = `bubble incoming` with empty `innerText`.

**6. ES module conflict — `require is not defined`.**
`shared/scripts/` has a `package.json` with `"type": "module"`. Playwright scripts use CommonJS `require()`. Resolution: added a `package.json` with `{"type": "commonjs"}` inside `shared/scripts/playwright/` to override the parent.

---

### First Live Test Result — Vacaville Grappling Academy (Emma bot)

| Question | Outcome |
|---|---|
| Who are you / what do you do? | ✅ Correct — identified as Virtual Staff Assistant |
| Classes offered? | ✅ Listed BJJ, Judo, MMA |
| Kids classes? | ✅ Confirmed + asked clarifying question |
| Adult classes? | ✅ Confirmed + pushed free trial offer |
| Schedule? | ⚠️ Vague — avoided specifics, redirected to free trial |
| Free trial? | ❌ No response within 12s |
| Pricing? | ✅ Deflected correctly — no price disclosed |
| Coaches? | ⚠️ Vague — no names given |

**Flag:** Free trial question produced no response — likely a gap in the bot's scenario handling or a timing issue. Worth re-testing with longer wait.

---

### Lessons

- **GHL chat widget = Web Component with nested Shadow DOM.** Never assume standard DOM queries work. Always traverse via `evaluate()`.
- **Slotted elements live in light DOM.** If a custom element uses `<slot>`, its children are in the host's light DOM, not the shadow root.
- **Direction detection = check shadow HTML string**, not element attributes.
- **Bot typing indicator** = `bubble incoming` with empty `innerText` — wait for it to clear before reading the reply.
- **`app.gohighlevel.com/v2/preview/` URLs are public** — no auth required despite the GHL domain.
- **Always add `package.json` with `"type": "commonjs"` in Playwright script folders** when parent folder is ES module.
- **API fake-inbound approach doesn't work for GHL chat widget bots.** GHL ignores `direction: inbound` on API-injected messages — workflows using "Customer Replied" trigger will never fire. Widget automation is the correct testing path.

---

## Bot Tester — Dynamic Response Engine (April 18, 2026)

### What Changed
Replaced rigid pattern-matching response engine with **GPT-4o-mini** (OpenAI API). The bot tester now reads the bot's actual message and generates a contextually appropriate human reply — same as how a real person would test.

Also added **randomized identity per test run**: last name, email, and phone are randomized each run. First name stays "Tester" for easy identification in GHL inbox. This prevents session/contact bleed between tests.

### Why GPT Over Pattern Matching
Pattern matching failed because:
- `m.includes('sign')` matched "assign" → wrong response triggered
- Bot asks unexpected questions → script had no match → looped or exited
- When stuck, script repeated the same message 15+ times — useless noise

GPT reads the full conversation history + knows the persona's goal → generates natural, adaptive replies. Never repeats itself. Handles scheduling questions, objections, unexpected flows.

### Token Cost (OpenAI GPT-4o-mini)
- ~$0.006 per test run (20 turns)
- 10 parallel tests = ~$0.06
- 100 tests/month = ~$0.60
- Key stored in `.env` as `OPENAI_API_KEY`

### Fresh Context Per Test Run
GHL chat widget stores session in browser cookies/localStorage. Using `browser.newContext()` in Playwright creates a completely isolated context (incognito equivalent) — zero cookies, zero storage, clean slate every run. Without this, conversations persist across runs and corrupt results.

### Lessons
- **Always use `browser.newContext()` not `browser.newPage()`** for test isolation
- **Pattern matching is wrong for conversational testing** — use an LLM
- **Holding messages ("Give us a minute...") must be skipped** — wait for the real response
- **Randomize identity per run** — prevents GHL from reusing prior contact sessions
- **Keep first name "Tester"** — makes test contacts easy to spot in GHL inbox
- **GPT-4o-mini is sufficient** for generating natural conversational replies — no need for Sonnet/GPT-4o

---
*Last updated: April 18, 2026*
