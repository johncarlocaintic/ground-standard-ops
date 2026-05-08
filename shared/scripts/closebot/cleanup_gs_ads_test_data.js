// Clean up test bookings + contacts in GS Ads sandbox.
const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION = process.env.GHL_GS_LOCATION_ID;

if (!TOKEN || !LOCATION) { console.error('Missing GHL_GS_API_TOKEN / GHL_GS_LOCATION_ID'); process.exit(1); }

async function ghl(method, path, body) {
  const url = `https://services.leadconnectorhq.com${path}${path.includes('?') ? '&' : '?'}locationId=${LOCATION}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json, text };
}

async function searchTestContacts() {
  // Filter by email pattern — every test identity puts "tester." in the email
  // (tester.{lastName}.{rand4}@donotuse.com) regardless of randomized first name.
  // Searching by email substring is more reliable than firstName matching now that
  // adult firstNames are randomized from a real-name pool (Marcus, Kayla, etc.).
  const r = await ghl('GET', `/contacts/?query=${encodeURIComponent('tester.')}&limit=100`);
  if (!r.ok) { console.log(`search failed: ${r.status}`); return []; }
  const cutoff = Date.now() - 7 * 86400 * 1000;
  return (r.json.contacts || []).filter(c => {
    const email = (c.email || '').toLowerCase();
    if (!email.includes('tester.') || !email.includes('@donotuse.com')) return false;
    if (!c.dateAdded) return false;
    return new Date(c.dateAdded).getTime() > cutoff;
  });
}

async function getAppointments(contactId) {
  const r = await ghl('GET', `/contacts/${contactId}/appointments`);
  return r.ok ? (r.json.events || []) : [];
}

async function deleteAppointment(apptId) {
  // Try canonical events path first; fall back to appointments path.
  const r1 = await ghl('DELETE', `/calendars/events/${apptId}`);
  if (r1.ok) return { ok: true, via: 'events' };
  const r2 = await ghl('DELETE', `/calendars/events/appointments/${apptId}`);
  return r2.ok ? { ok: true, via: 'appointments' } : { ok: false, status: `${r1.status}/${r2.status}`, body: r1.text.slice(0, 200) };
}

async function deleteContact(contactId) {
  const r = await ghl('DELETE', `/contacts/${contactId}`);
  return { ok: r.ok, status: r.status, body: r.text.slice(0, 200) };
}

console.log('=== GS Ads cleanup — Tester contacts (last 7 days) ===\n');
const contacts = await searchTestContacts();
console.log(`Found ${contacts.length} test contact(s)\n`);

for (const c of contacts) {
  console.log(`>> ${c.id}  ${c.firstName} ${c.lastName}  (${c.email || 'no email'})  added=${c.dateAdded?.slice(0, 16)}`);
  const appts = await getAppointments(c.id);
  for (const a of appts) {
    const r = await deleteAppointment(a.id);
    console.log(`     APPT ${a.id} ${a.startTime} "${a.title || ''}" → ${r.ok ? 'DELETED via ' + r.via : 'FAILED ' + r.status + ' ' + r.body}`);
  }
  const cr = await deleteContact(c.id);
  console.log(`     CONTACT delete → ${cr.ok ? 'OK' : 'FAILED ' + cr.status + ' ' + cr.body}`);
  console.log('');
}

console.log('=== GS Ads cleanup complete ===');
