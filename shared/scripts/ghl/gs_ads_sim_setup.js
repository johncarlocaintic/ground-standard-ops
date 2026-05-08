import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_ads_sim_setup.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOC = process.env.GHL_GS_LOCATION_ID;
const GHL = 'https://services.leadconnectorhq.com';
const H = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

async function req(method, ep, body) {
  const r = await fetch(`${GHL}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

async function main() {
  log('=== Phase 1: Simulate Vacaville env on GS Ads ===');

  // Check existing fields first
  const cur = await req('GET', `/locations/${LOC}/customFields`);
  const existing = cur.json?.customFields || [];
  log(`\nCurrent GS Ads custom fields: ${existing.length}`);
  for (const f of existing) log(`  - ${f.name} [${f.dataType}] fieldKey=${f.fieldKey}`);

  // Fields we want to ensure exist
  const targets = [
    { name: 'Youth Name', dataType: 'TEXT', expectedFieldKey: 'contact.youth_name' },
    { name: 'Youth Birthday', dataType: 'DATE', expectedFieldKey: 'contact.youth_birthday' },
  ];

  for (const t of targets) {
    const already = existing.find(f =>
      (f.fieldKey||'').toLowerCase() === t.expectedFieldKey.toLowerCase() ||
      (f.name||'').toLowerCase() === t.name.toLowerCase()
    );
    if (already) {
      log(`  [skip] "${t.name}" already exists (fieldKey=${already.fieldKey}, dataType=${already.dataType})`);
      continue;
    }
    log(`\n  Creating custom field: "${t.name}" (${t.dataType})`);
    const r = await req('POST', `/locations/${LOC}/customFields`, {
      name: t.name,
      dataType: t.dataType,
      position: 0,
      model: 'contact',
    });
    log(`    → ${r.status}`);
    logJson(`  create "${t.name}"`, r.json);
    if (r.ok) {
      const got = r.json?.customField || r.json;
      log(`    ✅ created  id=${got.id}  fieldKey=${got.fieldKey}`);
      if (got.fieldKey && got.fieldKey.toLowerCase() !== t.expectedFieldKey.toLowerCase()) {
        log(`    ⚠ fieldKey mismatch. Expected ${t.expectedFieldKey}, got ${got.fieldKey}`);
      }
    } else {
      log(`    ❌ failed`);
    }
  }

  // Verify final state
  log('\n[verify] Final GS Ads custom fields:');
  const after = await req('GET', `/locations/${LOC}/customFields`);
  for (const f of (after.json?.customFields || [])) {
    log(`  - ${f.name.padEnd(25)} [${f.dataType.padEnd(6)}] fieldKey=${f.fieldKey}`);
  }
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
