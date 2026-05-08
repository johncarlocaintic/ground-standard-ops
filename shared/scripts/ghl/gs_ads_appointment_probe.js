import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_ads_appointment_probe.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const s = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(s); fs.appendFileSync(logFile, s + '\n'); }

const GHL = 'https://services.leadconnectorhq.com';
const LOC = process.env.GHL_GS_LOCATION_ID;
const H = {
  'Authorization': `Bearer ${process.env.GHL_GS_API_TOKEN}`,
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

const CALENDAR_KIDS_7_13 = 'GWdabDvAgRFHZGsBN9Fq';
const TEST_CONTACT = JSON.parse(fs.readFileSync(path.join(logDir, 'sim_test_contacts.json'), 'utf8')).commapackContact;

async function main() {
  log('=== GHL appointment schema probe ===');
  log(`Contact: ${TEST_CONTACT}   Calendar: Kids 7-13 Jiu-Jitsu (${CALENDAR_KIDS_7_13})`);

  // Probe 1: check if any appointments exist for this contact already
  log('\n[1] GET /contacts/{id}/appointments');
  const existing = await req('GET', `/contacts/${TEST_CONTACT}/appointments`);
  log(`  → ${existing.status}`);
  if (existing.ok) {
    const apts = existing.json?.events || existing.json?.appointments || existing.json;
    log(`  ${Array.isArray(apts) ? apts.length + ' appointments' : 'response: ' + JSON.stringify(apts).slice(0, 200)}`);
  }

  // Probe 2: create an appointment with ALL fields we might want
  log('\n[2] POST /calendars/events/appointments — create test appointment with rich fields');
  const start = new Date(Date.now() + 7*24*60*60*1000); // 7 days from now
  start.setHours(17, 30, 0, 0); // 5:30pm
  const end = new Date(start.getTime() + 45*60*1000); // 45 min

  const body = {
    locationId: LOC,
    contactId: TEST_CONTACT,
    calendarId: CALENDAR_KIDS_7_13,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    title: 'CLAUDE-TEST: Alice Smith (kid of Sammy) - Kids 7-13 Jiu-Jitsu Trial',
    appointmentStatus: 'confirmed',
    address: 'Test appointment — do not use',
    ignoreDateRange: true,
    toNotify: false,
    meetingLocationType: 'custom',
    // Some GHL tenants support additional fields; we include what's documented
    notes: 'Test appointment created via API — Alice Smith, DOB 2017-05-10, enrolled by parent Sammy',
  };
  logJson('create body', body);
  const created = await req('POST', '/calendars/events/appointments', body);
  log(`  → ${created.status}`);
  logJson('create response', created.json);

  const apptId = created.json?.id || created.json?.appointment?.id;
  if (!apptId) { log('  ❌ no appointment id returned — stopping'); return; }
  log(`  ✅ appointment id: ${apptId}`);

  // Probe 3: read it back to see what stuck
  log(`\n[3] GET /calendars/events/appointments/${apptId} — verify persistence`);
  const readback = await req('GET', `/calendars/events/appointments/${apptId}`);
  log(`  → ${readback.status}`);
  logJson('readback', readback.json);

  // Analyze: what fields did GHL preserve?
  const a = readback.json?.appointment || readback.json;
  if (a) {
    log('\n=== FIELDS ACTUALLY STORED ===');
    log(`  title:            ${JSON.stringify(a.title)}`);
    log(`  address:          ${JSON.stringify(a.address)}`);
    log(`  notes:            ${JSON.stringify(a.notes)}`);
    log(`  description:      ${JSON.stringify(a.description)}`);
    log(`  appointmentStatus:${JSON.stringify(a.appointmentStatus)}`);
    log(`  startTime:        ${JSON.stringify(a.startTime)}`);
    log(`  endTime:          ${JSON.stringify(a.endTime)}`);
    log(`  meetingLocationType: ${JSON.stringify(a.meetingLocationType)}`);
    log(`  customFields:     ${JSON.stringify(a.customFields)}`);
    const allKeys = Object.keys(a);
    log(`  all keys on appointment object: ${allKeys.join(', ')}`);
  }

  // Save appointment id for cleanup
  const state = JSON.parse(fs.readFileSync(path.join(logDir, 'sim_test_contacts.json'), 'utf8'));
  state.testAppointment = apptId;
  fs.writeFileSync(path.join(logDir, 'sim_test_contacts.json'), JSON.stringify(state, null, 2));
  log(`\nSaved appointment id for cleanup`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
