// Search both GHL locations for "Tester" contacts and their appointments.
// Goal: definitively show which location each booking landed in.
const LOCATIONS = [
  { label: 'GS Ads',    token: process.env.GHL_GS_API_TOKEN,        locationId: process.env.GHL_GS_LOCATION_ID },
  { label: 'Vacaville', token: process.env.GHL_VACAVILLE_API_TOKEN, locationId: process.env.GHL_VACAVILLE_LOCATION_ID },
];

async function ghl(token, locationId, path) {
  const url = `https://services.leadconnectorhq.com${path}${path.includes('?') ? '&' : '?'}locationId=${locationId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function searchContacts(loc, query) {
  const r = await ghl(loc.token, loc.locationId, `/contacts/?query=${encodeURIComponent(query)}&limit=50`);
  if (!r.ok) return { ok: false, status: r.status, error: r.json };
  return { ok: true, contacts: r.json.contacts || [] };
}

async function getAppointments(loc, contactId) {
  const r = await ghl(loc.token, loc.locationId, `/contacts/${contactId}/appointments`);
  if (!r.ok) return { ok: false };
  return { ok: true, events: r.json.events || r.json.appointments || [] };
}

console.log('=========================================');
console.log('SEARCH FOR "Tester" CONTACTS IN EACH LOC');
console.log('=========================================');

for (const loc of LOCATIONS) {
  console.log(`\n--- ${loc.label} (${loc.locationId}) ---`);
  const r = await searchContacts(loc, 'Tester');
  if (!r.ok) {
    console.log(`  ERROR: ${r.status}`);
    continue;
  }
  console.log(`  ${r.contacts.length} matching contacts`);
  // Filter to contacts with first name "Tester" (our test pattern) and added in last 48h
  const cutoff = Date.now() - 48 * 3600 * 1000;
  const recent = r.contacts.filter(c => {
    const fn = (c.firstName || '').toLowerCase();
    if (fn !== 'tester' && fn !== 'testing') return false;
    if (!c.dateAdded) return false;
    return new Date(c.dateAdded).getTime() > cutoff;
  });
  console.log(`  ${recent.length} are "Tester *" added in last 48h`);
  for (const c of recent) {
    const tags = (c.tags || []).filter(t => /book|appointment|interest|minor|referral|handoff/i.test(t));
    console.log(`    ${c.id}  ${c.firstName} ${c.lastName}  added=${c.dateAdded?.slice(0,16)}  tags=[${tags.join(',')}]`);
    const appts = await getAppointments(loc, c.id);
    if (appts.ok && appts.events.length > 0) {
      for (const ev of appts.events) {
        console.log(`        APPT  ${ev.id || '?'}  cal=${ev.calendarId}  ${ev.startTime}  "${ev.title || ''}"  status=${ev.appointmentStatus || ev.status}`);
      }
    }
  }
}
