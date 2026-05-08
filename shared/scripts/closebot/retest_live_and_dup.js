/**
 * Combined retest: live launch bot + 3x duplicate experiment.
 * Sequential, slow, with timing buffers.
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

async function testSession(id, label) {
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) return { responded: false, reason: 'session create fail', elapsed: '0' };
  const leadId = sess.json.leadId || sess.json.id;
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await sleep(800);
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '', firstBotMsg = null, eventCount = 0;
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
        eventCount++;
        if (evt.type === 'message-sent' && evt.sender !== 'lead' && evt.message) {
          firstBotMsg = evt.message; break;
        }
      } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  return { responded: !!firstBotMsg, msgPreview: firstBotMsg?.slice(0, 100), elapsed, eventCount };
}

(async () => {
  console.log(`=== Retest: live launch bot + duplicate flow ===\n`);

  // Phase 1: Live launch bot
  console.log(`--- PHASE 1: Live launch bot ${LAUNCH} ---`);
  const det = await req('GET', `/bot/${LAUNCH}`);
  console.log(`name: ${det.json.name}`);
  console.log(`personaIds: ${JSON.stringify(det.json.personaIds)}  tools: [${(det.json.tools || []).map(t => t.type).join(',')}]  sources: [${(det.json.sources || []).map(s => s.name).join(',')}]`);
  console.log(`testing live launch bot...`);
  const live = await testSession(LAUNCH, 'live');
  if (live.responded) console.log(`✅ LIVE launch REPLIED in ${live.elapsed}s: "${live.msgPreview}" (${live.eventCount} events)`);
  else console.log(`❌ LIVE launch SILENT in ${live.elapsed}s (${live.eventCount} events)`);
  console.log('');

  await sleep(5000);

  // Phase 2: 3 duplicate iterations
  console.log(`--- PHASE 2: 3x duplicate → PUT persona → publish → test ---`);
  const dupResults = [];
  for (let i = 1; i <= 3; i++) {
    console.log(`\n  iter ${i}:`);
    const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
    if (!dup.ok) { console.log(`  duplicate fail: ${dup.status}`); continue; }
    const id = dup.json.id || dup.json.bot?.id;
    console.log(`    new bot: ${id}`);
    await req('PUT', `/bot/${id}`, { name: `[RETEST-${i}] ${new Date().toISOString().slice(11, 19)}` });
    await req('PUT', `/bot/${id}`, { personaIds: [EMMA] });
    await sleep(2000);
    await req('POST', `/bot/${id}/publish`, {});
    await sleep(2000);
    const res = await testSession(id, `iter${i}`);
    if (res.responded) console.log(`    ✅ REPLIED in ${res.elapsed}s: "${res.msgPreview}" (${res.eventCount} events)`);
    else console.log(`    ❌ SILENT in ${res.elapsed}s (${res.eventCount} events)`);
    dupResults.push({ id, ...res });
    if (i < 3) await sleep(5000);
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Live launch bot:  ${live.responded ? '✅' : '❌'}`);
  console.log(`Duplicate iter 1: ${dupResults[0]?.responded ? '✅' : '❌'}`);
  console.log(`Duplicate iter 2: ${dupResults[1]?.responded ? '✅' : '❌'}`);
  console.log(`Duplicate iter 3: ${dupResults[2]?.responded ? '✅' : '❌'}`);
})().catch(e => console.log(`FATAL: ${e.message}`));
