import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_swap_source.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const s = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(s); fs.appendFileSync(logFile, s + '\n'); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI'; // Vacaville v2 REBUILD TEST T07:13
const GS_ADS_SRC = 'src_4R4DUIQTMMX2NFPU';
const VACAVILLE_SRC = 'src_GDKORXSW4Q8RQUQ8';

async function currentSources(label) {
  const r = await req('GET', `/bot/${BOT_ID}`);
  const srcs = r.json?.sources ?? [];
  log(`  [${label}] sources: [${srcs.map(s => `${s.name}(${s.id})`).join(', ')}]`);
  return srcs;
}

async function main() {
  log(`=== Swap source on ${BOT_ID} ===`);
  log(`  detach ${GS_ADS_SRC} (GS Ads)  →  attach ${VACAVILLE_SRC} (Vacaville Grappling Academy)`);

  await currentSources('pre');

  // STEP 1: Detach GS Ads — try DELETE /bot/{id}/source/{src}
  log(`\n[1] DELETE /bot/${BOT_ID}/source/${GS_ADS_SRC}`);
  let r = await req('DELETE', `/bot/${BOT_ID}/source/${GS_ADS_SRC}`);
  log(`  → ${r.status}`);
  if (r.status >= 400) logJson('  resp', r.json);

  let srcs = await currentSources('post-delete');
  if (srcs.find(s => s.id === GS_ADS_SRC)) {
    log('  GS Ads still attached — trying alternative detach methods');

    const alt = [
      { m: 'DELETE', ep: `/bot/${BOT_ID}/sources/${GS_ADS_SRC}` },
      { m: 'DELETE', ep: `/bot/${BOT_ID}/source`, body: { sourceId: GS_ADS_SRC } },
      { m: 'POST',   ep: `/bot/${BOT_ID}/source/${GS_ADS_SRC}/detach`, body: {} },
      { m: 'POST',   ep: `/bot/${BOT_ID}/detachSource`, body: { sourceId: GS_ADS_SRC } },
    ];
    for (const a of alt) {
      log(`  trying ${a.m} ${a.ep}`);
      const rr = await req(a.m, a.ep, a.body);
      log(`    → ${rr.status}`);
      if (rr.status >= 400 && rr.status !== 404) logJson('    resp', rr.json);
      srcs = await currentSources('  verify');
      if (!srcs.find(s => s.id === GS_ADS_SRC)) { log('  ✅ detached'); break; }
    }
  } else {
    log('  ✅ GS Ads detached');
  }

  // STEP 2: Attach Vacaville using proven endpoint
  log(`\n[2] POST /bot/${BOT_ID}/source/${VACAVILLE_SRC}  body={tags:[], channels:[], input:{}}`);
  r = await req('POST', `/bot/${BOT_ID}/source/${VACAVILLE_SRC}`, { tags: [], channels: [], input: {} });
  log(`  → ${r.status}`);
  if (r.status >= 400) logJson('  error', r.json);
  const finalSrcs = await currentSources('post-attach');
  const attached = finalSrcs.find(s => s.id === VACAVILLE_SRC);
  if (attached) log(`  ✅ Vacaville attached`);
  else log(`  ❌ Vacaville NOT attached`);

  // STEP 3: Pull node descriptors and look for Vacaville custom fields / tags visibility
  log(`\n[3] GET /bot/node-descriptors — check for Vacaville schema surfacing`);
  const desc = await req('GET', '/bot/node-descriptors');
  log(`  → ${desc.status}`);
  if (desc.ok) {
    const arr = Array.isArray(desc.json) ? desc.json : (desc.json?.data || []);
    log(`  ${arr.length} node descriptor(s) returned`);
    // Dump to its own file for inspection
    fs.writeFileSync(path.join(logDir, 'node_descriptors.json'), JSON.stringify(desc.json, null, 2));
    log(`  saved → shared/logs/node_descriptors.json`);
  }

  // STEP 4: Look for per-bot source-aware endpoints (custom fields for this bot/source)
  log(`\n[4] Probing bot-source-aware endpoints`);
  const probes = [
    `/bot/${BOT_ID}/customFields`,
    `/bot/${BOT_ID}/tags`,
    `/bot/${BOT_ID}/calendars`,
    `/bot/${BOT_ID}/source/${VACAVILLE_SRC}/customFields`,
    `/bot/${BOT_ID}/source/${VACAVILLE_SRC}/tags`,
    `/source/${VACAVILLE_SRC}/customFields`,
    `/source/${VACAVILLE_SRC}/tags`,
    `/agency/source/${VACAVILLE_SRC}/customFields`,
    `/agency/source/${VACAVILLE_SRC}/tags`,
    `/agency/source/${VACAVILLE_SRC}`,
  ];
  for (const p of probes) {
    const rr = await req('GET', p);
    log(`  ${p.padEnd(68)} → ${rr.status}`);
    if (rr.ok) {
      logJson(`GET ${p}`, rr.json);
      const n = Array.isArray(rr.json) ? rr.json.length : (rr.json?.customFields?.length ?? rr.json?.tags?.length ?? rr.json?.total ?? '?');
      log(`    → ${n} items`);
    }
  }

  log('\n=== done ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
