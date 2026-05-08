---
name: Test Identity Randomization
description: every eval/orchestrator run must use randomized name/email/phone so each test creates a new GHL contact instead of overwriting; only first name "Tester" stays static for easy lookup
type: feedback
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
When running automated bot tests (orchestrator, deep diagnostic, eval pipeline), the test persona must use randomized identity per run. This prevents GHL from upserting onto the same contact across test runs (GHL's contactUniqueIdentifiers is `["email", "phone"]` by default — same email/phone = same contact).

**Per-run randomization:**
- **First name:** keep static as "Tester" (or similar consistent marker so test contacts are easy to filter in GHL inbox)
- **Last name:** random from a pool, OR a random short string
- **Email:** `tester.{lastname-lower}.{random4}@donotuse.com`
- **Phone:** **E.164 fictional** — `+1{real-area-code}555{0100-0199}` (e.g. `+14155550150`). Real area code (415/510/650/707/925) + 555 NANP-reserved fictional exchange + 0100-0199 reserved subscriber range. Bare `555-XXX-XXXX` form is NANP-invalid (555 isn't a real area code) and gets silently dropped by GHL's libphonenumber validation. Updated 2026-04-29.
- **Kid name:** random first + same lastname
- **Kid DOB:** static or randomized within an age bucket (depends on scenario)

**Implementation:** in `tester.js` (or wherever the persona brief is built), generate identity at run start and inject via template tokens (`{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{phone}}`, `{{kidName}}`, `{{kidDOB}}`). Log the generated identity in run.log so verification step can locate the GHL contact later.

**Why:** Idriss flagged 2026-04-28 that hardcoded persona identities (e.g. "Alex Johnson + alex.johnson@test.com") cause GHL to keep updating the same contact each run, polluting test-run separation. Randomization gives each test a clean GHL contact for accurate verification.

**Precedent:** the Playwright tester (`shared/scripts/playwright/run_booking_test.js`) already does this pattern — see `tasks/bot_tester_status.md`.
