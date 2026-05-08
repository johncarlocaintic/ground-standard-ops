// gs_import_vacaville_v2.js
// Creates a new Vacaville CloseBot from the KDL at clients/ground-standard/closebot/vacaville/new-bot.kdl
// Then publishes it. Returns the new bot ID.
//
// Usage:
//   node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_import_vacaville_v2.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../../..');
const logDir   = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_import_vacaville_v2.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`FATAL: Missing env var ${key}`); process.exit(1); }
  return val;
}

const BASE     = 'https://api.closebot.com';
const CB_KEY   = getEnv('CB_GS_API_KEY');
const HEADERS  = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };
const KDL_PATH = path.join(repoRoot, 'clients/ground-standard/closebot/vacaville/new-bot.kdl');

async function cb(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  log('=== Vacaville v2 Import ===');

  // 1. Load KDL
  if (!fs.existsSync(KDL_PATH)) {
    log(`FATAL: KDL file not found: ${KDL_PATH}`);
    process.exit(1);
  }
  const kdl = fs.readFileSync(KDL_PATH, 'utf8');
  log(`Loaded KDL: ${kdl.length} bytes, ${kdl.split('\n').length} lines`);

  // 2. Create bot via POST /bot { name, importKdl }
  const botName = `Vacaville Grappling Academy v2 (REBUILD TEST ${new Date().toISOString().slice(0,16)})`;
  log(`Creating bot: "${botName}"`);
  const create = await cb('POST', '/bot', { name: botName, importKdl: kdl });

  if (!create.ok) {
    log(`FAIL — POST /bot: HTTP ${create.status}`);
    log(`Response: ${JSON.stringify(create.json).slice(0, 2000)}`);
    process.exit(1);
  }

  const botId = create.json?.id || create.json?.botId || create.json?.bot?.id;
  if (!botId) {
    log(`FAIL — No bot ID in response: ${JSON.stringify(create.json).slice(0, 500)}`);
    process.exit(1);
  }
  log(`OK: bot created. ID = ${botId}`);

  // 3. Publish via POST /bot/{id}/publish
  log(`Publishing bot ${botId}...`);
  const publish = await cb('POST', `/bot/${botId}/publish`, {});

  if (!publish.ok) {
    log(`FAIL — POST /bot/${botId}/publish: HTTP ${publish.status}`);
    log(`Response: ${JSON.stringify(publish.json).slice(0, 1000)}`);
    log(`⚠️  Bot was CREATED (${botId}) but NOT PUBLISHED. May still be testable as draft.`);
  } else {
    log(`OK: bot published.`);
  }

  // 4. Output summary
  log('');
  log(`=== SUCCESS ===`);
  log(`Bot ID: ${botId}`);
  log(`Bot Name: ${botName}`);
  log(`Use this command to SSE test:`);
  log(`  CB_TEST_BOT_ID=${botId} node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_sse_test.js`);

  // Write the bot ID to a predictable file so downstream scripts can read it
  const idFile = path.join(repoRoot, 'clients/ground-standard/closebot/vacaville/new-bot-id.txt');
  fs.writeFileSync(idFile, botId + '\n');
  log(`Bot ID saved to: ${idFile}`);
}

main().catch(err => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
