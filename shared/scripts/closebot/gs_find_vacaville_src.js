import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_vacaville_src.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const s = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(s); fs.appendFileSync(logFile, s + '\n'); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(ep) {
  const res = await fetch(`${BASE}${ep}`, { headers: H });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; }
  catch { return { status: res.status, json: { raw: text.slice(0, 300) } }; }
}

async function main() {
  const all = [];
  for (const page of [0, 1, 2, 3]) {
    const r = await req(`/agency/source?page=${page}`);
    const results = r.json?.results || [];
    log(`page=${page} → ${results.length} results`);
    if (results.length === 0) break;
    all.push(...results);
  }

  const seen = new Set();
  const uniq = all.filter(s => { if (seen.has(s.sourceId)) return false; seen.add(s.sourceId); return true; });

  log(`\nTotal unique: ${uniq.length}`);
  uniq.forEach((s, i) => {
    log(`  ${String(i+1).padStart(2)}. ${s.sourceId}  ${s.category.padEnd(5)}  ${(s.key||'').padEnd(22)}  "${s.name}"`);
  });

  const vacav = uniq.filter(s => /vacaville|grappling academy/i.test(s.name));
  log(`\nVacaville matches: ${vacav.length}`);
  vacav.forEach(v => {
    // Log everything except accessToken (sensitive)
    const safe = { ...v, accessToken: v.accessToken ? `[JWT present, len=${v.accessToken.length}]` : null };
    logJson('VACAVILLE SOURCE', safe);
  });

  fs.writeFileSync(path.join(logDir, 'agency_sources_full.json'), JSON.stringify(uniq, null, 2));
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
