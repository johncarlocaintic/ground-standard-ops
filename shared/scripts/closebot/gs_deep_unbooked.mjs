/**
 * gs_deep_unbooked.mjs — find leads with deep bot conversations but no booking yet.
 *
 * Criteria:
 *   - Tagged `concierge` (bot was triggered for this lead)
 *   - NOT tagged `booked`, `member`, `alumni`, `spam`, `staff`, `service`
 *   - Conversation has >= MIN_MSGS messages (default 4)
 *   - Activity within last DAYS days (default 30)
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_deep_unbooked.mjs [--days=30] [--min=4]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'deep_unbooked.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const daysArg = process.argv.find(a => a.startsWith('--days='));
const minArg  = process.argv.find(a => a.startsWith('--min='));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
const MIN_MSGS = minArg ? parseInt(minArg.split('=')[1]) : 4;
const SINCE_MS = Date.now() - DAYS * 86400000;

const GHL = 'https://services.leadconnectorhq.com';

// 19 live GS gyms with PITs (Paragon excluded — no PIT)
const GYMS = [
  { slug: 'vacaville',             pit: 'pit-69f86c4a-9088-4cb2-b1d3-c4cf16ea34c1', loc: '53GFKJ5GnSyDPaUUSDh1' },
  { slug: '10p-miami',             pit: 'pit-c6effbe1-d616-494c-8285-5b10dc24fbeb', loc: '98Z8PDW1sSiYSGSzyqGl' },
  { slug: 'academyjjscottsdale',   pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', loc: '8XPm2yy1DqYc7fDpSj4O' },
  { slug: 'academyedenprairie',    pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', loc: 'YzynD9APfmv7ed8RIk3K' },
  { slug: 'ballantynemartialarts', pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff', loc: '2y7XT17KEqjIpnTvPvJB' },
  { slug: 'breathejiujitsu',       pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e', loc: 'USMxTUWMwAIetj1ka5u3' },
  { slug: 'artistrybjj',           pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad', loc: '3SIWDTRfqtCBE9gSr1bY' },
  { slug: 'gritjiujitsu',          pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58', loc: 'JPFHqtf4KnkqVtiUU9Bk' },
  { slug: 'championmartialarts',   pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', loc: 'ffkMyOy6QOwqrvn4OvoK' },
  { slug: 'centerlinejiujitsu',    pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7', loc: 'UWo67lKtFJYZCJ8LkD3O' },
  { slug: 'ombjj',                 pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47', loc: 'dUOiYuuo9LBcUnDOxd1i' },
  { slug: 'sugoi',                 pit: 'pit-5a11741a-025f-49a3-9753-cad63aeb357c', loc: '13FZuBUiLGp1WVpWYz3b' },
  { slug: 'raylongo',              pit: 'pit-70da2aa1-2805-402b-8e98-33e6f8227097', loc: 'MPmczU9WX0pOwJwZGEff' },
  { slug: 'universalmma',          pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9', loc: 'MkbS4Ud2oAGBtbpVkzyi' },
  { slug: 'montgomery',            pit: 'pit-01d47e41-ce24-41ef-b334-41d7a2715a70', loc: 'jzXRITAw6MM4hJZkG9A0' },
  { slug: 'signature',             pit: 'pit-d3ab70ad-ba7b-4e0a-b7af-d1db50ba15b0', loc: 'UOoHf3aLtbRc8fc68KiS' },
  { slug: 'roberts',               pit: 'pit-76c54493-51f5-4f8a-8e6f-c38f9fda65a5', loc: 'aTIcApLzaP3lirDWJfKW' },
  { slug: 'simpleman',             pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757', loc: 'aKQzZVFXhecYncsbvsOH' },
  { slug: 'killerb',               pit: 'pit-4d5cdc78-f3a6-420f-93a9-ebd07e298e78', loc: 'uIW84chF6pVm03ifxxlB' },
];

const EXCLUDED_TAGS = new Set(['booked', 'member', 'alumni', 'spam', 'staff', 'service']);

async function ghl(pit, method, ep, body) {
  const r = await fetch(`${GHL}${ep}`, {
    method,
    headers: { Authorization: 'Bearer ' + pit, Version: '2021-07-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 200) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function getConvStats(pit, locId, contactId) {
  const cv = await ghl(pit, 'GET', `/conversations/search?locationId=${locId}&contactId=${contactId}&limit=1`);
  const conv = (cv.ok && (cv.json.conversations || [])[0]) || null;
  if (!conv) return { count: 0, outboundCount: 0, lastOutboundMs: 0, lastOutboundBody: '', conv: null };

  const mr = await ghl(pit, 'GET', `/conversations/${conv.id}/messages?limit=100`);
  const msgs = (mr.ok && mr.json.messages?.messages) || (mr.ok && mr.json.messages) || [];
  if (!Array.isArray(msgs)) return { count: 0, outboundCount: 0, lastOutboundMs: 0, lastOutboundBody: '', conv };

  // Count meaningful outbound messages (have a body) — these are the bot replies
  let outboundCount = 0, lastOutboundMs = 0, lastOutboundBody = '';
  for (const m of msgs) {
    if (m.direction !== 'outbound') continue;
    const body = (m.body || m.message || '').trim();
    if (!body || body === 'Opportunity created' || body === 'Opportunity updated') continue;
    outboundCount++;
    const ms = m.dateAdded ? new Date(m.dateAdded).getTime() : 0;
    if (ms > lastOutboundMs) { lastOutboundMs = ms; lastOutboundBody = body; }
  }
  return { count: msgs.length, outboundCount, lastOutboundMs, lastOutboundBody, conv };
}

(async () => {
  W(`=== GS Deep-but-Unbooked Lead Hunter — ${new Date().toISOString()} ===`);
  W(`Filters: concierge tag, NOT booked/member/alumni/spam/staff/service, ≥${MIN_MSGS} msgs, activity in last ${DAYS} days\n`);

  const candidates = [];

  for (const g of GYMS) {
    process.stdout.write(`${g.slug}: searching... `);
    const cs = await ghl(g.pit, 'POST', '/contacts/search', {
      locationId: g.loc,
      filters: [{ field: 'tags', operator: 'contains', value: 'concierge' }],
      pageLimit: 100,
    });
    if (!cs.ok) {
      W(`SKIP (${cs.status})`);
      continue;
    }
    const contacts = cs.json.contacts || [];

    // Filter: recent + no excluded tags
    const eligible = contacts.filter(c => {
      const upd = c.dateUpdated || c.dateAdded || 0;
      const ms = typeof upd === 'string' ? new Date(upd).getTime() : upd;
      if (ms < SINCE_MS) return false;
      const tags = (c.tags || []).map(t => String(t).toLowerCase());
      for (const ex of EXCLUDED_TAGS) if (tags.includes(ex)) return false;
      return true;
    });

    process.stdout.write(`${contacts.length} concierge, ${eligible.length} unbooked+recent... `);

    let added = 0;
    for (const c of eligible) {
      const stats = await getConvStats(g.pit, g.loc, c.id);
      if (stats.count < MIN_MSGS) continue;
      // Require bot actually replied (outbound message with real body) within the window
      if (stats.outboundCount === 0) continue;
      if (stats.lastOutboundMs < SINCE_MS) continue;
      const name = c.contactName || `${c.firstName||''} ${c.lastName||''}`.trim() || c.phone || c.email || c.id;
      candidates.push({
        gym: g.slug,
        name,
        contactId: c.id,
        phone: c.phone || '',
        email: c.email || '',
        messages: stats.count,
        outboundCount: stats.outboundCount,
        lastOutboundMs: stats.lastOutboundMs,
        lastBody: (stats.conv?.lastMessageBody || '').replace(/\s+/g, ' ').slice(0, 100),
        lastBotReply: stats.lastOutboundBody.replace(/\s+/g, ' ').slice(0, 100),
        tags: (c.tags || []).join(','),
      });
      added++;
    }
    W(`${added} bot-replied recent`);
  }

  // Sort by most recent bot activity, descending
  candidates.sort((a, b) => b.lastOutboundMs - a.lastOutboundMs);

  W('\n=== BOT-REPLIED RECENT LEADS (concierge, unbooked) ===\n');
  if (candidates.length === 0) {
    W('None found.');
  } else {
    for (const c of candidates) {
      const ago = Math.floor((Date.now() - c.lastOutboundMs) / 3600000);
      W(`[${c.gym}] ${c.name}  (${c.messages} msgs, ${c.outboundCount} bot replies, last bot reply ${ago}h ago)`);
      W(`  phone: ${c.phone} | email: ${c.email}`);
      W(`  tags: ${c.tags}`);
      W(`  last bot reply: "${c.lastBotReply}"`);
      W(`  last in convo:  "${c.lastBody}"`);
      W(`  contactId: ${c.contactId}`);
      W('');
    }
  }

  W(`\nTotal: ${candidates.length} deep-but-unbooked leads across ${GYMS.length} live gyms.`);
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
