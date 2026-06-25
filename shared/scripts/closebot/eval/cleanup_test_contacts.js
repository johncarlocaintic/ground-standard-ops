// Delete all test contacts + their appointments from GHL sandbox after a sweep.
// Usage: node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/cleanup_test_contacts.js <evalLogDir> [<evalLogDir> ...]
// If no args, scans shared/logs/eval/ for all masondixon runs today.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const GHL_TOKEN = process.env.GHL_GS_API_TOKEN;
const GHL_LOCATION = process.env.GHL_GS_LOCATION_ID;
if (!GHL_TOKEN || !GHL_LOCATION) {
  console.error('FATAL: GHL_GS_API_TOKEN or GHL_GS_LOCATION_ID missing'); process.exit(1);
}

const EVAL_LOG_DIR = 'shared/logs/eval';
const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_HEADERS = {
  Authorization: `Bearer ${GHL_TOKEN}`,
  Version: '2021-07-28',
  'Content-Type': 'application/json',
};

async function deleteAppointment(apptId) {
  const r = await fetch(`${GHL_BASE}/calendars/events/${apptId}`, {
    method: 'DELETE', headers: GHL_HEADERS,
  });
  return r.status;
}

async function deleteContact(contactId) {
  const r = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    method: 'DELETE', headers: GHL_HEADERS,
  });
  return r.status;
}

async function processRunDir(runDir) {
  const factsPath = join(runDir, 'ghl_facts.json');
  if (!existsSync(factsPath)) {
    console.log(`  [skip] no ghl_facts.json in ${runDir}`);
    return;
  }
  const facts = JSON.parse(readFileSync(factsPath, 'utf8'));
  if (!facts.found || !facts.contact_id) {
    console.log(`  [skip] no GHL contact found in ${runDir}`);
    return;
  }
  const { contact_id, contact_name, appointments = [] } = facts;
  console.log(`\n  Contact: ${contact_name} (${contact_id})`);

  for (const appt of appointments) {
    if (appt.deleted) { console.log(`    appt ${appt.id} already deleted`); continue; }
    const status = await deleteAppointment(appt.id);
    console.log(`    DELETE appt ${appt.id} → ${status}`);
  }

  const status = await deleteContact(contact_id);
  console.log(`    DELETE contact ${contact_id} → ${status}`);
}

// Collect run dirs from args or scan
let runDirs = process.argv.slice(2);
if (runDirs.length === 0) {
  // scan all masondixon runs
  runDirs = readdirSync(EVAL_LOG_DIR)
    .filter(d => d.startsWith('masondixon_'))
    .map(d => join(EVAL_LOG_DIR, d));
}

console.log(`Cleanup: ${runDirs.length} run(s)`);
for (const dir of runDirs) {
  await processRunDir(dir);
}
console.log('\nDone.');
