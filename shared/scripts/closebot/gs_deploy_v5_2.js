/**
 * v5.2 — trimmed Agent Nodes (under 1000 char limit per node) + Statement preamble.
 *
 * Architecture: same as v5.1, but each Method's Sections + Instructions trimmed
 * to comply with CloseBot's 1000 char/node limit.
 *
 * Source: shared/logs/vacaville_v5.2.kdl (hand-written, already trimmed).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v5_2.log');
fs.writeFileSync(LOG, '');

const KDL_SOURCE = path.join(logDir, 'vacaville_v5.2.kdl');
const VERSION_LABEL = 'v5.2';

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
  log(`=== ${VERSION_LABEL} deploy — trimmed Agent Nodes (≤1k chars) ===`);

  const kdl = fs.readFileSync(KDL_SOURCE, 'utf8');
  log(`KDL: ${kdl.length} chars`);

  const name = `Vacaville ${VERSION_LABEL} TEST - trimmed agent nodes (${new Date().toISOString().slice(0, 16)})`;

  log('--- Step 1: Detach v5.1 from source ---');
  const detach = await api('DELETE', `/bot/bot_PS2AE0BPP2WKCUBC/source/src_4R4DUIQTMMX2NFPU`);
  log(`detach v5.1 → ${detach.status}`);

  log('--- Step 2: Create v5.2 ---');
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  if (!c.ok) { log(`FAIL: ${c.status} ${JSON.stringify(c.json).slice(0,500)}`); process.exit(1); }
  const botId = c.json.id;
  log(`bot ID: ${botId}`);

  log('--- Step 3: Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`publish → ${pub.status}`);

  log('--- Step 4: saveTools ---');
  const tools = await api('POST', `/bot/${botId}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }
  ]);
  log(`saveTools → ${tools.status}`);

  log('--- Step 5: Attach to GS Ads source (Test Chat 12) ---');
  const attach = await api('POST', `/bot/${botId}/source/src_4R4DUIQTMMX2NFPU`, {
    tags: [],
    channels: ['Test Chat 12 [VACAVILLE ]'],
    enabled: true,
  });
  log(`attach → ${attach.status}`);

  log('--- Step 6: Re-publish ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  log(`re-publish → ${pub2.status}`);

  log(`\n=== DEPLOY COMPLETE ===`);
  log(`v5.2 bot ID: ${botId}`);
  log(`Test command:`);
  log(`  $env:CB_TEST_BOT_ID="${botId}"; node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_deep_diagnostic.js`);
}

main().catch(e => { log(`FATAL: ${e.message}`); console.error(e); process.exit(1); });
