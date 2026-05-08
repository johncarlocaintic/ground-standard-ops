/**
 * Create the "ai off" tag in Vacaville GHL.
 * Universal kill switch tag — applied to a contact disables CloseBot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/ghl_test.log');
fs.mkdirSync(path.dirname(LOG), { recursive: true });

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC   = process.env.GHL_VACAVILLE_LOCATION_ID;
if (!TOKEN || !LOC) {
  log('FATAL: missing GHL_VACAVILLE_API_TOKEN or GHL_VACAVILLE_LOCATION_ID');
  process.exit(1);
}

const H = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
  Accept: 'application/json',
};

async function main() {
  log('=== Vacaville GHL: create "ai off" tag ===');

  // 1. List existing tags to confirm it doesn't exist
  log('[1] GET /locations/{loc}/tags — list existing');
  const list = await fetch(`https://services.leadconnectorhq.com/locations/${LOC}/tags`, { headers: H });
  log(`    → ${list.status}`);
  if (!list.ok) {
    const err = await list.text();
    log(`    error: ${err.slice(0, 300)}`);
    process.exit(1);
  }
  const listJson = await list.json();
  const tags = listJson.tags || [];
  log(`    total tags: ${tags.length}`);
  const existing = tags.find(t => (t.name || '').toLowerCase() === 'ai off');
  if (existing) {
    log(`    "ai off" ALREADY EXISTS: id=${existing.id}, name="${existing.name}" — nothing to do`);
    return;
  }

  // 2. Create the tag
  log('[2] POST /locations/{loc}/tags — create "ai off"');
  const create = await fetch(`https://services.leadconnectorhq.com/locations/${LOC}/tags`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ name: 'ai off' }),
  });
  log(`    → ${create.status}`);
  const body = await create.text();
  log(`    body: ${body.slice(0, 400)}`);
  if (!create.ok) {
    log('    FAIL: tag creation rejected (likely read-only PIT). User must add via UI.');
    process.exit(2);
  }
  log('    ✅ "ai off" created');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
