/**
 * Compare /duplicate behavior across two sources, sequentially.
 *   Source 1: bot_J56AWZ5TYQI9HKJS — live launch (1 sec ago duplicated, failed)
 *   Source 2: bot_DR18GF3ZG7IH5QOM — backup PROD v4.1
 *
 * If only #1 fails → launch bot specifically breaks /duplicate
 * If both fail → broader account/vendor issue
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function testDup(sourceId, label) {
  console.log(`\n=== ${label} (source: ${sourceId}) ===`);
  // First check source health
  const src = await req('GET', `/bot/${sourceId}`);
  console.log(`source state: persona=${JSON.stringify(src.json.personaIds)}  tools=[${(src.json.tools || []).map(t => t.type).join(',')}]  sources=[${(src.json.sources || []).map(s => s.name).join(',')}]`);

  const dup = await req('POST', `/bot/${sourceId}/duplicate`, {});
  console.log(`duplicate → ${dup.status}`);
  if (!dup.ok) return;
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`new bot: ${id}`);
  await req('PUT', `/bot/${id}`, { name: `[COMPARE-${label}] ${new Date().toISOString().slice(11, 19)}` });

  const det = await req('GET', `/bot/${id}`);
  console.log(`new bot state: persona=${JSON.stringify(det.json.personaIds)}  tools=[${(det.json.tools || []).map(t => t.type).join(',')}]`);

  await req('POST', `/bot/${id}/publish`, {});

  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) { console.log(`session fail: ${sess.status}`); return; }
  const leadId = sess.json.leadId || sess.json.id;
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await new Promise(r => setTimeout(r, 800));
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let firstBotMsg = null;
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
        if (evt.message && evt.sender !== 'lead') { firstBotMsg = evt.message; break; }
      } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(firstBotMsg ? `✅ REPLY in ${elapsed}s: "${firstBotMsg.slice(0, 80)}"` : `❌ NO REPLY in ${elapsed}s`);
}

(async () => {
  await testDup('bot_DR18GF3ZG7IH5QOM', 'BACKUP-v4.1');
  console.log('\n--- 5s cooldown ---\n');
  await new Promise(r => setTimeout(r, 5000));
  await testDup('bot_J56AWZ5TYQI9HKJS', 'LAUNCH');
})();
