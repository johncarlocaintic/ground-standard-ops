/**
 * v5.0 — minimal test workflow with Statement node (v3-style) instead of Agent Node.
 * Goal: confirm whether the silence is Agent Node (Method type) specific or affects all node types.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v5_test_node.log');
fs.writeFileSync(LOG, '');

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
  log('=== v5.0 test node deploy (Statement instead of Method/Agent Node) ===');

  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v5_test_node.kdl'), 'utf8');
  log(`KDL: ${kdl.length} chars`);

  const name = `Vacaville v5.0 TEST - Statement node (${new Date().toISOString().slice(0, 16)})`;
  log(`name: ${name}`);

  log('--- Step 1: Create ---');
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  if (!c.ok) { log(`FAIL: ${c.status} ${JSON.stringify(c.json).slice(0,500)}`); process.exit(1); }
  const botId = c.json.id;
  log(`bot ID: ${botId}`);

  log('--- Step 2: Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`publish → ${pub.status}`);

  log('--- Step 3: Attach to GS Ads source (Test Chat 12 channel) ---');
  const attach = await api('POST', `/bot/${botId}/source/src_4R4DUIQTMMX2NFPU`, {
    tags: [],
    channels: ['Test Chat 12 [VACAVILLE ]'],
    enabled: true,
  });
  log(`attach → ${attach.status}`);

  log('--- Step 4: Re-publish ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  log(`re-publish → ${pub2.status}`);

  log(`\n=== DEPLOY COMPLETE ===`);
  log(`v5.0 bot ID: ${botId}`);
  log('NEXT:');
  log(`  $env:CB_TEST_BOT_ID="${botId}"; node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/orchestrator.js`);
}

main().catch(e => { log(`FATAL: ${e.message}`); console.error(e); process.exit(1); });
