/**
 * Pull full state of the multi_kid_family contact (Marsh) from Vacaville GHL.
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC   = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

const CONTACT_ID = 'YNjSr3VFuid1706CqeQK';

(async () => {
  // Pull contact
  const c = await fetch(`https://services.leadconnectorhq.com/contacts/${CONTACT_ID}`, { headers: H });
  const cj = await c.json();
  const contact = cj.contact || cj;
  console.log('=== Contact ===');
  console.log(JSON.stringify({
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    dateOfBirth: contact.dateOfBirth,
    tags: contact.tags,
    customFields: contact.customFields,
  }, null, 2));

  // Resolve custom field names
  const cf = await fetch(`https://services.leadconnectorhq.com/locations/${LOC}/customFields`, { headers: H });
  const cfj = await cf.json();
  const fieldMap = Object.fromEntries((cfj.customFields || []).map(f => [f.id, { name: f.name, key: f.fieldKey }]));

  console.log('\n=== Custom fields named ===');
  for (const f of (contact.customFields || [])) {
    const meta = fieldMap[f.id] || { name: '?' };
    console.log(`  ${f.id}  "${meta.name}"  =>  ${JSON.stringify(f.value)}`);
  }

  // Appointments
  const a = await fetch(`https://services.leadconnectorhq.com/contacts/${CONTACT_ID}/appointments`, { headers: H });
  const aj = await a.json();
  console.log('\n=== Appointments ===');
  for (const ap of (aj.events || aj.appointments || [])) {
    console.log(`  ${ap.id} | ${ap.startTime} | cal ${ap.calendarId} | "${ap.title}" | status ${ap.appointmentStatus}`);
  }
})();
