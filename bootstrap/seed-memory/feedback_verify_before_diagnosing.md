---
name: Verify Before Diagnosing — Never Theorize From Error Strings Alone
description: When an API/tool error says "X not found" or similar, query the source of truth (GHL, CloseBot, etc.) directly before building any explanation around it
type: feedback
originSessionId: 8f14ee5c-f2f9-4f58-9a07-3e5135c7f39b
---
When investigating a bug, never construct a narrative from a single error string. If a `check_availability` response says "Calendar ID X not found" or `get_contact` says "no record," the next action is to query the underlying system directly (GHL `/calendars`, CloseBot `/bot/{id}/export`, etc.) and verify whether the resource actually exists. Only after observing ground truth do you propose explanations.

**Why:** During Vacaville booking-failure debugging (2026-04-29), I assumed two calendar IDs were "stale" because a `check_availability` error said "Could not find a calendar with ID..." Built an entire narrative — "old IDs replaced," "stale entries in todo.md," "Vacaville production IDs hardcoded in bot but bot is in GS Ads sandbox." All fiction. Idriss had to send a screenshot proving both IDs were active calendars in the GS Ads sub-account right now. The actual root cause of the "not found" error was something else entirely (different GHL credential / location binding / lookup path) that I never investigated because I'd already locked in a wrong story.

**How to apply:**
1. Treat error strings as a SIGNAL, never as a diagnosis. "Not found" can mean: doesn't exist, wrong credential, wrong location, wrong API version, cache issue, permissions, location binding mismatch.
2. Before writing any "the cause is X" claim, run a verification step that observes the actual state: list calendars via API, fetch the bot KDL, query the contact directly. Save the output.
3. If you cannot easily verify, say "I have not verified this — possible cause is X, would need to check Y" — never present a hypothesis as a finding.
4. Plausible-sounding wrong answers cost the user MORE time than admitting "I don't know yet, here's how I'd verify." Don't generate confident fiction.
5. The "retry before concluding" rule and CLAUDE.md "verify before executing" rule both apply here. They are not optional.
