/**
 * Vacaville v4.0 deploy — Agent Node rebuild.
 *
 * Architecture: 3 Agent Nodes (Intro/Q&A → Details → Book) + 4 scenarios.
 * Runs in PARALLEL with v3 on a separate test tag — does not archive v3.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_deploy_v4_0.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v4_0.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE  = 'src_4R4DUIQTMMX2NFPU';   // GS Ads testing source
const FILTER_TAG     = 'test - v4 agent node';     // separate tag from v3 tests
const CHANNEL        = 'Live_Chat';
const VERSION_LABEL  = 'v4.0';

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
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

async function main() {
  log(`=== Vacaville ${VERSION_LABEL} deploy ===`);

  // ── 1. Create bot from KDL ────────────────────────────────────────────────
  log('--- 1. Create bot ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v4.0.kdl'), 'utf8');
  const name = `Vacaville ${VERSION_LABEL} TEST - Agent Node (${new Date().toISOString().slice(0, 16)})`;
  log(`  KDL size: ${kdl.length} chars`);
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  log(`  create → ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  if (!botId) { log('FAIL: no bot ID in response: ' + JSON.stringify(c.json)); process.exit(1); }
  log(`  bot ID: ${botId}`);

  // ── 2. Publish ────────────────────────────────────────────────────────────
  log('--- 2. Publish ---');
  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${p.status}`);
  if (!p.ok) { log('FAIL publish: ' + JSON.stringify(p.json)); process.exit(1); }

  // ── 3. Enable Smart FAQ at bot level ─────────────────────────────────────
  // Note: `type` is the display className (PascalCase), `options.$type` is the
  // discriminator (snake_case). Mismatching these returns 400 "Tool does not exist".
  log('--- 3. saveTools (SmartFAQ) ---');
  const tools = await api('POST', `/bot/${botId}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }
  ]);
  log(`  saveTools → ${tools.status}`);
  if (!tools.ok) log(`  WARN: saveTools failed — ${JSON.stringify(tools.json)}`);

  // ── 4. Attach to GS Ads source ────────────────────────────────────────────
  log('--- 4. Attach to source ---');
  const a = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach → ${a.status}`);
  if (!a.ok) log(`  WARN: attach failed — ${JSON.stringify(a.json)}`);

  // ── 5. Read-back verification ─────────────────────────────────────────────
  log('--- 5. Read-back verify ---');
  const exp = await api('GET', `/bot/${botId}/export`);
  if (exp.ok && exp.json?.kdl) {
    const kdlLive = exp.json.kdl;

    // Node count checks
    const methodNodes = (kdlLive.match(/^Method id=/gm) || []).length;
    const scenarioNodes = (kdlLive.match(/^ScenarioCustom id=/gm) || []).length;
    log(`  Method nodes: ${methodNodes} (expected 3)`);
    log(`  ScenarioCustom nodes: ${scenarioNodes} (expected 4)`);

    // Tool flag checks — Node 1 should have SmartFaq true, GhlBooking false
    const n10 = kdlLive.slice(kdlLive.indexOf('"n10_intro"'), kdlLive.indexOf('"n20_details"'));
    const n10SmartFaq = n10.match(/EnableSmartFaq\s+(\w+)/)?.[1];
    const n10Booking  = n10.match(/EnableGhlBooking\s+(\w+)/)?.[1];
    log(`  n10_intro EnableSmartFaq: ${n10SmartFaq} (expected true)`);
    log(`  n10_intro EnableGhlBooking: ${n10Booking} (expected false)`);

    // Node 3 should have GhlBooking true
    const n30 = kdlLive.slice(kdlLive.indexOf('"n30_book"'));
    const n30Booking = n30.match(/EnableGhlBooking\s+(\w+)/)?.[1];
    log(`  n30_book EnableGhlBooking: ${n30Booking} (expected true)`);

    // Exit paths
    const exitPaths = (kdlLive.match(/ExitPaths:0 handle=/g) || []).length;
    log(`  ExitPaths:0 connections: ${exitPaths} (expected 2)`);

    // ProhibitedWords check
    const pwMatch = kdlLive.match(/prohibitedWords\s+"([^"]+)"/);
    if (pwMatch) {
      log(`  prohibitedWords present: "${pwMatch[1]}" — OK`);
    } else {
      log(`  WARN: prohibitedWords missing or stripped`);
    }
  } else {
    log(`  WARN: export failed — ${exp.status}`);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  log('\n=== Deploy complete ===');
  log(`Bot ID: ${botId}`);
  log(`Name:   ${name}`);
  log(`Source: ${GS_ADS_SOURCE}`);
  log(`Tag:    ${FILTER_TAG}`);
  log('Test this bot by applying the tag above to a GHL contact on the GS Ads source.');
  log(`To test via SSE: node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_sse_test.js ${botId}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
