/**
 * Verify GHL delivery — this time with source ATTACHED to the duplicate bot.
 *
 * Steps:
 *   1. Duplicate launch
 *   2. PUT persona, publish
 *   3. POST /bot/{id}/source/{sourceId} ATTACH GS Ads sandbox (with empty tags)
 *   4. Open test session, mimicBind, send opener
 *   5. Capture bot reply via activity event detection
 *   6. Wait for GHL propagation
 *   7. Query GHL for the test contact, check conversations + messages
 *   8. Look for the bot's reply text in GHL conversation
 */
const KEY = process.env.CB_GS_API_KEY;
const CB_HEADERS = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';

const GHL_TOKEN = process.env.GHL_GS_API_TOKEN;
const GHL_LOC = process.env.GHL_GS_LOCATION_ID;
const GHL_HEADERS = {
  Authorization: `Bearer ${GHL_TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

const LAUNCH = 'bot_J56AWZ5TYQI9HKJS';
const EMMA = 'pers_CB1LLPENDKDRB5S2';
const SANDBOX_SRC = 'src_4R4DUIQTMMX2NFPU'; // GS Ads sandbox

async function cb(m, ep, b) {
  const r = await fetch(`${BASE}${ep}`, { method: m, headers: CB_HEADERS, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}
async function ghl(ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { headers: GHL_HEADERS });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log(`=== Verify GHL delivery WITH SOURCE ATTACHED ===\n`);
  const startWindow = new Date();
  console.log(`run window starts: ${startWindow.toISOString()}`);

  // 1: duplicate
  const dup = await cb('POST', `/bot/${LAUNCH}/duplicate`, {});
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`bot: ${id}`);
  await cb('PUT', `/bot/${id}`, { name: `[GHL-VERIFY-SRC] ${new Date().toISOString().slice(11, 19)}` });

  // 2: persona + publish
  await cb('PUT', `/bot/${id}`, { personaIds: [EMMA] });
  await sleep(2000);
  await cb('POST', `/bot/${id}/publish`, {});
  await sleep(2000);

  // 3: ATTACH source (GS Ads sandbox, no tag filter)
  console.log(`attaching GS Ads sandbox source to bot...`);
  const attach = await cb('POST', `/bot/${id}/source/${SANDBOX_SRC}`, {
    tags: [], channels: [], enabled: true,
  });
  console.log(`  attach → ${attach.status}`);
  if (!attach.ok) { console.log(`  body: ${attach.raw.slice(0, 200)}`); return; }

  // Verify
  const det = await cb('GET', `/bot/${id}`);
  console.log(`  bot now has sources: ${(det.json.sources || []).map(s => s.name).join(',')}`);

  // 4: test session with mimicBind
  const sess = await cb('POST', `/bot/${id}/testSession`, {});
  const leadId = sess.json.leadId || sess.json.id;
  console.log(`leadId: ${leadId}`);

  const bind = await cb('PUT', `/bot/${id}/testSession/${leadId}`, { mimicSourceId: SANDBOX_SRC });
  console.log(`mimicBind → ${bind.status}`);

  const sse = await fetch(`${BASE}/bot/${id}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': KEY, 'Accept': 'text/event-stream' },
  });
  console.log(`SSE: ${sse.status}`);
  await sleep(800);

  const sentinel = `SRCATT-${Date.now()}`;
  const opener = `Hi this is ${sentinel}, I want to try a class`;
  console.log(`sending: "${opener}"`);
  await cb('POST', `/bot/${id}/testSession/message`, { leadId, message: opener });

  // 5: capture bot reply via both detection paths
  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let botReplyFromSSE = null;
  while (Date.now() - start < 25_000) {
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
        if (evt.type === 'message-sent' && evt.sender !== 'lead' && evt.message) {
          botReplyFromSSE = { source: 'message-sent event', text: evt.message }; break;
        }
        if (evt.type === 'activity' && evt.activity) {
          const inner = typeof evt.activity === 'string' ? JSON.parse(evt.activity) : evt.activity;
          if (inner.activity === 'agent_tool_use' && inner.data) {
            const data = typeof inner.data === 'string' ? JSON.parse(inner.data) : inner.data;
            if (data.toolName === 'send_message') {
              const args = typeof data.arguments === 'string' ? JSON.parse(data.arguments) : data.arguments;
              if (args?.message) {
                botReplyFromSSE = { source: 'activity event', text: args.message }; break;
              }
            }
          }
        }
      } catch {}
    }
    if (botReplyFromSSE) break;
  }
  try { reader.releaseLock(); } catch {}

  console.log('');
  if (botReplyFromSSE) {
    console.log(`Bot reply via SSE [${botReplyFromSSE.source}]:`);
    console.log(`  "${botReplyFromSSE.text.slice(0, 200)}"`);
  } else {
    console.log(`No bot reply captured in 25s.`);
  }

  // 6: wait for GHL propagation
  console.log(`\nwaiting 15s for GHL...`);
  await sleep(15_000);

  // 7: query GHL contacts
  const list = await ghl(`/contacts/?locationId=${GHL_LOC}&limit=20&order=desc`);
  if (!list.ok) { console.log(`GHL list fail: ${list.status}`); return; }
  const contacts = list.json.contacts || [];
  const inWindow = contacts.filter(c => new Date(c.dateAdded) >= startWindow);
  console.log(`new contacts: ${inWindow.length}`);
  for (const c of inWindow) {
    console.log(`  ${c.id} | ${c.firstName || ''} ${c.lastName || ''} | ${c.email || '(no email)'} | ${c.dateAdded}`);
  }

  // 8: for each, check conversations
  let foundDelivery = false;
  for (const c of inWindow) {
    console.log(`\nchecking conversations for ${c.id}...`);
    const convs = await ghl(`/conversations/search?locationId=${GHL_LOC}&contactId=${c.id}`);
    const convList = convs.json?.conversations || [];
    console.log(`  conversations: ${convList.length}`);
    for (const conv of convList) {
      const msgs = await ghl(`/conversations/${conv.id}/messages`);
      const messages = msgs.json?.messages?.messages || msgs.json?.messages || [];
      console.log(`  conv ${conv.id}: ${messages.length} messages`);
      for (const m of messages) {
        const body = m.body || '';
        const dir = m.direction || '?';
        console.log(`    [${m.dateAdded}] ${dir}: "${body.slice(0, 100)}"`);
        if (body.includes(sentinel)) console.log(`        contains sentinel ✓`);
        if (botReplyFromSSE && body.includes(botReplyFromSSE.text.slice(0, 30))) {
          console.log(`        ✅ MATCHES BOT REPLY`);
          foundDelivery = true;
        }
      }
    }
  }

  console.log(`\n=== VERDICT ===`);
  if (foundDelivery) console.log(`✅ Bot reply DELIVERED to GHL conversation. End-to-end works.`);
  else if (inWindow.length > 0) console.log(`⚠️ Contact created, no bot reply in conversation history. Channel routing not happening.`);
  else console.log(`❌ No GHL contact created.`);
})().catch(e => console.log(`FATAL: ${e.message}\n${e.stack}`));
