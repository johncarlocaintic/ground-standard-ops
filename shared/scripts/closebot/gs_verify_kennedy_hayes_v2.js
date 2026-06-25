/**
 * Wider search — try name, phone, and recent contacts to find Kennedy Hayes.
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

async function searchBy(query, label) {
  const r = await fetch('https://services.leadconnectorhq.com/contacts/search', {
    method: 'POST', headers: H,
    body: JSON.stringify({ locationId: LOC, query, pageLimit: 10 }),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  console.log(`\n--- search by ${label}: "${query}" → ${r.status}`);
  if (!r.ok) { console.log('  err:', JSON.stringify(j).slice(0, 300)); return []; }
  const list = j.contacts || j.data || [];
  console.log(`  matches: ${list.length}`);
  for (const c of list) {
    console.log(`    [${c.id}] ${c.firstName || ''} ${c.lastName || ''} | ${c.email || ''} | ${c.phone || '(no phone)'} | ${c.dateAdded || ''}`);
  }
  return list;
}

async function listRecent(limit = 20) {
  const url = `https://services.leadconnectorhq.com/contacts/?locationId=${LOC}&limit=${limit}`;
  const r = await fetch(url, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  console.log(`\n--- recent contacts (limit=${limit}) → ${r.status}`);
  if (!r.ok) { console.log('  err:', JSON.stringify(j).slice(0, 400)); return []; }
  const list = j.contacts || j.data || [];
  console.log(`  total: ${list.length}`);
  for (const c of list) {
    console.log(`    [${c.id}] ${c.firstName || ''} ${c.lastName || ''} | ${c.email || ''} | ${c.phone || '(no phone)'} | added=${c.dateAdded || ''}`);
  }
  return list;
}

(async () => {
  console.log('=== Vacaville GHL — Kennedy Hayes lookup ===');
  console.log(`Location: ${LOC}\n`);

  await searchBy('Kennedy Hayes', 'name');
  await searchBy('hayes', 'lastname only');
  await searchBy('925 485 5443', 'phone-with-spaces');
  await searchBy('+19254855443', 'phone-E164');
  await searchBy('9254855443', 'phone-digits');
  await searchBy('tester.hayes', 'email-prefix');
  await searchBy('donotuse.com', 'email-domain');
  await listRecent(15);
})();
