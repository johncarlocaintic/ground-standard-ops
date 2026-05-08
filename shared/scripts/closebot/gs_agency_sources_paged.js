import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_agency_sources_paged.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(ep) {
  const res = await fetch(`${BASE}${ep}`, { headers: H });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; }
  catch { return { status: res.status, json: { raw: text.slice(0, 300) } }; }
}

async function main() {
  log('=== Paginate /agency/source ===');

  // Try variants of pagination params
  const paramVariants = [
    'offset=0', 'offset=20', 'offset=40',
    'page=1', 'page=2', 'page=3',
    'skip=0', 'skip=20',
  ];

  for (const p of paramVariants) {
    const r = await req(`/agency/source?${p}`);
    const n = r.json?.results?.length;
    const first = r.json?.results?.[0]?.name;
    log(`  ?${p.padEnd(14)} → ${r.status} | returned=${n} | first="${first}"`);
  }

  // Fetch all pages via offset (seems most common)
  log('\nFull pagination via offset=0,20,40:');
  const all = [];
  for (const off of [0, 20, 40, 60]) {
    const r = await req(`/agency/source?offset=${off}`);
    const results = r.json?.results || [];
    if (results.length === 0) break;
    all.push(...results);
  }

  // Dedup by sourceId
  const seen = new Set();
  const dedup = all.filter(s => { if (seen.has(s.sourceId)) return false; seen.add(s.sourceId); return true; });

  log(`\nTotal unique sources retrieved: ${dedup.length}`);
  dedup.forEach((s, i) => {
    log(`  ${String(i + 1).padStart(2)}. src=${s.sourceId.padEnd(22)} key=${(s.key||'').padEnd(22)} cat=${(s.category||'').padEnd(5)} name="${s.name}"`);
  });

  const vacav = dedup.filter(s => /vacaville|grappling academy/i.test(s.name));
  log(`\nVacaville/Grappling matches: ${vacav.length}`);
  vacav.forEach(v => {
    logJson('MATCH', v);
    log(`   → id=${v.sourceId}  key=${v.key}  name="${v.name}"`);
  });

  // Save full dedup for reuse
  fs.writeFileSync(path.join(logDir, 'agency_sources_full.json'), JSON.stringify(dedup, null, 2));
  log(`\nSaved full dedup to shared/logs/agency_sources_full.json`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
