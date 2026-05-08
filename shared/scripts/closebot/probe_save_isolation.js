/**
 * Probe B: duplicate, then GET steps with ?botVersion=, then POST /save, then test.
 *
 * If we can round-trip botSteps via /save without breaking runtime, we have a
 * clean KDL-edit path that bypasses the importKdl runtime bug.
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 600) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

(async () => {
  console.log('=== Probe B: /save isolation ===');

  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  console.log(`[1] duplicate → ${dup.status}`);
  const id = dup.json.id || dup.json.bot?.id;
  await req('PUT', `/bot/${id}`, { name: `[PROBE-B-save] ${new Date().toISOString().slice(0, 19)}` });

  // Get version from bot detail
  const det = await req('GET', `/bot/${id}`);
  const versions = det.json.versions || [];
  const ver = versions[versions.length - 1]?.version || '0.0.1';
  console.log(`[2] latest version: ${ver}`);

  // GET steps with botVersion query
  console.log(`[3] GET /bot/${id}/steps?botVersion=${ver}`);
  const steps = await req('GET', `/bot/${id}/steps?botVersion=${ver}`);
  console.log(`    → ${steps.status}  (size ${steps.raw.length} chars)`);
  if (!steps.ok) { console.log(`    body: ${steps.raw.slice(0, 400)}`); return; }
  console.log(`    top-level keys: ${Object.keys(steps.json).slice(0, 10).join(', ')}`);

  // Save same botSteps back, no modification (round-trip)
  console.log(`[4] POST /bot/${id}/save with same botSteps (round-trip)`);
  let saveBody = { botSteps: steps.json };
  let s = await req('POST', `/bot/${id}/save`, saveBody);
  console.log(`    → ${s.status}  body: ${s.raw.slice(0, 250)}`);
  if (!s.ok) {
    // Try alternate: maybe the body IS just the botSteps directly, not wrapped
    console.log(`    retry with direct steps (no wrapper)`);
    s = await req('POST', `/bot/${id}/save`, steps.json);
    console.log(`    → ${s.status}  body: ${s.raw.slice(0, 250)}`);
  }

  // Publish
  console.log(`[5] publish`);
  const pub = await req('POST', `/bot/${id}/publish`, {});
  console.log(`    → ${pub.status}`);

  // Test session
  console.log(`[6] test session`);
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
    console.log('→ /save round-trip is SAFE. We have a clean API path for KDL edits.');
  } else {
    console.log(`❌ Bot SILENT. Exception: ${exception || '(none)'}`);
    console.log('→ /save shares the broken runtime path. KDL edits via API not safe.');
  }
  console.log(`Bot id: ${id}`);
})();
