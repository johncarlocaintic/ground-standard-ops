/**
 * Re-pull today's cooperative_scheduler test contact in Vacaville GHL.
 * Email: tester.kerns.fszh+5667261156735407051@donotuse.com
 * Contact ID: H3hrraggHlhg4QlYezeu
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

const CONTACT = 'H3hrraggHlhg4QlYezeu';

(async () => {
  console.log(`=== Re-check today's cooperative_scheduler contact ===\n`);

  const r = await fetch(`https://services.leadconnectorhq.com/contacts/${CONTACT}`, { headers: H });
  if (!r.ok) {
    console.log(`contact fetch fail: ${r.status} ${(await r.text()).slice(0, 300)}`);
    return;
  }
  const j = await r.json();
  const c = j.contact || j;
  console.log(`Contact ${c.id}:`);
  console.log(`  firstName:   ${c.firstName}`);
  console.log(`  lastName:    ${c.lastName}`);
  console.log(`  email:       ${c.email}`);
  console.log(`  phone:       ${c.phone}`);
  console.log(`  dateOfBirth: ${c.dateOfBirth}`);
  console.log(`  tags:        ${(c.tags || []).join(', ') || '(none)'}`);
  console.log(`  dateAdded:   ${c.dateAdded}`);
  console.log(`  dateUpdated: ${c.dateUpdated}`);
  console.log(`  customFields:`);
  for (const f of (c.customFields || [])) {
    if (f.value) console.log(`    ${f.id} = ${JSON.stringify(f.value)}`);
  }

  // Pull appointments
  const a = await fetch(`https://services.leadconnectorhq.com/contacts/${CONTACT}/appointments`, { headers: H });
  if (a.ok) {
    const aj = await a.json();
    const appts = aj.events || aj.appointments || [];
    console.log(`\nAppointments: ${appts.length}`);
    for (const ap of appts) {
      console.log(`  ${ap.id} | ${ap.startTime} | ${ap.title} | cal ${ap.calendarId} | status ${ap.appointmentStatus}`);
    }
  }
})().catch(e => console.log(`FATAL: ${e.message}`));
