/**
 * Vacaville v3.16.1 — deploy with full ExtraPrompt cleanup applied.
 * v3.16 was incomplete: only the Conversation-node ExtraPrompt (n81) was emptied.
 * v3.16.1 applies the rule uniformly: all 30 Prompt/ExtraPrompt fields now empty.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v3_16_1.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG = 'test - live chat';
const CHANNEL = 'Live_Chat';
const VERSION_LABEL = 'v3.16.1';
const PRIOR_BOT = 'bot_OMZ0C13BAHR82UIY'; // incomplete v3.16

function log(m) { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); fs.appendFileSync(LOG, line + '\n'); }
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(method, ep, body) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log(`=== Vacaville ${VERSION_LABEL} deploy ===`);

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

  log('--- Step 2: Publish ---');
  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${p.status}`);
  if (!p.ok) { log('FAIL publish: ' + JSON.stringify(p.json).slice(0, 400)); process.exit(1); }

  log('--- Step 3: Archive incomplete v3.16 ---');
  const detach = await api('DELETE', `/bot/${PRIOR_BOT}/source/${GS_ADS_SOURCE}`);
  log(`  detach v3.16 → ${detach.status}`);
  const priorName = 'Vacaville v3.16 TEST — GS Ads Live Chat (2026-04-23T15:25)';
  const renameRes = await fetch(`https://api.closebot.com/bot/${PRIOR_BOT}`, {
    method: 'PUT',
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `[LEGACY] ${priorName} — incomplete cleanup` }),
  });
  log(`  rename v3.16 → ${renameRes.status}`);

  log('--- Step 4: Attach v3.16.1 to GS Ads ---');
  const a = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach → ${a.status}`);
  if (!a.ok) log('  WARN attach: ' + JSON.stringify(a.json).slice(0, 300));

  log('--- Step 5: Read-back verification ---');
  const exp = await api('GET', `/bot/${botId}/export`);
  if (exp.ok) {
    const kdlLive = typeof exp.json === 'string' ? exp.json : (exp.json.kdl || exp.json.exportKdl || '');
    const filled = (kdlLive.match(/^\s+(Prompt|ExtraPrompt)\s+"[^"]/gm) || []).length;
    const empty = (kdlLive.match(/^\s+(Prompt|ExtraPrompt)\s+""/gm) || []).length;
    log(`  live bot has ${filled} filled Prompt/ExtraPrompt fields, ${empty} empty`);
    if (filled > 0) log(`  ⚠️  ${filled} fields still filled — see export`);
    fs.writeFileSync(path.join(logDir, `gs_audit_kdl_${botId}.kdl`), kdlLive);
  }

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
    notes: 'v3.16.1: full prompt-tier cleanup. All 30 Prompt/ExtraPrompt fields emptied uniformly across MultiObjective, Booking, and Conversation nodes. v3.16 (incomplete — only n81 emptied) archived as [LEGACY].',
    priorBot: PRIOR_BOT,
  }, null, 2));
  log(`  state → ${stateFile}`);

  log('');
  log('=== DEPLOY COMPLETE ===');
  log(`  New bot: ${botId}`);
  log(`  Prior bot (archived): ${PRIOR_BOT}`);
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
