/**
 * READ-ONLY. Two things, no writes:
 *  1. Fully paginate /library/files and report every file attached to the
 *     Vacaville prod source (fixes the no-pagination blind spot).
 *  2. Find lead "Ivan D. Dios" on the Vacaville prod bot and dump the full
 *     message transcript so we see exactly what the bot said about pricing.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_vacaville_ivan_diag.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'vacaville_ivan_diag.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BOT = 'bot_F0VNPTPCIW88YI3J';       // Vacaville PROD v4.6
const PROD_SRC = 'src_GDKORXSW4Q8RQUQ8';
const NAME_RX = /ivan|de ?dios|d\.? ?dios/i;

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

(async () => {
  // ---- 1. PAGINATED KB check ----
  W('=== KB files on Vacaville prod source (full pagination) ===');
  let page = 1, total = 0, onProd = [];
  while (page <= 50) {
    const r = await api(`/library/files?page=${page}&pageSize=100`);
    if (!r.ok) { W(`  page ${page} failed ${r.status}`); break; }
    const files = r.json.files || r.json.data || r.json.results || (Array.isArray(r.json) ? r.json : []);
    if (!Array.isArray(files) || files.length === 0) break;
    total += files.length;
    for (const f of files) {
      const d = await api(`/library/files/${f.id}`);
      if (!d.ok) continue;
      const sids = (d.json.sources || []).map(s => s.id || s.sourceId || s);
      const nm = d.json.name || f.name || f.id;
      if (sids.includes(PROD_SRC)) onProd.push({ id: f.id, name: nm, status: d.json.status || d.json.indexStatus || '?' });
      await new Promise(r => setTimeout(r, 80));
    }
    page++;
  }
  W(`  scanned ${total} library files across ${page - 1} page(s)`);
  if (onProd.length === 0) W('  RESULT: NO library file is attached to the prod source.');
  else { W(`  RESULT: ${onProd.length} file(s) on prod source:`); onProd.forEach(f => W(`    - ${f.name} [${f.id}] status=${f.status}`)); }

  // ---- 2. Find Ivan D. Dios lead + transcript ----
  W('\n=== Lead search: Ivan D. Dios on Vacaville prod ===');
  let found = null;
  for (let p = 1; p <= 25 && !found; p++) {
    const r = await api(`/lead?botId=${BOT}&page=${p}&pageSize=100`);
    const list = r.ok ? (r.json.results || r.json.leads || r.json.data || []) : [];
    if (!Array.isArray(list) || list.length === 0) {
      if (p === 1) { // fall back to source filter
        const r2 = await api(`/lead?sourceId=${PROD_SRC}&page=1&pageSize=100`);
        const l2 = r2.ok ? (r2.json.results || r2.json.leads || r2.json.data || []) : [];
        found = l2.find(l => NAME_RX.test(`${l.firstName || ''} ${l.lastName || ''} ${l.name || ''}`));
      }
      break;
    }
    found = list.find(l => NAME_RX.test(`${l.firstName || ''} ${l.lastName || ''} ${l.name || ''}`));
  }
  if (!found) { W('  Ivan D. Dios NOT found via API lead search. Need the lead/contact id or GHL link.'); W(`\nLog: ${out}`); return; }

  W(`  Found: ${found.firstName || ''} ${found.lastName || found.name || ''}  id=${found.id}  source=${found.source?.name || found.sourceId || '?'}`);
  const conv = await api(`/lead/${found.id}`);
  fs.appendFileSync(out, '\n--- raw lead ---\n' + JSON.stringify(conv.json, null, 2).slice(0, 8000) + '\n');
  const msgs = conv.json?.messages || conv.json?.conversation || conv.json?.transcript || [];
  W(`\n=== TRANSCRIPT (${Array.isArray(msgs) ? msgs.length : 0} msgs) ===`);
  if (Array.isArray(msgs)) for (const m of msgs) {
    const who = m.role || m.direction || m.from || m.sender || '?';
    const txt = (m.text || m.body || m.message || m.content || '').toString().replace(/\s+/g, ' ').trim();
    W(`[${who}] ${txt}`);
  }
  W(`\nFull raw lead JSON appended to: ${out}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
