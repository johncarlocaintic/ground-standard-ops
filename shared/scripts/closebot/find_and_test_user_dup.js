/**
 * Find the user's recent UI-duplicated Vacaville bot and test it.
 * The user just duplicated the live launch bot via CloseBot UI.
 * Look for a bot whose name contains "Vacaville" + has very recent modifiedAt
 * AND is not the live launch bot (J56AWZ5TYQI9HKJS) or the backup (DR18GF3ZG7IH5QOM).
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';
const BACKUP = 'bot_DR18GF3ZG7IH5QOM';

async function req(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log(`=== Find UI-duplicated Vacaville bot + test ===\n`);

  const list = await req('GET', '/bot');
  const bots = list.json.bots || list.json.data || (Array.isArray(list.json) ? list.json : []);
  console.log(`Total bots: ${bots.length}`);

  // Find Vacaville-named bots with very recent modifiedAt, excluding the live + backup
  const KEEP = new Set([LAUNCH, BACKUP]);
  const vacaville = bots.filter(b => /vacaville/i.test(b.name || '') && !KEEP.has(b.id) && !/DEMO/i.test(b.name || ''));
  // Sort by modifiedAt desc
  vacaville.sort((a, b) => (b.modifiedAt || '').localeCompare(a.modifiedAt || ''));
  console.log(`\nVacaville bots (not live, not backup, not DEMO):`);
  for (const b of vacaville.slice(0, 5)) {
    console.log(`  ${b.id} | "${b.name}" | modifiedAt: ${b.modifiedAt}`);
  }

  if (vacaville.length === 0) {
    console.log(`\nNo Vacaville duplicate found. Did you rename it to something non-"Vacaville"?`);
    return;
  }

  const target = vacaville[0];
  console.log(`\nTesting most recent: ${target.id} "${target.name}"`);

  // Pull detail
  const det = await req('GET', `/bot/${target.id}`);
  console.log(`  personaIds: ${JSON.stringify(det.json.personaIds)}`);
  console.log(`  tools: ${(det.json.tools || []).map(t => t.type).join(',') || 'none'}`);
  console.log(`  sources: ${(det.json.sources || []).map(s => s.name).join(',') || 'none'}`);
  console.log(`  versions: ${(det.json.versions || []).length} (latest published: ${(det.json.versions || []).slice(-1)[0]?.published})`);
  console.log('');

  // Test session
  console.log(`opening test session...`);
  const sess = await req('POST', `/bot/${target.id}/testSession`, {});
  if (!sess.ok) { console.log(`session create fail: ${sess.status}`); return; }
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`leadId: ${leadId}`);

  const sse = await fetch(`${BASE}/bot/${target.id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`SSE: ${sse.status}`);
  await sleep(800);

  console.log(`sending "Hi"...`);
  await req('POST', `/bot/${target.id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '', firstBotMsg = null, eventCount = 0, eventTypes = [];
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
        eventTypes.push(evt.type);
        if (evt.type === 'message-sent' && evt.sender !== 'lead' && evt.message) {
          firstBotMsg = evt.message; break;
        }
      } catch {}
    }
    if (firstBotMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nevents received: ${eventCount}`);
  console.log(`event types: ${eventTypes.join(', ')}`);
  if (firstBotMsg) {
    console.log(`✅ REPLIED in ${elapsed}s: "${firstBotMsg.slice(0, 200)}"`);
  } else {
    console.log(`❌ SILENT in ${elapsed}s`);
  }
})();
