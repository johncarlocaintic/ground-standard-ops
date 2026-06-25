/**
 * gs_arch_audit.mjs — TRUE per-bot architecture audit by KDL export.
 * Spec metadata is unreliable; this exports every bot's live KDL and
 * classifies AGENT (correct) vs CLASSIC (wrong) by node signature.
 * Output: shared/logs/_gs_arch_audit.tsv + console summary.
 */
import { writeFileSync, appendFileSync } from 'fs';
const K = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };
const OUT = 'D:/CLAUDE/Work/shared/logs/_gs_arch_audit.tsv';

const lr = await fetch('https://api.closebot.com/bot', { headers: H });
const lj = JSON.parse(await lr.text());
const bots = lj.bots || lj.data || lj;
writeFileSync(OUT, 'arch\tbot_id\tsize\tagentSig\tclassicNodes\tsources\tname\n');
console.log('TOTAL BOTS:', bots.length, '\n');

const tally = { AGENT: 0, CLASSIC: 0, EMPTY_OR_ERR: 0 };
let n = 0;
for (const b of bots) {
  n++;
  let arch = 'ERR', size = 0, agentSig = 0, classicNodes = 0;
  try {
    const er = await fetch(`https://api.closebot.com/bot/${b.id}/export`, { headers: H });
    const et = await er.text();
    let ej; try { ej = JSON.parse(et); } catch { ej = {}; }
    const kdl = ej.kdl || '';
    size = kdl.length;
    if (kdl) {
      agentSig = (kdl.match(/\bAgent\b|instructions|sections|@@\[|@@@\[|toolDescriptors/gi) || []).length;
      classicNodes = (kdl.match(/^\s*(MultiObjective|Booking|AISwitch|Comparator|Conversation) (id=|\{)/gmi) || []).length;
      // Agent Node = many agent sigs + few classic nodes + small. Classic = many classic nodes, 0 agent sigs.
      if (agentSig >= 5 && classicNodes <= 8) arch = 'AGENT';
      else if (classicNodes >= 20 && agentSig === 0) arch = 'CLASSIC';
      else arch = `MIXED?(a${agentSig}/c${classicNodes})`;
    } else { arch = 'EMPTY_OR_ERR'; }
  } catch (e) { arch = 'ERR:' + (e.message || '').slice(0, 30); }
  if (arch === 'AGENT') tally.AGENT++; else if (arch === 'CLASSIC') tally.CLASSIC++; else tally.EMPTY_OR_ERR++;
  const sources = (b.sources || []).map(s => s.id || s.sourceId || s).join(',') || 'NONE';
  appendFileSync(OUT, `${arch}\t${b.id}\t${size}\t${agentSig}\t${classicNodes}\t${sources}\t${(b.name || '').replace(/\t/g, ' ')}\n`);
  if (n % 10 === 0) console.log(`  ...${n}/${bots.length}`);
  await new Promise(z => setTimeout(z, 250));
}
console.log('\nDONE. Tally:', JSON.stringify(tally));
console.log('Audit written:', OUT);
