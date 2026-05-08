---
name: Always link transcripts in test-result reports
description: When reporting on any bot test run (adversarial sweep, QA eval, etc.), include clickable markdown links to every transcript log file, not just the analysis.
type: feedback
originSessionId: 2dce8f2a-ba0d-4d4d-a47d-5c3cebea8867
---
When reporting results from any bot-testing sweep, always include clickable markdown links to the raw transcript log files for every test — both flagged and clean. JC needs to verify findings independently and cross-check my classifications (false positive vs false negative vs real failure).

**Why:** JC cannot take my verdict at face value on subjective judgments like "false positive" or "hallucination" without reading the transcript. Saving him the lookup step each time is low cost; forcing him to hunt down log paths is high friction.

**How to apply:**
- Every sweep report should have a transcript table (test name + link + verdict) at minimum.
- For flagged tests or false negatives I claim, quote the specific line + link to the full transcript.
- Use relative paths in markdown format: `[log](shared/logs/v3.3_test_tXX_*.log)` so VSCode renders them as clickable.
- Applies to CloseBot adversarial sweeps, any future eval-agent runs, Retell test sessions, anything where I render a pass/fail verdict JC might want to contest.
