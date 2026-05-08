/**
 * Tightest possible test: duplicate the launch bot, do NOTHING else, send "hi",
 * see if it responds. If yes → /saveTools is what broke it. If no → /duplicate
 * itself is making bad bots right now (vendor regression on clone path).
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH_BOT = 'bot_J56AWZ5TYQI9HKJS';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

(async () => {
  console.log('=== Tightest test: duplicate, publish, test session, NOTHING else ===');

  const dup = await req('POST', `/bot/${LAUNCH_BOT}/duplicate`, {});
  console.log(`[1] duplicate → ${dup.status}`);
  if (!dup.ok) return console.log('FAIL');
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`    id: ${id}`);

  await req('PUT', `/bot/${id}`, { name: `[ISOLATION-PROBE] duplicate-only ${new Date().toISOString().slice(0, 19)}` });

  const pub = await req('POST', `/bot/${id}/publish`, {});
  console.log(`[2] publish → ${pub.status}`);

  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) return console.log(`session failed: ${sess.status}`);
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`[3] session leadId: ${leadId}`);

  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`[4] SSE status: ${sse.status}`);
  await new Promise(r => setTimeout(r, 600));
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  const timeout = 60_000;
  let buf = '';
  let firstBotMsg = null;
  let exception = null;
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
          for (const lg of evt.logs) {
            if (lg.severity >= 4 && (lg.message || '').includes('exception')) exception = lg.message;
          }
        }
        if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; }
      } catch {}
    }
    if (firstBotMsg) break;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== RESULT after ${elapsed}s ===`);
  if (firstBotMsg) {
    console.log(`✅ Bot REPLIED: "${firstBotMsg.slice(0, 100)}"`);
    console.log('→ Duplicate path is HEALTHY at runtime. Earlier failure was caused by /saveTools.');
  } else {
    console.log(`❌ Bot SILENT.`);
    console.log(`Exception logged: ${exception || '(none captured)'}`);
    console.log('→ Duplicate path itself is producing broken bots right now (vendor regression).');
  }
  try { reader.releaseLock(); } catch {}

  console.log(`\nProbe bot id: ${id} (renamed [ISOLATION-PROBE])`);
})();
