/**
 * gs_discover_16_gyms.js
 * Cross-references 16 new GS gym sub-accounts against:
 *   1. CloseBot agency sources  → sourceId + location ID (from JWT in accessToken)
 *   2. GHL via each PIT        → locationId (for gyms NOT in CloseBot)
 *
 * Outputs clients/ground-standard/ghl/pit-inventory.md
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_discover_16_gyms.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_discover_16_gyms.log');
fs.writeFileSync(logFile, '');

function log(m) {
  const l = `[${new Date().toISOString()}] ${m}`;
  console.log(l);
  fs.appendFileSync(logFile, l + '\n');
}

// The 16 gym sub-accounts (slug → PIT → fuzzy keywords for CB name matching)
const GYMS = [
  { slug: '10p-miami',              pit: 'pit-c6effbe1-d616-494c-8285-5b10dc24fbeb', keywords: ['10th planet', '10p', 'miami'] },
  { slug: 'academyedenprairie',     pit: 'pit-2785933c-30b5-4de5-a7b2-cc94e9086681', keywords: ['academy', 'eden prairie', 'eden'] },
  { slug: 'academyjjscottsdale',    pit: 'pit-aad9d675-cc50-4933-9e8f-4aa7d684fc46', keywords: ['academy', 'scottsdale'] },
  { slug: 'allinjujitsu',           pit: 'pit-51eb18df-f25f-49fa-a6c8-265246187c43', keywords: ['all in', 'allin'] },
  { slug: 'artistrybjj',            pit: 'pit-7cb1e1f3-5357-4b0a-ba51-aa28b0e3e6ad', keywords: ['artistry'] },
  { slug: 'ballantynemartialarts',  pit: 'pit-530f9249-c4c2-44e9-95da-a06f2b7d4fff', keywords: ['ballantyne'] },
  { slug: 'bodegajj',               pit: 'pit-3ec407a4-50c0-4bca-ac31-68044abaee6c', keywords: ['bodega'] },
  { slug: 'breathejiujitsu',        pit: 'pit-e3f69fd4-78d8-42e8-ab24-0e7e8e521c8e', keywords: ['breathe'] },
  { slug: 'centerlinejiujitsu',     pit: 'pit-7a27be78-90a6-4fcc-a590-82e8c2d818f7', keywords: ['centerline'] },
  { slug: 'championmartialarts',    pit: 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185', keywords: ['champion martial', 'champion'] },
  { slug: 'graciefarmingtonvalley', pit: 'pit-3807906c-e578-4a83-bd57-ac93ab568a55', keywords: ['gracie farmington', 'farmington'] },
  { slug: 'graciejj-sanjose',       pit: 'pit-de84de4b-9136-45b3-9a3a-1ad43706968f', keywords: ['gracie', 'san jose'] },
  { slug: 'gritjiujitsu',           pit: 'pit-39c05237-596c-43eb-84de-26a521df6e58', keywords: ['grit'] },
  { slug: 'hammersp',               pit: 'pit-a4ad12df-519f-4b6b-a340-98d62e29e5c1', keywords: ['hammer'] },
  { slug: 'hamptonsjj',             pit: 'pit-9160ad3d-2b0f-4d5b-8e15-0c26fc872223', keywords: ['hampton', 'hamptons', 'west hampton', 'south hampton'] },
  { slug: 'invertedgear',           pit: 'pit-5baba980-c1b1-4707-b433-a6b5bfd26164', keywords: ['inverted gear', 'inverted'] },
];

const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { log('ERROR: CB_GS_API_KEY missing'); process.exit(1); }

// ── JWT decode (no signature verify needed — just reading claims) ─────────────
function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch { return null; }
}

// ── CloseBot helpers ─────────────────────────────────────────────────────────
async function cbGet(ep) {
  const res = await fetch(`https://api.closebot.com${ep}`, {
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, json: { raw: text.slice(0, 300) } }; }
}

async function fetchAllCbSources() {
  const all = [];
  for (let offset = 0; ; offset += 20) {
    const r = await cbGet(`/agency/source?offset=${offset}`);
    const batch = r.json?.results || [];
    const total = r.json?.total ?? '?';
    log(`CB page offset=${offset}: got ${batch.length}, total=${total}`);
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 20) break;
  }

  // dedup by sourceId
  const seen = new Set();
  return all.filter(s => { if (seen.has(s.sourceId)) return false; seen.add(s.sourceId); return true; });
}

// Extract GHL location ID from a CloseBot source.
// CB stores the GHL OAuth accessToken as a JWT; `authClassId` = GHL location ID.
function extractLocationIdFromSource(source) {
  if (!source?.accessToken) return '';
  const payload = decodeJwtPayload(source.accessToken);
  // authClass === 'Location' means authClassId is the location ID
  if (payload?.authClass === 'Location' && payload?.authClassId) return payload.authClassId;
  // older token shape: may have locationId directly
  return payload?.locationId || payload?.location_id || '';
}

// ── GHL helpers ──────────────────────────────────────────────────────────────
const GHL_BASE = 'https://services.leadconnectorhq.com';

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

async function ghlGetLocationId(pit) {
  // 1. Calendars — almost always present; each has locationId
  const cal = await ghlGet(pit, '/calendars/');
  const calLoc = cal.j?.calendars?.[0]?.locationId
                || cal.j?.calendars?.[0]?.location_id;
  if (calLoc) return calLoc;

  // 2. Contacts — populated if gym has leads
  const con = await ghlGet(pit, '/contacts/?limit=1');
  const conLoc = con.j?.contacts?.[0]?.locationId;
  if (conLoc) return conLoc;

  // 3. Custom fields — populated if GHL has been configured
  const cf = await ghlGet(pit, '/custom-fields');
  const cfLoc = (cf.j?.customFields || cf.j?.fields)?.[0]?.locationId;
  if (cfLoc) return cfLoc;

  // 4. Users search — always has at least the admin user
  const us = await ghlGet(pit, '/users/search?limit=1');
  const usLoc = us.j?.users?.[0]?.locationIds?.[0]
             || us.j?.users?.[0]?.locationId;
  if (usLoc) return usLoc;

  // 5. If every probe 401'd, report auth failure
  if ([cal.status, con.status, cf.status].every(s => s === 401)) return 'AUTH_FAIL';

  return 'NOT_FOUND';
}

// ── Fuzzy match ──────────────────────────────────────────────────────────────
function matchSource(sourceName, keywords) {
  if (!sourceName) return false;
  const name = sourceName.toLowerCase();
  return keywords.some(kw => name.includes(kw.toLowerCase()));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log('=== GS 16-Gym Discovery ===');
  const startTime = Date.now();

  // Step 1: Fetch all CloseBot sources
  log('\n[1/2] Fetching CloseBot sources…');
  const cbSources = await fetchAllCbSources();
  log(`Unique sources: ${cbSources.length}`);
  cbSources.forEach(s => log(`  ${(s.sourceId||'').padEnd(26)} name="${s.name || '(null)'}"`));

  // Step 2: Match each gym against CB + probe GHL
  log('\n[2/2] Matching + GHL probe…');
  const results = [];

  for (const gym of GYMS) {
    const cbMatch = cbSources.find(s => matchSource(s.name, gym.keywords));
    const sourceId = cbMatch?.sourceId || '';
    const cbName   = cbMatch?.name || '';

    // Extract location ID from CB source JWT (fastest — no extra API call)
    const cbLocId  = cbMatch ? extractLocationIdFromSource(cbMatch) : '';

    // GHL probe — always run to confirm PIT works; use cbLocId as primary
    log(`  probing ${gym.slug}…`);
    const ghlLocId = await ghlGetLocationId(gym.pit);

    const locationId = cbLocId || ghlLocId;

    results.push({ slug: gym.slug, pit: gym.pit, locationId, sourceId, cbSourceName: cbName, inCb: !!cbMatch, cbLocId, ghlLocId });
    log(`    CB=${cbMatch ? `✅ ${sourceId}` : '❌ miss'} | cbLoc=${cbLocId||'—'} | ghlLoc=${ghlLocId} | final=${locationId}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  log('\n\n=== SUMMARY ===');
  const inCb  = results.filter(r => r.inCb);
  const notCb = results.filter(r => !r.inCb);
  log(`In CloseBot: ${inCb.length}/16`);
  log(`Not in CB:   ${notCb.length}/16`);

  if (inCb.length) {
    log('\nIn CloseBot:');
    inCb.forEach(r => log(`  ${r.slug.padEnd(28)} src=${r.sourceId}  loc=${r.locationId}  ("${r.cbSourceName}")`));
  }
  if (notCb.length) {
    log('\nNot in CloseBot:');
    notCb.forEach(r => log(`  ${r.slug.padEnd(28)} loc=${r.locationId}`));
  }

  const noLoc = results.filter(r => !r.locationId || r.locationId === 'NOT_FOUND' || r.locationId === 'AUTH_FAIL');
  if (noLoc.length) {
    log('\nCould not resolve location ID:');
    noLoc.forEach(r => log(`  ${r.slug} (cbLoc=${r.cbLocId||'—'}, ghlLoc=${r.ghlLocId})`));
  }

  // ── Markdown table ────────────────────────────────────────────────────────
  const lines = [
    '# GS 16-Gym PIT Inventory',
    '',
    `Last updated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '| Slug | PIT | Location ID | Source ID | CB Source Name | In CB | KB Status | Bot Status |',
    '|------|-----|-------------|-----------|----------------|-------|-----------|------------|',
    ...results.map(r =>
      `| ${r.slug} | ${r.pit} | ${r.locationId || '—'} | ${r.sourceId || '—'} | ${r.cbSourceName || '—'} | ${r.inCb ? 'yes' : 'no'} | pending | pending |`
    ),
    '',
  ];

  const mdPath = path.join(__dirname, '../../../clients/ground-standard/ghl/pit-inventory.md');
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, lines.join('\n'));
  log(`\npit-inventory.md → clients/ground-standard/ghl/pit-inventory.md`);

  // Save raw JSON for debugging
  const jsonPath = path.join(logDir, 'gs_discover_16_gyms.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  log(`Raw JSON → shared/logs/gs_discover_16_gyms.json`);

  log(`\nDone in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
