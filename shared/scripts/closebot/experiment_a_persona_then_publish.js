/**
 * Experiment A: does PUT personaIds + wait + publish + test produce a working bot?
 *
 * Hypothesis: maybe the runtime binding between persona and workflow is set up
 * during publish if persona is already on the bot record. The earlier diagnostic
 * may have rushed publish before the PUT had time to settle.
 *
 *   1. /duplicate (gets us a fresh bot with empty personaIds/tools)
 *   2. PUT personaIds  (sets the field; we already know this returns 200)
 *   3. Wait 5 seconds
 *   4. Verify GET /bot/{id} shows personaIds populated
 *   5. POST /publish
 *   6. Wait 3 seconds
 *   7. Test session: send "Hi", see if bot replies
 *
 *   Run it 3 times to rule out random noise.
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

async function testRespond(id) {
  const sess = await req('POST', `/bot/${id}/testSession`, {});
  if (!sess.ok) return { responded: false, reason: 'session create fail' };
  const leadId = sess.json.leadId || sess.json.id;
  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  await sleep(800);
  await req('POST', `/bot/${id}/testSession/message`, { leadId, message: 'Hi' });

  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '', firstBotMsg = null;
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
  return { responded: !!firstBotMsg, msgPreview: firstBotMsg?.slice(0, 100), elapsed };
}

async function singleIteration(label) {
  console.log(`\n--- iter ${label} ---`);

  console.log(`  duplicate`);
  const dup = await req('POST', `/bot/${LAUNCH}/duplicate`, {});
  if (!dup.ok) { console.log(`  duplicate fail: ${dup.status}`); return; }
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`  new bot: ${id}`);
  await req('PUT', `/bot/${id}`, { name: `[EXP-A-${label}] ${new Date().toISOString().slice(11, 19)}` });

  // Pre-PUT state
  const pre = await req('GET', `/bot/${id}`);
  console.log(`  before PUT: personaIds=${JSON.stringify(pre.json.personaIds)}`);

  // PUT personaIds
  console.log(`  PUT personaIds`);
  const put = await req('PUT', `/bot/${id}`, { personaIds: [EMMA] });
  console.log(`    → ${put.status}`);

  // Wait for settle
  console.log(`  waiting 5s`);
  await sleep(5000);

  // Verify
  const verify = await req('GET', `/bot/${id}`);
  console.log(`  after wait: personaIds=${JSON.stringify(verify.json.personaIds)}`);

  // Publish
  console.log(`  publish`);
  const pub = await req('POST', `/bot/${id}/publish`, {});
  console.log(`    → ${pub.status}`);

  // Wait for publish settle
  await sleep(3000);

  // Verify post-publish
  const post = await req('GET', `/bot/${id}`);
  console.log(`  after publish: personaIds=${JSON.stringify(post.json.personaIds)} versions=${(post.json.versions || []).length}`);

  // Test session
  console.log(`  testSession`);
  const r = await testRespond(id);
  if (r.responded) console.log(`  ✅ REPLY in ${r.elapsed}s: "${r.msgPreview}"`);
  else console.log(`  ❌ NO REPLY in ${r.elapsed}s`);
  return { id, postPersona: post.json.personaIds, responded: r.responded, elapsed: r.elapsed, msgPreview: r.msgPreview };
}

(async () => {
  console.log(`=== Experiment A: duplicate → PUT persona → wait → publish → test ===\n`);
  const results = [];
  for (let i = 1; i <= 3; i++) {
    const r = await singleIteration(`${i}`);
    results.push(r);
    if (i < 3) {
      console.log(`  cooldown 5s`);
      await sleep(5000);
    }
  }
  console.log(`\n\n=== RESULTS ===`);
  for (const r of results) console.log(`  ${r.id}  persona=${JSON.stringify(r.postPersona)}  responded=${r.responded ? '✅' : '❌'} (${r.elapsed}s)`);
  const allWorked = results.every(r => r.responded);
  console.log(`\nVerdict: ${allWorked ? '✅ WORKS — duplicate + PUT persona + publish gives a working bot' : '❌ Still not working — issue is deeper than persona attach'}`);
})().catch(e => console.log(`FATAL: ${e.message}`));
