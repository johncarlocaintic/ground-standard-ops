import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_attach_source_v2.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const b = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(b); fs.appendFileSync(logFile, b + '\n'); }

const BASE = 'https://api.closebot.com';
const API_KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  return { status: res.status, ok: res.ok, json };
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI';
const DEMO_BOT_ID = 'bot_PPGY5C82D1WJFLJP'; // we'll find the demo bot that has GS Ads attached
const SOURCE = {
  id: 'src_4R4DUIQTMMX2NFPU',
  category: 'GHLS',
  key: 'isGl70YkeLEAiVckMhgT',
  name: 'GS Ads',
  tags: [],
  channelList: [],
  personaNameOverride: null,
  enabled: true,
};

async function verify(label) {
  const r = await req('GET', `/bot/${BOT_ID}`);
  const found = r.json?.sources?.some(s => s.name === 'GS Ads');
  log(`  [verify:${label}] sources=${JSON.stringify(r.json?.sources)} attached=${found}`);
  return found;
}

async function main() {
  log(`=== Attach v2 — ${BOT_ID} ===`);

  // First: look at an existing bot WITH sources and fetch its FULL representation
  // to see if there are any extra fields we need
  log('\n[ref] Fetching a bot that HAS GS Ads attached');
  const bots = await req('GET', '/bot');
  const withGSAds = bots.json.find(b =>
    Array.isArray(b.sources) && b.sources.some(s => s.name === 'GS Ads')
  );
  if (withGSAds) {
    log(`  Reference bot: "${withGSAds.name}" (${withGSAds.id})`);
    const full = await req('GET', `/bot/${withGSAds.id}`);
    logJson('Full reference bot', full.json);
  }

  // Attempt 1: POST /bot/{id}/save with just sources
  log('\n[try 1] POST /bot/{id}/save with {sources:[...]}');
  let r = await req('POST', `/bot/${BOT_ID}/save`, { sources: [SOURCE] });
  log(`  → ${r.status}`); logJson('  response', r.json);
  if (await verify('try1')) { log('✅ SUCCESS'); return; }

  // Attempt 2: POST /bot/{id}/save with full bot shape
  log('\n[try 2] POST /bot/{id}/save with full bot object');
  const current = await req('GET', `/bot/${BOT_ID}`);
  const fullBody = { ...current.json, sources: [SOURCE] };
  r = await req('POST', `/bot/${BOT_ID}/save`, fullBody);
  log(`  → ${r.status}`); logJson('  response', r.json);
  if (await verify('try2')) { log('✅ SUCCESS'); return; }

  // Attempt 3: PUT /bot/{id} with FULL bot object (including name etc + sources)
  log('\n[try 3] PUT /bot/{id} with full bot object including name');
  r = await req('PUT', `/bot/${BOT_ID}`, fullBody);
  log(`  → ${r.status}`); logJson('  response', r.json);
  if (await verify('try3')) { log('✅ SUCCESS'); return; }

  // Attempt 4: POST /source with the source object (create or attach?)
  log('\n[try 4] POST /source');
  r = await req('POST', '/source', { ...SOURCE, botId: BOT_ID });
  log(`  → ${r.status}`); logJson('  response', r.json);
  if (await verify('try4')) { log('✅ SUCCESS'); return; }

  // Attempt 5: look for swagger/openapi spec
  log('\n[meta] Probing for API docs / schema');
  for (const path of ['/swagger.json', '/openapi.json', '/swagger', '/docs.json', '/api-docs', '/schema']) {
    const rr = await req('GET', path);
    log(`  GET ${path.padEnd(20)} → ${rr.status}`);
    if (rr.ok) logJson(`  ${path}`, rr.json);
  }

  log('\n❌ v2 exhausted without success. See log.');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
