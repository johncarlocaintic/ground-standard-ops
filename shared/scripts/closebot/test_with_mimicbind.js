/**
 * Replicate the eval orchestrator's test flow exactly.
 * Key difference from our recent probes: mimicBind via PUT before sending message.
 *
 * Test 1: live launch bot with mimicBind → does it reply?
 * Test 2: fresh duplicate with persona attached + mimicBind → does it reply?
 *
 * mimicSourceId = src_4R4DUIQTMMX2NFPU (GS Ads sandbox — safe, no Vacaville artifacts)
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';
const EMMA = 'pers_CB1LLPENDKDRB5S2';
const SANDBOX_SRC = 'src_4R4DUIQTMMX2NFPU'; // GS Ads sandbox

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testSessionWithBind(id, mimicSourceId, label) {
  console.log(`\n  testing ${label} (bot=${id}, mimic=${mimicSourceId})`);
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) { console.log(`    session create fail: ${sess.status}`); return { responded: false }; }
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`    leadId: ${leadId}`);

  // mimicBind
  const bind = await req('PUT', `/bot/${id}/testSession/${leadId}`, { mimicSourceId });
  console.log(`    mimicBind → ${bind.status}`);
  if (!bind.ok) { console.log(`    bind body: ${bind.raw.slice(0, 200)}`); }

  // SSE
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`    SSE: ${sse.status}`);
  await sleep(600);

  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });
  console.log(`    sent "Hi"`);

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
  if (firstBotMsg) console.log(`    ✅ REPLY in ${elapsed}s (${eventCount} events): "${firstBotMsg.slice(0, 100)}"`);
  else console.log(`    ❌ SILENT in ${elapsed}s (${eventCount} events)`);
  return { responded: !!firstBotMsg, msgPreview: firstBotMsg, eventCount, elapsed };
}

(async () => {
  console.log(`=== Test with mimicBind (eval-orchestrator-style) ===`);

  // Test 1: live launch bot
  console.log(`\n--- TEST 1: Live launch bot with mimicBind to GS Ads sandbox ---`);
  const live = await testSessionWithBind(LAUNCH, SANDBOX_SRC, 'live launch');

  await sleep(5000);

  // Test 2: fresh duplicate with persona + mimicBind
  console.log(`\n--- TEST 2: Fresh duplicate with persona + mimicBind ---`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  const dupId = dup.json.id || dup.json.bot?.id;
  console.log(`  new bot: ${dupId}`);
  await req('PUT', `/bot/${dupId}`, { name: `[MIMICBIND-TEST] ${new Date().toISOString().slice(11, 19)}` });
  await req('PUT', `/bot/${dupId}`, { personaIds: [EMMA] });
  await sleep(2000);
  await req('POST', `/bot/${dupId}/publish`, {});
  await sleep(2000);
  const dupRes = await testSessionWithBind(dupId, SANDBOX_SRC, 'fresh duplicate');

  console.log(`\n=== SUMMARY ===`);
  console.log(`Live launch bot with mimicBind:  ${live.responded ? '✅' : '❌'}`);
  console.log(`Fresh duplicate with mimicBind:  ${dupRes.responded ? '✅' : '❌'}`);
})().catch(e => console.log(`FATAL: ${e.message}`));
