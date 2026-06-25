const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const H = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
};
(async () => {
  const r = await fetch('https://services.leadconnectorhq.com/contacts/3BHmztEuln3zSBopgLI1', { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 500) }; }
  if (!r.ok) { console.log('err:', r.status, JSON.stringify(j).slice(0, 500)); return; }
  const c = j.contact || j;
  console.log('=== Kennedy Hayes — full record ===');
  console.log('firstName:    ', c.firstName);
  console.log('lastName:     ', c.lastName);
  console.log('email:        ', c.email);
  console.log('phone:        ', c.phone || '(BLANK)');
  console.log('dateOfBirth:  ', c.dateOfBirth || '(BLANK)');
  console.log('tags:         ', (c.tags || []).join(', ') || '(none)');
  console.log('source:       ', c.source);
  console.log('dateAdded:    ', c.dateAdded);
  console.log('---');
  console.log('customFields keys:');
  for (const f of (c.customFields || [])) {
    console.log(`  ${f.id}: ${JSON.stringify(f.value).slice(0, 120)}`);
  }
})();
