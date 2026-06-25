---
name: Cross-examine Judge LLM output before reporting
description: never parrot judge_assessment.json verdicts to Idriss without first confirming the claims against ghl_facts.json, events.json logs, and the GHL API directly
type: feedback
originSessionId: 54fc8f28-85d0-4eac-8882-534fa74428d0
---
Judge LLM verdicts in `shared/logs/eval/*/judge_assessment.json` are inference, not ground truth. Idriss caught this on 2026-05-11 during the Vacaville prod sweep — I reported the Judge's "critical fail" without checking. He had to ask "did you cross examine everything yourself to check GHL and closebot?" before I actually verified.

**Why:** the Judge is right often enough to feel trustworthy, but it can over-flag (e.g. soft language read as fabrication), miss context (DOB ordering in transcript), or simply hallucinate severity. Reporting its output as fact without verification erodes Idriss's trust in every subsequent run.

**How to apply:** for every Judge-flagged failure that I plan to surface, before reporting:
1. Read `ghl_facts.json` AND hit `GET https://services.leadconnectorhq.com/contacts/{contact_id}` with `GHL_VACAVILLE_API_TOKEN` to independently confirm GHL field state.
2. Open `events.json` and grep the `logs[]` array inside `type:logs` events for the actual `Tool update_contact args: ...` / `Tool send_message args: ...` lines — these are CloseBot's own internal claims about what tool calls fired and what they returned.
3. Open `transcript.md` and verify any quoted bot line + the surrounding turns (especially when the Judge's claim depends on *ordering*, like "bot said X before lead said Y").
4. Only then write the verdict to chat. State which evidence is independent (GHL API call, raw logs, transcript line numbers) vs. which is the Judge's narrative.

If the Judge and the independent evidence disagree, the independent evidence wins. Flag the Judge's miss explicitly so we know its reliability over time.
