import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_sim_swap_testA.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

const CB = 'https://api.closebot.com';
const CB_H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

const GHL = 'https://services.leadconnectorhq.com';
const GHL_H = {
  'Authorization': `Bearer ${process.env.GHL_GS_API_TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};
const LOC = process.env.GHL_GS_LOCATION_ID;

async function cb(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: CB_H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}
async function ghl(method, ep, body) {
  const r = await fetch(`${GHL}${ep}`, { method, headers: GHL_H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI';
const VACAVILLE_SRC = 'src_GDKORXSW4Q8RQUQ8';
const GS_ADS_SRC = 'src_4R4DUIQTMMX2NFPU';

async function main() {
  log('=== Swap bot source: Vacaville → GS Ads + run comma-pack test ===');

  // STEP 1: Current state
  log('\n[0] Current bot state');
  const pre = await cb('GET', `/bot/${BOT_ID}`);
  log(`  sources: [${(pre.json.sources||[]).map(s => s.name).join(', ')}]`);

  // STEP 2: Detach Vacaville (if attached)
  if ((pre.json.sources||[]).find(s => s.id === VACAVILLE_SRC)) {
    log(`\n[1] Detaching Vacaville (${VACAVILLE_SRC})`);
    const d = await cb('DELETE', `/bot/${BOT_ID}/source/${VACAVILLE_SRC}`);
    log(`  → ${d.status}`);
  } else {
    log(`\n[1] Vacaville not attached — skipping detach`);
  }

  // STEP 3: Attach GS Ads with concierge tag, no channels
  log(`\n[2] Attaching GS Ads (${GS_ADS_SRC}) with tags=[concierge], channels=[]`);
  const a = await cb('POST', `/bot/${BOT_ID}/source/${GS_ADS_SRC}`, {
    tags: [{ name: 'concierge', approveDeny: true, id: 'concierge' }],
    channels: [],
    input: {},
  });
  log(`  → ${a.status}`);
  const verify = await cb('GET', `/bot/${BOT_ID}`);
  const attached = (verify.json.sources||[]).find(s => s.id === GS_ADS_SRC);
  log(`  ${attached ? '✅ GS Ads attached with tags: ' + JSON.stringify(attached.tags) : '❌ attach failed'}`);

  // ========= TEST A: comma-pack viability =========
  log('\n=== TEST A: Comma-pack viability (direct GHL writes) ===');

  // Create test contact
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  log(`\n[A1] Creating test contact CLAUDE-TEST-COMMAPACK-${ts}`);
  const contactBody = {
    locationId: LOC,
    firstName: 'CLAUDE-TEST-COMMAPACK',
    lastName: ts,
    email: `claude-test-commapack-${ts}@example.invalid`,
    tags: ['do-not-use', 'claude-test-commapack'],
  };
  const c = await ghl('POST', '/contacts/', contactBody);
  log(`  → ${c.status}`);
  if (!c.ok) { logJson('  create err', c.json); return; }
  const contactId = c.json?.contact?.id || c.json?.id;
  log(`  ✅ contact id: ${contactId}`);

  // Write comma-packed values
  log(`\n[A2] Writing comma-packed values`);
  const cfYouth = [
    { id: '0qK1RF7UcA9vusObgxov', key: 'youth_name', field_value: 'Alice Smith, Bob Smith' },
    { id: 'WF8LVDZHEkMD5kSol7AM', key: 'youth_birthday', field_value: '2017-05-10, 2013-09-22' },
  ];
  const update = await ghl('PUT', `/contacts/${contactId}`, {
    customFields: cfYouth,
  });
  log(`  → ${update.status}`);
  logJson('update response', update.json);

  // Read back
  log(`\n[A3] Reading back contact to verify persistence`);
  const read = await ghl('GET', `/contacts/${contactId}`);
  log(`  → ${read.status}`);
  const readCf = read.json?.contact?.customFields || [];
  log(`  contact has ${readCf.length} custom field entries`);
  for (const f of readCf) {
    log(`    - fieldId=${f.id}  value=${JSON.stringify(f.value ?? f.field_value)}`);
  }

  // Analyze
  const youthNameEntry = readCf.find(x => x.id === '0qK1RF7UcA9vusObgxov');
  const youthBdayEntry = readCf.find(x => x.id === 'WF8LVDZHEkMD5kSol7AM');
  log('\n=== TEST A RESULTS ===');
  log(`Youth Name (TEXT):     ${youthNameEntry ? 'PERSISTED as ' + JSON.stringify(youthNameEntry.value ?? youthNameEntry.field_value) : '❌ DID NOT PERSIST'}`);
  log(`Youth Birthday (DATE): ${youthBdayEntry ? 'PERSISTED as ' + JSON.stringify(youthBdayEntry.value ?? youthBdayEntry.field_value) : '❌ DID NOT PERSIST'}`);

  // Save the contact ID for cleanup
  fs.writeFileSync(path.join(logDir, 'sim_test_contacts.json'), JSON.stringify({ commapackContact: contactId }, null, 2));
  log(`\nSaved contact id for cleanup → shared/logs/sim_test_contacts.json`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
