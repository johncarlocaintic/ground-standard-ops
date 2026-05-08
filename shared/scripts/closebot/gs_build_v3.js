import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const clientDir = path.join(__dirname, '../../../clients/ground-standard');

fs.mkdirSync(logDir, { recursive: true });

const LOG_FILE = path.join(logDir, 'gs_build_v3.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function getEnv(key) {
  if (!process.env[key]) { log(`FATAL: missing env var ${key}`); process.exit(1); }
  return process.env[key];
}

async function api(method, path, body, isFormData = false) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY') };
  if (!isFormData) H['Content-Type'] = 'application/json';
  const res = await fetch(`https://api.closebot.com${path}`, {
    method,
    headers: H,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json, text };
}

async function main() {
  log('=== Vacaville v3 Build ===');

  // ── Step 1: Replace KB (v1.5.0 → v2.1.0) ──────────────────────────────
  log('--- Step 1: Replace KB (v1.5.0 → v2.1.0) ---');
  const KB_FILE_ID = 'file_8ZV4PPX1N6Q2X1XM';
  const kbPath = path.join(clientDir, 'closebot/vacaville_kb_v2.1.0_DEPLOY.txt');
  const kbContent = fs.readFileSync(kbPath);

  const kbBlob = new Blob([kbContent], { type: 'text/plain' });
  const form = new globalThis.FormData();
  form.append('newFile', kbBlob, 'Vacaville_Grappling_Academy_CloseBot_KB_v2.1.0_DEPLOY.txt');

  const kbRes = await fetch(`https://api.closebot.com/library/files/${KB_FILE_ID}`, {
    method: 'PUT',
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY') },
    body: form,
  });
  const kbText = await kbRes.text();
  log(`  KB replace → ${kbRes.status}: ${kbText.slice(0, 200)}`);
  if (!kbRes.ok) {
    log('  WARN: KB replace failed — proceeding without KB update');
  } else {
    log('  KB updated to v2.1.0 ✅');
  }

  // ── Step 2: Create v3 bot ──────────────────────────────────────────────
  log('--- Step 2: Create v3 bot ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v3.kdl'), 'utf8');
  const botName = `Vacaville v3 (${new Date().toISOString().slice(0, 16)})`;
  log(`  name: ${botName}`);
  log(`  KDL size: ${kdl.length} chars`);

  const createRes = await api('POST', '/bot', { name: botName, importKdl: kdl });
  log(`  create → ${createRes.status}`);
  if (!createRes.ok) {
    log('  FAIL: ' + JSON.stringify(createRes.json).slice(0, 600));
    process.exit(1);
  }
  const botId = createRes.json?.id || createRes.json?.bot?.id;
  log(`  bot ID: ${botId}`);

  // ── Step 3: Publish ────────────────────────────────────────────────────
  log('--- Step 3: Publish ---');
  const pubRes = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${pubRes.status}`);
  if (!pubRes.ok) {
    log('  WARN: publish returned non-200 — ' + JSON.stringify(pubRes.json).slice(0, 300));
  } else {
    log('  published ✅');
  }

  // ── Step 4: Attach Vacaville Grappling Academy source ─────────────────
  // src_GDKORXSW4Q8RQUQ8 = "Vacaville Grappling Academy" — the correct production source
  // KB file_8ZV4PPX1N6Q2X1XM is already on this source
  log('--- Step 4: Attach Vacaville Grappling Academy source ---');
  const VGA_SOURCE_ID = 'src_GDKORXSW4Q8RQUQ8';
  const attachRes = await api('POST', `/bot/${botId}/source/${VGA_SOURCE_ID}`, {
    tags: [{ name: 'concierge', approveDeny: true, id: 'concierge' }],
    channels: [],
    enabled: true,
  });
  log(`  attach VGA source → ${attachRes.status}`);
  if (!attachRes.ok) {
    log('  WARN: attach returned non-200 — ' + JSON.stringify(attachRes.json).slice(0, 300));
  } else {
    log('  source attached ✅');
  }

  // ── Step 5: Save state ─────────────────────────────────────────────────
  log('--- Step 5: Save state ---');
  const stateFile = path.join(logDir, 'v3_state.json');
  const state = {
    botId,
    botName,
    sourceId: VGA_SOURCE_ID,
    sourceName: 'Vacaville Grappling Academy',
    kbFileId: KB_FILE_ID,
    kbVersion: 'v2.1.0',
    builtAt: new Date().toISOString(),
    notes: 'v3.2: availability-first booking — bot checks calendar first, presents real slot, accommodates preference only after multiple declines',
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  log(`  state saved → ${stateFile}`);

  log('');
  log('=== BUILD COMPLETE ===');
  log(`  Bot ID: ${botId}`);
  log(`  Source: ${VGA_SOURCE_ID} (Vacaville Grappling Academy)`);
  log(`  KB: ${KB_FILE_ID} v2.1.0`);
  log('');
  log('Next: run multi-agent tests with gs_test_v3_agents.js');
}

main().catch(err => {
  log('FATAL: ' + err.message);
  console.error(err);
  process.exit(1);
});
