/**
 * Deploy Vacaville v3.19:
 *   1) Create new bot from updated KDL (conversationReason: free-trial fix + MaxAttempts unlimited + minor gate + aggression detection)
 *   2) Publish
 *   3) Attach to GS Ads source (tag: test - live chat, channel: Live_Chat)
 *   4) Read-back verify prohibitedWords (platform strips on every deploy — flag if empty)
 *   5) Save bot ID to state file
 *
 * After deploy: manually restore prohibited words in CloseBot UI:
 *   Settings -> Prohibited Words → waiver, insurance, regulations, compliance
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v3.19.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG = 'test - live chat';
const CHANNEL = 'Live_Chat';
const VERSION_LABEL = 'v3.19';
const EXPECTED_PROHIBITED = ['waiver', 'insurance', 'regulations', 'compliance'];

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); }
  return process.env[k];
}
async function api(method, ep, body) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log(`=== Vacaville ${VERSION_LABEL} deploy ===`);
  log('  Change: conversationReason — "first class" not "free trial"');

  // Step 1: Create new bot from updated KDL
  log('--- Step 1: Create bot ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v3.kdl'), 'utf8');
  const name = `Vacaville ${VERSION_LABEL} — GS Ads (${new Date().toISOString().slice(0, 16)})`;
  log(`  name: ${name}`);
  log(`  KDL size: ${kdl.length} chars`);
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  log(`  create → ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json).slice(0, 500)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  if (!botId) { log('FAIL: no bot ID in response: ' + JSON.stringify(c.json).slice(0, 300)); process.exit(1); }
  log(`  bot ID: ${botId}`);

  // Step 2: Publish
  log('--- Step 2: Publish ---');
  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${p.status}`);
  if (!p.ok) log('  WARN publish: ' + JSON.stringify(p.json).slice(0, 300));

  // Step 3: Attach to GS Ads source
  log('--- Step 3: Attach to GS Ads source ---');
  const a = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach → ${a.status}`);
  if (!a.ok) log('  WARN attach: ' + JSON.stringify(a.json).slice(0, 300));

  // Step 4: Read-back prohibitedWords check (platform strips on every deploy)
  log('--- Step 4: Read-back prohibitedWords check ---');
  const ex = await api('GET', `/bot/${botId}/export`);
  if (ex.ok) {
    const exportedKdl = ex.json?.kdl || ex.json?.importKdl || JSON.stringify(ex.json);
    const pwLine = exportedKdl.match(/prohibitedWords[^\n]*/)?.[0] || '';
    const hasValues = EXPECTED_PROHIBITED.every(w => exportedKdl.includes(w));
    if (hasValues) {
      log(`  prohibitedWords OK: ${pwLine.trim()}`);
    } else {
      log(`  WARNING: prohibitedWords stripped by platform (known bug).`);
      log(`  Exported line: "${pwLine.trim()}"`);
      log(`  ACTION REQUIRED: restore manually in CloseBot UI → Settings → Prohibited Words`);
      log(`  Expected values: ${EXPECTED_PROHIBITED.join(', ')}`);
    }
  } else {
    log(`  WARN: could not fetch export for read-back (${ex.status})`);
  }

  // Step 5: Save state
  const stateFile = path.join(logDir, 'v3_testbot_state.json');
  fs.writeFileSync(stateFile, JSON.stringify({
    botId,
    botName: name,
    sourceId: GS_ADS_SOURCE,
    sourceName: 'GS Ads (GHL testing)',
    filterTag: FILTER_TAG,
    channel: CHANNEL,
    version: VERSION_LABEL,
    builtAt: new Date().toISOString(),
    notes: 'v3.19: conversationReason — call it first class, never free trial.',
  }, null, 2));
  log(`  state → ${stateFile}`);

  log('');
  log('=== DEPLOY COMPLETE ===');
  log(`  Bot: ${botId}`);
  log(`  NEXT: update BOT_ID in gs_test_v3_adversarial.js to ${botId}`);
  log(`  NEXT: restore prohibited words in CloseBot UI (waiver, insurance, regulations, compliance)`);
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
