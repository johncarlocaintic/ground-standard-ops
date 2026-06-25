/**
 * cb_clean_attach_verify.js
 * Test-source hygiene per the documented attach/detach protocol:
 *   1. Detach EVERY bot from the sandbox source EXCEPT the bot under test.
 *   2. Attach the bot under test to the sandbox source (empty tag filter).
 *   3. Read the bot back: node count, published state, prohibitedWords, sources.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_clean_attach_verify.js bot_XXXX src_YYYY
 */
import { appendFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_test.log');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); appendFileSync(logFile, l + '\n'); }

const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { log('ERROR: CB_GS_API_KEY missing'); process.exit(1); }
const KEEP_BOT = process.argv[2];
const SOURCE = process.argv[3];
if (!KEEP_BOT || !SOURCE) { log('ERROR: usage: bot_XXXX src_YYYY'); process.exit(1); }
const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function cb(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function main() {
  log(`=== Clean sandbox ${SOURCE}, keep ${KEEP_BOT} ===`);
  const list = await cb('GET', '/bot');
  const bots = Array.isArray(list.json) ? list.json : (list.json.results || []);
  log(`Total bots in account: ${bots.length}`);

  let detached = 0;
  for (const b of bots) {
    if (b.id === KEEP_BOT) continue;
    const d = await cb('GET', `/bot/${b.id}`);
    const onSrc = (d.json.sources || []).some(s => s.id === SOURCE);
    if (!onSrc) continue;
    const r = await cb('DELETE', `/bot/${b.id}/source/${SOURCE}`);
    log(`  detached ${b.id} ("${(b.name||'').slice(0,60)}") → ${r.status}`);
    detached++;
    await new Promise(z => setTimeout(z, 60));
  }
  log(`Detached ${detached} contaminating bot(s).`);

  log(`\nAttaching ${KEEP_BOT} → ${SOURCE} (tags=[], channels=[])`);
  const a = await cb('POST', `/bot/${KEEP_BOT}/source/${SOURCE}`, { tags: [], channels: [], input: {} });
  log(`  attach → ${a.status}`);

  const v = await cb('GET', `/bot/${KEEP_BOT}`);
  const j = v.json;
  const nodeCount = Array.isArray(j.botSteps) ? j.botSteps.length
                  : (Array.isArray(j.nodes) ? j.nodes.length : 'n/a');
  const srcs = (j.sources || []).map(s => `${s.id}${s.id===SOURCE?'(SANDBOX)':''}`).join(', ') || 'NONE';
  const cfg = j.config || j;
  const pw = (cfg.prohibitedWords ?? j.prohibitedWords);
  log(`\n=== READ-BACK ${KEEP_BOT} ===`);
  log(`  name:        ${j.name}`);
  log(`  published:   ${j.published ?? j.isPublished ?? '?'}`);
  log(`  nodeCount:   ${nodeCount}`);
  log(`  prohibited:  ${pw === undefined ? 'field-absent' : JSON.stringify(pw)}`);
  log(`  sources:     [${srcs}]`);
  const sandboxOk = (j.sources || []).some(s => s.id === SOURCE);
  log(sandboxOk ? '  ✅ attached to sandbox' : '  ❌ NOT attached to sandbox');
}
main().catch(e => { log(`FATAL: ${e.stack || e.message}`); process.exit(1); });
