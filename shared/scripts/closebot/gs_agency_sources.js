import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_agency_sources.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const res = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  log('=== Fetch FULL agency source list ===');
  const r = await req('GET', '/agency/source?limit=200');
  log(`status ${r.status}, total reported: ${r.json?.total}`);
  logJson('FULL agency sources', r.json);

  const results = r.json?.results || [];
  log(`\nReturned ${results.length} sources. Listing names + matches:`);
  results.forEach((s, i) => {
    log(`  ${String(i + 1).padStart(2)}. src=${s.sourceId.padEnd(22)} key=${(s.key||'').padEnd(22)} cat=${(s.category||'').padEnd(5)} name="${s.name}"`);
  });

  // Match Vacaville
  const vacav = results.filter(s => /vacaville|grappling academy/i.test(s.name));
  log(`\nVacaville/Grappling matches: ${vacav.length}`);
  vacav.forEach(v => logJson(`MATCH: ${v.name}`, v));

  if (vacav.length > 0) {
    log('\n✅ Vacaville source found at agency level');
    vacav.forEach(v => log(`   → id=${v.sourceId}  key=${v.key}  name="${v.name}"`));
  } else {
    log('\n❌ No Vacaville source at agency level. The sub-account has NOT been connected to CloseBot yet.');
  }
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
