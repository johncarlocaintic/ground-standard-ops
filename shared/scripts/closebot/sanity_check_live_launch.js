/**
 * Sanity check: live launch bot test session.
 *
 * Verify bot_J56AWZ5TYQI9HKJS still responds. No mimicSourceId, no GHL writes,
 * just a test session to confirm the bot itself is healthy.
 */
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

(async () => {
  console.log(`=== Live launch bot sanity check ===\n`);

  // Health snapshot
  const det = await req('GET', `/bot/${LAUNCH}`);
  console.log(`name:       ${det.json.name}`);
  console.log(`personaIds: ${JSON.stringify(det.json.personaIds)}`);
  console.log(`tools:      ${(det.json.tools || []).map(t => t.type).join(',') || 'none'}`);
  console.log(`sources:    ${(det.json.sources || []).map(s => s.name).join(',') || 'none'}`);
  console.log(`versions:   ${(det.json.versions || []).length} (latest published: ${(det.json.versions || []).slice(-1)[0]?.published})`);
  console.log('');

  // Test session
  console.log(`opening test session...`);
  const sess = await req('POST', `/bot/${LAUNCH}/testSession`, {});
  if (!sess.ok) { console.log(`session create failed: ${sess.status} ${sess.raw.slice(0, 200)}`); return; }
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`leadId: ${leadId}`);

  const sse = await fetch(`${BASE}/bot/${LAUNCH}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`SSE: ${sse.status}`);
  await new Promise(r => setTimeout(r, 800));

  console.log(`sending "Hi"...`);
  await req('POST', `/bot/${LAUNCH}/testSession/message`, { leadId, message: 'Hi' });

  // Listen for response
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
        if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; }
      } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nevents received: ${eventCount}`);
  if (firstBotMsg) {
    console.log(`✅ LIVE LAUNCH BOT RESPONDED in ${elapsed}s:`);
    console.log(`   "${firstBotMsg.slice(0, 200)}"`);
    console.log(`\n→ Live launch bot is healthy. Bobby's leads are getting served.`);
  } else {
    console.log(`❌ LIVE LAUNCH BOT DID NOT RESPOND in ${elapsed}s`);
    console.log(`\n→ This is a major problem. The live bot may also be affected.`);
  }
})();
