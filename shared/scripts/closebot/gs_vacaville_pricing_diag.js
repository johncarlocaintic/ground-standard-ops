/**
 * READ-ONLY diagnostic: why is live Vacaville answering with pricing.
 * No writes. Pulls the actual prod bot KDL + config + the KB files on its
 * prod source, and scans all of it for dollar figures / pricing language.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_vacaville_pricing_diag.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BOT = 'bot_F0VNPTPCIW88YI3J';            // Vacaville PROD - v4.6 (2026-05-12)
const PROD_SRC = 'src_GDKORXSW4Q8RQUQ8';        // Vacaville production source

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 600) }; }
}

// price signals: $ followed by a digit, or money words
const PRICE_RX = /\$\s?\d|\b\d+\s?(usd|dollars?)\b|\b(price|pricing|cost|fee|tuition|per month|monthly rate|membership (is|costs?|runs))\b/i;
function scan(label, text) {
  if (!text) { console.log(`  [${label}] empty`); return; }
  const hits = [];
  text.split(/\n/).forEach((ln, i) => { if (PRICE_RX.test(ln)) hits.push(`L${i + 1}: ${ln.trim().slice(0, 160)}`); });
  console.log(`  [${label}] ${hits.length} price-signal line(s)`);
  hits.slice(0, 25).forEach(h => console.log(`    ${h}`));
}

(async () => {
  console.log(`=== Vacaville PROD pricing diagnostic ===\nbot=${BOT}  prodSource=${PROD_SRC}\n`);

  // 1. Bot config
  const b = await api(`/bot/${BOT}`);
  if (!b.ok) { console.log('GET /bot failed', b.status, b.raw || ''); }
  else {
    const j = b.json;
    console.log(`Bot name: ${j.name}`);
    const srcIds = (j.sources || []).map(s => s.id || s.sourceId || s);
    console.log(`Attached sources: ${srcIds.join(', ') || '(none)'}`);
    console.log(`On prod source: ${srcIds.includes(PROD_SRC) ? 'YES' : 'NO'}`);
    const pw = j.prohibitedWords ?? j.config?.prohibitedWords ?? '(field not present)';
    console.log(`prohibitedWords: ${JSON.stringify(pw)}`);
    const cr = j.conversationReason ?? j.config?.conversationReason ?? '';
    scan('conversationReason', cr);
  }

  // 2. Live KDL export
  const ex = await api(`/bot/${BOT}/export`);
  if (ex.ok && ex.json && ex.json.kdl) {
    const out = path.join(logDir, 'vacaville_prod_v46_live.kdl');
    fs.writeFileSync(out, ex.json.kdl);
    console.log(`\nKDL exported: ${out} (${ex.json.kdl.length} chars)`);
    scan('KDL', ex.json.kdl);
  } else {
    console.log('\nKDL export failed:', ex.status, ex.raw || JSON.stringify(ex.json).slice(0, 300));
  }

  // 3. KB files on the prod source
  const all = await api('/library/files');
  const files = all.ok ? (all.json.files || all.json.data || all.json) : [];
  if (!Array.isArray(files)) { console.log('\nlibrary list unexpected shape'); return; }
  console.log(`\n=== KB files attached to prod source ${PROD_SRC} ===`);
  let onProd = 0;
  for (const f of files) {
    const d = await api(`/library/files/${f.id}`);
    if (!d.ok) continue;
    const sids = (d.json.sources || []).map(s => s.id || s.sourceId || s);
    if (!sids.includes(PROD_SRC)) continue;
    onProd++;
    const name = d.json.name || f.name || f.id;
    console.log(`\n- ${name}  [${f.id}]  status=${d.json.status || d.json.indexStatus || '?'}`);
    const content = d.json.content || d.json.text || d.json.body || '';
    if (content) scan(name, content);
    else console.log('  (no inline content in API response; pull file separately if needed)');
    await new Promise(r => setTimeout(r, 120));
  }
  if (!onProd) console.log('  none found on prod source');
  console.log('\n=== done (read-only, nothing changed) ===');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
