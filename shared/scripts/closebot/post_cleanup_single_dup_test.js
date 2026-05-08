/**
 * Post-cleanup single duplicate test.
 *
 * 1. Verify launch bot still has its persona, tools, sources (i.e. cleanup didn't
 *    break the live bot).
 * 2. Single duplicate, single test session, observe result.
 *
 * Source: bot_J56AWZ5TYQI9HKJS — DUPLICATE-ONLY, never modified.
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
  console.log(`=== Post-cleanup single duplicate test ===\n`);

  // Step 1: launch bot health
  console.log(`[1] Verify live launch bot is healthy`);
  const live = await req('GET', `/bot/${LAUNCH}`);
  console.log(`    name:       ${live.json.name}`);
  console.log(`    versions:   ${(live.json.versions || []).length}`);
  console.log(`    personaIds: ${JSON.stringify(live.json.personaIds)}`);
  console.log(`    tools:      ${(live.json.tools || []).map(t => t.type).join(',') || 'none'}`);
  console.log(`    sources:    ${(live.json.sources || []).map(s => s.name).join(', ') || 'none'}`);
  console.log('');

  // Step 2: count bots in account
  const list = await req('GET', `/bot`);
  const botCount = (list.json.bots || list.json.data || []).length || (Array.isArray(list.json) ? list.json.length : 0);
  console.log(`[2] account bot count: ${botCount}`);
  console.log('');

  // Step 3: single duplicate
  console.log(`[3] POST /bot/${LAUNCH}/duplicate`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  console.log(`    → ${dup.status}`);
  if (!dup.ok) { console.log(`    body: ${dup.raw.slice(0, 200)}`); return; }
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`    new bot: ${id}`);

  await req('PUT', `/bot/${id}`, { name: `[POST-CLEANUP-TEST] ${new Date().toISOString().slice(11, 19)}` });

  // Step 4: detail
  const det = await req('GET', `/bot/${id}`);
  console.log(`[4] GET /bot/${id}`);
  console.log(`    personaIds: ${JSON.stringify(det.json.personaIds)}`);
  console.log(`    tools:      ${(det.json.tools || []).map(t => t.type).join(',') || 'none'}`);

  // Step 5: publish
  const pub = await req('POST', `/bot/${id}/publish`, {});
  console.log(`[5] publish → ${pub.status}`);

  // Step 6: test session
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) { console.log(`session create failed: ${sess.status}`); return; }
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`[6] testSession leadId: ${leadId}`);

  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`    SSE: ${sse.status}`);
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
  console.log('');
  if (firstBotMsg) {
    console.log(`✅ Bot REPLIED in ${elapsed}s: "${firstBotMsg.slice(0, 100)}"`);
    console.log(`→ Account-state cleanup HELPED. Duplicate path is healthy from clean state.`);
  } else {
    console.log(`❌ Bot SILENT in ${elapsed}s.`);
    console.log(`→ Cleanup did NOT help. Issue is something else.`);
  }
  console.log(`\nProbe bot: ${id}`);
})();
