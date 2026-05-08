// Deep diagnostic: capture FULL JSON of every SSE event, looking for backend errors in logs
import fs from 'fs';
const CB = 'https://api.closebot.com';
const CB_KEY = process.env.CB_GS_API_KEY;
const BOT_ID = process.env.CB_TEST_BOT_ID || 'bot_8MQTN84B7VJL3WW8'; // v4.4 from v4.1 source
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
  console.log(`Session: ${s.status}, leadId=${leadId}`);

  const bind = await req('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: MIMIC_SRC });
  console.log(`mimicBind: ${bind.status}`);

  const events = [];
  let stopped = false;
  const reconnect = async () => {
    while (!stopped) {
      let res;
      try {
        res = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
          headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' }
        });
      } catch { await new Promise(r => setTimeout(r, 500)); continue; }
      console.log(`SSE open: ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) { console.log('SSE stream closed by server'); break; }
          buf += dec.decode(value, { stream: true });
          const blocks = buf.split('\n\n'); buf = blocks.pop();
          for (const block of blocks) {
            let data = '';
            for (const line of block.split('\n')) if (line.startsWith('data: ')) data = line.slice(6).trim();
            if (!data) continue;
            try {
              const ev = JSON.parse(data);
              events.push({ ts: new Date().toISOString(), event: ev });
              if (ev.type !== 'ping') {
                console.log(`[${ev.type}] ${JSON.stringify(ev).slice(0, 600)}`);
              }
            } catch (e) { console.log(`PARSE ERROR: ${data.slice(0,300)}`); }
          }
        }
      } catch (e) { console.log(`Reader error: ${e.message}`); }
      if (!stopped) await new Promise(r => setTimeout(r, 50));
    }
  };
  reconnect();

  await new Promise(r => setTimeout(r, 800));
  console.log(`\n>>> Sending msg 1: "hi can you help me"`);
  const sent = await req('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: 'hi can you help me' });
  console.log(`send: ${sent.status}`);

  // Wait 30s for first reply
  await new Promise(r => setTimeout(r, 30000));

  console.log(`\n>>> Sending msg 2: "I want to book a trial class for my kid"`);
  const sent2 = await req('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: 'I want to book a trial class for my kid' });
  console.log(`send 2: ${sent2.status}`);

  // Wait 90s more for second reply
  await new Promise(r => setTimeout(r, 90000));
  stopped = true;
  await new Promise(r => setTimeout(r, 500));

  console.log('\n=== SUMMARY ===');
  console.log(`Total events: ${events.length}`);
  const types = events.reduce((acc, e) => { acc[e.event.type] = (acc[e.event.type] || 0) + 1; return acc; }, {});
  console.log(`Event type counts: ${JSON.stringify(types)}`);

  // Print all non-ping events with full JSON
  console.log('\n=== ALL NON-PING EVENTS (FULL) ===');
  for (const e of events) {
    if (e.event.type === 'ping') continue;
    console.log(`\n[${e.ts}] type=${e.event.type}`);
    console.log(JSON.stringify(e.event, null, 2));
  }

  fs.writeFileSync('shared/logs/v4_4_deep_events.json', JSON.stringify(events, null, 2));
  console.log(`\nFull → shared/logs/v4_4_deep_events.json`);
  process.exit(0);
})();
