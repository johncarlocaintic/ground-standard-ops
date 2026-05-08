import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');

const kdl = fs.readFileSync(path.join(logDir, 'rebuild_bot_fixed_v2.kdl'), 'utf8');

// Node parse
const nodeRegex = /^(Source|Objective|MultiObjective|Comparator|AISwitch|Booking|Statement|Conversation|ModifyTags|SetField|ScenarioCustom|End) id="([^"]+)" \{([\s\S]*?)\n\}/gm;
const nodes = [];
let m;
while ((m = nodeRegex.exec(kdl)) !== null) {
  const [, type, id, body] = m;
  // Extract Title
  const titleMatch = body.match(/Title "([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : id;
  // Extract edges
  const edges = [];
  const nextRe = /(?:^|\n)\s*Next handle="([^"]+)"/g;
  let e;
  while ((e = nextRe.exec(body)) !== null) edges.push({ target: e[1], label: '' });
  const trueRe = /(?:^|\n)\s*True handle="([^"]+)"/g;
  while ((e = trueRe.exec(body)) !== null) edges.push({ target: e[1], label: 'true' });
  const falseRe = /(?:^|\n)\s*False handle="([^"]+)"/g;
  while ((e = falseRe.exec(body)) !== null) edges.push({ target: e[1], label: 'false' });
  const aiCaseRe = /AiCases:(\d+) handle="([^"]+)"/g;
  // Extract CaseName labels for AISwitch
  const caseNames = [];
  const caseRe = /CaseName "([^"]+)"/g;
  let cm;
  while ((cm = caseRe.exec(body)) !== null) caseNames.push(cm[1]);
  while ((e = aiCaseRe.exec(body)) !== null) {
    const idx = parseInt(e[1], 10);
    const shortLabel = caseNames[idx] ? caseNames[idx].slice(0, 30) : `case ${idx}`;
    edges.push({ target: e[2], label: shortLabel });
  }
  nodes.push({ type, id, title, edges });
}

// Format label for Mermaid — type + short title
function shortLabel(n) {
  const titleTrim = n.title.length > 40 ? n.title.slice(0, 37) + '...' : n.title;
  return `${n.id}<br/>[${n.type}]<br/>${titleTrim}`;
}

// Emit Mermaid
let out = 'flowchart LR\n';

// Style classes per type
out += '  classDef source fill:#9cf,stroke:#333,stroke-width:2px,color:#000\n';
out += '  classDef obj fill:#ff9,stroke:#333,color:#000\n';
out += '  classDef branch fill:#f9f,stroke:#333,color:#000\n';
out += '  classDef book fill:#9f9,stroke:#333,color:#000\n';
out += '  classDef statement fill:#fcf,stroke:#333,color:#000\n';
out += '  classDef tag fill:#fc9,stroke:#333,color:#000\n';
out += '  classDef setfield fill:#cf9,stroke:#333,color:#000\n';
out += '  classDef scenario fill:#ccc,stroke:#333,color:#000,stroke-dasharray:5 5\n';
out += '  classDef end1 fill:#faa,stroke:#333,color:#000\n\n';

// Declare nodes
for (const n of nodes) {
  const label = shortLabel(n);
  out += `  ${n.id}["${label}"]\n`;
}
out += '\n';

// Edges
for (const n of nodes) {
  for (const e of n.edges) {
    if (e.target === 'EOC') {
      const endId = `EOC_${n.id}`;
      out += `  ${endId}(((End)))\n`;
      out += `  ${n.id} -.->${e.label ? `|${e.label}|` : ''} ${endId}\n`;
    } else {
      const arrow = e.label ? `-->|"${e.label.replace(/"/g, '\\"')}"|` : '-->';
      out += `  ${n.id} ${arrow} ${e.target}\n`;
    }
  }
}
out += '\n';

// Style assignments
for (const n of nodes) {
  const cls = {
    Source: 'source',
    Objective: 'obj', MultiObjective: 'obj',
    Comparator: 'branch', AISwitch: 'branch',
    Booking: 'book',
    Statement: 'statement', Conversation: 'statement',
    ModifyTags: 'tag',
    SetField: 'setfield',
    ScenarioCustom: 'scenario',
    End: 'end1',
  }[n.type] || '';
  if (cls) out += `  class ${n.id} ${cls}\n`;
}

fs.writeFileSync(path.join(logDir, 'bot_flow.mmd'), out);
console.log(`Mermaid chart saved → shared/logs/bot_flow.mmd`);
console.log(`Nodes: ${nodes.length}`);

// Also a terse per-node summary
console.log('\n=== Node inventory ===');
const counts = {};
for (const n of nodes) counts[n.type] = (counts[n.type] || 0) + 1;
for (const [t, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(20)} × ${c}`);
}

// Edge sanity: any node with no incoming edges (except Source + ScenarioCustom)?
const incoming = new Map();
for (const n of nodes) incoming.set(n.id, 0);
for (const n of nodes) for (const e of n.edges) if (incoming.has(e.target)) incoming.set(e.target, incoming.get(e.target) + 1);
console.log('\n=== Orphans (no incoming, ignoring Source+Scenarios) ===');
for (const n of nodes) {
  if (incoming.get(n.id) === 0 && n.type !== 'Source' && n.type !== 'ScenarioCustom') {
    console.log(`  ⚠ ${n.id} [${n.type}] "${n.title}"`);
  }
}

// Sanity: n79 wiring — should have >= 2 incoming from kid paths
const n79In = incoming.get('n79_write_youth_name') || 0;
console.log(`\nn79_write_youth_name incoming edges: ${n79In} (from which nodes:)`);
for (const n of nodes) for (const e of n.edges) if (e.target === 'n79_write_youth_name') console.log(`  ← ${n.id} [${n.type}] label=${e.label || '(Next)'}`);
