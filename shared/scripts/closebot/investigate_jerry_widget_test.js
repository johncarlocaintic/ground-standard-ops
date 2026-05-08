// Investigate the user's manual chat widget test — find the Jerry contact in GS Ads.
const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION = process.env.GHL_GS_LOCATION_ID;

async function ghl(path) {
  const url = `https://services.leadconnectorhq.com${path}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Version': '2021-07-28', 'Accept': 'application/json' } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

console.log('=== List recent GS Ads contacts (last 8 hours, NOT firstName=tester) ===');
const r1 = await ghl(`/contacts/?locationId=${LOCATION}&limit=50&order=desc`);
const all = r1.json.contacts || [];
const contacts = all.filter(c => {
  if (!c.dateAdded) return false;
  if (new Date(c.dateAdded).getTime() < Date.now() - 8 * 3600 * 1000) return false;
  const fn = (c.firstName || '').toLowerCase();
  // Skip eval-tester contacts (they have firstName != tester now, but emails contain "tester.")
  if ((c.email || '').toLowerCase().includes('tester.') && (c.email || '').toLowerCase().includes('@donotuse.com')) return false;
  return true;
});
console.log(`Found ${contacts.length} recent Jerry-named contacts in GS Ads\n`);

for (const c of contacts) {
  console.log(`--- ${c.id} | ${c.firstName} ${c.lastName || ''} | ${c.email || 'no email'} ---`);
  console.log(`  added: ${c.dateAdded}`);
  console.log(`  tags: ${(c.tags || []).join(', ')}`);

  const detail = await ghl(`/contacts/${c.id}`);
  const cd = detail.json.contact || detail.json;
  console.log(`  phone: ${cd.phone || '(none)'}`);
  console.log(`  DOB: ${cd.dateOfBirth || '(none)'}`);
  const populated = (cd.customFields || []).filter(f => f.value);
  if (populated.length) {
    console.log('  custom fields populated:');
    for (const f of populated) console.log(`    ${f.id}: ${JSON.stringify(f.value).slice(0, 100)}`);
  }

  const appts = await ghl(`/contacts/${c.id}/appointments`);
  const events = appts.json.events || [];
  console.log(`  appointments: ${events.length}`);
  for (const a of events) console.log(`    ${a.startTime} | ${a.title} | calId=${a.calendarId}`);

  const convos = await ghl(`/conversations/search?locationId=${LOCATION}&contactId=${c.id}&limit=5`);
  const cs = convos.json.conversations || [];
  console.log(`  conversations in GHL: ${cs.length}`);
  for (const conv of cs) {
    console.log(`    conv ${conv.id} | type=${conv.type} | last=${conv.lastMessageDate}`);
    const msgs = await ghl(`/conversations/${conv.id}/messages?limit=30`);
    const messages = msgs.json.messages?.messages || msgs.json.messages || [];
    console.log(`    ${messages.length} messages:`);
    for (const m of messages) {
      const dir = m.direction === 'inbound' ? '<<' : '>>';
      const body = (m.body || '').replace(/\n/g, ' ').slice(0, 120);
      console.log(`      ${dir} [${m.dateAdded?.slice(11,16)}] ${body}`);
    }
  }
  console.log('');
}
