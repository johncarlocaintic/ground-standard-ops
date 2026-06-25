// cb_phone_confirm_patch.js
// Tweak #3: SMS leads already have a phone number on the inbound text, so the bot
// must CONFIRM the number we have, not ask for it cold. Only ask if blank.
//
// For every MultiObjective objective whose Variable is "contact.phone":
//   - SkipIfNotBlank -> "False"  (always engage so we explicitly confirm)
//   - Description     -> "Confirm the contact's phone number"  (short, node-discipline)
//   - inject a Prompt (if absent) instructing confirm-{{contact.phone}}-else-ask
//
// Idempotent: re-running on an already-patched KDL is a no-op (Prompt-present guard).
//
// Usage: node cb_phone_confirm_patch.js <input.kdl> <output.kdl>

import { readFileSync, writeFileSync } from 'fs';

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
    console.error('Usage: node cb_phone_confirm_patch.js <input.kdl> <output.kdl>');
    process.exit(1);
}

// IMPORTANT: do NOT put {{contact.phone}} as a literal merge token in this Prompt.
// CloseBot wraps unresolved variables as "UNRESOLVED(contact.phone)" instead of "",
// and the AI then reads that wrapper aloud (e.g. "I have your number as
// UNRESOLVED(contact.phone). Is that the best number?"). Verified failure 2026-05-18
// in Logica v1.1 nonbookable_program. Use behavioral instructions only and let the
// agent read the real phone from its implicit contact context.
const PHONE_PROMPT =
  'We are texting this contact so we usually already have their phone number on file. ' +
  'Look at the contact profile. If a real phone number is on file for this contact, ' +
  'tell them you have their number as that specific number and ask if that is the best ' +
  'number to reach them, and accept a yes or a corrected number. If no phone number is ' +
  'on file (or it is blank), just ask them for their best phone number. Never output ' +
  'placeholder text or unresolved variable names like UNRESOLVED or curly braces. ' +
  'Never use em dashes.';

const lines = readFileSync(input, 'utf8').split('\n');
const out = [];
let patched = 0;
let skippedAlready = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\s*)Variable "contact\.phone"\s*$/);
    if (!m) { out.push(line); continue; }

    const indent = m[1];

    // Walk backwards in the already-emitted buffer to the objective's "SkipIfNotBlank"
    // and forward (in source) to its Description, staying inside this objective block.
    // Objective block bounds: from the nearest preceding "_ {" to the next "}".
    // Flip SkipIfNotBlank in the emitted buffer.
    for (let b = out.length - 1; b >= 0 && b > out.length - 12; b--) {
        if (/^\s*_ \{\s*$/.test(out[b])) break;
        const sm = out[b].match(/^(\s*)SkipIfNotBlank\s+("?)(?:True|False|true|false)\2\s*$/);
        if (sm) { out[b] = `${sm[1]}SkipIfNotBlank "False"`; break; }
    }

    out.push(line); // the Variable "contact.phone" line itself

    // Look ahead within the objective for Title/Description/Prompt and the closing }.
    let j = i + 1;
    let hasPrompt = false;
    let descIdx = -1;
    const lookahead = [];
    for (; j < lines.length; j++) {
        const lj = lines[j];
        if (/^\s*\}\s*$/.test(lj)) break;            // end of objective
        if (/^\s*_ \{\s*$/.test(lj)) break;          // safety: next objective
        if (/^\s*Prompt "/.test(lj)) hasPrompt = true;
        if (/^\s*Description "Determine\s+the contact's phone"\s*$/.test(lj)) descIdx = lookahead.length;
        lookahead.push(lj);
    }

    if (hasPrompt) { skippedAlready++; out.push(...lookahead); i = j - 1; continue; }

    // Rewrite the phone Description to the short confirm form.
    if (descIdx >= 0) {
        lookahead[descIdx] = `${indent}Description "Confirm the contact's phone number"`;
    }
    // Append a Prompt as the last key in the objective (before the closing }).
    lookahead.push(`${indent}Prompt "${PHONE_PROMPT}"`);
    out.push(...lookahead);
    i = j - 1;
    patched++;
}

writeFileSync(output, out.join('\n'), 'utf8');
console.log(`Phone-confirm patch: ${patched} objective(s) patched, ${skippedAlready} already patched (skipped).`);
console.log(`Output: ${output}`);
