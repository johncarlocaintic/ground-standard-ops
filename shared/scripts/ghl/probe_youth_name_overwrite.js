/**
 * Probe whether something in Vacaville GHL is overwriting youth_name post-write.
 *
 * Steps:
 *   1. Pick an existing test contact (known youth_name = "Update")
 *   2. PUT youth_name to a unique sentinel value
 *   3. Read it back immediately
 *   4. Wait 30s, read again — did automation overwrite it?
 *   5. Wait 60s, read again
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC   = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const CONTACT_ID = 'YNjSr3VFuid1706CqeQK'; // testing marsh
const YOUTH_NAME_FIELD = 'ofSm228f46nQZHVVGGcU';
const sentinel = `SENTINEL-${Date.now()}`;

async function read(label) {
  const r = await fetch(`https://services.leadconnectorhq.com/contacts/${CONTACT_ID}`, { headers: H });
  if (!r.ok) { console.log(`[${label}] read failed: ${r.status} ${await r.text().then(t => t.slice(0, 200))}`); return null; }
  const j = await r.json();
  const c = j.contact || j;
  const f = (c.customFields || []).find(x => x.id === YOUTH_NAME_FIELD);
  console.log(`[${label}] youth_name = ${JSON.stringify(f?.value)}`);
  return f?.value;
}

async function write(value) {
  const r = await fetch(`https://services.leadconnectorhq.com/contacts/${CONTACT_ID}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ customFields: [{ id: YOUTH_NAME_FIELD, value }] }),
  });
  console.log(`PUT youth_name="${value}" → ${r.status}`);
  if (!r.ok) console.log('  body:', await r.text().then(t => t.slice(0, 300)));
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log(`=== Probe overwrite on contact ${CONTACT_ID} ===\n`);
  console.log(`Sentinel: ${sentinel}`);
  await read('T0 (initial)');
  await write(sentinel);
  await read('T0+0s (just after PUT)');
  await sleep(5000);
  await read('T0+5s');
  await sleep(10000);
  await read('T0+15s');
  await sleep(15000);
  await read('T0+30s');
  await sleep(30000);
  await read('T0+60s');
  console.log(`\nIf the value at T0+60s still equals "${sentinel}" → no automation is overwriting.`);
  console.log(`If it flipped to "Update" or anything else → automation runs on contact update events.`);
})();
