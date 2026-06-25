/**
 * gs_unbooked_diagnose.mjs — pull full conversations for top HOT unbooked leads
 * to diagnose why they didn't book.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_unbooked_diagnose.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const logFile = path.join(logDir, 'unbooked_diagnose.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const GHL = 'https://services.leadconnectorhq.com';

// Top HOT leads from the 3-day scan, sample the freshest + most-engaged
const TARGETS = [
  { gym: 'academyjjscottsdale',   pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', cid: 'tEHnEm0CkqOdpwgIJrnE', name: 'william howard' },
  { gym: 'academyjjscottsdale',   pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', cid: '8gxLG3kuMZkrIQ50ndcS', name: 'julia chappell' },
  { gym: 'simpleman',             pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', cid: 'unknown', name: 'jimmy ly' },
  { gym: 'championmartialarts',   pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', cid: 'unknown', name: 'jose castillo' },
  { gym: 'championmartialarts',   pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', cid: 'unknown', name: 'francisco monserrat' },
  { gym: 'championmartialarts',   pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', cid: 'unknown', name: 'carlos hernandez' },
  { gym: 'championmartialarts',   pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', cid: 'unknown', name: 'atef huda' },
  { gym: 'ombjj',                 pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47', cid: 'unknown', name: 'cara ferrara' },
  { gym: 'universalmma',          pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9', cid: '901nftvgOLORJPGLqTwz', name: 'pablo chevere' },
  { gym: 'universalmma',          pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9', cid: 'unknown', name: 'antonio nelson' },
  { gym: 'simpleman',             pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', cid: 'unknown', name: 'kelly poniris' },
  { gym: 'simpleman',             pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', cid: 'unknown', name: 'lamar musson' },
  { gym: 'academyedenprairie',    pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', cid: 'b64NlPZOv0XmWEe53uGU', name: 'alberto alvarez' },
  { gym: 'academyedenprairie',    pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', cid: 'mC6HAz0aBuADC6ZzLTjf', name: 'james mason' },
  { gym: 'academyedenprairie',    pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', cid: 'sClN7oLndjacIqiW1wgN', name: 'dennis brown' },
  { gym: 'ombjj',                 pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47', cid: 'jDeVQehWxOKYmMiRCUY2', name: 'nicolle ramírez' },
  { gym: 'sugoi',                 pit: 'pit-5a11741a-025f-49a3-9753-cad63aeb357c', cid: 'CKkJeh6zcnWgPmOfMKXC', name: 'samuel regalado' },
  { gym: 'championmartialarts',   pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', cid: 'WVhP0w3AWGz94WIXHElq', name: 'guillermo alanis' },
];

const LOC = {
  'academyjjscottsdale': '8XPm2yy1DqYc7fDpSj4O',
  'simpleman': 'aKQzZVFXhecYncsbvsOH',
  'championmartialarts': 'ffkMyOy6QOwqrvn4OvoK',
  'ombjj': 'dUOiYuuo9LBcUnDOxd1i',
  'universalmma': 'MkbS4Ud2oAGBtbpVkzyi',
  'academyedenprairie': 'YzynD9APfmv7ed8RIk3K',
  'sugoi': '13FZuBUiLGp1WVpWYz3b',
};

async function ghl(pit, ep) {
  const r = await fetch(GHL + ep, { headers: { Authorization: 'Bearer ' + pit, Version: '2021-07-28' } });
  if (!r.ok) return null;
  return r.json();
}

async function resolveContactId(t) {
  if (t.cid && t.cid !== 'unknown') return t.cid;
  // search by name
  const loc = LOC[t.gym];
  const r = await fetch(GHL + '/contacts/search', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t.pit, Version: '2021-07-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationId: loc, filters: [{ field: 'tags', operator: 'contains', value: 'concierge' }], pageLimit: 100 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const contacts = j.contacts || [];
  const match = contacts.find(c => {
    const full = (c.contactName || ((c.firstName||'') + ' ' + (c.lastName||''))).toLowerCase().trim();
    return full === t.name.toLowerCase();
  });
  return match ? match.id : null;
}

(async () => {
  W(`=== Unbooked HOT-lead Conversation Diagnosis — ${new Date().toISOString()} ===\n`);

  for (const t of TARGETS) {
    const cid = await resolveContactId(t);
    if (!cid) { W(`\n[${t.gym}] ${t.name}: COULD NOT RESOLVE CONTACT ID\n`); continue; }

    const c = await ghl(t.pit, '/contacts/' + cid);
    const ct = c?.contact || c || {};
    const cv = await ghl(t.pit, '/conversations/search?contactId=' + cid + '&limit=1');
    const conv = cv?.conversations?.[0];
    if (!conv) { W(`\n[${t.gym}] ${t.name}: NO CONVERSATION\n`); continue; }
    const mr = await ghl(t.pit, '/conversations/' + conv.id + '/messages?limit=100');
    const msgs = (mr?.messages?.messages || mr?.messages || []);
    msgs.sort((a,b) => new Date(a.dateAdded||0) - new Date(b.dateAdded||0));

    W(`\n========================================`);
    W(`[${t.gym}] ${t.name}  (cid: ${cid})`);
    W(`  tags: ${(ct.tags || []).join(',')}`);
    W(`  added: ${ct.dateAdded || '?'} | source: ${ct.source || '?'}`);
    W(`========================================`);
    for (const m of msgs) {
      const body = (m.body || m.message || '').trim().replace(/\s+/g, ' ');
      if (!body || body === 'Opportunity created' || body === 'Opportunity updated' || body === 'Opportunity status changed') continue;
      const ts = (m.dateAdded || '').slice(0, 16);
      const dir = m.direction === 'inbound' ? '<<' : '>>';
      W(`${ts} ${dir} ${body.slice(0, 200)}`);
    }
  }

  W(`\nLog: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
