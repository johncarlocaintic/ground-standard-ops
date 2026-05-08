// gs_v4_2_diagnostic.js
// Captures ALL SSE events from a v4.2 test session.
// Uses PUT mimicBind after session create.
import fs from 'fs';
const CB = 'https://api.closebot.com';
const CB_KEY = process.env.CB_GS_API_KEY;
const BOT_ID = 'bot_W7ZC8X7DD98QMDA6';
const MIMIC_SRC = 'src_4R4DUIQTMMX2NFPU';

async function req(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; }
  catch { return { status: r.status, raw: t }; }
}

(async () => {
  console.log(`Target bot: ${BOT_ID}`);
  const s = await req('POST', `/bot/${BOT_ID}/testSession`, {});
  const leadId = s.json?.leadId;
  console.log(`Session created: ${s.status}, leadId=${leadId}`);

  const bind = await req('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: MIMIC_SRC });
  console.log(`mimicBind: ${bind.status}, body=${JSON.stringify(bind.json || bind.raw).slice(0, 200)}`);

  const events = [];
  let stopReader = false;
  const readLoop = async () => {
    try {
      const res = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
        headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' }
      });
      console.log(`SSE open: ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (!stopReader) {
        const { value, done } = await reader.read();
        if (done) { console.log('SSE stream closed by server'); break; }
        buf += dec.decode(value, { stream: true });
        const blocks = buf.split('\n\n');
        buf = blocks.pop();
        for (const block of blocks) {
          let data = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('data: ')) data = line.slice(6).trim();
          }
          if (!data) continue;
          try {
            const ev = JSON.parse(data);
            events.push(ev);
            const summary = `type=${ev.type} sender=${ev.sender || '-'} nodeId=${ev.action?.frontendNodeId || ev.frontendNodeId || '-'} text="${(ev.message || ev.text || '').slice(0, 80)}"`;
            console.log(`EVENT: ${summary}`);
          } catch (e) { console.log(`PARSE ERROR: ${data.slice(0,200)}`); }
        }
      }
    } catch (e) { console.log(`SSE error: ${e.message}`); }
  };
  readLoop();

  await new Promise(r => setTimeout(r, 800));
  console.log(`\n>>> Sending: "hi, do you have bjj classes?"`);
  const send = await req('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: 'hi, do you have bjj classes?' });
  console.log(`send: ${send.status}, body=${JSON.stringify(send.json || send.raw).slice(0, 200)}`);

  await new Promise(r => setTimeout(r, 75000));
  stopReader = true;
  await new Promise(r => setTimeout(r, 300));

  console.log('\n=== SUMMARY ===');
  console.log(`Total events: ${events.length}`);
  const types = [...new Set(events.map(e => e.type))];
  console.log(`Event types: ${JSON.stringify(types)}`);
  const senders = [...new Set(events.filter(e => e.sender).map(e => e.sender))];
  console.log(`Senders seen: ${JSON.stringify(senders)}`);
  const nodeIds = [...new Set(events.filter(e => e.action?.frontendNodeId).map(e => e.action.frontendNodeId))];
  console.log(`Unique frontendNodeIds: ${JSON.stringify(nodeIds)}`);

  fs.writeFileSync('shared/logs/v4_2_diagnostic_events.json', JSON.stringify(events, null, 2));
  console.log(`\nFull events → shared/logs/v4_2_diagnostic_events.json`);
  process.exit(0);
})();
