// Verify which GHL location the recent test appointments actually live in,
// and whether the test contacts are in production GHL.
const APPOINTMENTS = [
  { id: 'y0LUbB7I2ESNSRiBHTCs', label: 'Ben Hayes - Kids 7-13 Trial' },
  { id: 'vnH8B6V7naCwAvrNvjVC', label: 'Charlie Hayes - Adult No-Gi Trial' },
];

const TEST_CONTACTS = [
  { id: 'muj2iSW65uS4wcnEmDJg', label: 'Tester Hayes (multi_kid 161258)' },
  { id: 'zOguQ8h9GudsEcDx90ym', label: 'Tester Ellis (comp_happy 162715)' },
  { id: '4NaLGE0Yy1t9li7QjKbX', label: 'Tester Vance (multi_kid 155319)' },
  { id: 'GdPrDAFRloWgbEXtXqVf', label: 'Tester Underwood (multi_kid 145717)' },
  { id: 'HoVexqZh0W1ocC0ye0QO', label: 'Tester Fenton (comp_happy 153151)' },
  { id: 'KHo08jcP2ulQAmjJCEhJ', label: 'Tester Paxton (cooperative_scheduler 04-28)' },
  { id: 'TeGnav1fI5osu9GWl51S', label: 'Tester Quinn (adult_only 113103)' },
];

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

async function fetchAppointment(loc, apptId) {
  // GHL appointment fetch — calendars/events/appointments/{id}
  const r = await ghl(loc.token, loc.locationId, `/calendars/events/appointments/${apptId}`);
  return r;
}

async function fetchContact(loc, contactId) {
  const r = await ghl(loc.token, loc.locationId, `/contacts/${contactId}`);
  return r;
}

console.log('========================================');
console.log('APPOINTMENT VERIFICATION');
console.log('========================================');
for (const appt of APPOINTMENTS) {
  console.log(`\n${appt.id}  (${appt.label})`);
  for (const loc of LOCATIONS) {
    const r = await fetchAppointment(loc, appt.id);
    if (r.ok) {
      const a = r.json.appointment || r.json.event || r.json;
      console.log(`  ${loc.label}: FOUND — calendar=${a.calendarId} status=${a.appointmentStatus || a.status} start=${a.startTime} title="${a.title || ''}"`);
    } else {
      console.log(`  ${loc.label}: ${r.status} ${(JSON.stringify(r.json) || '').slice(0, 120)}`);
    }
  }
}

console.log('\n========================================');
console.log('CONTACT VERIFICATION');
console.log('========================================');
for (const c of TEST_CONTACTS) {
  console.log(`\n${c.id}  (${c.label})`);
  for (const loc of LOCATIONS) {
    const r = await fetchContact(loc, c.id);
    if (r.ok) {
      const x = r.json.contact || r.json;
      console.log(`  ${loc.label}: FOUND — name="${x.firstName || ''} ${x.lastName || ''}" email=${x.email || '?'} tags=[${(x.tags || []).join(',')}]`);
    } else {
      console.log(`  ${loc.label}: ${r.status}`);
    }
  }
}
