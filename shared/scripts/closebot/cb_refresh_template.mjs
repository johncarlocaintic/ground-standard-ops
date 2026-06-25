/**
 * cb_refresh_template.mjs — root-cause guard (a).
 * Re-exports the 3 known-good Agent Node reference bots from LIVE CloseBot,
 * verifies each is still Agent Node, and refreshes the audit-trail copies.
 * The Agent Node build skill MUST run this at the start of every build
 * cycle so the template is a re-derived artifact, never a frozen snapshot
 * (the frozen-snapshot freeze is exactly what caused the classic diversion).
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_refresh_template.mjs
 *
 * Exit non-zero if ANY reference bot fails the Agent Node assertion.
 */
import { writeFileSync, mkdirSync } from 'fs';

const K = process.env.CB_GS_API_KEY;
if (!K) { console.error('FATAL: CB_GS_API_KEY missing'); process.exit(2); }

const REFS = {
  vacaville_prod_v46: 'bot_F0VNPTPCIW88YI3J',   // production-truth + rollback ref
  scottsdale_agent:   'bot_01MYV7I9IWMHYPCF',   // CANONICAL extraction base (cleanest)
  eden_prairie_v12:   'bot_20P7NZ6ZMRY37GC4',   // discipline-switch variant ref
};
const date = new Date().toISOString().slice(0, 10);
const dir = 'D:/CLAUDE/Work/shared/logs/_tpl_refresh';
mkdirSync(dir, { recursive: true });

// Same classifier as gs_arch_audit.mjs (single source of truth for "is Agent Node").
function classify(kdl) {
  const agentSig = (kdl.match(/\bAgent\b|instructions|sections|@@\[|@@@\[|toolDescriptors/gi) || []).length;
  const classicNodes = (kdl.match(/^\s*(MultiObjective|Booking|AISwitch|Comparator|Conversation) (id=|\{)/gmi) || []).length;
  const ok = agentSig >= 5 && classicNodes <= 8;
  return { agentSig, classicNodes, ok };
}

let fail = 0;
for (const [label, id] of Object.entries(REFS)) {
  try {
    const r = await fetch(`https://api.closebot.com/bot/${id}/export`, { headers: { 'X-CB-KEY': K } });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch { j = {}; }
    const kdl = j.kdl || '';
    if (!kdl) { console.error(`FAIL ${label} (${id}): empty export, HTTP ${r.status}`); fail++; continue; }
    const c = classify(kdl);
    const out = `${dir}/${label}_${id}_${date}.kdl`;
    writeFileSync(out, kdl);
    const verdict = c.ok ? 'AGENT ✓' : 'NOT-AGENT ✗';
    console.log(`${verdict}  ${label}  ${id}  ${kdl.length}b  agentSig=${c.agentSig} classic=${c.classicNodes}  -> ${out}`);
    if (!c.ok) fail++;
  } catch (e) {
    console.error(`FAIL ${label} (${id}): ${e.message}`); fail++;
  }
}
if (fail) { console.error(`\nFATAL: ${fail} reference bot(s) failed the Agent Node assertion. Do NOT build.`); process.exit(1); }
console.log('\nOK — all 3 Agent Node reference bots refreshed + verified. Canonical base = scottsdale_agent.');
