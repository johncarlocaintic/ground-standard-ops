import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_attach_source_final.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const s = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(s); fs.appendFileSync(logFile, s + '\n'); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI';
const SOURCE_ID = 'src_4R4DUIQTMMX2NFPU'; // GS Ads

async function verify() {
  const r = await req('GET', `/bot/${BOT_ID}`);
  logJson('bot after attach', { name: r.json?.name, sources: r.json?.sources });
  return r.json?.sources?.some(s => s.name === 'GS Ads');
}

async function tryAttach(label, body) {
  log(`\n[${label}] POST /bot/${BOT_ID}/source/${SOURCE_ID}`);
  log(`  body: ${JSON.stringify(body)}`);
  const r = await req('POST', `/bot/${BOT_ID}/source/${SOURCE_ID}`, body);
  log(`  → ${r.status}`);
  if (r.status >= 400) logJson(`  error`, r.json);
  else logJson(`  response`, r.json);
  if (r.ok) {
    if (await verify()) { log(`✅ SUCCESS with shape: ${JSON.stringify(body)}`); return true; }
  }
  return false;
}

async function main() {
  log(`=== Final attach attempt — ${BOT_ID} ← ${SOURCE_ID} (GS Ads) ===`);

  // Error said: missing 'tags', 'channels', and 'input' field required
  // Try shape per error message
  if (await tryAttach('A', { input: { tags: [], channels: [] } })) return;
  if (await tryAttach('B', { tags: [], channels: [], input: {} })) return;
  if (await tryAttach('C', { tags: [], channels: [] })) return;
  if (await tryAttach('D', { input: { tags: [], channels: [], enabled: true, personaNameOverride: null } })) return;

  log('\n=== done ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
