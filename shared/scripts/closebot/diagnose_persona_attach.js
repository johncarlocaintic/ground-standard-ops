/**
 * Diagnostic: figure out WHY /duplicate produces empty-persona bots,
 * and whether we can patch it post-hoc by attaching persona via PUT.
 *
 * Steps:
 *   1. Pull launch bot's full detail (json dump for inspection)
 *   2. Duplicate it. Pull the new bot's full detail (json dump).
 *   3. DIFF the two: what's missing in the duplicate?
 *   4. Try PUT /bot/{id} with { personaIds: [...] } and see if it sticks
 *   5. Try alternate persona attach paths
 *   6. After persona is attached: publish, test session, see if bot responds
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';
const EMMA = 'pers_CB1LLPENDKDRB5S2';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function testRespond(id) {
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) return { responded: false, reason: 'session fail' };
  const leadId = sess.json.leadId || sess.json.id;
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await new Promise(r => setTimeout(r, 800));
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '', firstBotMsg = null;
  while (Date.now() - start < 60_000) {
    const { value, done } = await Promise.race([reader.read(), new Promise(r => setTimeout(() => r({ done: false, value: null }), 1000))]);
    if (done) break; if (!value) continue;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim(); if (!d) continue;
      try { const evt = JSON.parse(d); if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; } } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  return { responded: !!firstBotMsg, msgPreview: firstBotMsg?.slice(0, 100), elapsed };
}

(async () => {
  console.log(`=== Persona-attach diagnostic ===\n`);

  // 1. Source detail
  console.log(`[1] GET launch bot detail`);
  const live = await req('GET', `/bot/${LAUNCH}`);
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/diag_launch_detail.json'), JSON.stringify(live.json, null, 2));
  console.log(`   personaIds: ${JSON.stringify(live.json.personaIds)}`);
  console.log(`   tools: ${(live.json.tools || []).map(t => t.type).join(',')}`);
  console.log(`   keys: ${Object.keys(live.json).join(', ')}`);
  console.log('');

  // 2. Duplicate
  console.log(`[2] Duplicate launch bot`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  console.log(`   → ${dup.status}`);
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`   new bot: ${id}`);
  await req('PUT', `/bot/${id}`, { name: `[DIAG-PERSONA] ${new Date().toISOString().slice(11, 19)}` });

  // 3. Fresh-duplicate detail
  console.log(`\n[3] Fresh duplicate detail`);
  const fresh = await req('GET', `/bot/${id}`);
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/diag_fresh_dup_detail.json'), JSON.stringify(fresh.json, null, 2));
  console.log(`   personaIds: ${JSON.stringify(fresh.json.personaIds)}`);
  console.log(`   tools: ${(fresh.json.tools || []).map(t => t.type).join(',')}`);
  console.log(`   keys: ${Object.keys(fresh.json).join(', ')}`);

  // 4. DIFF — what keys differ?
  console.log(`\n[4] Key-by-key diff (top-level)`);
  const liveKeys = new Set(Object.keys(live.json));
  const freshKeys = new Set(Object.keys(fresh.json));
  for (const k of liveKeys) {
    if (!freshKeys.has(k)) console.log(`   ← only in live: ${k}`);
  }
  for (const k of freshKeys) {
    if (!liveKeys.has(k)) console.log(`   → only in fresh: ${k}`);
  }
  console.log(`   Comparing common-key values...`);
  for (const k of liveKeys) {
    if (!freshKeys.has(k)) continue;
    const lv = JSON.stringify(live.json[k]);
    const fv = JSON.stringify(fresh.json[k]);
    if (lv !== fv) {
      const liveStr = lv?.slice(0, 100);
      const freshStr = fv?.slice(0, 100);
      console.log(`   ≠ ${k}:`);
      console.log(`       live: ${liveStr}`);
      console.log(`       fresh: ${freshStr}`);
    }
  }

  // 5. Try PUT personaIds
  console.log(`\n[5] PUT personaIds`);
  const put = await req('PUT', `/bot/${id}`, { personaIds: [EMMA] });
  console.log(`   PUT → ${put.status}`);
  console.log(`   response body: ${put.raw.slice(0, 200)}`);
  const after = await req('GET', `/bot/${id}`);
  console.log(`   after PUT: personaIds = ${JSON.stringify(after.json.personaIds)}`);

  // 6. If PUT didn't stick, try alternate
  if ((after.json.personaIds || []).length === 0) {
    console.log(`\n[6] PUT didn't stick. Trying alternate keys...`);
    for (const payload of [
      { personaId: EMMA },
      { persona: EMMA },
      { Persona: { id: EMMA } },
      { personaIds: [EMMA], folderId: null },  // maybe needs co-fields
    ]) {
      const t = await req('PUT', `/bot/${id}`, payload);
      console.log(`   PUT ${JSON.stringify(payload).slice(0, 60)} → ${t.status}`);
      const re = await req('GET', `/bot/${id}`);
      const got = re.json.personaIds || [];
      if (got.length > 0) { console.log(`   ✅ stuck via ${JSON.stringify(payload)}`); break; }
    }
  }

  // 7. Look for /agency-level persona attach paths
  console.log(`\n[7] Probe agency-level persona attach paths`);
  for (const path of [
    `/bot/${id}/persona`,
    `/bot/${id}/persona/${EMMA}`,
    `/persona/${EMMA}/bot/${id}`,
  ]) {
    for (const method of ['POST', 'PUT', 'PATCH']) {
      const r = await req(method, path, method === 'POST' || method === 'PUT' ? {} : undefined);
      if (r.status !== 404 && r.status !== 405) {
        console.log(`   ${method} ${path} → ${r.status}  (notable!)`);
        if (r.ok) console.log(`   body: ${r.raw.slice(0, 200)}`);
      }
    }
  }

  // 8. Test bot response (with whatever state we have)
  console.log(`\n[8] Publish + test session response`);
  await req('POST', `/bot/${id}/publish`, {});
  const finalState = await req('GET', `/bot/${id}`);
  console.log(`   final personaIds: ${JSON.stringify(finalState.json.personaIds)}`);
  console.log(`   final tools: ${(finalState.json.tools || []).map(t => t.type).join(',')}`);
  const r = await testRespond(id);
  if (r.responded) console.log(`   ✅ REPLY in ${r.elapsed}s: "${r.msgPreview}"`);
  else console.log(`   ❌ NO REPLY in ${r.elapsed}s`);

  console.log(`\nProbe bot: ${id}`);
})();
