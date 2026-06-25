---
name: CloseBot Tester Framework
description: Automated bot tester using Playwright + GPT-4o-mini. Status, scripts, findings, and next steps for the bot testing system.
type: project
originSessionId: 1ee84f19-2183-4cc7-83b9-85028197ac5d
---
A working automated bot conversation tester has been built and validated.

**Status:** Core framework working. Vacaville KB corrected (v2.0.0-working). Ready to run full test — NOT yet run with updated KB.

**Full status doc:** `tasks/bot_tester_status.md` — read this first at the start of any session continuing this work.

**Run command:** `node --env-file=.env shared/scripts/playwright/run_booking_test.js`

**Why:** Testing CloseBot bots before launch. Goal is parallel agents — one per bot — to expedite launch timeline.

**Session Apr 18 2026 — what happened:**
- Studied Vacaville Grappling Academy KB and identified that the deployed KB (v1.5.0) only had 2 age groups but GHL has 4 calendars: Kids 3-5 BJJ, Kids 7-13 Jiu-Jitsu, Kids 10-14 BJJ, Adult No-Gi Submission Grappling
- Built corrected KB working draft: `clients/ground-standard/closebot/vacaville_kb_working.txt` (v2.0.0-working)
- Overlap/gap routing: age 6 = unavailable; ages 10-13 = both kids programs offered; age 14 = both Kids 10-14 and Adult offered
- Test URL confirmed: `https://app.gohighlevel.com/v2/preview/hQknECdmqlTW4P6978BD`
- Test is channel-agnostic (same logic for SMS, FB DM, live chat)

**Next session priorities (in order):**
1. Update `run_booking_test.js`: raise MAX_TURNS 30→50, update stale KB inconsistency notes (lines 207–213), check `sonRouted` regex matches new program name "Kids 7-13 Jiu-Jitsu"
2. Deploy corrected KB v2.0.0-working to CloseBot (Emma bot)
3. Run full test suite against live widget URL
4. Review transcript, flag issues, confirm overlap routing with Bobby/Coach Nick
5. 10 consecutive clean test conversations = ready for go-live
6. Then package into reusable `closebot-tester` skill

**How to apply:** Read `tasks/bot_tester_status.md` first. Do not start fresh — all context is there.
