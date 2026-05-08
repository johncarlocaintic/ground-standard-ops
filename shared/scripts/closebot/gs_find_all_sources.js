import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_find_all_sources.log');
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

async function main() {
  log('=== Hunt: agency-level sources + Vacaville source ID ===');

  // Part 1: catalog all distinct sources attached across ALL bots (agency surface)
  log('\n[1] Cataloging sources across all bots');
  const bots = await req('GET', '/bot');
  const list = Array.isArray(bots.json) ? bots.json : [];
  const uniqueSources = new Map();
  for (const b of list) {
    if (Array.isArray(b.sources)) {
      for (const s of b.sources) {
        if (!uniqueSources.has(s.id)) {
          uniqueSources.set(s.id, { ...s, usedOn: [b.name] });
        } else {
          uniqueSources.get(s.id).usedOn.push(b.name);
        }
      }
    }
  }
  log(`  Unique sources seen across bots: ${uniqueSources.size}`);
  for (const [id, s] of uniqueSources) {
    log(`    ${id}  cat=${s.category.padEnd(5)} key=${s.key.padEnd(22)} name="${s.name}"  used on ${s.usedOn.length} bot(s)`);
  }

  // Part 2: Search all source names for "Vacaville" / "Grappling"
  log('\n[2] Any sources matching Vacaville/Grappling?');
  const matches = [...uniqueSources.values()].filter(s =>
    /vacaville|grappling/i.test(s.name)
  );
  if (matches.length === 0) log('  NO source named Vacaville/Grappling found on any attached bot.');
  else matches.forEach(m => logJson('MATCH', m));

  // Part 3: Probe agency-level endpoints we haven't tried yet
  log('\n[3] Agency-level source endpoint probes');
  const probes = [
    '/me',
    '/me/sources',
    '/me/source',
    '/agency',
    '/agency/sources',
    '/agency/source',
    '/agencies',
    '/api/sources',
    '/v2/source',
    '/v2/sources',
    '/admin/sources',
    '/workspace',
    '/workspace/sources',
    '/account',
    '/account/sources',
    '/user',
    '/user/sources',
    '/bot/source/list',
    '/bot/sources/list',
    '/bot/availableSources',
    '/bot/available-sources',
  ];
  for (const p of probes) {
    const r = await req('GET', p);
    log(`  ${p.padEnd(30)} → ${r.status}`);
    if (r.ok && r.json) {
      const preview = JSON.stringify(r.json).slice(0, 300);
      log(`    preview: ${preview}`);
    }
  }

  // Part 4: Try GET /bot/{id}/source with no id (sometimes APIs return available sources for the bot context)
  const REBUILD_BOT = 'bot_MHAFTF25QVPIQLUI';
  log(`\n[4] GET /bot/${REBUILD_BOT}/source (might list available)`);
  const r4 = await req('GET', `/bot/${REBUILD_BOT}/source`);
  log(`  → ${r4.status}`);
  if (r4.ok) logJson('  response', r4.json);

  // Part 5: Search by likely source_id patterns — maybe Vacaville has src_ already
  //         Also try GET /source/{id} for the src IDs we've seen + probe if individual source has more data
  log('\n[5] GET /source/{id} for known source IDs');
  for (const [id] of uniqueSources) {
    const r = await req('GET', `/source/${id}`);
    log(`  GET /source/${id} → ${r.status}`);
    if (r.ok) logJson(`  ${id}`, r.json);
    if (r.status !== 404) break; // only need to learn the endpoint once
  }
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
