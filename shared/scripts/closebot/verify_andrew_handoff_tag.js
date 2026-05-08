// Confirm Andrew Testings contact has the handoff tag set after the chat widget test.
const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOCATION = process.env.GHL_GS_LOCATION_ID;
const CONTACT_ID = '0RSxHFNuMTLVDVHXSTjK';

async function ghl(path) {
  const res = await fetch(`https://services.leadconnectorhq.com${path}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

const r = await ghl(`/contacts/${CONTACT_ID}`);
if (!r.ok) { console.log(`Failed: ${r.status}`); process.exit(1); }
const c = r.json.contact || r.json;
console.log(`=== Andrew Testings (${CONTACT_ID}) ===`);
console.log(`Name: ${c.firstName} ${c.lastName}`);
console.log(`Email: ${c.email}`);
console.log(`Phone: ${c.phone || '(none)'}`);
console.log(`DOB: ${c.dateOfBirth || '(none)'}`);
console.log(`Date Added: ${c.dateAdded}`);
console.log(`Date Updated: ${c.dateUpdated}`);
console.log(`\nTags (${(c.tags || []).length}):`);
for (const t of (c.tags || [])) console.log(`  - ${t}`);

// Check expected handoff tags
const expected = ['concierge - booking handoff'];
const has = expected.filter(t => (c.tags || []).includes(t));
const missing = expected.filter(t => !(c.tags || []).includes(t));
console.log('\n=== Handoff verification ===');
if (missing.length === 0) console.log('✓ All expected handoff tags present');
else console.log(`✗ Missing: ${missing.join(', ')}`);

console.log('\n=== Custom fields populated ===');
const populated = (c.customFields || []).filter(f => f.value);
if (populated.length === 0) console.log('  (none)');
for (const f of populated) console.log(`  ${f.id}: ${JSON.stringify(f.value).slice(0, 100)}`);
