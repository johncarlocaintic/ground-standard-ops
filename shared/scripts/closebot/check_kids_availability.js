// Check actual GS Ads Kids 7-13 calendar availability for next 14 days.
const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION = process.env.GHL_GS_LOCATION_ID;
const KIDS_CAL = 'GWdabDvAgRFHZGsBN9Fq';
const ADULT_CAL = 'KKR9rxFq16DS0fykxXMa';

async function ghl(path) {
  const url = `https://services.leadconnectorhq.com${path}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function freeSlots(calId, label) {
  const start = Date.now();
  const end = start + 14 * 86400 * 1000;
  const r = await ghl(`/calendars/${calId}/free-slots?startDate=${start}&endDate=${end}`);
  console.log(`\n=== ${label} (${calId}) — next 14 days ===`);
  if (!r.ok) { console.log(`  ERROR ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`); return; }
  const slots = r.json.slots || r.json;
  if (slots && Object.keys(slots).length === 0) { console.log('  NO SLOTS available'); return; }
  let count = 0;
  for (const [date, info] of Object.entries(slots)) {
    if (info.slots) {
      console.log(`  ${date}: ${info.slots.length} slot(s)`);
      info.slots.slice(0, 3).forEach(s => console.log(`    ${s}`));
      count += info.slots.length;
    }
  }
  console.log(`  TOTAL: ${count} slots in 14 days`);
}

await freeSlots(KIDS_CAL, 'Kids 7-13 Jiu-Jitsu');
await freeSlots(ADULT_CAL, 'Adult No-Gi Submission Grappling');
