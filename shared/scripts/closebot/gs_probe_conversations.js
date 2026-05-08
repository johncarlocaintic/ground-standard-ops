import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_conversations_probe.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function logJson(label, data) {
  const truncated = JSON.stringify(data, null, 2);
  const snippet = truncated.length > 4000 ? truncated.slice(0, 4000) + '\n...[truncated]' : truncated;
  const block = `\n--- ${label} ---\n${snippet}\n`;
  console.log(block);
  fs.appendFileSync(logFile, block + '\n');
}
function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };
const VACAVILLE_BOT_ID = 'bot_9SWB45KI6PAJMX4Y';

async function probe(endpoint, label) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  const status = res.status;
  const marker = res.ok ? 'PASS' : status === 404 ? 'NOT FOUND' : 'FAIL';
  log(`[${marker}] ${status} ${endpoint}   (${label})`);
  if (res.ok) {
    const shape = Array.isArray(json) ? `array(${json.length})` :
                  Array.isArray(json?.data) ? `obj{data:array(${json.data.length})}` :
                  typeof json === 'object' ? `obj{keys:${Object.keys(json || {}).slice(0,8).join(',')}}` :
                  typeof json;
    log(`   shape: ${shape}`);
    logJson(label, json);
  }
  return { status, ok: res.ok, json };
}

async function main() {
  log('=== CloseBot Conversations Probe — Ground Standard ===');
  log(`Target bot: ${VACAVILLE_BOT_ID} (Vacaville)\n`);

  const candidates = [
    ['/conversation', 'list all conversations'],
    ['/conversations', 'list all conversations (plural)'],
    ['/lead', 'list all leads'],
    ['/leads', 'list all leads (plural)'],
    ['/message', 'list all messages'],
    ['/messages', 'list all messages (plural)'],
    [`/bot/${VACAVILLE_BOT_ID}/conversation`, 'bot conversations'],
    [`/bot/${VACAVILLE_BOT_ID}/conversations`, 'bot conversations plural'],
    [`/bot/${VACAVILLE_BOT_ID}/lead`, 'bot leads'],
    [`/bot/${VACAVILLE_BOT_ID}/leads`, 'bot leads plural'],
    [`/bot/${VACAVILLE_BOT_ID}/messages`, 'bot messages'],
    [`/bot/${VACAVILLE_BOT_ID}/transcripts`, 'bot transcripts'],
    [`/bot/${VACAVILLE_BOT_ID}/history`, 'bot history'],
    [`/bot/${VACAVILLE_BOT_ID}/sessions`, 'bot sessions'],
    [`/bot/${VACAVILLE_BOT_ID}/analytics`, 'bot analytics'],
    ['/source', 'sources (GHL connections)'],
    [`/bot/${VACAVILLE_BOT_ID}/source`, 'bot sources'],
  ];

  log(`Probing ${candidates.length} candidate endpoints...\n`);

  for (const [ep, label] of candidates) {
    try {
      await probe(ep, label);
    } catch (e) {
      log(`[ERR] ${ep} — ${e.message}`);
    }
  }

  log('\n=== DONE ===');
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
