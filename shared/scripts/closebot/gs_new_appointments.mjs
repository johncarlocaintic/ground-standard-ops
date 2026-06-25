/**
 * gs_new_appointments.mjs — GHL appointments booked in the last N days, per gym.
 * Approach: contacts-based (startDate filter) — /calendars/events 403s for all token types.
 * Fetches contacts added in window, filters for booked/cb tags, then pulls their appointments.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_new_appointments.mjs [--days=N]
 *
 * --days=N  look-back window (default 14)
 *
 * Gyms can use either pit (GHL PIT) or sourceId (CB agency source — token
 * fetched at runtime). sourceId entries don't need a pit field.
 *
 * Limitation: only captures appointments for contacts ADDED within the window.
 * Re-engaged existing contacts may be missed, but this covers the vast majority
 * of bot-driven lead → booking conversions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'new_appointments.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const daysArg = process.argv.find(a => a.startsWith('--days='));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 14;
const SINCE_MS = Date.now() - DAYS * 24 * 60 * 60 * 1000;
const SINCE_ISO = new Date(SINCE_MS).toISOString();
const GHL = 'https://services.leadconnectorhq.com';
const CB_API_KEY = process.env.CB_GS_API_KEY;

const GYMS = [
  { label: 'Vacaville PROD',   sourceId: 'src_GDKORXSW4Q8RQUQ8' },
  { label: 'Hamptons JJ West', sourceId: 'src_8RHY7XBXZ50T5CXD' },
  { label: 'SOMA MVMT',        sourceId: 'src_R05QT50QS4PTYDBG' },
  { label: '10P Miami',        sourceId: 'src_MXT2RCPXUZNTOP0S' },
  { label: 'Champion',         pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', loc: 'ffkMyOy6QOwqrvn4OvoK' },
  { label: 'Academy Scottsdale', pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', loc: '8XPm2yy1DqYc7fDpSj4O' },
  { label: 'Academy EP',       pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', loc: 'YzynD9APfmv7ed8RIk3K' },
  { label: 'Ballantyne',       pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff', loc: '2y7XT17KEqjIpnTvPvJB' },
  { label: 'Breathe JJ',       pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e', loc: 'USMxTUWMwAIetj1ka5u3' },
  { label: 'Artistry BJJ',     pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad', loc: '3SIWDTRfqtCBE9gSr1bY' },
  { label: 'Grit JJ',          pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58', loc: 'JPFHqtf4KnkqVtiUU9Bk' },
  { label: 'Centerline JJ',    pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7', loc: 'UWo67lKtFJYZCJ8LkD3O' },
  { label: 'OM BJJ',           pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47', loc: 'dUOiYuuo9LBcUnDOxd1i' },
  { label: 'Sugoi',            pit: 'pit-5a11741a-025f-49a3-9753-cad63aeb357c', loc: '13FZuBUiLGp1WVpWYz3b' },
  { label: 'Ray Longo MMA',    pit: 'pit-70da2aa1-2805-402b-8e98-33e6f8227097', loc: 'MPmczU9WX0pOwJwZGEff' },
  { label: 'Universal MMA',    pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9', loc: 'MkbS4Ud2oAGBtbpVkzyi' },
  { label: 'Montgomery BJJ',   pit: 'pit-01d47e41-ce24-41ef-b334-41d7a2715a70', loc: 'jzXRITAw6MM4hJZkG9A0' },
  { label: 'Signature JJ',     pit: 'pit-d3ab70ad-ba7b-4e0a-b7af-d1db50ba15b0', loc: 'UOoHf3aLtbRc8fc68KiS' },
  { label: 'Roberts MMA',      pit: 'pit-76c54493-51f5-4f8a-8e6f-c38f9fda65a5', loc: 'aTIcApLzaP3lirDWJfKW' },
  { label: 'Simple Man MA',    pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', loc: 'aKQzZVFXhecYncsbvsOH' },
  { label: 'Killer B',         pit: 'pit-4d5cdc78-f3a6-420f-93a9-ebd07e298e78', loc: 'uIW84chF6pVm03ifxxlB' },
  { label: 'Mason Dixon',      pit: 'pit-f88f9de3-e08a-4339-9bfe-ee70dfc1b52e', loc: 'mhWC5iT8EBKHcGefn2hO' },
  // Paragon excluded — PIT unknown
];

function hasTag(tags, name) {
  return (tags || []).some(t => t.toLowerCase() === name.toLowerCase());
}

async function ghlFetch(pit, ep) {
  const r = await fetch(`${GHL}${ep}`, {
    headers: { Authorization: 'Bearer ' + pit, Version: '2021-07-28' },
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function getContactsInWindow(pit, loc) {
  const contacts = [];
  let nextUrl = `${GHL}/contacts/?locationId=${loc}&startDate=${SINCE_MS}&endDate=${Date.now()}&limit=100`;
  while (nextUrl) {
    const r = await fetch(nextUrl, {
      headers: { Authorization: 'Bearer ' + pit, Version: '2021-07-28' },
    });
    if (!r.ok) break;
    const j = await r.json();
    contacts.push(...(j.contacts || []));
    nextUrl = j.meta?.nextPageUrl || null;
    if (contacts.length >= 500) break; // safety cap
  }
  return contacts;
}

(async () => {
  // Resolve sourceId entries → pit (GHL OAuth token) + loc via CB agency API
  for (const g of GYMS) {
    if (g.sourceId && !g.pit) {
      const r = await fetch(`https://api.closebot.com/agency/source/${g.sourceId}`, {
        headers: { 'X-CB-KEY': CB_API_KEY },
      });
      if (!r.ok) { W(`[WARN] Could not resolve token for ${g.label} (${g.sourceId}): ${r.status}`); continue; }
      const j = await r.json();
      g.pit = j.accessToken;
      g.loc = j.key;
    }
  }

  W(`=== New GHL Appointments — last ${DAYS} days (since ${SINCE_ISO.slice(0,10)}) ===`);
  W(`Run at: ${new Date().toISOString()}\n`);
  W('Bot indicators: [CB-TAG] = bot booked (cb tag). [concierge+booked] = bot was active + booking exists.\n');

  let grandTotal = 0;
  let botTotal = 0;

  for (const g of GYMS) {
    if (!g.pit || !g.loc) {
      W(`${g.label}: skipped (no credentials resolved)`);
      continue;
    }

    // Get all contacts added in the window
    const contacts = await getContactsInWindow(g.pit, g.loc);
    if (contacts.length === 0) {
      W(`${g.label}: 0 new contacts in window`);
      continue;
    }

    // Filter to those with booking-related tags
    const bookedContacts = contacts.filter(c => hasTag(c.tags, 'booked') || hasTag(c.tags, 'cb'));
    if (bookedContacts.length === 0) {
      W(`${g.label}: ${contacts.length} new contacts, 0 with booking tags`);
      continue;
    }

    // For each booked contact, get their appointments
    const gymAppts = [];
    for (const c of bookedContacts) {
      const ar = await ghlFetch(g.pit, `/contacts/${c.id}/appointments`);
      if (!ar.ok) continue;
      const events = ar.json.events || [];
      for (const e of events) {
        const created = e.dateAdded || e.createdAt || '';
        const createdMs = created ? new Date(created).getTime() : 0;
        if (createdMs < SINCE_MS) continue;
        gymAppts.push({ ...e, _contact: c, _createdMs: createdMs });
      }
    }

    if (gymAppts.length === 0) {
      W(`${g.label}: ${contacts.length} new contacts, ${bookedContacts.length} booked — 0 appointments in window`);
      continue;
    }

    grandTotal += gymAppts.length;

    W(`${g.label}: ${gymAppts.length} appointment(s) (from ${contacts.length} new contacts)`);
    for (const appt of gymAppts) {
      const c = appt._contact;
      const tags = c.tags || [];
      const contactName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.phone || c.id;
      const title = appt.title || '?';
      const start = typeof appt.startTime === 'string' ? appt.startTime.slice(0, 10) : '?';
      const createdAt = new Date(appt._createdMs).toISOString().slice(0, 16);

      const hasCB        = hasTag(tags, 'cb');
      const hasConcierge = hasTag(tags, 'concierge');
      const hasBooked    = hasTag(tags, 'booked');

      const botFlag = hasCB ? '[CB-TAG]      ' : (hasConcierge && hasBooked ? '[concierge+booked]' : '[booked]      ');
      if (hasCB || hasConcierge) botTotal++;

      const tagStr = tags.length ? tags.join(', ') : 'none';
      W(`  ${botFlag} ${contactName}`);
      W(`    Appt: "${title}" on ${start} | booked ${createdAt}`);
      W(`    Tags: ${tagStr}`);
    }
    W('');
  }

  W('=== SUMMARY ===');
  W(`Total new appointments (last ${DAYS}d): ${grandTotal}`);
  W(`Bot-touched (CB tag OR concierge):      ${botTotal}`);
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
