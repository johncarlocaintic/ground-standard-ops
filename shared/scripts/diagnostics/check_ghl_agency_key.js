// Health check for the agency GHL sub-account (LeadGen Listings).
// This key is CHURN RISK: rights may be revoked at any time.
// When this script fails (non-zero exit), delete GHL_AGENCY_* from root .env
// and retire scripts that depend on it.
//
// Run:  node --env-file=.env shared/scripts/diagnostics/check_ghl_agency_key.js
// Exit: 0 = key works, 1 = key fails (missing, revoked, or API error).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'ghl_agency_key_check.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

class HealthFail extends Error {}

async function main() {
  log('=== GHL Agency Key Health Check (LeadGen Listings) ===');

  const token = process.env.GHL_AGENCY_API_TOKEN;
  const locId = process.env.GHL_AGENCY_LOCATION_ID;

  if (!token) throw new HealthFail('GHL_AGENCY_API_TOKEN is not set');
  if (!locId) throw new HealthFail('GHL_AGENCY_LOCATION_ID is not set');

  const url = `https://services.leadconnectorhq.com/locations/${locId}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        Accept: 'application/json',
      },
    });
  } catch (err) {
    throw new HealthFail(`network error: ${err.message}`);
  }

  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }

  if (!res.ok) {
    throw new HealthFail(`HTTP ${res.status} - ${JSON.stringify(body).slice(0, 300)}`);
  }

  const loc = body.location || body;
  log(`OK: HTTP ${res.status}`);
  log(`    Location: ${loc.name || '(unknown)'} [${loc.id || locId}]`);
  log(`    Business: ${loc.business?.name || loc.companyId || '(unknown)'}`);
  log('PASS: agency GHL key is still valid');
}

main().catch(err => {
  log(`FAIL: ${err.message}`);
  log('ACTION: delete GHL_AGENCY_API_TOKEN and GHL_AGENCY_LOCATION_ID from .env, retire dependent scripts.');
  process.exitCode = 1;
});
