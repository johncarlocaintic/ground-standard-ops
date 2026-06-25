/**
 * gs_concierge_activity.mjs — what our bots actually did.
 *
 * Filters GHL conversations + appointments to contacts carrying the
 * `concierge` tag (the trigger tag for every live GS bot). This isolates
 * CloseBot-touched leads from the pre-existing GHL automations.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_concierge_activity.mjs [--hours=N]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'concierge_activity.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const hoursArg = process.argv.find(a => a.startsWith('--hours='));
const HOURS = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
const SINCE_MS = Date.now() - HOURS * 60 * 60 * 1000;
const SINCE_ISO = new Date(SINCE_MS).toISOString();

const GHL = 'https://services.leadconnectorhq.com';

// All live gyms with valid PITs (Paragon excluded — PIT missing)
const GYMS = [
  { slug: '10p-miami',            pit: 'pit-c6effbe1-d616-494c-8285-5b10dc24fbeb', loc: '98Z8PDW1sSiYSGSzyqGl' },
  { slug: 'academyjjscottsdale',  pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', loc: '8XPm2yy1DqYc7fDpSj4O' },
  { slug: 'academyedenprairie',   pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', loc: 'YzynD9APfmv7ed8RIk3K' },
  { slug: 'ballantynemartialarts', pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff', loc: '2y7XT17KEqjIpnTvPvJB' },
  { slug: 'breathejiujitsu',      pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e', loc: 'USMxTUWMwAIetj1ka5u3' },
  { slug: 'artistrybjj',          pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad', loc: '3SIWDTRfqtCBE9gSr1bY' },
  { slug: 'gritjiujitsu',         pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58', loc: 'JPFHqtf4KnkqVtiUU9Bk' },
  { slug: 'championmartialarts',  pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', loc: 'ffkMyOy6QOwqrvn4OvoK' },
  { slug: 'centerlinejiujitsu',   pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7', loc: 'UWo67lKtFJYZCJ8LkD3O' },
  { slug: 'ombjj',                pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47', loc: 'dUOiYuuo9LBcUnDOxd1i' },
  { slug: 'sugoi',                pit: 'pit-5a11741a-025f-49a3-9753-cad63aeb357c', loc: '13FZuBUiLGp1WVpWYz3b' },
  { slug: 'raylongo',             pit: 'pit-70da2aa1-2805-402b-8e98-33e6f8227097', loc: 'MPmczU9WX0pOwJwZGEff' },
  { slug: 'universalmma',         pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9', loc: 'MkbS4Ud2oAGBtbpVkzyi' },
  { slug: 'montgomery',           pit: 'pit-01d47e41-ce24-41ef-b334-41d7a2715a70', loc: 'jzXRITAw6MM4hJZkG9A0' },
  { slug: 'signature',            pit: 'pit-d3ab70ad-ba7b-4e0a-b7af-d1db50ba15b0', loc: 'UOoHf3aLtbRc8fc68KiS' },
  { slug: 'roberts',              pit: 'pit-76c54493-51f5-4f8a-8e6f-c38f9fda65a5', loc: 'aTIcApLzaP3lirDWJfKW' },
  { slug: 'simpleman',            pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', loc: 'aKQzZVFXhecYncsbvsOH' },
  { slug: 'killerb',              pit: 'pit-4d5cdc78-f3a6-420f-93a9-ebd07e298e78', loc: 'uIW84chF6pVm03ifxxlB' },
  // Paragon: pit unknown — chase Bobby. Skipped here until PIT is provided.
];

async function ghl(pit, method, ep, body) {
  const r = await fetch(`${GHL}${ep}`, {
    method,
    headers: { Authorization: 'Bearer ' + pit, Version: '2021-07-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  W(`=== GS Concierge Activity Monitor — last ${HOURS}h (since ${SINCE_ISO}) ===`);
  W(`Run at: ${new Date().toISOString()}`);
  W('Filters: contacts with `concierge` tag (the trigger tag every live GS bot fires on)\n');

  let totalContacts = 0, totalActiveConvs = 0, totalNewBookings = 0;

  for (const g of GYMS) {
    // 1. Search contacts with concierge tag for this location
    const cs = await ghl(g.pit, 'POST', '/contacts/search', {
      locationId: g.loc,
      filters: [{ field: 'tags', operator: 'contains', value: 'concierge' }],
      pageLimit: 100,
    });
    if (!cs.ok) {
      W(`${g.slug}: contacts/search ${cs.status} — ${JSON.stringify(cs.json).slice(0, 150)}`);
      continue;
    }
    const contacts = cs.json.contacts || [];
    totalContacts += contacts.length;

    if (contacts.length === 0) {
      W(`${g.slug}: 0 concierge contacts`);
      continue;
    }

    // Recent activity contacts (dateUpdated in window or any new message)
    const recentContacts = [];
    for (const c of contacts) {
      const upd = c.dateUpdated || c.dateAdded || 0;
      const ms = typeof upd === 'string' ? new Date(upd).getTime() : upd;
      if (ms >= SINCE_MS) recentContacts.push({ ...c, _upd: ms });
    }

    W(`${g.slug}: ${contacts.length} concierge contact(s) total, ${recentContacts.length} active in last ${HOURS}h`);

    if (recentContacts.length === 0) continue;
    totalActiveConvs += recentContacts.length;

    // 2. For each active contact, get their conversation summary
    for (const c of recentContacts.slice(0, 8)) {
      const name = c.contactName || `${c.firstName||''} ${c.lastName||''}`.trim() || c.phone || c.id;

      // Fetch conversation for this contact (by contactId filter)
      const cv = await ghl(g.pit, 'GET', `/conversations/search?locationId=${g.loc}&contactId=${c.id}&limit=1`);
      const conv = (cv.ok && (cv.json.conversations||[])[0]) || null;

      const lastMsg = conv?.lastMessageBody || '(no msg)';
      const lastDir = conv?.lastMessageDirection || conv?.lastMessageType || '?';
      const lastTs  = conv?.lastMessageDate || c.dateUpdated;
      const unread  = conv?.unreadCount || 0;

      W(`  • ${name} | ${lastDir} | unread=${unread} | ${new Date(typeof lastTs==='string'?lastTs:lastTs).toISOString()}`);
      W(`    "${String(lastMsg).replace(/\s+/g,' ').slice(0, 120)}"`);
    }

    // 3. Get appointments for these contacts (new bookings in window)
    const calR = await ghl(g.pit, 'GET', `/calendars/?locationId=${g.loc}`);
    const calendars = calR.ok ? (calR.json.calendars || calR.json.data || []) : [];
    const contactIds = new Set(recentContacts.map(c => c.id));
    let newBookings = 0;
    const bookings = [];
    for (const cal of calendars) {
      const evR = await ghl(g.pit, 'GET', `/calendars/events?calendarId=${cal.id}&startTime=${SINCE_MS}&endTime=${Date.now()+7*24*60*60*1000}`);
      if (!evR.ok) continue;
      const events = evR.json.events || evR.json.appointments || evR.json.data || [];
      for (const e of events) {
        const created = e.createdAt || e.dateAdded || 0;
        const ms = typeof created === 'string' ? new Date(created).getTime() : created;
        if (ms < SINCE_MS) continue;
        const contactMatch = contactIds.has(e.contactId);
        if (contactMatch) {
          newBookings++;
          bookings.push({ title: e.title || '?', contactId: e.contactId, start: e.startTime, cal: cal.name });
        }
      }
    }
    if (newBookings > 0) {
      W(`  ★ ${newBookings} new booking(s) by concierge contacts:`);
      for (const b of bookings) W(`    "${b.title}" | ${b.cal} | ${b.start}`);
      totalNewBookings += newBookings;
    }
  }

  W('');
  W('=== TOTALS ===');
  W(`Concierge contacts (all-time): ${totalContacts}`);
  W(`Active contacts (last ${HOURS}h): ${totalActiveConvs}`);
  W(`New bookings (last ${HOURS}h): ${totalNewBookings}`);
  W('');
  W('Note: Paragon excluded (PIT missing). All other 18 live gyms covered.');
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
