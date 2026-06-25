/**
 * READ-ONLY, fast. Evidence-first:
 *  1. GET /source/{prodSrc} once - does the source object list attached
 *     knowledge/library docs directly (no slow per-file pagination).
 *  2. Find lead "Ivan D. Dios" on Vacaville prod bot, dump full transcript
 *     AND raw lead JSON (custom fields / notes could carry injected pricing).
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_ivan_transcript.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'ivan_transcript.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BOT = 'bot_F0VNPTPCIW88YI3J';
const PROD_SRC = 'src_GDKORXSW4Q8RQUQ8';
const NAME_RX = /ivan|de ?dios|d\.? ?dios/i;
const PRICE_RX = /\$\s?\d|\b\d{2,4}\s?(usd|dollars?|month|mo)\b|\b(price|pricing|cost|fee|tuition|per month|monthly)\b/i;

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

(async () => {
  // 1. Source object - look for attached knowledge inline
  W('=== GET /source prod (looking for attached knowledge refs) ===');
  const s = await api(`/source/${PROD_SRC}`);
  if (s.ok) {
    const j = s.json;
    const keys = Object.keys(j);
    W(`source keys: ${keys.join(', ')}`);
    for (const k of ['libraryFiles', 'knowledge', 'files', 'smartFaq', 'faqs', 'documents']) {
      if (j[k] !== undefined) W(`  ${k}: ${JSON.stringify(j[k]).slice(0, 600)}`);
    }
    fs.appendFileSync(out, '\n--- raw source ---\n' + JSON.stringify(j, null, 2).slice(0, 6000) + '\n');
  } else W(`  failed ${s.status} ${s.raw || ''}`);

  // 2. Find Ivan lead
  W('\n=== Find lead Ivan D. Dios ===');
  let found = null;
  for (let p = 1; p <= 15 && !found; p++) {
    const r = await api(`/lead?botId=${BOT}&page=${p}&pageSize=100`);
    const list = r.ok ? (r.json.results || r.json.leads || r.json.data || []) : [];
    if (!Array.isArray(list) || list.length === 0) break;
    found = list.find(l => NAME_RX.test(`${l.firstName || ''} ${l.lastName || ''} ${l.name || ''} ${l.email || ''}`));
    W(`  page ${p}: ${list.length} leads scanned${found ? ' - MATCH' : ''}`);
  }
  if (!found) {
    const r2 = await api(`/lead?sourceId=${PROD_SRC}&page=1&pageSize=100`);
    const l2 = r2.ok ? (r2.json.results || r2.json.leads || r2.json.data || []) : [];
    found = l2.find(l => NAME_RX.test(`${l.firstName || ''} ${l.lastName || ''} ${l.name || ''}`));
    W(`  source-filter fallback: ${l2.length} leads, ${found ? 'MATCH' : 'no match'}`);
  }
  if (!found) { W('\n  Ivan D. Dios NOT found via API. Need the GHL contact id or conversation link.'); W(`\nLog: ${out}`); return; }

  W(`\n  Found: "${found.firstName || ''} ${found.lastName || found.name || ''}"  id=${found.id}  src=${found.source?.name || found.sourceId || '?'}`);
  const conv = await api(`/lead/${found.id}`);
  fs.appendFileSync(out, '\n--- raw lead JSON ---\n' + JSON.stringify(conv.json, null, 2) + '\n');

  // custom fields / notes scan for injected price
  const cf = conv.json?.customFields || conv.json?.contact?.customFields || conv.json?.fields || {};
  W('\n=== custom fields / notes price scan ===');
  const blob = JSON.stringify(cf) + ' ' + (conv.json?.notes || conv.json?.contact?.notes || '');
  W(PRICE_RX.test(blob) ? `  PRICE SIGNAL in contact data: ${blob.slice(0, 400)}` : '  no price signal in custom fields/notes');

  const msgs = conv.json?.messages || conv.json?.conversation || conv.json?.transcript || conv.json?.history || [];
  W(`\n=== TRANSCRIPT (${Array.isArray(msgs) ? msgs.length : 0} msgs) ===`);
  if (Array.isArray(msgs)) for (const m of msgs) {
    const who = m.role || m.direction || m.from || m.sender || '?';
    const txt = (m.text || m.body || m.message || m.content || '').toString().replace(/\s+/g, ' ').trim();
    const flag = PRICE_RX.test(txt) ? '  <<< PRICE' : '';
    W(`[${who}] ${txt}${flag}`);
  }
  W(`\nFull raw lead JSON in: ${out}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
