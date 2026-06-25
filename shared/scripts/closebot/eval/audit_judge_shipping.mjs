// Judge audit filtered to: (a) shipping bots only, (b) runs that completed (not SSE-truncated).
// Reads judge_assessment.json + report.md per run.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const EVAL = 'shared/logs/eval';

// Read shipping bot IDs from each gym's spec
const specs = [
  'logica-bot-spec.json', 'paragonsimi-bot-spec.json', 'ombjj-bot-spec.json', 'sugoi-bot-spec.json',
  'raylongo-bot-spec.json', 'universalmma-bot-spec.json', 'montgomery-bot-spec.json',
  'signature-bot-spec.json', 'roberts-bot-spec.json', 'simpleman-bot-spec.json', 'killerb-bot-spec.json',
];
const shippingBots = new Set();
for (const f of specs) {
  try {
    const j = JSON.parse(readFileSync('clients/ground-standard/closebot/' + f, 'utf8'));
    const latest = j.deployHistory.find(d => /(QA-PASSED|QA-PENDING)/i.test(d.verdict || '')) || j.deployHistory[0];
    if (latest?.botId) shippingBots.add(latest.botId);
  } catch (e) {}
}
console.log('Shipping bots:', Array.from(shippingBots).join(', '));
console.log('');

const sessionGyms = ['logica', 'paragonsimi', 'ombjj', 'sugoi', 'raylongo', 'universalmma', 'montgomery', 'signature', 'roberts', 'simpleman', 'killerb'];
const allDirs = readdirSync(EVAL).filter(d => {
  if (!d.includes('20260519_') && !d.includes('20260520_')) return false;
  return sessionGyms.some(g => d.startsWith(g + '_'));
});

const concerns = [];
let scanned = 0;
let nonShipping = 0;
let sseFailed = 0;
let clean = 0;

for (const d of allDirs) {
  const reportPath = join(EVAL, d, 'report.md');
  const judgePath = join(EVAL, d, 'judge_assessment.json');
  if (!existsSync(reportPath) || !existsSync(judgePath)) continue;
  const report = readFileSync(reportPath, 'utf8');

  const botMatch = report.match(/\*\*Bot:\*\*\s*`(bot_[A-Z0-9]+)`/);
  const botId = botMatch ? botMatch[1] : null;
  if (!shippingBots.has(botId)) { nonShipping++; continue; }

  // Skip SSE-truncated runs (judge can't reliably score them)
  const termMatch = report.match(/\*\*Termination:\*\*\s*(.+)/);
  const termination = termMatch ? termMatch[1].trim() : '';
  if (/send failed|mimicBind|timeout at turn [1-3]\b/i.test(termination)) { sseFailed++; continue; }

  scanned++;
  let j;
  try { j = JSON.parse(readFileSync(judgePath, 'utf8')); } catch { continue; }

  const flags = [];
  const unsafe = j.production_safety?.safe_for_real_customers === false;
  const unsafeReason = j.production_safety?.reasoning || j.production_safety?.notes || '';
  if (unsafe) flags.push({ type: 'UNSAFE_FOR_PROD', detail: unsafeReason.slice(0, 300) });

  const gaps_chat = j.data_consistency?.gaps_chat_to_tool || [];
  if (gaps_chat.length > 0) flags.push({ type: 'GAPS_CHAT_TO_TOOL', detail: gaps_chat.slice(0, 5).map(g => typeof g === 'string' ? g : JSON.stringify(g)).join('; ') });

  const gaps_tool = j.data_consistency?.gaps_tool_to_ghl || [];
  if (gaps_tool.length > 0) flags.push({ type: 'GAPS_TOOL_TO_GHL', detail: gaps_tool.slice(0, 5).map(g => typeof g === 'string' ? g : JSON.stringify(g)).join('; ') });

  const stuck = j.node_routing?.stuck_in_node;
  if (stuck) flags.push({ type: 'STUCK_IN_NODE', detail: typeof stuck === 'string' ? stuck : JSON.stringify(stuck) });

  const missing = j.tool_call_health?.missing || j.tool_call_health?.missing_tools || [];
  if (missing.length > 0) flags.push({ type: 'MISSING_TOOLS', detail: missing.slice(0, 5).map(m => typeof m === 'string' ? m : JSON.stringify(m)).join('; ') });

  const fabs = (j.discrepancies || []).filter(disc => disc.type === 'fabrication' || disc.discrepancy_type === 'fabrication');
  if (fabs.length > 0) flags.push({ type: 'FABRICATION', detail: fabs.length + ' cases' });

  if (flags.length > 0) {
    concerns.push({ run: d, botId, termination, flags });
  } else {
    clean++;
  }
}

console.log('=== JUDGE AUDIT (shipping bots, non-SSE-failed runs) ===');
console.log('Total scanned:', scanned);
console.log('Clean (no judge concern):', clean);
console.log('Concerns:', concerns.length);
console.log('Skipped — non-shipping bot:', nonShipping);
console.log('Skipped — SSE/timeout truncated:', sseFailed);
console.log('');

if (concerns.length === 0) {
  console.log('No production-safety concerns from judge on shipping bots in completed runs.');
} else {
  const byGym = {};
  for (const c of concerns) {
    const gym = c.run.split('_')[0];
    if (!byGym[gym]) byGym[gym] = [];
    byGym[gym].push(c);
  }
  for (const [gym, list] of Object.entries(byGym)) {
    console.log(`-- ${gym} (${list.length}) --`);
    for (const c of list) {
      console.log('  ' + c.run + ' | bot=' + c.botId + ' | term=' + c.termination);
      for (const f of c.flags) console.log(`    [${f.type}] ${f.detail}`);
    }
    console.log('');
  }
}
