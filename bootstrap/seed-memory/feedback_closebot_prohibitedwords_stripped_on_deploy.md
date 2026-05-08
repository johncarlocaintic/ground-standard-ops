---
name: CloseBot strips prohibitedWords values on every deploy - always re-verify after deploy
description: CloseBot's KDL import drops the prohibitedWords values on every deploy. Local KDL has the words; exported deployed KDL has an empty field. Always read-back verify and restore.
type: feedback
originSessionId: 50d7038a-cc6e-4c21-aa8b-71503b97ea77
---
## The bug

Local `__CONFIG__.prohibitedWords "word1" "word2" "word3"` survives `importKdl` on bot creation as a FIELD but its VALUES are dropped. Every deployed bot shows `prohibitedWords` alone on the line with nothing after it.

Verified on Vacaville v3.16, v3.16.1, v3.16.2 deploys (2026-04-23 to 2026-04-24). Pattern is consistent.

## Always do this on every CloseBot deploy

1. After `POST /bot + POST /bot/.../publish`, run a read-back via `GET /bot/{id}/export`.
2. Grep the exported KDL for `prohibitedWords` and confirm the values are present.
3. If the values are empty and the local KDL had values, the deploy stripped them - this needs explicit restoration.

## Restoration options (tested 2026-04-24 - NONE work via API)

Exhaustive attempts confirmed that **no API path restores prohibitedWords values**:
- `PATCH /bot/{id}` - 405 method not allowed
- `PUT /bot/{id}` with `prohibitedWords: [...]` JSON field - 200 but values not persisted
- `POST /bot/{id}/prohibited-words` - 404 no endpoint
- `PUT /bot/{id}` with `importKdl` containing block `{ _ "word" }` syntax - 200 but stripped
- `PUT /bot/{id}` with `importKdl` containing array `[ "word", ... ]` syntax - 200 but stripped
- `PUT /bot/{id}` with `importKdl` containing comma-string - 200 but stripped
- `PUT /bot/{id}` with `importKdl` containing repeated `prohibitedWords` lines - 200 but stripped

CloseBot's backend strips prohibitedWords values on every write regardless of syntax. Confirmed platform bug.

**Only working path is the CloseBot UI** (Settings -> Prohibited Words). Must be done manually after every deploy until CloseBot fixes their API.

**Action:** file a bug report with CloseBot support citing this exhaustive test set. When Bobby or another agency user next contacts support, include the list above.

## Why it matters

Prohibited words are the compliance-level vocabulary kill switch (e.g., "waiver", "insurance", "regulations", "compliance" for GSA martial arts bots). If they silently drop on deploy:
- The bot can accidentally use compliance language that conversationReason no longer hardens against
- This was one of the triple backstops we leaned on when emptying the data-collection Prompts during v3.16.x cleanup

## Deploy-script discipline

Every `gs_deploy_*.js` or equivalent deploy script should include a final read-back step that:
- Parses the exported KDL
- Checks prohibitedWords has its expected values
- Logs a WARNING (not a silent success) if the values were stripped
- Ideally: attempts to re-apply them via whatever API path works, or at minimum flags it for manual follow-up

The current v3.16.2 deploy script does the read-back but doesn't specifically check prohibitedWords. Add that check to future scripts.

## Known mitigations in place

For Vacaville specifically:
- conversationReason has the no-pricing hard guardrail built in
- KB "What We Do Not Currently Offer" section covers the main negations
- Smart FAQ has pricing-redirect entries
- These are compensating controls but not substitutes for prohibitedWords as a hard vocabulary block
