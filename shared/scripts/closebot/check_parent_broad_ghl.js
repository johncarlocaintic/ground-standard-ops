/**
 * Verify parent_broad_01 sweep run created a contact in Vacaville GHL.
 *
 * Run was at 2026-05-05T13:25 UTC against Vacaville prod source.
 * Test identity: Wesley Quinn | tester.quinn.k09e@donotuse.com | +17075550101
 *
 * Conversation got stuck in DOB loop — never reached booking. So expected:
 *   - Contact created with firstName/lastName updated (lead gave "Alex Johnson" in chat)
 *   - Phone, email partially filled
 *   - Custom fields: maybe Ethan kid info if any update_contact fired before fetch died
 *   - 0 appointments
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

(async () => {
  console.log(`=== Vacaville GHL — find parent_broad_01 run artifacts ===\n`);

  // Pull recent contacts in Vacaville
  const r = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${LOC}&limit=20&order=desc`, { headers: H });
  if (!r.ok) {
    console.log(`contact list failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
    return;
  }
  const j = await r.json();
  const contacts = j.contacts || [];
  console.log(`pulled ${contacts.length} most recent`);

  // Window: 2026-05-05T13:25 onward (first persona started ~13:25 UTC)
  const windowStart = new Date('2026-05-05T13:25:00.000Z');
  const today = contacts.filter(c => new Date(c.dateAdded) >= windowStart);
  console.log(`\nContacts created since 13:25 UTC today: ${today.length}\n`);

  for (const c of today) {
    console.log(`Contact: ${c.id}`);
    console.log(`  name:     ${c.firstName || ''} ${c.lastName || ''}`);
    console.log(`  email:    ${c.email || '(none)'}`);
    console.log(`  phone:    ${c.phone || '(none)'}`);
    console.log(`  dateOfBirth: ${c.dateOfBirth || '(none)'}`);
    console.log(`  tags:     ${(c.tags || []).join(', ') || '(none)'}`);
    console.log(`  dateAdded: ${c.dateAdded}`);

    // Pull full detail to get custom fields
    const det = await fetch(`https://services.leadconnectorhq.com/contacts/${c.id}`, { headers: H });
    if (det.ok) {
      const dj = await det.json();
      const cf = (dj.contact?.customFields || []).filter(f => f.value);
      if (cf.length) {
        console.log(`  customFields:`);
        for (const f of cf) console.log(`    ${f.id} = ${JSON.stringify(f.value)}`);
      }
    }

    // Pull appointments
    const ap = await fetch(`https://services.leadconnectorhq.com/contacts/${c.id}/appointments`, { headers: H });
    if (ap.ok) {
      const aj = await ap.json();
      const appts = aj.events || aj.appointments || [];
      console.log(`  appointments: ${appts.length}`);
      for (const a of appts) console.log(`    ${a.id} | ${a.startTime} | ${a.title} | cal ${a.calendarId}`);
    }

    console.log('');
  }
})().catch(e => console.log(`FATAL: ${e.message}`));
