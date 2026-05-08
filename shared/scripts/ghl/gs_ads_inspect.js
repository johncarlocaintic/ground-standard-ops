import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_ads_inspect.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }

const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOC = process.env.GHL_GS_LOCATION_ID;
const GHL = 'https://services.leadconnectorhq.com';
const H = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
};

async function get(ep) {
  const r = await fetch(`${GHL}${ep}`, { headers: H });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; }
  catch { return { status: r.status, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log(`=== Inspect GS Ads GHL (location=${LOC}) ===`);

  // 1. Custom fields
  log('\n[1] GET /locations/{loc}/customFields');
  const cf = await get(`/locations/${LOC}/customFields`);
  log(`  → ${cf.status}`);
  const fields = cf.json?.customFields || [];
  log(`  ${fields.length} custom field(s)`);
  fs.writeFileSync(path.join(logDir, 'gs_ads_custom_fields.json'), JSON.stringify(cf.json, null, 2));
  for (const f of fields) {
    log(`    - ${(f.name||'').padEnd(40)} [${f.dataType||'?'}]  fieldKey=${f.fieldKey||'?'}`);
  }

  // 2. Calendars
  log('\n[2] GET /calendars/?locationId={loc}');
  const cal = await get(`/calendars/?locationId=${LOC}`);
  log(`  → ${cal.status}`);
  const cals = cal.json?.calendars || [];
  log(`  ${cals.length} calendar(s)`);
  fs.writeFileSync(path.join(logDir, 'gs_ads_calendars.json'), JSON.stringify(cal.json, null, 2));
  for (const c of cals) {
    log(`    - ${c.name} (${c.id}) type=${c.calendarType||'?'}`);
  }

  // 3. Contact count
  log('\n[3] GET /contacts/?locationId={loc}&limit=5');
  const con = await get(`/contacts/?locationId=${LOC}&limit=5`);
  log(`  → ${con.status}`);
  const total = con.json?.meta?.total ?? '?';
  log(`  total contacts in GS Ads: ${total}`);

  // 4. Gap analysis — what Vacaville has that GS Ads doesn't
  log('\n[4] GAP ANALYSIS');
  const vac = JSON.parse(fs.readFileSync(path.join(logDir, 'vacaville_fields.json'), 'utf8'));
  const vacContact = vac.contact || [];
  const gsAdsFieldKeys = new Set(fields.map(f => (f.fieldKey || '').toLowerCase()));

  // Bot-relevant fieldKeys (derived from REBUILD TEST bot KDL)
  const botRelevant = [
    'contact.first_name', 'contact.last_name', 'contact.date_of_birth', 'contact.email', 'contact.phone',
    'contact.youth_name', 'contact.youth_birthday',
    'contact.program_interest', 'contact.interest_level', 'contact.additional_adult_note',
  ];

  log(`  Bot writes to ${botRelevant.length} field keys. Checking availability on GS Ads:`);
  for (const key of botRelevant) {
    const hasIt = gsAdsFieldKeys.has(key.toLowerCase());
    const vacHasIt = vacContact.find(f => (f.fieldKey||'').toLowerCase() === key.toLowerCase());
    log(`    ${hasIt ? '✅' : '❌'} ${key.padEnd(35)} ${hasIt ? 'exists on GS Ads' : (vacHasIt ? 'MISSING (Vacaville has it)' : 'not in Vacaville either — bot may autocreate or this is standard')}`);
  }

  // 5. Vacaville calendar names — to clone
  log('\n[5] Vacaville calendar names (targets to simulate):');
  const vacCals = JSON.parse(fs.readFileSync(path.join(logDir, 'vacaville_calendars.json'), 'utf8'));
  const vcList = vacCals.calendars || vacCals || [];
  for (const c of vcList) log(`    - ${c.name}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
