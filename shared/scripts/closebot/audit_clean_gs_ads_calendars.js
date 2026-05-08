// Audit GS Ads Kids + Adult calendars and delete any test bookings cluttering them.
// Test signals: title contains "Tester", "Testing", "Andrew", "Tate", "Trial Class", or contact's email matches our test patterns.
const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION = process.env.GHL_GS_LOCATION_ID;
const CALS = [
  { id: 'GWdabDvAgRFHZGsBN9Fq', name: 'Kids 7-13 Jiu-Jitsu' },
  { id: 'KKR9rxFq16DS0fykxXMa', name: 'Adult No-Gi Submission Grappling' },
];

async function ghl(method, path) {
  const url = `https://services.leadconnectorhq.com${path}`;
  const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${TOKEN}`, 'Version': '2021-07-28', 'Accept': 'application/json' } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json, text };
}

// GHL calendars events endpoint (returns all events on a calendar in a date range).
async function getEvents(calId) {
  // Look at next 30 days + last 7 days to catch everything.
  const startDate = Date.now() - 7 * 86400 * 1000;
  const endDate = Date.now() + 30 * 86400 * 1000;
  const r = await ghl('GET', `/calendars/events?locationId=${LOCATION}&calendarId=${calId}&startTime=${startDate}&endTime=${endDate}`);
  if (!r.ok) {
    console.log(`  [error fetching events] ${r.status}: ${r.text.slice(0, 200)}`);
    return [];
  }
  return r.json.events || [];
}

function isTestEvent(ev) {
  const t = (ev.title || '').toLowerCase();
  const testKeywords = ['tester', 'testing', 'andrew', 'tate', 'trial class', 'free trial', 'first class'];
  // Test if title contains any keyword OR has "trial" in it
  return testKeywords.some(k => t.includes(k));
}

async function deleteEvent(eventId) {
  const r = await ghl('DELETE', `/calendars/events/${eventId}`);
  return { ok: r.ok, status: r.status };
}

console.log('=== Audit GS Ads calendars ===\n');
const allEvents = [];
for (const cal of CALS) {
  console.log(`--- ${cal.name} (${cal.id}) ---`);
  const events = await getEvents(cal.id);
  console.log(`  ${events.length} total events in window`);
  for (const ev of events) {
    const tag = isTestEvent(ev) ? '[TEST]' : '[REAL?]';
    console.log(`  ${tag} ${ev.id} | ${ev.startTime} | "${ev.title}" | status=${ev.appointmentStatus || ev.status}`);
    allEvents.push({ ...ev, calendarName: cal.name, isTest: isTestEvent(ev) });
  }
  console.log('');
}

const testEvents = allEvents.filter(e => e.isTest);
const realEvents = allEvents.filter(e => !e.isTest);
console.log(`=== Summary ===`);
console.log(`  Test events: ${testEvents.length}`);
console.log(`  Possibly-real events: ${realEvents.length}`);

if (testEvents.length === 0) {
  console.log('\nNothing to clean up.');
  process.exit(0);
}

console.log(`\n=== Deleting ${testEvents.length} test events ===\n`);
let deleted = 0, failed = 0;
for (const ev of testEvents) {
  const r = await deleteEvent(ev.id);
  if (r.ok) { console.log(`  ✓ DELETED ${ev.id} | "${ev.title}"`); deleted++; }
  else { console.log(`  ✗ FAILED ${ev.id} | ${r.status}`); failed++; }
}
console.log(`\nDone. Deleted ${deleted}, failed ${failed}.`);

if (realEvents.length > 0) {
  console.log(`\n=== ${realEvents.length} events left untouched (may be real bookings — please review) ===`);
  for (const ev of realEvents) console.log(`  ${ev.id} | ${ev.startTime} | "${ev.title}"`);
}
