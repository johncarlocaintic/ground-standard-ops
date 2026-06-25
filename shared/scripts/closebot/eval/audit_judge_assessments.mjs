// Audit every judge_assessment.json in this session's runs.
// Surfaces: data_consistency gaps, node_routing issues, production_safety verdicts,
//   tool_call_health missing tools, fabrication discrepancies.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const EVAL = 'shared/logs/eval';
const sessionGyms = ['logica', 'paragonsimi', 'ombjj', 'sugoi', 'raylongo', 'universalmma', 'montgomery', 'signature', 'roberts', 'simpleman', 'killerb'];

const allDirs = readdirSync(EVAL).filter(d => {
  if (!d.includes('20260519_') && !d.includes('20260520_')) return false;
  return sessionGyms.some(g => d.startsWith(g + '_'));
});

let totalJudged = 0;
const concerns = [];

for (const d of allDirs) {
  const jp = join(EVAL, d, 'judge_assessment.json');
  if (!existsSync(jp)) continue;
  totalJudged++;
  let j;
  try { j = JSON.parse(readFileSync(jp, 'utf8')); } catch { continue; }

  const flags = [];
  // production_safety verdict
  if (j.production_safety?.safe_for_real_customers === false) {
    flags.push('UNSAFE_FOR_PROD: ' + (j.production_safety?.reasoning || '').slice(0, 200));
  }
  // data consistency gaps
  const gaps_chat = j.data_consistency?.gaps_chat_to_tool || [];
  const gaps_tool = j.data_consistency?.gaps_tool_to_ghl || [];
  if (gaps_chat.length > 0) flags.push('GAPS_CHAT_TO_TOOL: ' + gaps_chat.slice(0, 3).map(g => typeof g === 'string' ? g : JSON.stringify(g)).join('; '));
  if (gaps_tool.length > 0) flags.push('GAPS_TOOL_TO_GHL: ' + gaps_tool.slice(0, 3).map(g => typeof g === 'string' ? g : JSON.stringify(g)).join('; '));
  // node routing
  const stuck = j.node_routing?.stuck_in_node;
  if (stuck) flags.push('STUCK_IN_NODE: ' + (typeof stuck === 'string' ? stuck : JSON.stringify(stuck)));
  // tool call health
  const missing = j.tool_call_health?.missing || j.tool_call_health?.missing_tools || [];
  if (missing.length > 0) flags.push('MISSING_TOOLS: ' + missing.slice(0, 3).map(m => typeof m === 'string' ? m : JSON.stringify(m)).join('; '));
  // discrepancies (fabrication)
  const fabrications = (j.discrepancies || []).filter(disc => disc.type === 'fabrication' || disc.discrepancy_type === 'fabrication');
  if (fabrications.length > 0) flags.push('FABRICATION: ' + fabrications.length + ' cases');

  if (flags.length > 0) {
    concerns.push({ run: d, flags });
  }
}

console.log('=== JUDGE ASSESSMENT AUDIT ===');
console.log('Total judged runs:', totalJudged);
console.log('Runs with concerns:', concerns.length);
console.log('');

if (concerns.length === 0) {
  console.log('✓ No production-safety / fabrication / stuck-node / tool-gap concerns flagged by judge across all runs.');
} else {
  // Group by gym for clarity
  const byGym = {};
  for (const c of concerns) {
    const gym = c.run.split('_')[0];
    if (!byGym[gym]) byGym[gym] = [];
    byGym[gym].push(c);
  }
  for (const [gym, gymConcerns] of Object.entries(byGym)) {
    console.log(`-- ${gym} (${gymConcerns.length}) --`);
    for (const c of gymConcerns) {
      console.log(`  ${c.run}`);
      for (const f of c.flags) console.log(`    ${f.slice(0, 250)}`);
    }
  }
}
