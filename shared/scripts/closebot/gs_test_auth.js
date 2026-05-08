import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_gs_test.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
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
  log('=== CloseBot API Auth Test (Ground Standard) ===');

  // Test 1: Read-only — list personas
  log('TEST 1: GET /persona (list personas)');
  const list = await request('GET', '/persona');
  if (list.ok) {
    const count = Array.isArray(list.json) ? list.json.length : '?';
    log(`PASS — ${count} persona(s) found`);
  } else {
    log(`FAIL — ${list.status}: ${JSON.stringify(list.json)}`);
  }

  // Test 2: Create a test persona, then delete it
  log('TEST 2: POST /persona (create test persona)');
  const created = await request('POST', '/persona', {
    personaInput: {
      personaName: 'TEST-DO-NOT-USE',
      aiProviderPreferences: [],
    },
  });
  log(`Create response: ${created.status} — ${JSON.stringify(created.json)}`);

  if (created.ok) {
    const id = created.json?.id || created.json?._id || created.json?.data?.id;
    if (id) {
      log(`TEST 3: DELETE /persona/${id}`);
      const deleted = await request('DELETE', `/persona/${id}`);
      if (deleted.ok) {
        log(`PASS — test persona deleted (id: ${id})`);
      } else {
        log(`WARN — delete failed: ${deleted.status} — ${JSON.stringify(deleted.json)}`);
      }
    } else {
      log('WARN — could not extract persona ID from create response; manual cleanup may be needed');
      log(`Full response: ${JSON.stringify(created.json)}`);
    }
  } else {
    log(`FAIL — create returned ${created.status}`);
  }

  log('=== Test complete ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
