/**
 * Experiment C: duplicate → PUT persona → /save (force new version) → publish → test
 *
 * Hypothesis: the published version snapshot is what the runtime actually uses.
 * Version 0.0.1 was created at duplicate time before persona attached. PUT +
 * publish updates the bot record but the snapshot is locked at v0.0.1 state.
 *
 * /save with modified botSteps should bump to v0.0.2 — and the new version's
 * snapshot will include the now-attached personaIds.
 *
 * 3 iterations to confirm reliability.
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';
const EMMA = 'pers_CB1LLPENDKDRB5S2';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testRespond(id) {
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) return { responded: false };
  const leadId = sess.json.leadId || sess.json.id;
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await sleep(800);
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

async function singleIteration(label) {
  console.log(`\n--- iter ${label} ---`);

  // Step 1: duplicate
  console.log(`  duplicate`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  if (!dup.ok) { console.log(`  duplicate fail: ${dup.status}`); return; }
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`  new bot: ${id}`);
  await req('PUT', `/bot/${id}`, { name: `[EXP-C-${label}] ${new Date().toISOString().slice(11, 19)}` });

  // Step 2: PUT personaIds
  console.log(`  PUT personaIds`);
  await req('PUT', `/bot/${id}`, { personaIds: [EMMA] });
  await sleep(2000);

  // Step 3: GET botSteps
  const v1Det = await req('GET', `/bot/${id}`);
  const ver1 = (v1Det.json.versions || []).slice(-1)[0]?.version || '0.0.1';
  console.log(`  current version: ${ver1}`);
  const stepsR = await req('GET', `/bot/${id}/steps?botVersion=${ver1}`);
  if (!stepsR.ok) { console.log(`  GET steps fail: ${stepsR.status}`); return; }

  // Step 4: /save with a tiny noop-ish modification to force a new version
  // Modify a single node title with a sentinel suffix; this should trigger save
  // (round-trip with no changes returns "Nothing to save")
  const stepsCopy = JSON.parse(JSON.stringify(stepsR.json));
  const sentinel = `__exp_c_${label}__`;
  let modified = false;
  function deepFindTitle(obj) {
    if (Array.isArray(obj)) for (const it of obj) deepFindTitle(it);
    else if (obj && typeof obj === 'object') {
      if (typeof obj.title === 'string' && !modified) { obj.title = obj.title + ' ' + sentinel; modified = true; return; }
      if (typeof obj.Title === 'string' && !modified) { obj.Title = obj.Title + ' ' + sentinel; modified = true; return; }
      for (const v of Object.values(obj)) { deepFindTitle(v); if (modified) return; }
    }
  }
  deepFindTitle(stepsCopy);
  console.log(`  /save with sentinel modification (mod applied: ${modified})`);
  const saveR = await req('POST', `/bot/${id}/save`, { botSteps: stepsCopy });
  console.log(`    → ${saveR.status} body: ${saveR.raw.slice(0, 150)}`);

  // Step 5: publish (now there should be a new version)
  await sleep(2000);
  const v2Det = await req('GET', `/bot/${id}`);
  const ver2 = (v2Det.json.versions || []).slice(-1)[0]?.version || ver1;
  console.log(`  version after save: ${ver2} (was ${ver1})`);

  console.log(`  publish`);
  const pub = await req('POST', `/bot/${id}/publish`, {});
  console.log(`    → ${pub.status}`);
  await sleep(2000);

  const finalDet = await req('GET', `/bot/${id}`);
  console.log(`  final personaIds: ${JSON.stringify(finalDet.json.personaIds)}`);
  console.log(`  final versions: ${(finalDet.json.versions || []).length} (latest published: ${(finalDet.json.versions || []).slice(-1)[0]?.published})`);

  // Step 6: test session
  console.log(`  testSession`);
  const r = await testRespond(id);
  if (r.responded) console.log(`  ✅ REPLY in ${r.elapsed}s: "${r.msgPreview}"`);
  else console.log(`  ❌ NO REPLY in ${r.elapsed}s`);
  return { id, responded: r.responded, elapsed: r.elapsed, msgPreview: r.msgPreview };
}

(async () => {
  console.log(`=== Experiment C: duplicate → PUT persona → /save (force version bump) → publish → test ===`);
  const results = [];
  for (let i = 1; i <= 3; i++) {
    const r = await singleIteration(`${i}`);
    results.push(r);
    if (i < 3) await sleep(5000);
  }
  console.log(`\n=== RESULTS ===`);
  for (const r of results) console.log(`  ${r.id}  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)`);
  console.log(`\n${results.every(r => r.responded) ? '✅ ALL 3 WORKED' : `${results.filter(r => r.responded).length}/3 worked`}`);
})().catch(e => console.log(`FATAL: ${e.message}`));
