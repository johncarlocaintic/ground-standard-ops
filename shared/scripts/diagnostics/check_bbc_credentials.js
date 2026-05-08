// Health check for Bikini Bootcamp / Amansala GHL credentials.
// PIT received 2026-04-29 from Melissa Glee.
//
// Run:  node --env-file=.env --env-file=clients/bikini-bootcamp/.env shared/scripts/diagnostics/check_bbc_credentials.js
// Exit: 0 = key works, 1 = key fails (missing, revoked, or API error).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'bbc_credential_check.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

class HealthFail extends Error {}

async function main() {
  log('=== Bikini Bootcamp GHL Credential Health Check ===');

  const token = process.env.GHL_BBC_API_TOKEN;
  const locId = process.env.GHL_BBC_LOCATION_ID;

  if (!token) throw new HealthFail('GHL_BBC_API_TOKEN is not set (chain in clients/bikini-bootcamp/.env)');
  if (!locId) throw new HealthFail('GHL_BBC_LOCATION_ID is not set');

  log(`Location ID: ${locId}`);
  log(`PIT prefix:  ${token.slice(0, 12)}...`);

  // Test 1: location lookup (proves PIT + location pair is valid)
  const locUrl = `https://services.leadconnectorhq.com/locations/${locId}`;
  const locRes = await fetch(locUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      Accept: 'application/json',
    },
  });
  const locText = await locRes.text();
  let locBody;
  try { locBody = JSON.parse(locText); } catch { locBody = locText.slice(0, 300); }

  if (!locRes.ok) {
    throw new HealthFail(`location lookup HTTP ${locRes.status}: ${JSON.stringify(locBody).slice(0, 400)}`);
  }

  const loc = locBody.location || locBody;
  log(`OK location:  ${loc.name || '(unnamed)'} [${loc.id || locId}]`);
  log(`   business:  ${loc.business?.name || loc.companyId || '(unknown)'}`);
  log(`   timezone:  ${loc.timezone || '(unknown)'}`);

  // Test 2: contact list (proves contacts.read scope and gives a quick volume signal)
  const contactsUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${locId}&limit=1`;
  const contactsRes = await fetch(contactsUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      Accept: 'application/json',
    },
  });
  const contactsText = await contactsRes.text();
  let contactsBody;
  try { contactsBody = JSON.parse(contactsText); } catch { contactsBody = contactsText.slice(0, 300); }

  if (!contactsRes.ok) {
    log(`WARN contacts lookup HTTP ${contactsRes.status}: ${JSON.stringify(contactsBody).slice(0, 300)}`);
    log('     This may indicate the PIT is missing the contacts.readonly scope.');
  } else {
    const total = contactsBody.meta?.total ?? contactsBody.total ?? '(unknown)';
    log(`OK contacts:  total in location = ${total}`);
  }

  log('PASS: credentials are valid');
}

main().catch(err => {
  log(`FAIL: ${err.message}`);
  log('ACTION: verify the PIT in clients/bikini-bootcamp/.env, ask Melissa to regenerate if needed.');
  process.exitCode = 1;
});
