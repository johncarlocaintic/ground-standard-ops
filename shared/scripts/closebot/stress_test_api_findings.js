/**
 * Stress test the API findings from 2026-05-04.
 *
 * Tests:
 *   A. /duplicate baseline (N=5)
 *   B. /save round-trip (N=5)
 *   C. /save with actual modification (N=5)
 *   D. /saveTools poisons runtime (N=5)
 *   E. /save AFTER /saveTools (heal test) (N=3)
 *
 * Each test creates [STRESS-TEST-{type}-...] bots. Reports pass/fail counts.
 * SSE wait per test session is 60s; parallel within a test for speed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/stress_test_api_findings.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function duplicate(label) {
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  if (!dup.ok) return null;
  const id = dup.json.id || dup.json.bot?.id;
  await req('PUT', `/bot/${id}`, { name: `[STRESS-${label}] ${new Date().toISOString().slice(11, 19)}` });
  return id;
}

async function pollResponse(botId, leadId, timeoutMs = 60_000) {
  const sse = await fetch(`${BASE}/bot/${botId}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await new Promise(r => setTimeout(r, 600));
  await req('POST', `/bot/${botId}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let firstBotMsg = null;
  let exception = null;
  while (Date.now() - start < timeoutMs) {
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
        if (evt.type === 'logs') for (const lg of (evt.logs || [])) if (lg.severity >= 4 && (lg.message || '').includes('exception')) exception = lg.message;
        if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; }
      } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  return { responded: !!firstBotMsg, msgPreview: firstBotMsg?.slice(0, 80), exception, elapsed: ((Date.now() - start) / 1000).toFixed(1) };
}

async function testRespond(botId) {
  const sess = await req('POST', `/bot/${botId}/testSession`, {});
  if (!sess.ok) return { responded: false, reason: 'session create failed' };
  const leadId = sess.json.leadId || sess.json.id;
  return await pollResponse(botId, leadId);
}

// ─── Test A: duplicate baseline ────────────────────────────────────────────────
async function testA(N = 5) {
  log(`\n=== TEST A: /duplicate baseline (N=${N}) ===`);
  const runs = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const id = await duplicate(`A${i + 1}`);
    if (!id) return { ok: false, reason: 'duplicate failed' };
    const det = await req('GET', `/bot/${id}`);
    const persona = (det.json.personaIds || []).length > 0;
    await req('POST', `/bot/${id}/publish`, {});
    const r = await testRespond(id);
    return { id, persona, responded: r.responded, elapsed: r.elapsed, msgPreview: r.msgPreview };
  }));
  log(`A results:`);
  for (const r of runs) log(`  ${r.id || '(no id)'}  persona=${r.persona ? '✅' : '❌'}  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)  "${r.msgPreview || ''}"`);
  const pass = runs.every(r => r.persona && r.responded);
  log(`A verdict: ${pass ? '✅ PASS' : '❌ FAIL'} (${runs.filter(r => r.persona && r.responded).length}/${N})`);
  return { test: 'A', pass, runs };
}

// ─── Test B: /save round-trip no-mod ──────────────────────────────────────────
async function testB(N = 5) {
  log(`\n=== TEST B: /save round-trip no-mod (N=${N}) ===`);
  const runs = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const id = await duplicate(`B${i + 1}`);
    if (!id) return { ok: false };
    const det = await req('GET', `/bot/${id}`);
    const ver = (det.json.versions || []).slice(-1)[0]?.version || '0.0.1';
    const steps = await req('GET', `/bot/${id}/steps?botVersion=${ver}`);
    if (!steps.ok) return { id, saveOk: false, reason: 'GET steps failed' };
    const saveR = await req('POST', `/bot/${id}/save`, { botSteps: steps.json });
    await req('POST', `/bot/${id}/publish`, {});
    const r = await testRespond(id);
    return { id, saveStatus: saveR.status, saveMsg: saveR.json?.message, responded: r.responded, elapsed: r.elapsed };
  }));
  log(`B results:`);
  for (const r of runs) log(`  ${r.id}  save=${r.saveStatus} (${r.saveMsg})  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)`);
  const pass = runs.every(r => r.saveStatus === 200 && r.responded);
  log(`B verdict: ${pass ? '✅ PASS' : '❌ FAIL'} (${runs.filter(r => r.responded).length}/${N})`);
  return { test: 'B', pass, runs };
}

// ─── Test C: /save with actual content modification ───────────────────────────
async function testC(N = 5) {
  log(`\n=== TEST C: /save with content modification (N=${N}) ===`);
  // We'll modify a node Title with a unique sentinel and verify it persists + bot still responds
  const runs = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const sentinel = `STRESS-C${i + 1}-${Date.now()}`;
    const id = await duplicate(`C${i + 1}`);
    if (!id) return { ok: false };
    const det = await req('GET', `/bot/${id}`);
    const ver = (det.json.versions || []).slice(-1)[0]?.version || '0.0.1';
    const steps = await req('GET', `/bot/${id}/steps?botVersion=${ver}`);
    if (!steps.ok) return { id, reason: 'GET steps failed' };
    const stepsJson = JSON.parse(JSON.stringify(steps.json));
    let modified = false;
    function deepFindTitle(obj) {
      if (Array.isArray(obj)) for (const it of obj) deepFindTitle(it);
      else if (obj && typeof obj === 'object') {
        if (typeof obj.title === 'string' && !modified) { obj.title = `${sentinel} ${obj.title}`; modified = true; return; }
        if (typeof obj.Title === 'string' && !modified) { obj.Title = `${sentinel} ${obj.Title}`; modified = true; return; }
        for (const v of Object.values(obj)) { deepFindTitle(v); if (modified) return; }
      }
    }
    deepFindTitle(stepsJson);
    const saveR = await req('POST', `/bot/${id}/save`, { botSteps: stepsJson });
    await req('POST', `/bot/${id}/publish`, {});
    // verify mod persists
    const detAfter = await req('GET', `/bot/${id}`);
    const verAfter = (detAfter.json.versions || []).slice(-1)[0]?.version || '0.0.1';
    const stepsAfter = await req('GET', `/bot/${id}/steps?botVersion=${verAfter}`);
    const persisted = JSON.stringify(stepsAfter.json).includes(sentinel);
    const r = await testRespond(id);
    return { id, modified, saveStatus: saveR.status, saveMsg: saveR.json?.message, persisted, responded: r.responded, elapsed: r.elapsed, sentinel };
  }));
  log(`C results:`);
  for (const r of runs) log(`  ${r.id}  mod=${r.modified ? '✅' : '❌'}  save=${r.saveStatus} (${r.saveMsg})  persisted=${r.persisted ? '✅' : '❌'}  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)`);
  const pass = runs.every(r => r.modified && r.saveStatus === 200 && r.persisted && r.responded);
  log(`C verdict: ${pass ? '✅ PASS' : '❌ FAIL'} (${runs.filter(r => r.modified && r.persisted && r.responded).length}/${N})`);
  return { test: 'C', pass, runs };
}

// ─── Test D: /saveTools poisons runtime ───────────────────────────────────────
async function testD(N = 5) {
  log(`\n=== TEST D: /saveTools poisons runtime (N=${N}) ===`);
  const runs = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const id = await duplicate(`D${i + 1}`);
    if (!id) return { ok: false };
    const stR = await req('POST', `/bot/${id}/saveTools`, [{ type: 'SmartFAQ', enabled: true, options: { $type: 'smart_faq' } }]);
    await req('POST', `/bot/${id}/publish`, {});
    const r = await testRespond(id);
    return { id, saveToolsStatus: stR.status, responded: r.responded, elapsed: r.elapsed };
  }));
  log(`D results:`);
  for (const r of runs) log(`  ${r.id}  saveTools=${r.saveToolsStatus}  responded=${r.responded ? 'YES (unexpected!)' : 'NO (as predicted)'} (${r.elapsed}s)`);
  const pass = runs.every(r => r.saveToolsStatus === 200 && !r.responded);
  log(`D verdict: ${pass ? '✅ PASS (deterministic poison confirmed)' : '⚠️ FLAKY'} (${runs.filter(r => !r.responded).length}/${N} silent)`);
  return { test: 'D', pass, runs };
}

// ─── Test E: /save AFTER /saveTools (heal test) ───────────────────────────────
async function testE(N = 3) {
  log(`\n=== TEST E: /save AFTER /saveTools heal test (N=${N}) ===`);
  const runs = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const id = await duplicate(`E${i + 1}`);
    if (!id) return { ok: false };
    // Poison with saveTools first
    await req('POST', `/bot/${id}/saveTools`, [{ type: 'SmartFAQ', enabled: true, options: { $type: 'smart_faq' } }]);
    // Try to heal with a /save round-trip
    const det = await req('GET', `/bot/${id}`);
    const ver = (det.json.versions || []).slice(-1)[0]?.version || '0.0.1';
    const steps = await req('GET', `/bot/${id}/steps?botVersion=${ver}`);
    const saveR = await req('POST', `/bot/${id}/save`, { botSteps: steps.json });
    await req('POST', `/bot/${id}/publish`, {});
    const r = await testRespond(id);
    return { id, saveStatus: saveR.status, responded: r.responded, elapsed: r.elapsed };
  }));
  log(`E results:`);
  for (const r of runs) log(`  ${r.id}  save-after-saveTools=${r.saveStatus}  responded=${r.responded ? '✅ HEALED' : '❌ STILL BROKEN'} (${r.elapsed}s)`);
  const allHealed = runs.every(r => r.responded);
  log(`E verdict: ${allHealed ? '✅ /save HEALS the saveTools poison' : '❌ /save does NOT heal'} (${runs.filter(r => r.responded).length}/${N})`);
  return { test: 'E', pass: allHealed, runs };
}

async function main() {
  log('=== API findings stress test ===');
  log(`Source bot: ${LAUNCH} (read-only)`);

  const startedAt = Date.now();
  const A = await testA(5);
  const B = await testB(5);
  const C = await testC(5);
  const D = await testD(5);
  const E = await testE(3);
  const finishedAt = Date.now();

  log(`\n\n=== FINAL VERDICT ===`);
  log(`Wall time: ${((finishedAt - startedAt) / 1000).toFixed(0)}s`);
  for (const r of [A, B, C, D, E]) {
    log(`  Test ${r.test}: ${r.pass ? '✅ PASS' : '❌ FAIL'}`);
  }

  const summary = {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    tests: [A, B, C, D, E].map(r => ({
      test: r.test,
      pass: r.pass,
      runs: r.runs.map(x => ({
        id: x.id,
        persona: x.persona,
        responded: x.responded,
        modified: x.modified,
        persisted: x.persisted,
        saveStatus: x.saveStatus,
        saveToolsStatus: x.saveToolsStatus,
        elapsed: x.elapsed,
      })),
    })),
  };
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/stress_test_summary.json'), JSON.stringify(summary, null, 2));
  log(`\nSummary → shared/logs/stress_test_summary.json`);
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
