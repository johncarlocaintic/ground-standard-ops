// Verify every PropertyBots-agency sub-account PIT against GHL API V2.
// Credentials live in clients/propertybots/.env — must chain-load both env files:
//   node --env-file=.env --env-file=clients/propertybots/.env shared/scripts/ghl/verify_pits.js
// Inventory source of truth: clients/propertybots/ghl/pit-inventory.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../logs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'ghl_pit_verify.log');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logPath, line + '\n');
}

function getEnv(key) {
  const v = process.env[key];
  if (!v) {
    log(`FATAL: missing env var ${key}`);
    process.exit(1);
  }
  return v;
}

const clients = [
  { label: 'propertybots', tokenEnv: 'GHL_PROPERTYBOTS_API_TOKEN', locEnv: 'GHL_PROPERTYBOTS_LOCATION_ID' },
  { label: 'ips_cash',     tokenEnv: 'GHL_IPS_CASH_API_TOKEN',     locEnv: 'GHL_IPS_CASH_LOCATION_ID' },
  { label: 'oro',          tokenEnv: 'GHL_ORO_API_TOKEN',          locEnv: 'GHL_ORO_LOCATION_ID' },
  { label: 'ltd',          tokenEnv: 'GHL_LTD_API_TOKEN',          locEnv: 'GHL_LTD_LOCATION_ID' },
  { label: 'royal',        tokenEnv: 'GHL_ROYAL_API_TOKEN',        locEnv: 'GHL_ROYAL_LOCATION_ID' },
  { label: 'parabilis',    tokenEnv: 'GHL_PARABILIS_API_TOKEN',    locEnv: 'GHL_PARABILIS_LOCATION_ID' },
  { label: 'real_offer',   tokenEnv: 'GHL_REAL_OFFER_API_TOKEN',   locEnv: 'GHL_REAL_OFFER_LOCATION_ID' },
  { label: 'trustpoint',   tokenEnv: 'GHL_TRUSTPOINT_API_TOKEN',   locEnv: 'GHL_TRUSTPOINT_LOCATION_ID' },
];

async function verify({ pit, locationId }) {
  const res = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
    headers: {
      'Authorization': `Bearer ${pit}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) {
    return { status: 'FAIL', code: res.status, message: data?.message || text.slice(0, 200) };
  }
  const loc = data?.location || data;
  return {
    status: 'OK',
    name: loc?.name ?? '(no name)',
    business: loc?.business?.name ?? null,
    companyId: loc?.companyId ?? null,
    timezone: loc?.timezone ?? null,
  };
}

async function main() {
  log(`Verifying ${clients.length} PITs against GHL API V2...`);
  const results = [];
  for (const c of clients) {
    const pit = getEnv(c.tokenEnv);
    const locationId = getEnv(c.locEnv);
    log(`→ ${c.label} (${locationId})...`);
    try {
      const r = await verify({ pit, locationId });
      results.push({ label: c.label, locationId, ...r });
      if (r.status === 'OK') {
        log(`  OK  name="${r.name}" business="${r.business ?? '-'}" companyId=${r.companyId ?? '-'}`);
      } else {
        log(`  FAIL  ${r.code} ${r.message}`);
      }
    } catch (err) {
      log(`  ERROR  ${err.message}`);
      results.push({ label: c.label, locationId, status: 'ERROR', message: err.message });
    }
  }
  log('\n=== SUMMARY ===');
  for (const r of results) {
    const name = r.name ?? r.message ?? '';
    log(`${String(r.label).padEnd(14)} ${String(r.locationId).padEnd(22)} ${r.status.padEnd(5)} ${name}`);
  }
  const jsonPath = path.join(logDir, 'ghl_pit_verify.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  log(`\nWrote ${jsonPath}`);
}

main().catch(err => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
