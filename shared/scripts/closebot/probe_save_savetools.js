/**
 * Probe POST /bot/{id}/save and POST /bot/{id}/saveTools.
 *
 * Plan: do this on a fresh duplicate of the launch bot so we don't risk Bobby's go-live.
 *   1. /duplicate launch bot → testBotId
 *   2. GET /bot/{testBotId}/steps         → fetch current botSteps
 *   3. POST /bot/{testBotId}/save (same body, round-trip test) → confirm save accepts it
 *   4. POST /bot/{testBotId}/save (with a tiny modification — change a Title) → confirm persists
 *   5. POST /bot/{testBotId}/saveTools with SmartFAQ        → confirm tools applied
 *   6. Open a test session, send "hi", read SSE → confirm bot still RESPONDS at runtime
 *      (this is the critical check: did our API edit break the bot like importKdl does?)
 *   7. Rename test bot to [TEST-API-PROBE-...]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/probe_save_savetools.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const LAUNCH_BOT = 'bot_J56AWZ5TYQI9HKJS'; // Vacaville launch (DON'T touch this one)

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 600) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function main() {
  log('=== Probe /save and /saveTools ===\n');

  // STEP 1: Duplicate launch bot (sandbox copy)
  log('[1] /duplicate launch bot');
  const dup = await req('POST', `/bot/${LAUNCH_BOT}/duplicate`, {});
  log(`    → ${dup.status}`);
  if (!dup.ok) { log(`FATAL: duplicate failed: ${dup.raw.slice(0, 200)}`); process.exit(1); }
  const testBot = dup.json.id || dup.json.bot?.id;
  log(`    test bot: ${testBot}`);

  // Rename it immediately so it's clear what this is
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  await req('PUT', `/bot/${testBot}`, { name: `[API-PROBE-${stamp}] save+saveTools test` });

  // STEP 2: GET current botSteps
  log('\n[2] GET /bot/{id}/steps (current botSteps)');
  const steps = await req('GET', `/bot/${testBot}/steps`);
  log(`    → ${steps.status}`);
  if (!steps.ok) {
    log(`    FAIL: ${steps.raw.slice(0, 400)}`);
  } else {
    const len = JSON.stringify(steps.json).length;
    log(`    botSteps payload size: ${len} chars`);
    log(`    top-level keys: ${Object.keys(steps.json).slice(0, 8).join(', ')}`);
    fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/probe_botSteps_initial.json'), JSON.stringify(steps.json, null, 2));
    log(`    saved → shared/logs/probe_botSteps_initial.json`);
  }

  // STEP 3: Round-trip — POST same botSteps back
  log('\n[3] POST /bot/{id}/save with the SAME botSteps (round-trip test)');
  const roundTrip = await req('POST', `/bot/${testBot}/save`, { botSteps: steps.json });
  log(`    → ${roundTrip.status}`);
  log(`    body: ${roundTrip.raw.slice(0, 400)}`);
  if (!roundTrip.ok) {
    log(`    /save round-trip rejected. The shape we sent is wrong.`);
    log(`    Trying alt: maybe /save expects {botSteps: <inner>}`);
    if (steps.json.botSteps) {
      const alt = await req('POST', `/bot/${testBot}/save`, { botSteps: steps.json.botSteps });
      log(`    alt → ${alt.status}  body: ${alt.raw.slice(0, 300)}`);
    }
  }

  // STEP 4: Modify and save
  log('\n[4] POST /bot/{id}/save with ONE tiny modification (rename a node Title)');
  // Find a node with a Title field and tweak it
  let modified = JSON.parse(JSON.stringify(steps.json));
  let didModify = false;
  function deepFind(obj, key, callback) {
    if (Array.isArray(obj)) for (const it of obj) deepFind(it, key, callback);
    else if (obj && typeof obj === 'object') {
      if (obj[key] !== undefined) callback(obj);
      for (const v of Object.values(obj)) deepFind(v, key, callback);
    }
  }
  deepFind(modified, 'title', (n) => { if (!didModify && typeof n.title === 'string') { n.title = `[API-PROBE] ${n.title}`; didModify = true; }});
  deepFind(modified, 'Title', (n) => { if (!didModify && typeof n.Title === 'string') { n.Title = `[API-PROBE] ${n.Title}`; didModify = true; }});
  log(`    modification applied: ${didModify}`);
  const mod = await req('POST', `/bot/${testBot}/save`, { botSteps: modified });
  log(`    → ${mod.status}`);
  log(`    body: ${mod.raw.slice(0, 400)}`);

  // Verify modification persists
  if (mod.ok) {
    const reread = await req('GET', `/bot/${testBot}/steps`);
    const found = JSON.stringify(reread.json).includes('[API-PROBE]');
    log(`    re-read contains modification marker: ${found ? '✅' : '❌'}`);
  }

  // STEP 5: saveTools with SmartFAQ
  log('\n[5] POST /bot/{id}/saveTools with [SmartFAQ]');
  const saveTools = await req('POST', `/bot/${testBot}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { $type: 'smart_faq' } },
  ]);
  log(`    → ${saveTools.status}`);
  log(`    body: ${saveTools.raw.slice(0, 400)}`);
  if (saveTools.ok) {
    const det = await req('GET', `/bot/${testBot}`);
    const tools = det.json.tools || [];
    log(`    bot tools after save: [${tools.map(t => t.type).join(', ')}]`);
    log(`    SmartFAQ present: ${tools.some(t => t.type === 'SmartFAQ') ? '✅' : '❌'}`);
  }

  // STEP 6: Critical — does the bot still respond at runtime?
  log('\n[6] Test session against modified bot');
  // Need to publish first so latest version is live
  const pub = await req('POST', `/bot/${testBot}/publish`, {});
  log(`    publish → ${pub.status}`);

  const sess = await req('POST', `/bot/${testBot}/testSession`, {});
  if (!sess.ok) { log(`    session create failed: ${sess.status}`); }
  else {
    const leadId = sess.json.leadId || sess.json.id;
    log(`    leadId: ${leadId}`);
    const sseRes = await fetch(`${BASE}/bot/${testBot}/testSession/messages/${leadId}`, {
      headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
    });
    log(`    SSE: ${sseRes.status}`);
    await new Promise(r => setTimeout(r, 600));
    await req('POST', `/bot/${testBot}/testSession/message`, { leadId, message: 'Hi' });

    const reader = sseRes.body.getReader();
    const dec = new TextDecoder();
    const start = Date.now();
    const timeout = 60_000;
    let buf = '';
    let firstBotMsg = null;
    let exceptionSeen = false;
    while (Date.now() - start < timeout) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise(r => setTimeout(() => r({ done: false, value: null }), 1500)),
      ]);
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
          if (evt.type === 'logs' && Array.isArray(evt.logs)) {
            for (const lg of evt.logs) if (lg.severity === 4 && (lg.message || '').includes('exception')) exceptionSeen = true;
          }
          if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; }
        } catch {}
      }
      if (firstBotMsg) break;
    }
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (firstBotMsg) {
      log(`    ✅ BOT REPLIED in ${elapsed}s: "${firstBotMsg.slice(0, 100)}"`);
      log(`    → /save did NOT trigger the importKdl runtime bug. Editing via /save is SAFE.`);
    } else {
      log(`    ❌ NO REPLY in ${elapsed}s. Exception seen: ${exceptionSeen}`);
      log(`    → /save may share the same broken setup path as importKdl.`);
    }
    try { reader.releaseLock(); } catch {}
  }

  log('\n=== DONE ===');
  log(`Test bot: ${testBot} (renamed [API-PROBE-...])`);
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
