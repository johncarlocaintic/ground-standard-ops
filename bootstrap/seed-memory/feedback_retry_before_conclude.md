---
name: Retry Before Concluding
description: never declare "X is broken" or "API down" after one failed call; retry first (at least 2-3 times with brief pauses) before reporting any failure conclusion
type: feedback
originSessionId: 50428a9f-796d-4885-8003-68dc8367c85f
---
Before reporting that an external API/service is broken, down, or otherwise non-functional, ALWAYS retry the call at least 2-3 times with brief pauses. Only conclude "broken" after consistent retries fail.

**Why:** Idriss caught me declaring "CloseBot's create-bot API is broken" after a single 500 response. Transient errors (rate limits, momentary backend hiccups, network blips) are common. One failure is not a conclusion. Repeating a failed deploy 3 times before reporting saves him from acting on bad data.

**How to apply:**
- Any external API call that fails with 5xx or transient error: retry 2-3 times before reporting failure
- Phrase reports as "X failed N times in a row" not "X is broken"
- Same applies to bot timeouts, network errors, rate limits, anything that could be transient
- This is a behavior rule, not a code rule. Applies to my reasoning/reporting, not just retry logic in scripts.
