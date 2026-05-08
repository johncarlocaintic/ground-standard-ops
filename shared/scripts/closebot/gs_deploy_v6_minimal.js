/**
 * v6.0 — minimal single-Agent-Node bot.
 * Source → Method (one Section, one Instructions, no tools, no scenarios) → EOC.
 * Goal: confirm whether ANY freshly-deployed Agent Node bot can produce output today.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v6_minimal.log');
fs.writeFileSync(LOG, '');
const KDL_SOURCE = path.join(logDir, 'vacaville_v6_minimal_agent.kdl');

function log(m) { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); fs.appendFileSync(LOG, line + '\n'); }
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log('=== v6.0 minimal Agent Node deploy ===');

  const kdl = fs.readFileSync(KDL_SOURCE, 'utf8');
  log(`KDL: ${kdl.length} chars`);

  log('--- Detach v5.2 from source ---');
  await api('DELETE', `/bot/bot_XCBBA2FRB26FFJ5P/source/src_4R4DUIQTMMX2NFPU`);

  log('--- Create v6.0 ---');
  const c = await api('POST', '/bot', { name: `Vacaville v6.0 - minimal Agent Node (${new Date().toISOString().slice(0, 16)})`, importKdl: kdl });
  if (!c.ok) { log(`FAIL: ${c.status} ${JSON.stringify(c.json).slice(0,400)}`); process.exit(1); }
  const botId = c.json.id;
  log(`bot ID: ${botId}`);

  log('--- Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`publish → ${pub.status}`);

  log('--- Attach ---');
  const attach = await api('POST', `/bot/${botId}/source/src_4R4DUIQTMMX2NFPU`, {
    tags: [],
    channels: ['Test Chat 12 [VACAVILLE ]'],
    enabled: true,
  });
  log(`attach → ${attach.status}`);

  log('--- Re-publish ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  log(`re-publish → ${pub2.status}`);

  log('=== DONE ===');
  log(`v6.0 bot ID: ${botId}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); console.error(e); process.exit(1); });
