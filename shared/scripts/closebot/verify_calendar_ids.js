// Verify which GHL location actually owns the calendar IDs in question.
// Queries both GS Ads and Vacaville GHL locations.
import fs from 'fs';

const TARGETS = [
  // From bot's check_availability calls (the "not found" ones)
  { id: 'GWdabDvAgRFHZGsBN9Fq', expected_name: 'Kids 7-13 Jiu-Jitsu (per GS Ads UI)' },
  { id: 'KKR9rxFq16DS0fykxXMa', expected_name: 'Adult No-Gi Submission Grappling (per GS Ads UI)' },
  // From check_availability error response (claimed available)
  { id: '5BZ9V5do89DR1sKxXfrM', expected_name: 'Kids 7-13 Jiu-Jitsu (per error response)' },
  { id: 'eP72M7eCi37bpN7Shg2a', expected_name: 'Adult No-Gi Submission Grappling (per error response)' },
  { id: '80CSGgA3OrluQNcf816V', expected_name: 'Adult Express No-Gi Fundamentals (per error response)' },
  { id: 'YdfBrZRJfzbuEcQiyLxU', expected_name: 'Kids 10-14 BJJ (per error response)' },
  { id: 'rUNpciMLyI2VGHu6ONrq', expected_name: 'Kids 3-5 BJJ (per error response)' },
  // Also from GS Ads UI screenshot (additional)
  { id: 'VzusiMBZhpLauldz1Xcv', expected_name: 'Kids 3-5 BJJ (per GS Ads UI)' },
  { id: 'W9sKR4wWzEGUw4zTzlZJ', expected_name: 'Kids 10-14 BJJ (per GS Ads UI)' },
];

const LOCATIONS = [
  { label: 'GS Ads',      token: process.env.GHL_GS_API_TOKEN,        locationId: process.env.GHL_GS_LOCATION_ID },
  { label: 'Vacaville',   token: process.env.GHL_VACAVILLE_API_TOKEN, locationId: process.env.GHL_VACAVILLE_LOCATION_ID },
];

async function listCalendars({ label, token, locationId }) {
  if (!token || !locationId) { console.log(`SKIP ${label}: missing token or locationId`); return null; }
  const url = `https://services.leadconnectorhq.com/calendars/?locationId=${locationId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    console.log(`\n=== ${label} (location ${locationId}) — STATUS ${res.status} ===`);
    console.log(JSON.stringify(json, null, 2).slice(0, 800));
    return null;
  }
  const cals = json.calendars || json.data || json;
  return { label, locationId, cals: Array.isArray(cals) ? cals : [] };
}

const results = [];
for (const loc of LOCATIONS) {
  const r = await listCalendars(loc);
  if (r) results.push(r);
}

console.log('\n========================================');
console.log('CALENDAR INVENTORY BY LOCATION');
console.log('========================================');
for (const r of results) {
  console.log(`\n--- ${r.label} (${r.locationId}) — ${r.cals.length} calendar(s) ---`);
  for (const c of r.cals) {
    const id = c.id || c.calendarId || c._id;
    console.log(`  ${id}  |  ${c.name || c.title || '(no name)'}  |  active=${c.isActive ?? c.active ?? '?'}`);
  }
}

console.log('\n========================================');
console.log('TARGET ID LOOKUP');
console.log('========================================');
for (const t of TARGETS) {
  const found = [];
  for (const r of results) {
    const match = r.cals.find(c => (c.id || c.calendarId || c._id) === t.id);
    if (match) found.push(`${r.label}: "${match.name || match.title}" active=${match.isActive ?? match.active ?? '?'}`);
  }
  console.log(`\n${t.id}  (${t.expected_name})`);
  if (found.length === 0) console.log('  NOT FOUND in any queried location');
  else found.forEach(f => console.log(`  ${f}`));
}

fs.writeFileSync('shared/logs/calendar_verification.json', JSON.stringify({ when: new Date().toISOString(), locations: results, targets: TARGETS }, null, 2));
console.log('\nWrote shared/logs/calendar_verification.json');
