/**
 * List all test contacts + appointments created in Vacaville GHL during today's
 * sweep window so Bobby has a single cleanup checklist.
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC   = process.env.GHL_VACAVILLE_LOCATION_ID;
if (!TOKEN || !LOC) { console.error('missing creds'); process.exit(1); }

const H = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

const TODAY = '2026-05-04';

async function main() {
  // search contacts via /contacts/search by query "tester."
  const url = `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${LOC}&number=&email=`;
  // Simpler approach: pull contacts and filter
  const list = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${LOC}&limit=100&order=desc`, { headers: H });
  if (!list.ok) {
    console.error('contacts list failed:', list.status, await list.text().then(t => t.slice(0, 200)));
    process.exit(1);
  }
  const j = await list.json();
  const contacts = j.contacts || [];
  console.log(`Pulled ${contacts.length} most recent contacts in Vacaville`);

  const today = contacts.filter(c => (c.dateAdded || '').startsWith(TODAY) && (
    (c.email || '').includes('tester.') || (c.email || '').includes('donotuse.com')
  ));
  console.log(`\nToday's tester contacts: ${today.length}\n`);

  console.log('| Contact ID | Name | Email | dateAdded | Tags |');
  console.log('|---|---|---|---|---|');
  for (const c of today) {
    const tags = (c.tags || []).join(', ');
    console.log(`| \`${c.id}\` | ${c.firstName || ''} ${c.lastName || ''} | ${c.email} | ${c.dateAdded} | ${tags} |`);
  }

  // Appointments — search per contact
  console.log('\n--- Appointments per contact ---');
  for (const c of today) {
    const a = await fetch(`https://services.leadconnectorhq.com/contacts/${c.id}/appointments`, { headers: H });
    if (!a.ok) { console.log(`${c.id}: appts fetch ${a.status}`); continue; }
    const aj = await a.json();
    const appts = aj.events || aj.appointments || [];
    if (!appts.length) { console.log(`${c.id} (${c.firstName} ${c.lastName}): no appointments`); continue; }
    for (const ap of appts) {
      console.log(`${c.id} (${c.firstName} ${c.lastName}): appt \`${ap.id}\` ${ap.startTime} | cal ${ap.calendarId} | "${ap.title}"`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
