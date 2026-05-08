/**
 * One-off deploy for Vacaville v3.10:
 *   1) PUT KB v2.3.2 content onto file_0CUSZU82MX5UPG6O (in-place replace; no dup attachments)
 *   2) Create new test bot from updated KDL (persona with HARD FACTS at top)
 *   3) Publish
 *   4) Attach to GS Ads source with tag "test - live chat" + Live_Chat channel
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const clientDir = path.join(__dirname, '../../../clients/ground-standard');
const LOG = path.join(logDir, 'gs_deploy_v3_10.log');
fs.mkdirSync(logDir, { recursive: true });

const KB_FILE_ID = 'file_0CUSZU82MX5UPG6O';
const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG = 'test - live chat';
const CHANNEL = 'Live_Chat';
const VERSION_LABEL = 'v3.15';

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

  // Step 1: Replace KB content in place (same file_id, avoids dup-attachment bug)
  log('--- Step 1: PUT KB v2.3.2 content ---');
  const kbPath = path.join(clientDir, 'closebot/vacaville_kb_v2.1.0_DEPLOY.txt');
  const kbContent = fs.readFileSync(kbPath);
  const blob = new Blob([kbContent], { type: 'text/plain' });
  const form = new globalThis.FormData();
  form.append('newFile', blob, 'Vacaville_Grappling_Academy_CloseBot_KB_v2.3.2_DEPLOY.txt');
  const kbRes = await fetch(`https://api.closebot.com/library/files/${KB_FILE_ID}`, {
    method: 'PUT',
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY') },
    body: form,
  });
  const kbText = await kbRes.text();
  log(`  KB PUT → ${kbRes.status}: ${kbText.slice(0, 200)}`);
  if (!kbRes.ok) { log('  FATAL KB: aborting'); process.exit(1); }

  // Step 2: Create new test bot from updated KDL
  log('--- Step 2: Create test bot ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v3.kdl'), 'utf8');
  const name = `Vacaville ${VERSION_LABEL} TEST — GS Ads Live Chat (${new Date().toISOString().slice(0, 16)})`;
  log(`  name: ${name}`);
  log(`  KDL size: ${kdl.length} chars`);
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  log(`  create → ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json).slice(0, 500)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  log(`  bot ID: ${botId}`);

  // Step 3: Publish
  log('--- Step 3: Publish ---');
  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${p.status}`);
  if (!p.ok) log('  WARN publish: ' + JSON.stringify(p.json).slice(0, 300));

  // Step 4: Attach
  log('--- Step 4: Attach to GS Ads source ---');
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
    kbFileId: KB_FILE_ID,
    kbVersion: 'v2.3.2',
    builtAt: new Date().toISOString(),
    notes: 'v3.15: KB fixes — coach Nick date clarified (2018 BJJ start, 2020 under Ramos), instructional language removed. n81 ExtraPrompt rewritten to match WHEN YOU DON\'T KNOW protocol — no more "let me check on that" phrases.',
  }, null, 2));
  log(`  state → ${stateFile}`);

  log('');
  log('=== DEPLOY COMPLETE ===');
  log(`  Bot: ${botId}`);
  log(`  KB:  ${KB_FILE_ID} v2.3.2`);
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
