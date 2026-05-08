/**
 * Sequential, slow, deliberate test on the LIVE LAUNCH BOT.
 *
 * Source bot: bot_J56AWZ5TYQI9HKJS  (Vacaville PROD - Launch v1.0 — LIVE, READ-ONLY here)
 *
 * The launch bot is only used as a /duplicate source. /duplicate creates a new
 * bot record and does NOT modify the source. The live launch bot stays untouched.
 *
 * Plan: 3 iterations, fully sequential, 10s cooldown between each.
 *   Each iteration: duplicate, GET detail (verify persona inherited), publish,
 *   testSession (60s wait for reply).
 *
 * If 3/3 respond → earlier stress fail was caused by parallelism (Promise.all of 5).
 * If 0/3 respond → there's a different cause to investigate (vendor or env).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/sequential_duplicate_launch_test.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS'; // live launch bot — DUPLICATE-ONLY, never modified

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function singleIteration(label) {
  log(`\n--- iteration ${label} ---`);

  log(`  POST /bot/${LAUNCH}/duplicate  (read-only on launch; creates new bot)`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  log(`    → ${dup.status}`);
  if (!dup.ok) return { label, responded: false, reason: 'duplicate failed' };
  const id = dup.json.id || dup.json.bot?.id;
  log(`    new bot: ${id}`);

  await req('PUT', `/bot/${id}`, { name: `[SEQ-LAUNCH-${label}] ${new Date().toISOString().slice(11, 19)}` });

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

  log(`  open SSE stream`);
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
  log(`=== Sequential duplicate test on LIVE LAUNCH bot ===`);
  log(`Source: ${LAUNCH} (read-only, duplicate target only)`);
  log(`Plan: 3 iterations, sequential, 10s cooldown between\n`);

  const results = [];
  for (let i = 1; i <= 3; i++) {
    const r = await singleIteration(`${i}`);
    results.push(r);
    if (i < 3) {
      log(`  cooldown 10s before next iteration...`);
      await sleep(10_000);
    }
  }

  log(`\n\n=== SEQUENTIAL TEST RESULTS ===`);
  for (const r of results) {
    log(`  iter ${r.label}: persona=${r.persona ? '✅' : '❌'}  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)  "${r.msgPreview || ''}"`);
  }
  const allPassed = results.every(r => r.persona && r.responded);
  if (allPassed) {
    log(`\n→ Sequential 3/3 ✅. The earlier 0/15 fail was caused by PARALLELISM (Promise.all of 5 simultaneous duplicates).`);
    log(`→ Methodology fix: serialize duplicates and test sessions across N clients/iterations.`);
  } else {
    log(`\n→ Only ${results.filter(r => r.responded).length}/3 responded sequentially.`);
    log(`→ Parallelism is NOT the sole cause. Need to dig deeper into our code or env.`);
  }
})().catch(e => log(`FATAL: ${e.message}`));
