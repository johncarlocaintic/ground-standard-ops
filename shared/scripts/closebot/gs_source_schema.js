/**
 * gs_source_schema.js
 * Dump the live GHL schema (calendars, custom fields, tags) for ONE CloseBot
 * agency source, using Bobby's agency key — no per-gym PIT required.
 *
 * Endpoints (X-CB-KEY auth, base https://api.closebot.com):
 *   GET /agency/source/{id}/calendars
 *   GET /agency/source/{id}/fields
 *   GET /agency/source/{id}/tags
 *
 * Run:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_source_schema.js src_OJO9E23V1JJSRJLN
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_test.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function getEnv(key) {
  const v = process.env[key];
  if (!v) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return v;
}

const SOURCE_ID = process.argv[2];
if (!SOURCE_ID) { log('ERROR: pass a source id as argv[2]'); process.exit(1); }

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function cbGet(ep) {
  try {
    const res = await fetch(`${BASE}${ep}`, { headers: HEADERS });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 800) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (e) {
    return { status: 0, ok: false, json: { error: e.message } };
  }
}

async function main() {
  log(`Source schema dump for ${SOURCE_ID}`);

  const cals = await cbGet(`/agency/source/${SOURCE_ID}/calendars`);
  log(`\n=== CALENDARS (status ${cals.status}) ===`);
  const calList = cals.json?.calendars || cals.json?.results || cals.json;
  if (Array.isArray(calList)) {
    for (const c of calList) {
      log(`  • "${c.name}"  id=${c.id || c.calendarId}  active=${c.isActive ?? c.active ?? '?'}`);
    }
  } else {
    log(JSON.stringify(cals.json, null, 2));
  }

  const fields = await cbGet(`/agency/source/${SOURCE_ID}/fields`);
  log(`\n=== CUSTOM FIELDS (status ${fields.status}) ===`);
  const contactFields = fields.json?.contact || fields.json?.customFields || [];
  if (Array.isArray(contactFields)) {
    for (const f of contactFields) {
      log(`  • ${f.name}  key=${f.fieldKey || f.key}  type=${f.dataType || f.type}`);
    }
  } else {
    log(JSON.stringify(fields.json, null, 2));
  }

  const tags = await cbGet(`/agency/source/${SOURCE_ID}/tags`);
  log(`\n=== TAGS (status ${tags.status}) ===`);
  const tagList = tags.json?.tags || tags.json?.results || tags.json;
  if (Array.isArray(tagList)) {
    log('  ' + tagList.map(t => (t.name || t)).join(', '));
  } else {
    log(JSON.stringify(tags.json, null, 2));
  }

  // raw dump for the record
  const outFile = path.join(__dirname, `../../../clients/ground-standard/closebot/_source-schema-${SOURCE_ID}.json`);
  fs.writeFileSync(outFile, JSON.stringify({
    sourceId: SOURCE_ID,
    fetchedAt: new Date().toISOString(),
    calendars: cals.json,
    fields: fields.json,
    tags: tags.json,
  }, null, 2));
  log(`\nRaw schema written to ${outFile}`);
}

main().catch(e => { log(`FATAL: ${e.stack || e.message}`); process.exit(1); });
