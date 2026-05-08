/**
 * Cross-check bot message delivery against GHL.
 *
 * Plan:
 *   1. Duplicate launch bot, attach persona, publish
 *   2. Open test session, mimicBind to GS Ads sandbox source
 *   3. Send "Hi" — capture all SSE events
 *   4. Look in events for the bot's send_message tool call (extract reply text)
 *   5. Wait 30 seconds for delivery
 *   6. Query GS Ads GHL: list recent contacts, find the "Testing" contact created in this run window
 *   7. Pull that contact's conversation history
 *   8. Compare: does the bot's reply text appear in GHL conversation messages?
 *
 *   ✅ Found in GHL → bot is actually delivering messages, just SSE format changed
 *   ❌ Not in GHL → bot is going through motions but not delivering
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

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
  console.log(`=== Verify GHL delivery of bot replies ===\n`);

  const startWindow = new Date();
  console.log(`run window starts: ${startWindow.toISOString()}`);

  // 1-3: setup
  const dup = await cb('POST', `/bot/${LAUNCH}/duplicate`, {});
  const id = dup.json.id || dup.json.bot?.id;
  console.log(`bot: ${id}`);
  await cb('PUT', `/bot/${id}`, { name: `[GHL-VERIFY] ${new Date().toISOString().slice(11, 19)}` });
  await cb('PUT', `/bot/${id}`, { personaIds: [EMMA] });
  await sleep(2000);
  await cb('POST', `/bot/${id}/publish`, {});
  await sleep(2000);

  // Open test session with mimicBind to GS Ads sandbox
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

  // Send a unique opener so we can find it in GHL
  const sentinel = `SENTINEL-${Date.now()}`;
  const opener = `Hi this is ${sentinel}, I'm interested in classes`;
  console.log(`sending: "${opener}"`);
  await cb('POST', `/bot/${id}/testSession/message`, { leadId, message: opener });

  // Capture events for 20s, extract bot reply from activity events
  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '';
  let botReplyFromSSE = null;
  while (Date.now() - start < 20_000) {
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
        // Try the legacy detection
        if (evt.type === 'message-sent' && evt.sender !== 'lead' && evt.message) {
          botReplyFromSSE = { source: 'message-sent event', text: evt.message };
          break;
        }
        // Try the activity-event detection (new SSE format)
        if (evt.type === 'activity' && evt.activity) {
          const inner = typeof evt.activity === 'string' ? JSON.parse(evt.activity) : evt.activity;
          if (inner.activity === 'agent_tool_use' && inner.data) {
            const data = typeof inner.data === 'string' ? JSON.parse(inner.data) : inner.data;
            if (data.toolName === 'send_message') {
              const args = typeof data.arguments === 'string' ? JSON.parse(data.arguments) : data.arguments;
              if (args?.message) {
                botReplyFromSSE = { source: 'activity event (agent_tool_use)', text: args.message };
                break;
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
    console.log(`Bot reply captured via SSE [${botReplyFromSSE.source}]:`);
    console.log(`  "${botReplyFromSSE.text.slice(0, 200)}"`);
  } else {
    console.log(`No bot reply captured in SSE within 20s.`);
  }

  // Wait for GHL delivery
  console.log(`\nwaiting 15s for GHL delivery to land...`);
  await sleep(15_000);

  // 6: Query GS Ads GHL for recent contacts in this window
  console.log(`querying GS Ads GHL for recent contacts...`);
  const list = await ghl(`/contacts/?locationId=${GHL_LOC}&limit=20&order=desc`);
  if (!list.ok) {
    console.log(`GHL contacts list failed: ${list.status} ${list.raw.slice(0, 200)}`);
    return;
  }
  const contacts = list.json.contacts || [];
  const inWindow = contacts.filter(c => new Date(c.dateAdded) >= startWindow);
  console.log(`contacts created since run start: ${inWindow.length}`);
  for (const c of inWindow) {
    console.log(`  ${c.id} | ${c.firstName || ''} ${c.lastName || ''} | ${c.email} | ${c.dateAdded}`);
  }

  // 7: For each candidate, pull conversation messages and look for sentinel + bot reply
  let foundDelivery = false;
  for (const c of inWindow) {
    console.log(`\nchecking conversations on contact ${c.id}...`);
    // Find conversation for this contact
    const convs = await ghl(`/conversations/search?locationId=${GHL_LOC}&contactId=${c.id}`);
    if (!convs.ok) { console.log(`  conv search failed: ${convs.status}`); continue; }
    const convList = convs.json.conversations || [];
    console.log(`  conversations: ${convList.length}`);
    for (const conv of convList) {
      const msgs = await ghl(`/conversations/${conv.id}/messages`);
      if (!msgs.ok) { console.log(`  msgs fail: ${msgs.status}`); continue; }
      const messages = msgs.json.messages?.messages || msgs.json.messages || [];
      console.log(`  conv ${conv.id}: ${messages.length} messages`);
      for (const m of messages) {
        const body = m.body || '';
        const senderType = m.direction || (m.contactId ? 'inbound' : 'outbound');
        console.log(`    [${m.dateAdded}] ${senderType}: "${(body || '').slice(0, 100)}"`);
        if (body.includes(sentinel)) console.log(`        contains sentinel ✓`);
        if (botReplyFromSSE && body.includes(botReplyFromSSE.text.slice(0, 30))) {
          console.log(`        ✅ MATCHES BOT REPLY FROM SSE`);
          foundDelivery = true;
        }
      }
    }
  }

  console.log(`\n=== VERDICT ===`);
  if (foundDelivery) {
    console.log(`✅ Bot message DELIVERED to GHL conversation. Bot is working end-to-end.`);
  } else if (inWindow.length > 0) {
    console.log(`⚠️  Contacts created in GHL but bot reply NOT found in any conversation. Either delivery is broken, or the bot's reply is being delivered through a path we didn't query.`);
  } else {
    console.log(`❌ No GHL contact created at all. Test session never wrote to GHL despite mimicBind.`);
  }
})().catch(e => console.log(`FATAL: ${e.message}\n${e.stack}`));
