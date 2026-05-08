import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_attach_source_v3.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI';
const REF_BOT_ID = 'bot_9SWB45KI6PAJMX4Y'; // Vacaville DEMO — has GS Ads
const SOURCE = {
  id: 'src_4R4DUIQTMMX2NFPU', category: 'GHLS', key: 'isGl70YkeLEAiVckMhgT',
  name: 'GS Ads', tags: [], channelList: [], personaNameOverride: null, enabled: true,
};

async function verify(label) {
  const r = await req('GET', `/bot/${BOT_ID}`);
  const found = r.json?.sources?.some(s => s.name === 'GS Ads');
  log(`  [verify:${label}] sources.length=${r.json?.sources?.length ?? 'n/a'} attached=${found}`);
  return found;
}

async function try_(label, method, ep, body) {
  log(`\n[${label}] ${method} ${ep}`);
  const r = await req(method, ep, body);
  log(`  → ${r.status}`);
  logJson(`resp:${label}`, r.json);
  const attached = await verify(label);
  if (attached) { log(`✅ SUCCESS via ${method} ${ep}`); return true; }
  return false;
}

async function main() {
  log(`=== Attach v3 — ${BOT_ID} ===`);

  // Fetch ref bot to learn steps/structure
  log('\n[ref] GET reference bot steps');
  const refVersions = await req('GET', `/bot/${REF_BOT_ID}/versions`);
  log(`  versions status ${refVersions.status}`);
  logJson('ref versions', refVersions.json);

  const refLatest = Array.isArray(refVersions.json) && refVersions.json.length > 0
    ? refVersions.json[refVersions.json.length - 1]?.version
    : null;
  log(`  ref latest version: ${refLatest}`);

  if (refLatest) {
    const refSteps = await req('GET', `/bot/${REF_BOT_ID}/versions/${refLatest}/steps`);
    log(`  ref steps status ${refSteps.status}`);
    logJson('ref steps (structure)', refSteps.json);
  }

  // Fetch OUR bot's steps
  log('\n[ours] GET our bot latest version steps');
  const ourVersions = await req('GET', `/bot/${BOT_ID}/versions`);
  logJson('our versions', ourVersions.json);
  const ourLatest = Array.isArray(ourVersions.json) && ourVersions.json.length > 0
    ? ourVersions.json[ourVersions.json.length - 1]?.version
    : null;
  log(`  our latest version: ${ourLatest}`);
  let ourSteps = null;
  if (ourLatest) {
    const s = await req('GET', `/bot/${BOT_ID}/versions/${ourLatest}/steps`);
    log(`  our steps status ${s.status}`);
    ourSteps = s.json;
    logJson('our steps', s.json);
  }

  // Get current bot shell
  const cur = await req('GET', `/bot/${BOT_ID}`);
  logJson('current bot', cur.json);

  // Attempt A: /save with { botSteps, sources }
  if (await try_('A', 'POST', `/bot/${BOT_ID}/save`, { botSteps: ourSteps ?? [], sources: [SOURCE] })) return;

  // Attempt B: /save with { sources } only, minimal
  if (await try_('B', 'POST', `/bot/${BOT_ID}/save`, { sources: [SOURCE], botSteps: [] })) return;

  // Attempt C: /save with full bot + sources
  const fullBody = { ...cur.json, sources: [SOURCE] };
  delete fullBody.versions;
  delete fullBody.modifiedAt;
  delete fullBody.modifiedBy;
  if (await try_('C', 'POST', `/bot/${BOT_ID}/save`, fullBody)) return;

  // Attempt D: /save with steps wrapped + sources
  if (await try_('D', 'POST', `/bot/${BOT_ID}/save`, { botSteps: ourSteps ?? [], sources: [SOURCE], name: cur.json.name })) return;

  // Attempt E: see if there's a dedicated source-attach endpoint under /source
  if (await try_('E', 'POST', `/source/${SOURCE.id}/bot/${BOT_ID}`, {})) return;
  if (await try_('F', 'POST', `/source/${SOURCE.id}/attach`, { botId: BOT_ID })) return;
  if (await try_('G', 'POST', `/bot/${BOT_ID}/attachSource`, { sourceId: SOURCE.id })) return;
  if (await try_('H', 'POST', `/bot/${BOT_ID}/source/${SOURCE.id}`, {})) return;
  if (await try_('I', 'PUT',  `/bot/${BOT_ID}/source/${SOURCE.id}`, {})) return;

  log('\n❌ v3 exhausted.');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
