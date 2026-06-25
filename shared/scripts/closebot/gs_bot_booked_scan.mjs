/**
 * gs_bot_booked_scan.mjs
 *
 * Find contacts that our bots likely booked:
 *   1. Has CB tag  (injected by bot at booking confirm — most reliable, from 2026-05-22)
 *   2. Has concierge + booked tags  (historical fingerprint — bot triggered + GHL confirmed booking)
 *
 * For each match, shows name, tags, date added, and last message.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_bot_booked_scan.mjs [--days=N]
 *
 * --days=N  filter contacts updated in last N days (default 30)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'bot_booked_scan.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const daysArg = process.argv.find(a => a.startsWith('--days='));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
const SINCE_MS = Date.now() - DAYS * 24 * 60 * 60 * 1000;
const GHL = 'https://services.leadconnectorhq.com';

const GYMS = [
  { label: 'Champion',           pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', loc: 'ffkMyOy6QOwqrvn4OvoK' },
  { label: 'Academy Scottsdale', pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', loc: '8XPm2yy1DqYc7fDpSj4O' },
  { label: 'Academy EP',         pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', loc: 'YzynD9APfmv7ed8RIk3K' },
  { label: 'Mason Dixon',        pit: 'pit-f88f9de3-e08a-4339-9bfe-ee70dfc1b52e', loc: 'mhWC5iT8EBKHcGefn2hO' },
  { label: 'Breathe JJ',         pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e', loc: 'USMxTUWMwAIetj1ka5u3' },
  { label: 'Grit JJ',            pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58', loc: 'JPFHqtf4KnkqVtiUU9Bk' },
  { label: 'Centerline JJ',      pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7', loc: 'UWo67lKtFJYZCJ8LkD3O' },
  { label: 'Ballantyne',         pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff', loc: '2y7XT17KEqjIpnTvPvJB' },
  { label: 'Artistry BJJ',       pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad', loc: '3SIWDTRfqtCBE9gSr1bY' },
  { label: '10P Miami',          pit: 'pit-c6effbe1-d616-494c-8285-5b10dc24fbeb', loc: '98Z8PDW1sSiYSGSzyqGl' },
  { label: 'Universal MMA',      pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9', loc: 'MkbS4Ud2oAGBtbpVkzyi' },
  { label: 'Ray Longo MMA',      pit: 'pit-70da2aa1-2805-402b-8e98-33e6f8227097', loc: 'MPmczU9WX0pOwJwZGEff' },
  { label: 'Montgomery BJJ',     pit: 'pit-01d47e41-ce24-41ef-b334-41d7a2715a70', loc: 'jzXRITAw6MM4hJZkG9A0' },
  { label: 'Simple Man MA',      pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', loc: 'aKQzZVFXhecYncsbvsOH' },
  { label: 'Killer B',           pit: 'pit-4d5cdc78-f3a6-420f-93a9-ebd07e298e78', loc: 'uIW84chF6pVm03ifxxlB' },
  { label: 'Sugoi',              pit: 'pit-5a11741a-025f-49a3-9753-cad63aeb357c', loc: '13FZuBUiLGp1WVpWYz3b' },
  { label: 'OM BJJ',             pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47', loc: 'dUOiYuuo9LBcUnDOxd1i' },
  { label: 'Signature JJ',       pit: 'pit-d3ab70ad-ba7b-4e0a-b7af-d1db50ba15b0', loc: 'UOoHf3aLtbRc8fc68KiS' },
  { label: 'Roberts MMA',        pit: 'pit-76c54493-51f5-4f8a-8e6f-c38f9fda65a5', loc: 'aTIcApLzaP3lirDWJfKW' },
  // Paragon excluded — PIT unknown
];

async function ghlPost(pit, ep, body) {
  const r = await fetch(`${GHL}${ep}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer '+pit, Version: '2021-07-28', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0,300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  W(`=== Bot-Booked Contact Scan — last ${DAYS} days ===`);
  W(`Run at: ${new Date().toISOString()}\n`);
  W('Fingerprints:');
  W('  [CB]              = CB tag (bot confirmed booking, applies from 2026-05-22 onwards)');
  W('  [concierge+booked] = historical — bot triggered + GHL booking confirmed\n');

  let grandTotal = 0;

  for (const g of GYMS) {
    const gymMatches = [];

    // Query 1: CB tag
    const cbR = await ghlPost(g.pit, '/contacts/search', {
      locationId: g.loc,
      filters: [{ field: 'tags', operator: 'contains', value: 'CB' }],
      pageLimit: 100,
    });
    if (cbR.ok) {
      for (const c of (cbR.json.contacts || [])) {
        const upd = c.dateUpdated || c.dateAdded || 0;
        const ms = typeof upd === 'string' ? new Date(upd).getTime() : upd;
        if (ms >= SINCE_MS) gymMatches.push({ ...c, _fingerprint: 'CB' });
      }
    }

    // Query 2: concierge + booked (historical)
    const histR = await ghlPost(g.pit, '/contacts/search', {
      locationId: g.loc,
      filters: [
        { field: 'tags', operator: 'contains', value: 'concierge' },
        { field: 'tags', operator: 'contains', value: 'booked' },
      ],
      pageLimit: 100,
    });
    if (histR.ok) {
      for (const c of (histR.json.contacts || [])) {
        // Skip if already found via CB tag
        if (gymMatches.some(m => m.id === c.id)) continue;
        const upd = c.dateUpdated || c.dateAdded || 0;
        const ms = typeof upd === 'string' ? new Date(upd).getTime() : upd;
        if (ms >= SINCE_MS) gymMatches.push({ ...c, _fingerprint: 'concierge+booked' });
      }
    }

    if (gymMatches.length === 0) {
      W(`${g.label}: 0`);
      continue;
    }

    grandTotal += gymMatches.length;
    W(`${g.label}: ${gymMatches.length} bot-booked contact(s)`);
    for (const c of gymMatches) {
      const name = c.contactName || `${c.firstName||''} ${c.lastName||''}`.trim() || c.phone || c.id;
      const dateUpdated = c.dateUpdated ? new Date(c.dateUpdated).toISOString().slice(0,10) : '?';
      const allTags = (c.tags || []).join(', ') || 'none';
      W(`  [${c._fingerprint}] ${name} | updated ${dateUpdated}`);
      W(`    tags: ${allTags}`);
    }
  }

  W('');
  W(`=== TOTAL bot-booked contacts (last ${DAYS}d): ${grandTotal} ===`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
