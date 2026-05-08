/**
 * Capture ALL SSE events from a fresh duplicate's test session.
 *
 * What we're looking for:
 *   - "logs" events with severity 4 (exceptions)
 *   - "action" events showing which node fired
 *   - Anything other than silence
 *
 * If we see actions/logs but no message-sent → the bot IS running, just not replying.
 * If we see nothing → the bot isn't even processing, problem is upstream.
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

(async () => {
  console.log(`=== SSE event debug ===\n`);

  // Make a fresh duplicate, attach persona, publish
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`bot id: ${id}`);
  await req('PUT', `/bot/${id}`, { name: `[DEBUG-SSE] ${new Date().toISOString().slice(11, 19)}` });
  await req('PUT', `/bot/${id}`, { personaIds: [EMMA] });
  await sleep(2000);
  await req('POST', `/bot/${id}/publish`, {});
  await sleep(2000);

  const det = await req('GET', `/bot/${id}`);
  console.log(`personaIds: ${JSON.stringify(det.json.personaIds)}`);
  console.log(`tools: ${(det.json.tools || []).map(t => t.type).join(',') || 'none'}`);
  console.log('');

  // Open test session
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`session leadId: ${leadId}`);

  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`SSE status: ${sse.status}`);
  await sleep(800);

  console.log(`sending "Hi"...`);
  const send = await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });
  console.log(`send → ${send.status}, body: ${send.raw.slice(0, 200)}`);
  console.log('');

  // Capture EVERY event for 60 seconds
  console.log(`--- ALL SSE events for 60s ---`);
  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let totalEvents = 0;
  while (Date.now() - start < 60_000) {
    const { value, done } = await Promise.race([reader.read(), new Promise(r => setTimeout(() => r({ done: false, value: null }), 1500))]);
    if (done) { console.log('  (stream ended)'); break; }
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
        totalEvents++;
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        if (evt.type === 'logs' && Array.isArray(evt.logs)) {
          for (const lg of evt.logs) {
            console.log(`  [${elapsed}s] LOG severity=${lg.severity}: ${(lg.message || '').slice(0, 200)}`);
          }
        } else {
          console.log(`  [${elapsed}s] ${evt.type || '?'}: ${JSON.stringify(evt).slice(0, 250)}`);
        }
      } catch {}
    }
  }
  try { reader.releaseLock(); } catch {}
  console.log(`\nTotal events captured: ${totalEvents}`);
  console.log(`Bot id: ${id}`);
})();
