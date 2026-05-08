import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');

const exp = JSON.parse(fs.readFileSync(path.join(logDir, 'rebuild_bot_export.json'), 'utf8'));
let kdl = exp.kdl;

const map = {
  'Kids 7-13 Jiu-Jitsu': 'GWdabDvAgRFHZGsBN9Fq',
  'Kids 10-14 BJJ': 'W9sKR4wWzEGUw4zTzIZJ',
  'Kids 3-5 BJJ': 'VzusiMBZhpLauldz1Xcv',
  'Adult No-Gi Submission Grappling': 'KKR9rxFq16DS0fykxXMa',
};

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

for (const [name, id] of Object.entries(map)) {
  const re = new RegExp(`CalendarName "${esc(name)}"`, 'g');
  const matches = (kdl.match(re) || []).length;
  kdl = kdl.replace(re, `CalendarName "${id}"`);
  console.log(`  ${matches}× "${name}" → ${id}`);
}

fs.writeFileSync(path.join(logDir, 'rebuild_bot_calid.kdl'), kdl);
console.log(`\nKDL written → shared/logs/rebuild_bot_calid.kdl (${kdl.length} chars)`);

const remainingNames = (kdl.match(/CalendarName "(Kids|Adult)[^"]*"/g) || []);
console.log('CalendarName entries still using names:', remainingNames);

const idRefs = (kdl.match(/CalendarName "[A-Za-z0-9]{18,22}"/g) || []);
console.log('CalendarName entries now with IDs:', idRefs.length);

// Now import as a new bot
const CB = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const botName = `Vacaville v2 (CALID TEST ${new Date().toISOString().slice(0,19)})`;

console.log(`\n[import] POST /bot  name="${botName}"`);
const createRes = await fetch(`${CB}/bot`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ name: botName, importKdl: kdl }),
});
const createText = await createRes.text();
let createJson;
try { createJson = JSON.parse(createText); } catch { createJson = { raw: createText.slice(0, 500) }; }
console.log('  →', createRes.status);
console.log('  response:', JSON.stringify(createJson, null, 2).slice(0, 500));

const newBotId = createJson?.id || createJson?.bot?.id;
if (!newBotId) { console.log('FAIL - no bot id'); process.exit(1); }

console.log(`\n[publish] POST /bot/${newBotId}/publish`);
const pub = await fetch(`${CB}/bot/${newBotId}/publish`, { method: 'POST', headers: H, body: JSON.stringify({}) });
console.log('  →', pub.status);

console.log(`\n[attach] POST /bot/${newBotId}/source/src_4R4DUIQTMMX2NFPU`);
const att = await fetch(`${CB}/bot/${newBotId}/source/src_4R4DUIQTMMX2NFPU`, {
  method: 'POST', headers: H,
  body: JSON.stringify({
    tags: [{ name: 'concierge', approveDeny: true, id: 'concierge' }],
    channels: [],
    input: {},
  }),
});
console.log('  →', att.status);

// Save bot id
const state = JSON.parse(fs.readFileSync(path.join(logDir, 'sim_test_contacts.json'), 'utf8'));
state.calidBotId = newBotId;
fs.writeFileSync(path.join(logDir, 'sim_test_contacts.json'), JSON.stringify(state, null, 2));
console.log(`\n✅ New bot ready: ${newBotId}`);
console.log(`   saved to shared/logs/sim_test_contacts.json`);
