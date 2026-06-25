// Empirically probe Vacaville PIT scopes by hitting each documented GHL endpoint
// and recording status codes. 200/201 = granted. 401 = no scope. 403 = wrong access.
import fs from 'node:fs';

const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC   = process.env.GHL_VACAVILLE_LOCATION_ID;
if (!TOKEN || !LOC) { console.error('missing env'); process.exit(1); }

const H = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

const probes = [
  // contacts
  ['contacts.readonly',          'GET',  `/contacts/?locationId=${LOC}&limit=1`],
  ['contacts.readonly (single)', 'GET',  `/contacts/INVALID_ID`],

  // conversations
  ['conversations.readonly',     'GET',  `/conversations/search?locationId=${LOC}&limit=1`],

  // custom fields
  ['locations/customFields',     'GET',  `/locations/${LOC}/customFields`],
  ['locations/customValues',     'GET',  `/locations/${LOC}/customValues`],

  // tags
  ['locations/tags',             'GET',  `/locations/${LOC}/tags`],

  // calendars
  ['calendars.readonly',         'GET',  `/calendars/?locationId=${LOC}`],
  ['calendars/groups',           'GET',  `/calendars/groups?locationId=${LOC}`],

  // location info
  ['locations.readonly',         'GET',  `/locations/${LOC}`],

  // opportunities
  ['opportunities.search',       'GET',  `/opportunities/search?location_id=${LOC}&limit=1`],
  ['pipelines',                  'GET',  `/opportunities/pipelines?locationId=${LOC}`],

  // workflows
  ['workflows.readonly',         'GET',  `/workflows/?locationId=${LOC}`],

  // users
  ['users.readonly',             'GET',  `/users/?locationId=${LOC}`],

  // forms / surveys / links
  ['forms.readonly',             'GET',  `/forms/?locationId=${LOC}&limit=1`],
  ['surveys.readonly',           'GET',  `/surveys/?locationId=${LOC}&limit=1`],
  ['links.readonly',             'GET',  `/links/?locationId=${LOC}`],

  // medias / files
  ['medias.readonly',            'GET',  `/medias/files?altType=location&altId=${LOC}&limit=1`],

  // businesses
  ['businesses.readonly',        'GET',  `/businesses/?locationId=${LOC}`],

  // campaigns
  ['campaigns.readonly',         'GET',  `/campaigns/?locationId=${LOC}`],

  // social planner
  ['socialplanner.readonly',     'GET',  `/social-media-posting/${LOC}/posts/list`, {from:'2026-01-01', to:'2026-12-31', limit:1, skip:0}],

  // products
  ['products.readonly',          'GET',  `/products/?locationId=${LOC}&limit=1`],

  // saas
  ['saas.readonly',              'GET',  `/saas-api/public-api/locations?companyId=invalid`],
];

async function run() {
  const results = [];
  for (const [name, method, path, body] of probes) {
    try {
      const init = { method, headers: H };
      if (body) { init.headers = {...H, 'Content-Type':'application/json'}; init.body = JSON.stringify(body); }
      const r = await fetch('https://services.leadconnectorhq.com' + path, init);
      const txt = await r.text();
      let msg = '';
      try { const j = JSON.parse(txt); msg = j.message || j.error || ''; } catch { msg = txt.slice(0,80); }
      results.push({ name, status: r.status, msg: String(msg).slice(0,100) });
      console.log(`${String(r.status).padEnd(4)} ${name.padEnd(32)} ${method} ${path}`);
    } catch (e) {
      results.push({ name, status: 'ERR', msg: e.message });
      console.log(`ERR  ${name}  ${e.message}`);
    }
  }
  fs.writeFileSync('shared/logs/vacaville_scope_probe.json', JSON.stringify(results, null, 2));
}
run();
