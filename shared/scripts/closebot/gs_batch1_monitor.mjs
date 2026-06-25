/**
 * Batch-1 monitor — CB conversations + GHL appointments for all 5 gyms.
 *
 * CB side:  GET /agency/conversations (filtered by sourceId)
 * GHL side: GET /calendars/events for each gym's location via its PIT
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_batch1_monitor.mjs [--hours=N]
 *
 * --hours=N  look-back window (default 24)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'batch1_monitor.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const hoursArg = process.argv.find(a => a.startsWith('--hours='));
const HOURS = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
const NOW = Date.now();
const SINCE_MS = NOW - HOURS * 60 * 60 * 1000;
const SINCE_ISO = new Date(SINCE_MS).toISOString();

const cbKey = process.env.CB_GS_API_KEY;
if (!cbKey) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const CB_H = { 'X-CB-KEY': cbKey, 'Content-Type': 'application/json' };
const GHL_BASE = 'https://services.leadconnectorhq.com';

const BATCH1 = [
  {
    slug: '10p-miami',
    srcId: 'src_MXT2RCPXUZNTOP0S',
    ghlLoc: '98Z8PDW1sSiYSGSzyqGl',
    pit: 'pit-c6effbe1-d616-494c-8285-5b10dc24fbeb',
  },
  {
    slug: 'academyjjscottsdale',
    srcId: 'src_G95K8VC8HQTNWPGL',
    ghlLoc: '8XPm2yy1DqYc7fDpSj4O',
    pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46',
  },
  {
    slug: 'academyedenprairie',
    srcId: 'src_OJO9E23V1JJSRJLN',
    ghlLoc: 'YzynD9APfmv7ed8RIk3K',
    pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681',
  },
  {
    slug: 'ballantynemartialarts',
    srcId: 'src_5E8F1KTYKN51FWK5',
    ghlLoc: '2y7XT17KEqjIpnTvPvJB',
    pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff',
  },
  {
    slug: 'breathejiujitsu',
    srcId: 'src_J4AHQWBOVA6ZXV0Y',
    ghlLoc: 'USMxTUWMwAIetj1ka5u3',
    pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e',
  },
  // ── Batch-2 (launched 2026-05-20) ──
  {
    slug: 'artistrybjj',
    srcId: 'src_D87BKGBV6H9K4WRS',
    ghlLoc: '3SIWDTRfqtCBE9gSr1bY',
    pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad',
  },
  {
    slug: 'gritjiujitsu',
    srcId: 'src_6MS3RHIRTR8OEKMO',
    ghlLoc: 'JPFHqtf4KnkqVtiUU9Bk',
    pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58',
  },
  {
    slug: 'championmartialarts',
    srcId: 'src_EJODL02HM128RGZH',
    ghlLoc: 'ffkMyOy6QOwqrvn4OvoK',
    pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185',
  },
  {
    slug: 'centerlinejiujitsu',
    srcId: 'src_QST1SHU18MPOOHEH',
    ghlLoc: 'UWo67lKtFJYZCJ8LkD3O',
    pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7',
  },
  {
    slug: 'paragonsimi',
    srcId: 'src_SFJ08L818G37B5CP',
    ghlLoc: 'SO522NFKOtYUxfAzLbYW',
    pit: null, // Paragon real PIT is MISSING (inventory expanded list) — GHL conv/appt skipped; filter-health still works
  },
  // ── Batch-3 (launched 2026-05-20) ──
  {
    slug: 'ombjj',
    srcId: 'src_VGIGZ52AQVQZKXS3',
    ghlLoc: 'dUOiYuuo9LBcUnDOxd1i',
    pit: 'pit-aa7d0727-de0b-4905-ac61-3af7182d8f47',
  },
  {
    slug: 'sugoi',
    srcId: 'src_JPK476A1ODXA5YGB',
    ghlLoc: '13FZuBUiLGp1WVpWYz3b',
    pit: 'pit-5a11741a-025f-49a3-9753-cad63aeb357c',
  },
  // ── Batch-3 final 3 (launched 2026-05-21) ──
  {
    slug: 'raylongo',
    srcId: 'src_XM58ZT2N3E8A1UDT',
    ghlLoc: 'MPmczU9WX0pOwJwZGEff',
    pit: 'pit-70da2aa1-2805-402b-8e98-33e6f8227097',
  },
  {
    slug: 'universalmma',
    srcId: 'src_4C7CIFW27LLW2TCH',
    ghlLoc: 'MkbS4Ud2oAGBtbpVkzyi',
    pit: 'pit-a46fac8e-856a-4d4b-ad3f-8afdd25b5ab9',
  },
  {
    slug: 'montgomery',
    srcId: 'src_4VEFF108BZ7GDG4K',
    ghlLoc: 'jzXRITAw6MM4hJZkG9A0',
    pit: 'pit-01d47e41-ce24-41ef-b334-41d7a2715a70',
  },
  // ── Batch-4 (launched 2026-05-21) ──
  {
    slug: 'signature',
    srcId: 'src_HHSREAS1NVHJMDSR',
    ghlLoc: 'UOoHf3aLtbRc8fc68KiS',
    pit: 'pit-d3ab70ad-ba7b-4e0a-b7af-d1db50ba15b0',
  },
  {
    slug: 'roberts',
    srcId: 'src_E4ZQBA8ABFBDK5RM',
    ghlLoc: 'aTIcApLzaP3lirDWJfKW',
    pit: 'pit-76c54493-51f5-4f8a-8e6f-c38f9fda65a5',
  },
  {
    slug: 'simpleman',
    srcId: 'src_XZH7NHD2M8NF0EQL',
    ghlLoc: 'aKQzZVFXhecYncsbvsOH',
    pit: 'pit-1b8ce5fe-7308-4a07-b9ef-4874c1486757',
  },
  {
    slug: 'killerb',
    srcId: 'src_YJOFG6926ILNHH1R',
    ghlLoc: 'uIW84chF6pVm03ifxxlB',
    pit: 'pit-4d5cdc78-f3a6-420f-93a9-ebd07e298e78',
  },
];

async function cbApi(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: CB_H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function ghlApi(pit, ep) {
  const r = await fetch(`${GHL_BASE}${ep}`, {
    headers: { Authorization: 'Bearer ' + pit, Version: '2021-07-28', 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  W(`=== Batch-1 Monitor — last ${HOURS}h (since ${SINCE_ISO}) ===`);
  W(`Run at: ${new Date().toISOString()}\n`);

  // ── GHL CONVERSATIONS (bot activity) ────────────────────────────────────
  // CB has no conversations API — all bot activity is stored in GHL.
  // Uses each gym's PIT to pull recent conversations via /conversations/search.
  W('── GHL Conversations (bot activity) ──');
  for (const g of BATCH1) {
    if (!g.pit) { W(`  ${g.slug}: no PIT — GHL conversation check skipped (filter-health below still covers it)`); continue; }
    const r = await ghlApi(g.pit, `/conversations/search?locationId=${g.ghlLoc}&limit=20`);
    if (!r.ok) {
      W(`  ${g.slug}: GHL ${r.status} — ${JSON.stringify(r.json).slice(0, 150)}`);
      continue;
    }
    const convs = r.json.conversations || r.json.data || [];

    // Filter to conversations with activity in the window
    const recent = convs.filter(c => {
      const ts = c.lastMessageDate || c.dateUpdated || c.dateAdded || 0;
      const ms = typeof ts === 'string' ? new Date(ts).getTime() : ts;
      return ms >= SINCE_MS;
    });

    W(`  ${g.slug}: ${recent.length} active conversation(s) in last ${HOURS}h`);
    for (const c of recent.slice(0, 5)) {
      const contact = c.contactName || c.fullName || c.contact?.name || '?';
      const lastMsg = c.lastMessageBody || c.lastMessage || '(no preview)';
      const lastDir = c.lastMessageDirection || c.lastMessageType || '?'; // inbound=lead, outbound=bot
      const ts = c.lastMessageDate || c.dateUpdated || '?';
      const unread = c.unreadCount || 0;
      W(`    ${contact} | ${lastDir} | "${String(lastMsg).slice(0, 60)}" | ${ts} | unread=${unread}`);
    }
  }
  W('');

  // ── GHL APPOINTMENTS ────────────────────────────────────────────────────
  // GHL /calendars/events requires calendarId, not just locationId.
  // Step 1: get all calendars for each gym's location.
  // Step 2: query events per calendar for the time window.
  W('── GHL Appointments ──');
  for (const g of BATCH1) {
    if (!g.pit) { W(`  ${g.slug}: no PIT — GHL appointment check skipped`); continue; }
    const calR = await ghlApi(g.pit, `/calendars/?locationId=${g.ghlLoc}`);
    if (!calR.ok) {
      W(`  ${g.slug}: GHL calendars ${calR.status} — ${JSON.stringify(calR.json).slice(0,150)}`);
      continue;
    }
    const calendars = calR.json.calendars || calR.json.data || [];
    if (!calendars.length) { W(`  ${g.slug}: no calendars found`); continue; }

    const startTime = SINCE_MS;
    const endTime = NOW + 7 * 24 * 60 * 60 * 1000; // upcoming week too

    let totalNew = 0;
    const newEvents = [];
    for (const cal of calendars) {
      const calId = cal.id;
      const evR = await ghlApi(g.pit, `/calendars/events?calendarId=${calId}&startTime=${startTime}&endTime=${endTime}`);
      if (!evR.ok) continue;
      const events = evR.json.events || evR.json.appointments || evR.json.data || [];
      for (const e of events) {
        const created = e.createdAt || e.dateAdded || 0;
        const ms = typeof created === 'string' ? new Date(created).getTime() : created;
        if (ms >= SINCE_MS) {
          newEvents.push({ ...e, _calName: cal.name });
          totalNew++;
        }
      }
    }

    W(`  ${g.slug}: ${totalNew} new booking(s) in last ${HOURS}h across ${calendars.length} calendars`);
    for (const e of newEvents.slice(0, 5)) {
      const title = e.title || e.name || '?';
      const contact = e.contact?.name || e.contactName || '?';
      const start = e.startTime || e.start || '?';
      W(`    "${title}" | ${contact} | start=${start} | cal=${e._calName}`);
    }
  }
  W('');

  // ── SOURCE FILTER HEALTH ─────────────────────────────────────────────────
  W('── Source Filter Health ──');
  for (const g of BATCH1) {
    const r = await cbApi(`/agency/source?offset=0&limit=100`);
    if (!r.ok) { W(`  ${g.slug}: CB source list failed`); continue; }
    const sources = Array.isArray(r.json) ? r.json : (r.json.results || r.json.data || []);
    const src = sources.find(s => (s.sourceId || s.id) === g.srcId);
    if (!src) { W(`  ${g.slug}: source not found in list`); continue; }

    // Check via bot GET for filter state
    break; // only need to call this once per batch
  }

  // Get bot filter state for each gym
  const BOTS = {
    '10p-miami':           'bot_ZC2MREMJ87S77LH1',
    'academyjjscottsdale': 'bot_01MYV7I9IWMHYPCF',
    'academyedenprairie':  'bot_20P7NZ6ZMRY37GC4',
    'ballantynemartialarts':'bot_SYX87T5XAAKPCUDE',
    'breathejiujitsu':     'bot_3TG2JEKB8YHKZ711',
    'artistrybjj':         'bot_WPGXC5YR7VT13RVY',
    'gritjiujitsu':        'bot_7H147LLL7WMR506K',
    'championmartialarts': 'bot_GEGYNE5WQNOYH7UB',
    'centerlinejiujitsu':  'bot_F2IMVLSJ61TQ4R8X',
    'paragonsimi':         'bot_3CLH0PGK4HNLX144',
    'ombjj':               'bot_WKX9WYAUBNGC2RLO',
    'sugoi':               'bot_JNTG80QQ0CMJP35W',
    'raylongo':            'bot_78NZSL4KC3Q4HPDI',
    'universalmma':        'bot_4EH6K792OEHGCAIB',
    'montgomery':          'bot_96PAT3JCI2YC32KY',
    'signature':           'bot_QDSOGLYJA9B4HIO0',
    'roberts':             'bot_YUMT096UZ49BH7AV',
    'simpleman':           'bot_97Q687NTPLF6GHC7',
    'killerb':             'bot_FMMFAFOFG7IG89XI',
  };

  for (const g of BATCH1) {
    const r = await cbApi(`/bot/${BOTS[g.slug]}`);
    if (!r.ok) { W(`  ${g.slug}: GET /bot failed ${r.status}`); continue; }
    const srcs = r.json.sources || [];
    const src = srcs.find(s => s.id === g.srcId);
    if (!src) {
      W(`  ${g.slug}: NOT attached to ${g.srcId}`);
      continue;
    }
    const tg = src.tags || [];
    const req = tg.filter(t => t.approveDeny === true).map(t => t.name);
    const exc = tg.filter(t => t.approveDeny === false).map(t => t.name);
    const ch = src.channelList || [];
    const ok = req.includes('concierge') && exc.includes('booked') && !ch.some(c => /email|custom/i.test(c));
    W(`  ${g.slug}: ${ok ? 'FILTER OK' : 'FILTER PROBLEM'} | req=${JSON.stringify(req)} | exc=[${exc.join(',')}] | ch=${JSON.stringify(ch)}`);
  }

  W(`\nLog: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
