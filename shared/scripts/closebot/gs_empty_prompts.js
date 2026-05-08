/**
 * Empty every `Prompt "..."` and `ExtraPrompt "..."` field in the local KDL.
 * Rule: blank by default. If sweep shows failures, add targeted content back
 * for the specific nodes that need it.
 *
 * Guards: only empties the per-node Prompt/ExtraPrompt fields. Does NOT touch
 * __CONFIG__.conversationReason or __CONFIG__.businessInformation (those start
 * at column 4 inside __CONFIG__ braces but use different field names entirely).
 */
import fs from 'fs';

const KDL_PATH = 'shared/logs/vacaville_v3.kdl';
const BACKUP = 'shared/logs/vacaville_v3.kdl.pre_prompt_empty.bak';

const src = fs.readFileSync(KDL_PATH, 'utf8');
fs.writeFileSync(BACKUP, src);

const lines = src.split('\n');
const out = [];
let emptied = 0;
const log = [];

// Match lines like:   Prompt "..."  or   ExtraPrompt "..."
// Both indented. Handles escaped quotes inside the string.
const rx = /^(\s+)(Prompt|ExtraPrompt)\s+"((?:[^"\\]|\\.)*)"\s*$/;

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(rx);
  if (m) {
    const [, indent, field, content] = m;
    if (content.length > 0) {
      log.push(`line ${i + 1}: ${field} emptied (was ${content.length} chars): "${content.slice(0, 60).replace(/\n/g, ' ')}..."`);
      out.push(`${indent}${field} ""`);
      emptied++;
      continue;
    }
  }
  out.push(lines[i]);
}

fs.writeFileSync(KDL_PATH, out.join('\n'));
fs.writeFileSync('shared/logs/gs_empty_prompts.log', [
  `=== EMPTY PROMPTS — ${new Date().toISOString()} ===`,
  `Source: ${KDL_PATH}`,
  `Backup: ${BACKUP}`,
  `Fields emptied: ${emptied}`,
  '',
  ...log,
].join('\n'));

console.log(`Emptied ${emptied} Prompt/ExtraPrompt fields in ${KDL_PATH}`);
console.log(`Backup: ${BACKUP}`);
console.log(`Log: shared/logs/gs_empty_prompts.log`);
