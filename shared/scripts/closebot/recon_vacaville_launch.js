/**
 * Recon for Vacaville launch:
 *   1. List all bots in Bobby's CloseBot (name + id + sources + version)
 *   2. Pull full detail on bot_J56AWZ5TYQI9HKJS (the launch source-of-truth)
 *   3. Pull tag list from Vacaville prod source (src_GDKORXSW4Q8RQUQ8)
 *
 * Read-only. Writes one log file we can scan for the next steps.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(__dirname, '../../../shared/logs/recon_vacaville_launch.log');
fs.mkdirSync(path.dirname(LOG), { recursive: true });
fs.writeFileSync(LOG, '');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
if (!KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const LAUNCH_BOT_ID = 'bot_J56AWZ5TYQI9HKJS';
const VACAVILLE_SRC = 'src_GDKORXSW4Q8RQUQ8';

async function req(method, ep) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function main() {
  log('=== STEP 1: List ALL bots ===');
  const list = await req('GET', '/bot');
  log(`  GET /bot → ${list.status}`);
  const bots = list.json.bots || list.json.data || (Array.isArray(list.json) ? list.json : []);
  log(`  total bots: ${bots.length}`);
  log('');

  // Categorize
  const vacaville = [];
  const other    = [];
  for (const b of bots) {
    const n = (b.name || '').toLowerCase();
    if (/vacaville|vga|vaca/.test(n)) vacaville.push(b);
    else other.push(b);
  }
  log(`  Vacaville-named: ${vacaville.length}`);
  log(`  Other:           ${other.length}`);
  log('');

  log('--- Vacaville-named bots ---');
  for (const b of vacaville) {
    log(`  ${b.id} | "${b.name}"`);
  }
  log('');
  log('--- Other bots ---');
  for (const b of other) {
    log(`  ${b.id} | "${b.name}"`);
  }
  log('');

  // STEP 2: Pull launch-source-of-truth detail
  log(`=== STEP 2: Detail for launch bot ${LAUNCH_BOT_ID} ===`);
  const detail = await req('GET', `/bot/${LAUNCH_BOT_ID}`);
  log(`  GET /bot/${LAUNCH_BOT_ID} → ${detail.status}`);
  if (detail.ok) {
    const b = detail.json;
    log(`  name:    ${b.name}`);
    log(`  id:      ${b.id}`);
    log(`  version: ${b.version || '?'}`);
    log(`  sources: ${(b.sources || []).map(s => `${s.name}(${s.id})`).join(', ') || 'none'}`);
    log(`  persona: ${b.persona?.name || b.personaId || '?'}`);
    // dump the entire detail to a side file for later use
    const dumpPath = path.join(__dirname, '../../../shared/logs/launch_bot_detail.json');
    fs.writeFileSync(dumpPath, JSON.stringify(b, null, 2));
    log(`  full detail dumped → shared/logs/launch_bot_detail.json (${JSON.stringify(b).length} bytes)`);
  } else {
    log(`  ERROR: ${JSON.stringify(detail.json).slice(0, 300)}`);
  }
  log('');

  // STEP 3: Vacaville source tag list
  log(`=== STEP 3: Tag list for ${VACAVILLE_SRC} (Vacaville prod source) ===`);
  const tagsRes = await req('GET', `/agency/source/${VACAVILLE_SRC}/tags`);
  log(`  GET /agency/source/${VACAVILLE_SRC}/tags → ${tagsRes.status}`);
  if (tagsRes.ok) {
    const tags = tagsRes.json.tags || tagsRes.json.data || (Array.isArray(tagsRes.json) ? tagsRes.json : []);
    log(`  tag count: ${tags.length}`);
    // Filter for the tags we need: concierge + booked, member, alumni, spam, staff, service, showed + ai off
    const needed = ['concierge', 'booked', 'member', 'alumni', 'spam', 'staff', 'service', 'showed', 'ai off'];
    log('');
    log('  Tags needed for filter (matching from source):');
    for (const need of needed) {
      const matches = tags.filter(t => {
        const name = (t.name || t.tag || '').toLowerCase();
        return name === need || name.startsWith(need + ' ') || name.includes(need);
      });
      if (matches.length === 0) {
        log(`    ${need.padEnd(12)} → ❌ NO MATCH FOUND`);
      } else if (matches.length === 1) {
        const m = matches[0];
        log(`    ${need.padEnd(12)} → ✅ "${m.name || m.tag}" id=${m.id || '(no id)'}`);
      } else {
        log(`    ${need.padEnd(12)} → ⚠️  ${matches.length} matches: ${matches.map(m => `"${m.name || m.tag}"`).join(', ')}`);
      }
    }
    // Dump full tag list
    const tagsPath = path.join(__dirname, '../../../shared/logs/vacaville_source_tags.json');
    fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2));
    log('');
    log(`  full tags dumped → shared/logs/vacaville_source_tags.json`);
  } else {
    log(`  ERROR: ${JSON.stringify(tagsRes.json).slice(0, 400)}`);
  }
  log('');

  log('=== DONE ===');
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
