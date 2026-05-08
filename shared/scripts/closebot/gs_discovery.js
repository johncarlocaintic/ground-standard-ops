import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_gs_discovery.log');

// Clear previous log
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function logJson(label, data) {
  const block = `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n`;
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

async function request(method, endpoint, body) {
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
  log('=== CloseBot Phase 1 Discovery — Ground Standard ===');

  // 1. List personas
  log('\n[1/5] GET /persona — list personas');
  const personas = await request('GET', '/persona');
  if (personas.ok) {
    log(`PASS — ${Array.isArray(personas.json) ? personas.json.length : '?'} persona(s)`);
    logJson('Personas', personas.json);
  } else {
    log(`FAIL — ${personas.status}: ${JSON.stringify(personas.json)}`);
  }

  // 2. List bots
  log('\n[2/5] GET /bot — list bots');
  const bots = await request('GET', '/bot');
  if (bots.ok) {
    const count = Array.isArray(bots.json) ? bots.json.length :
                  Array.isArray(bots.json?.data) ? bots.json.data.length : '?';
    log(`PASS — ${count} bot(s) found`);
    logJson('Bots', bots.json);
  } else {
    log(`FAIL — ${bots.status}: ${JSON.stringify(bots.json)}`);
  }

  // Extract first bot ID for subsequent calls
  const botList = Array.isArray(bots.json) ? bots.json :
                  Array.isArray(bots.json?.data) ? bots.json.data : [];
  const firstBot = botList[0];
  const botId = firstBot?.id || firstBot?._id;

  if (!botId) {
    log('\nNo bot ID found — skipping export, steps, and node-descriptors that require a bot.');
  } else {
    log(`\nUsing bot: "${firstBot?.name || firstBot?.botName || botId}" (id: ${botId})`);

    // 3. Export bot (KDL format)
    log(`\n[3/5] GET /bot/${botId}/export — export bot`);
    const exported = await request('GET', `/bot/${botId}/export`);
    if (exported.ok) {
      log('PASS — export successful');
      logJson('Bot Export', exported.json);
    } else {
      log(`FAIL — ${exported.status}: ${JSON.stringify(exported.json)}`);
    }

    // 4. Get versions, then steps
    log(`\n[4/5] GET /bot/${botId}/versions — get version list`);
    const versions = await request('GET', `/bot/${botId}/versions`);
    if (versions.ok) {
      log('PASS — versions retrieved');
      logJson('Bot Versions', versions.json);

      const versionList = Array.isArray(versions.json) ? versions.json :
                          Array.isArray(versions.json?.data) ? versions.json.data : [];
      const latestVersion = versionList[0]?.version || versionList[0]?.id || versionList[0]?._id || 1;

      log(`\n  GET /bot/${botId}/versions/${latestVersion}/steps`);
      const steps = await request('GET', `/bot/${botId}/versions/${latestVersion}/steps`);
      if (steps.ok) {
        log('PASS — steps retrieved');
        logJson('Bot Steps (node structure)', steps.json);
      } else {
        log(`FAIL — ${steps.status}: ${JSON.stringify(steps.json)}`);
      }
    } else {
      log(`FAIL — ${versions.status}: ${JSON.stringify(versions.json)}`);
    }
  }

  // 5. Node descriptors (no bot ID needed)
  log('\n[5/5] GET /bot/node-descriptors — all node type schemas');
  const descriptors = await request('GET', '/bot/node-descriptors');
  if (descriptors.ok) {
    const count = Array.isArray(descriptors.json) ? descriptors.json.length :
                  Array.isArray(descriptors.json?.data) ? descriptors.json.data.length : '?';
    log(`PASS — ${count} node descriptor(s) returned`);
    logJson('Node Descriptors', descriptors.json);
  } else {
    log(`FAIL — ${descriptors.status}: ${JSON.stringify(descriptors.json)}`);
  }

  log('\n=== Discovery complete. Full output saved to shared/logs/closebot_gs_discovery.log ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
