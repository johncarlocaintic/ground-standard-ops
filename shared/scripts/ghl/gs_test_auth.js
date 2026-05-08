import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'ghl_gs_test.log');

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

const BASE = 'https://services.leadconnectorhq.com';
const TOKEN = getEnv('GHL_GS_API_TOKEN');
const LOCATION_ID = getEnv('GHL_GS_LOCATION_ID');
const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
};

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
  log('=== GHL API Auth Test (Ground Standard / GS Ads) ===');

  // Test 1: Read-only — fetch location info
  log('TEST 1: GET /locations/:id (verify token + location)');
  const loc = await request('GET', `/locations/${LOCATION_ID}`);
  if (loc.ok) {
    const name = loc.json?.location?.name || loc.json?.name || 'unknown';
    log(`PASS — Location: "${name}"`);
  } else {
    log(`FAIL — ${loc.status}: ${JSON.stringify(loc.json)}`);
  }

  // Test 2: Create a test contact, then delete it
  log('TEST 2: POST /contacts/ (create test contact)');
  const created = await request('POST', '/contacts/', {
    firstName: 'TEST',
    lastName: 'DO-NOT-USE',
    email: 'test-delete-me@do-not-use.invalid',
    locationId: LOCATION_ID,
    tags: ['do-not-use'],
  });
  log(`Create response: ${created.status}`);

  if (created.ok) {
    const id = created.json?.contact?.id;
    if (id) {
      log(`TEST 3: DELETE /contacts/${id}`);
      const deleted = await request('DELETE', `/contacts/${id}`);
      if (deleted.ok) {
        log(`PASS — test contact deleted (id: ${id})`);
      } else {
        log(`WARN — delete failed: ${deleted.status} — ${JSON.stringify(deleted.json)}`);
      }
    } else {
      log(`WARN — could not extract contact ID. Full response: ${JSON.stringify(created.json)}`);
    }
  } else {
    log(`FAIL — ${created.status}: ${JSON.stringify(created.json)}`);
  }

  log('=== Test complete ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
