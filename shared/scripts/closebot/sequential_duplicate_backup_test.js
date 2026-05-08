/**
 * Sequential, slow, deliberate test on the BACKUP PROD bot.
 *
 * Goal: disambiguate parallel-stress failure vs vendor-side issue.
 *
 *   Source bot: bot_DR18GF3ZG7IH5QOM (Vacaville PROD - v4.1 reverted, kept as fallback)
 *
 * Plan:
 *   - 3 iterations, fully sequential (no Promise.all)
 *   - 5 second cooldown between iterations
 *   - Each: duplicate, GET detail (verify persona inherited), publish, testSession (60s wait for reply)
 *   - Print per-iteration result
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/sequential_duplicate_backup_test.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const BACKUP = 'bot_DR18GF3ZG7IH5QOM'; // Vacaville PROD - v4.1 reverted (READ ONLY)

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function singleIteration(label) {
  log(`\n--- iteration ${label} ---`);

  log(`  POST /bot/${BACKUP}/duplicate`);
  const dup = await req('POST', `/bot/${BACKUP}/duplicate`, {});
  log(`    → ${dup.status}`);
  if (!dup.ok) return { label, status: 'duplicate failed', responded: false };
  const id = dup.json.id || dup.json.bot?.id;
  log(`    new bot: ${id}`);

  await req('PUT', `/bot/${id}`, { name: `[SEQ-TEST-${label}] ${new Date().toISOString().slice(11, 19)}` });

  log(`  GET /bot/${id}`);
  const det = await req('GET', `/bot/${id}`);
  const personaIds = det.json.personaIds || [];
  log(`    personaIds: ${JSON.stringify(personaIds)}`);
  log(`    tools: ${(det.json.tools || []).map(t => t.type).join(',') || 'none'}`);

  log(`  POST /bot/${id}/publish`);
  const pub = await req('POST', `/bot/${id}/publish`, {});
  log(`    → ${pub.status}`);

  log(`  POST /bot/${id}/testSession`);
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) { log(`    session failed: ${sess.status}`); return { label, id, persona: personaIds.length > 0, responded: false }; }
  const leadId = sess.json.leadId || sess.json.id;
  log(`    leadId: ${leadId}`);

  log(`  open SSE`);
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  log(`    SSE: ${sse.status}`);
  await sleep(800);

  log(`  send "Hi"`);
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let firstBotMsg = null;
  while (Date.now() - start < 60_000) {
    const { value, done } = await Promise.race([reader.read(), new Promise(r => setTimeout(() => r({ done: false, value: null }), 1000))]);
    if (done) break;
    if (!value) continue;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (!d) continue;
      try {
        const evt = JSON.parse(d);
        if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; }
      } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  if (firstBotMsg) log(`    ✅ REPLY in ${elapsed}s: "${firstBotMsg.slice(0, 100)}"`);
  else log(`    ❌ NO REPLY in ${elapsed}s`);
  return { label, id, persona: personaIds.length > 0, responded: !!firstBotMsg, msgPreview: firstBotMsg?.slice(0, 100), elapsed };
}

(async () => {
  log(`=== Sequential duplicate test on backup PROD bot ${BACKUP} ===`);
  log(`Source bot context: kept as fallback v4.1 PROD; READ ONLY in this script.`);

  const results = [];
  for (let i = 1; i <= 3; i++) {
    const r = await singleIteration(`${i}`);
    results.push(r);
    if (i < 3) {
      log(`  cooldown 10s...`);
      await sleep(10_000);
    }
  }

  log(`\n\n=== SEQUENTIAL TEST RESULTS ===`);
  for (const r of results) {
    log(`  iter ${r.label}: persona=${r.persona ? '✅' : '❌'}  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)  "${r.msgPreview || ''}"`);
  }
  const allPassed = results.every(r => r.persona && r.responded);
  if (allPassed) {
    log(`\n→ Sequential 3/3 ✅. Issue is PARALLELISM (or our stress harness), not the vendor or our methodology.`);
  } else {
    log(`\n→ ${results.filter(r => r.responded).length}/3 responded sequentially. Vendor or other env issue.`);
  }
})().catch(e => log(`FATAL: ${e.message}`));
