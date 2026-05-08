/**
 * Probe A: duplicate, then ONLY /saveTools, then test.
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
  console.log('=== Probe A: /saveTools isolation ===');
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  console.log(`[1] duplicate → ${dup.status}`);
  const id = dup.json.id || dup.json.bot?.id;
  await req('PUT', `/bot/${id}`, { name: `[PROBE-A-saveTools] ${new Date().toISOString().slice(0, 19)}` });

  console.log(`[2] saveTools (SmartFAQ)`);
  const st = await req('POST', `/bot/${id}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { $type: 'smart_faq' } },
  ]);
  console.log(`    → ${st.status}  body: ${st.raw.slice(0, 150)}`);

  console.log(`[3] publish`);
  const pub = await req('POST', `/bot/${id}/publish`, {});
  console.log(`    → ${pub.status}`);

  console.log(`[4] test session`);
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  const leadId = sess.json.leadId || sess.json.id;
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await new Promise(r => setTimeout(r, 600));
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let firstBotMsg = null;
  let exception = null;
  while (Date.now() - start < 60_000) {
    const { value, done } = await Promise.race([reader.read(), new Promise(r => setTimeout(() => r({ done: false, value: null }), 1500))]);
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
  const el = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== RESULT after ${el}s ===`);
  if (firstBotMsg) {
    console.log(`✅ Bot REPLIED: "${firstBotMsg.slice(0, 100)}"`);
    console.log('→ /saveTools alone does NOT break runtime. SmartFAQ enablement via API is SAFE.');
  } else {
    console.log(`❌ Bot SILENT. Exception: ${exception || '(none)'}`);
    console.log('→ /saveTools triggers the vendor runtime bug. SmartFAQ must be enabled via UI.');
  }
  console.log(`Bot id: ${id}`);
})();
