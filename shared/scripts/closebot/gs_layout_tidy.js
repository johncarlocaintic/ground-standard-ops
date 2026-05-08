import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');

// Start from v2 KDL (has all fixes)
let kdl = fs.readFileSync(path.join(logDir, 'rebuild_bot_fixed_v2.kdl'), 'utf8');

// ------ Parse: find every node's id, and its Next/True/False/AiCases:N handles ------
// Node block pattern: Type id="NAME" { ... __position X Y \n __zIndex N \n }
// Handle references: Next handle="NAME" | True handle="NAME" | False handle="NAME" | AiCases:N handle="NAME"

const nodeRegex = /^(Source|Objective|MultiObjective|Comparator|AISwitch|Booking|Statement|Conversation|ModifyTags|SetField|ScenarioCustom|End) id="([^"]+)" \{([\s\S]*?)\n\}/gm;
const nodes = new Map(); // id → { type, body, handles: [ids] }
let match;
while ((match = nodeRegex.exec(kdl)) !== null) {
  const [, type, id, body] = match;
  const handles = [];
  const handleRe = /(?:Next|True|False|AiCases:\d+) handle="([^"]+)"/g;
  let hm;
  while ((hm = handleRe.exec(body)) !== null) handles.push(hm[1]);
  nodes.set(id, { type, body, handles, originalMatch: match[0] });
}
console.log(`Parsed ${nodes.size} nodes.`);

// ------ Topological layering via BFS from Source ------
const sourceId = [...nodes.keys()].find(id => nodes.get(id).type === 'Source');
if (!sourceId) { console.log('No Source node found'); process.exit(1); }

const layers = new Map(); // id → layer index
layers.set(sourceId, 0);
const queue = [sourceId];
while (queue.length > 0) {
  const id = queue.shift();
  const depth = layers.get(id);
  const node = nodes.get(id);
  if (!node) continue;
  for (const h of node.handles) {
    if (h === 'EOC') continue; // end-of-conversation marker
    if (!nodes.has(h)) continue;
    const existing = layers.get(h);
    if (existing === undefined || existing < depth + 1) {
      layers.set(h, depth + 1);
      queue.push(h);
    }
  }
}

// Scenarios (not reachable from source via Next) get their own layer at 0 (left edge)
for (const id of nodes.keys()) {
  if (!layers.has(id)) {
    if (nodes.get(id).type === 'ScenarioCustom') {
      layers.set(id, 0);
    } else {
      layers.set(id, 0); // fallback — shouldn't happen after n25/n46/n56 removed
    }
  }
}

console.log(`Layer assignments: ${[...new Set(layers.values())].length} distinct layers`);

// ------ Group nodes per layer, assign Y within layer ------
const layerMap = new Map(); // layer → [ids]
for (const [id, l] of layers.entries()) {
  if (!layerMap.has(l)) layerMap.set(l, []);
  layerMap.get(l).push(id);
}

const X_SPACING = 420;
const Y_SPACING = 220;
const positions = new Map(); // id → { x, y }

// Heuristic ordering by node id number when possible
function nodeOrder(id) {
  const m = id.match(/^n(\d+)/);
  return m ? parseInt(m[1], 10) : 9999;
}

for (const [layer, ids] of layerMap.entries()) {
  ids.sort((a, b) => nodeOrder(a) - nodeOrder(b));
  const n = ids.length;
  const x = layer * X_SPACING;
  ids.forEach((id, idx) => {
    // center vertically: offsets from -((n-1)/2)*SP to ((n-1)/2)*SP
    const y = (idx - (n - 1) / 2) * Y_SPACING;
    positions.set(id, { x, y });
  });
}

console.log(`\nFirst 10 positions:`);
let c = 0;
for (const [id, p] of positions.entries()) {
  if (c++ < 10) console.log(`  ${id.padEnd(40)} x=${p.x.toFixed(0).padStart(6)}  y=${p.y.toFixed(0).padStart(6)}  layer=${layers.get(id)}`);
}

// ------ Rewrite each node's __position line ------
let newKdl = kdl;
let updated = 0;
for (const [id, pos] of positions.entries()) {
  // Find the node's __position line and replace
  const nodeHeadRe = new RegExp(`(id="${id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}"[\\s\\S]*?)__position\\s+[-0-9.]+(?:\\s+[-0-9.]+)?`, 'g');
  const before = newKdl;
  newKdl = newKdl.replace(nodeHeadRe, `$1__position ${pos.x.toFixed(1)} ${pos.y.toFixed(1)}`);
  if (newKdl !== before) updated++;
}
console.log(`\nUpdated positions on ${updated} / ${positions.size} nodes`);

fs.writeFileSync(path.join(logDir, 'rebuild_bot_tidied.kdl'), newKdl);
console.log(`\nTidied KDL saved → shared/logs/rebuild_bot_tidied.kdl (${newKdl.length} chars)`);

// Import as new bot
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const botName = `Vacaville v2 TIDIED (${new Date().toISOString().slice(0,19)})`;
console.log(`\n--- Importing as: ${botName} ---`);
const createRes = await fetch('https://api.closebot.com/bot', {
  method: 'POST', headers: H,
  body: JSON.stringify({ name: botName, importKdl: newKdl }),
});
const createText = await createRes.text();
let createJson; try { createJson = JSON.parse(createText); } catch { createJson = { raw: createText.slice(0, 400) }; }
console.log(`  → ${createRes.status}`);
if (!createRes.ok) { console.log('  FAIL:', JSON.stringify(createJson).slice(0, 600)); process.exit(1); }
const newBotId = createJson?.id || createJson?.bot?.id;
console.log(`  new bot: ${newBotId}`);

const pub = await fetch(`https://api.closebot.com/bot/${newBotId}/publish`, { method: 'POST', headers: H, body: '{}' });
console.log(`  publish → ${pub.status}`);
const attach = await fetch(`https://api.closebot.com/bot/${newBotId}/source/src_4R4DUIQTMMX2NFPU`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ tags: [{ name: 'concierge', approveDeny: true, id: 'concierge' }], channels: [], enabled: true }),
});
console.log(`  attach GS Ads → ${attach.status}`);

const state = JSON.parse(fs.readFileSync(path.join(logDir, 'sim_test_contacts.json'), 'utf8'));
state.tidiedBotId = newBotId;
fs.writeFileSync(path.join(logDir, 'sim_test_contacts.json'), JSON.stringify(state, null, 2));
console.log(`\n✅ Tidied bot ready: ${newBotId}  — open in CloseBot UI to review layout`);
