// Pull full GHL state for the multi_kid Marcus Stark contact + check conversation history.
const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION = process.env.GHL_GS_LOCATION_ID;
const EMAIL = 'tester.stark.nz7b@donotuse.com';

async function ghl(path) {
  const url = `https://services.leadconnectorhq.com${path}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Version': '2021-07-28', 'Accept': 'application/json' } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

console.log('=== Search for Marcus Stark contact ===');
const search = await ghl(`/contacts/?locationId=${LOCATION}&query=${encodeURIComponent('marcus stark')}&limit=10`);
const contacts = search.json.contacts || [];
if (contacts.length === 0) { console.log('No contact found'); process.exit(0); }
const c = contacts[0];
console.log(`Found: ${c.id} | ${c.firstName} ${c.lastName} | ${c.email}`);

console.log('\n=== Full contact details ===');
const detail = await ghl(`/contacts/${c.id}`);
const cd = detail.json.contact || detail.json;
console.log(`Name: ${cd.firstName} ${cd.lastName}`);
console.log(`Email: ${cd.email}`);
console.log(`Phone: ${cd.phone}`);
console.log(`DOB: ${cd.dateOfBirth || '(not set)'}`);
console.log(`Tags: ${(cd.tags || []).join(', ')}`);
console.log(`Date Added: ${cd.dateAdded}`);
console.log('Custom fields with values:');
for (const f of (cd.customFields || [])) {
  if (f.value) console.log(`  ${f.id}: ${JSON.stringify(f.value).slice(0, 100)}`);
}

console.log('\n=== Appointments for this contact ===');
const appts = await ghl(`/contacts/${c.id}/appointments`);
const events = appts.json.events || appts.json.appointments || [];
console.log(`${events.length} appointment(s)`);
for (const a of events) {
  console.log(`  ${a.id} | ${a.startTime} | ${a.title} | status=${a.appointmentStatus || a.status} | calId=${a.calendarId}`);
}

console.log('\n=== Conversations for this contact ===');
const convos = await ghl(`/conversations/search?locationId=${LOCATION}&contactId=${c.id}&limit=5`);
const cs = convos.json.conversations || [];
console.log(`${cs.length} conversation(s)`);
for (const conv of cs) {
  console.log(`  conversation ${conv.id} | type=${conv.type} | last=${conv.lastMessageDate} | unread=${conv.unreadCount}`);
}

if (cs.length > 0) {
  console.log('\n=== Messages in conversation ===');
  const msgs = await ghl(`/conversations/${cs[0].id}/messages?limit=50`);
  const messages = msgs.json.messages?.messages || msgs.json.messages || [];
  console.log(`${messages.length} message(s) in GHL conversation`);
  for (const m of messages.slice(-15)) {
    const dir = m.direction === 'inbound' ? '<<' : '>>';
    const body = (m.body || '').replace(/\n/g, ' ').slice(0, 100);
    console.log(`  ${dir} [${m.dateAdded?.slice(11,16)}] ${body}`);
  }
}
