---
name: GS Ads Sandbox KB Swap Protocol
description: Always swap KBs on GS Ads sandbox source between bot tests — previous KB causes source bleed into new bot's responses
type: feedback
originSessionId: 54fc8f28-85d0-4eac-8882-534fa74428d0
---
Before testing a new gym's bot on the GS Ads sandbox source (`src_4R4DUIQTMMX2NFPU`), detach the previous gym's KB and attach the new gym's KB. Failing to do this causes the bot to answer using the previous gym's program list / facts (KB source bleed).

**Why:** Confirmed 2026-05-14 on Ballantyne v1.0 test. Vacaville KB was still attached to GS Ads sandbox. Ballantyne bot denied its own Kids 4-5 Kickboxing program existed and claimed "Kids 7-13 Jiu-Jitsu" as the youngest class — direct bleed from Vacaville KB. Wrecks every kids persona run; corrupts QA verdicts.

**How to apply:**
- Before every `/closebot-test` run on GS Ads, swap the attached KB to the gym under test
- After testing complete: detach test KB from GS Ads sandbox before the next gym's run
- The KB attach endpoint is `POST /library/files/{fileId}/source/{sourceId}` — same endpoint used for production attachment
- If the gym's KB isn't built yet (`kbReady: false` in spec), either build it first or document the test results as KB-blind and re-run after KB exists
