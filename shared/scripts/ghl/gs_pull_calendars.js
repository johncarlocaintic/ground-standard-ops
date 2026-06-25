/**
 * gs_pull_calendars.js
 * Pulls all GHL calendars for each of the 16 GS gym sub-accounts using their PITs.
 * Outputs clients/ground-standard/ghl/calendar-inventory.md
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/ghl/gs_pull_calendars.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_pull_calendars.log');
fs.writeFileSync(logFile, '');

function log(m) {
  const l = `[${new Date().toISOString()}] ${m}`;
  console.log(l);
  fs.appendFileSync(logFile, l + '\n');
}

const GHL_BASE = 'https://services.leadconnectorhq.com';

const GYMS = [
  { slug: '10p-miami',              pit: 'pit-c6effbe1-d616-494c-8285-5b10dc24fbeb', locationId: '98Z8PDW1sSiYSGSzyqGl' },
  { slug: 'academyedenprairie',     pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', locationId: 'YzynD9APfmv7ed8RIk3K' },
  { slug: 'academyjjscottsdale',    pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', locationId: '8XPm2yy1DqYc7fDpSj4O' },
  { slug: 'allinjujitsu',           pit: 'pit-51eb18df-f25f-49fa-a6c8-265246187c43', locationId: '7jz3trWsyu4R0zBlnCRI' },
  { slug: 'artistrybjj',            pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad', locationId: '3SIWDTRfqtCBE9gSr1bY' },
  { slug: 'ballantynemartialarts',  pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff', locationId: '2y7XT17KEqjIpnTvPvJB' },
  { slug: 'bodegajj',               pit: 'pit-3ec407a4-50c0-4bca-ac31-68044abaee6c', locationId: '0svdYcor6p7eXPqx7hVA' },
  { slug: 'breathejiujitsu',        pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e', locationId: 'USMxTUWMwAIetj1ka5u3' },
  { slug: 'centerlinejiujitsu',     pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7', locationId: 'UWo67lKtFJYZCJ8LkD3O' },
  { slug: 'championmartialarts',    pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', locationId: 'ffkMyOy6QOwqrvn4OvoK' },
  { slug: 'graciefarmingtonvalley', pit: 'pit-3807906c-e578-4a83-bd57-ac93ab568a55', locationId: '5yxX1tJAbq5vttIUwGzJ' },
  { slug: 'graciejj-sanjose',       pit: 'pit-de84de4b-9136-45b3-9a3a-1ad43706968f', locationId: 'wy55JSUKKC3h6TPHfHOo' },
  { slug: 'gritjiujitsu',           pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58', locationId: 'JPFHqtf4KnkqVtiUU9Bk' },
  { slug: 'hammersp',               pit: 'pit-a4ad12df-519f-4b6b-a340-98d62e29e5c1', locationId: 'IB5NHYNn4F4ANpNt5NvX' },
  { slug: 'hamptonsjj',             pit: 'pit-9160ad3d-2b0f-4d5b-8e15-0c26fc872223', locationId: '7rOciO3DHa7ZfaXTZ0CC' },
  { slug: 'invertedgear',           pit: 'pit-5baba980-c1b1-4707-b433-a6b5bfd26164', locationId: 'ajf9RVwQJUGwU900yGEq' },
];

async function ghlGet(pit, ep) {
  try {
    const res = await fetch(`${GHL_BASE}${ep}`, {
      headers: { Authorization: `Bearer ${pit}`, Version: '2021-07-28' },
    });
    const text = await res.text();
    let j; try { j = JSON.parse(text); } catch { return { status: res.status, j: null }; }
    return { status: res.status, j };
  } catch { return { status: 0, j: null }; }
}

async function main() {
  log('=== GS Calendar Pull ===');
  const inventory = [];

  for (const gym of GYMS) {
    log(`Pulling ${gym.slug}...`);
    const r = await ghlGet(gym.pit, `/calendars/?locationId=${gym.locationId}`);
    if (r.status !== 200) {
      log(`  ERROR ${r.status} for ${gym.slug}`);
      inventory.push({ slug: gym.slug, locationId: gym.locationId, status: r.status, calendars: [] });
      continue;
    }
    const cals = r.j?.calendars || [];
    log(`  ${cals.length} calendar(s)`);
    cals.forEach(c => log(`    [${c.id}] "${c.name}" (${c.calendarType || 'unknown'})`));
    inventory.push({ slug: gym.slug, locationId: gym.locationId, status: 200, calendars: cals });
  }

  // Build markdown
  const lines = [
    '# GS Gym Calendar Inventory',
    '',
    `Last updated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '> Source: GHL API `/calendars/?locationId={id}` via each gym PIT.',
    '> masondixon excluded — location ID pending from Bobby.',
    '',
  ];

  for (const gym of inventory) {
    lines.push(`## ${gym.slug}`);
    lines.push('');
    lines.push(`Location ID: \`${gym.locationId}\``);
    lines.push('');
    if (gym.status !== 200) {
      lines.push(`_Error: HTTP ${gym.status}_`);
    } else if (gym.calendars.length === 0) {
      lines.push('_No calendars found._');
    } else {
      lines.push('| Calendar Name | Calendar ID | Type |');
      lines.push('|---------------|-------------|------|');
      gym.calendars.forEach(c => {
        lines.push(`| ${c.name} | \`${c.id}\` | ${c.calendarType || '—'} |`);
      });
    }
    lines.push('');
  }

  const mdPath = path.join(__dirname, '../../../clients/ground-standard/ghl/calendar-inventory.md');
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, lines.join('\n'));
  log(`\nSaved → clients/ground-standard/ghl/calendar-inventory.md`);

  // Raw JSON for debugging
  const jsonPath = path.join(logDir, 'gs_pull_calendars.json');
  fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2));
  log(`Raw JSON → shared/logs/gs_pull_calendars.json`);

  log('Done.');
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
