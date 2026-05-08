/**
 * Vacaville v3.16 deploy — prompt-tier cleanup.
 * Changes from v3.15:
 *   - conversationReason trimmed from ~900 words to ~65 words (goal + voice + 2 guardrails + positive answer directive)
 *   - n81_openqa ExtraPrompt emptied (per Idriss: ExtraPrompt is for targeted steering only; blank on simple/direct nodes)
 *
 * Unchanged: KB (v2.3.2 already deployed on file_0CUSZU82MX5UPG6O), Smart FAQ, scenarios, nodes, prohibitedWords.
 *
 * Steps:
 *   1) Create new test bot from updated KDL
 *   2) Publish
 *   3) Detach v3.15 bot from GS Ads source + rename [LEGACY]
 *   4) Attach v3.16 bot to GS Ads source with tag "test - live chat" + Live_Chat channel
 *   5) Save state
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v3_16.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG = 'test - live chat';
const CHANNEL = 'Live_Chat';
const VERSION_LABEL = 'v3.16';
const V315_BOT = 'bot_T7VCBNV3YCYMI8JP';

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(method, ep, body) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log(`=== Vacaville ${VERSION_LABEL} deploy ===`);

  // Step 1: Create new test bot from updated KDL
  log('--- Step 1: Create test bot from KDL ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v3.kdl'), 'utf8');
  const name = `Vacaville ${VERSION_LABEL} TEST — GS Ads Live Chat (${new Date().toISOString().slice(0, 16)})`;
  log(`  name: ${name}`);
  log(`  KDL size: ${kdl.length} chars`);
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  log(`  create → ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json).slice(0, 500)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  log(`  bot ID: ${botId}`);

  // Step 2: Publish
  log('--- Step 2: Publish ---');
  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${p.status}`);
  if (!p.ok) { log('FAIL publish: ' + JSON.stringify(p.json).slice(0, 400)); process.exit(1); }

  // Step 3: Archive v3.15 (detach + rename)
  log('--- Step 3: Archive v3.15 ---');
  const detach = await api('DELETE', `/bot/${V315_BOT}/source/${GS_ADS_SOURCE}`);
  log(`  detach v3.15 → ${detach.status}`);
  const v315Name = 'Vacaville v3.15 TEST — GS Ads Live Chat (2026-04-22T22:52)';
  const renameRes = await fetch(`https://api.closebot.com/bot/${V315_BOT}`, {
    method: 'PUT',
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `[LEGACY] ${v315Name}` }),
  });
  log(`  rename v3.15 → ${renameRes.status}`);

  // Step 4: Attach v3.16 to GS Ads source
  log('--- Step 4: Attach v3.16 to GS Ads ---');
  const a = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach → ${a.status}`);
  if (!a.ok) log('  WARN attach: ' + JSON.stringify(a.json).slice(0, 300));

  // Step 5: Save state
  const stateFile = path.join(logDir, 'v3_testbot_state.json');
  fs.writeFileSync(stateFile, JSON.stringify({
    botId,
    botName: name,
    sourceId: GS_ADS_SOURCE,
    sourceName: 'GS Ads (GHL testing)',
    filterTag: FILTER_TAG,
    channel: CHANNEL,
    kbFileId: 'file_0CUSZU82MX5UPG6O',
    kbVersion: 'v2.3.2',
    builtAt: new Date().toISOString(),
    notes: 'v3.16: prompt-tier cleanup. conversationReason trimmed from ~900 words (15 policy sections) to ~65 words (goal + voice + 2 hard guardrails + positive answer-from-KB directive). n81_openqa ExtraPrompt emptied. KB, Smart FAQ, scenarios, prohibitedWords unchanged. Previous v3.15 bot archived to [LEGACY].',
    priorBot: V315_BOT,
  }, null, 2));
  log(`  state → ${stateFile}`);

  log('');
  log('=== DEPLOY COMPLETE ===');
  log(`  New bot: ${botId}`);
  log(`  Prior bot (archived): ${V315_BOT}`);
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
