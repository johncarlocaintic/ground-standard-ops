/**
 * List Vacaville GHL workflows. We need to find the one that's overwriting
 * youth_name to literal "Update" after the bot sets it correctly.
 */
const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC   = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

async function go(method, ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { method, headers: H });
  const t = await r.text();
  return { status: r.status, ok: r.ok, body: t };
}

(async () => {
  console.log('=== Workflows ===');
  const w = await go('GET', `/workflows/?locationId=${LOC}`);
  console.log(`status: ${w.status}`);
  if (!w.ok) {
    console.log('error:', w.body.slice(0, 300));
  } else {
    const j = JSON.parse(w.body);
    const flows = j.workflows || j.data || [];
    console.log(`found ${flows.length} workflows`);
    for (const f of flows) {
      console.log(`  ${f.id} | "${f.name}" | status=${f.status} | locationId=${f.locationId || '?'}`);
    }
  }
})();
