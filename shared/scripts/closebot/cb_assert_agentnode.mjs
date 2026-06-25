/**
 * cb_assert_agentnode.mjs — root-cause guard (b/c).
 * Single source of truth for "is this KDL Agent Node?". Same classifier as
 * gs_arch_audit.mjs. Used by: cb_agentnode_build (before writing output),
 * cb_import_publish (before POST), and closebot-test (pre-flight on the bot
 * under test). A classic regression becomes impossible — the build aborts.
 *
 * Usage:
 *   node shared/scripts/closebot/cb_assert_agentnode.mjs <path-to.kdl>
 *   (or pipe KDL on stdin)
 * Exit 0 = AGENT (pass). Exit 1 = NOT Agent (hard fail). Exit 2 = usage/err.
 */
import { readFileSync } from 'fs';

export function classifyKdl(kdl) {
  const agentSig = (kdl.match(/\bAgent\b|instructions|sections|@@\[|@@@\[|toolDescriptors/gi) || []).length;
  const classicNodes = (kdl.match(/^\s*(MultiObjective|Booking|AISwitch|Comparator|Conversation) (id=|\{)/gmi) || []).length;
  const ok = agentSig >= 5 && classicNodes <= 8;
  return { agentSig, classicNodes, ok };
}

// Run as CLI only when invoked directly (not when imported).
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('cb_assert_agentnode.mjs');
if (invokedDirectly) {
  const p = process.argv[2];
  let kdl = '';
  try {
    if (p) kdl = readFileSync(p, 'utf8');
    else kdl = readFileSync(0, 'utf8'); // stdin
  } catch (e) { console.error('ASSERT ERR: cannot read input —', e.message); process.exit(2); }
  if (!kdl.trim()) { console.error('ASSERT ERR: empty KDL'); process.exit(2); }
  const c = classifyKdl(kdl);
  if (c.ok) {
    console.log(`ASSERT PASS — Agent Node (agentSig=${c.agentSig}, classicNodes=${c.classicNodes})`);
    process.exit(0);
  }
  console.error(`ASSERT FAIL — NOT Agent Node (agentSig=${c.agentSig} need>=5, classicNodes=${c.classicNodes} need<=8). Build aborted.`);
  process.exit(1);
}
