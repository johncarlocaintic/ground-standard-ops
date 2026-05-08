// gs_v4_diagnostic.js
// Single-turn test against v4.0 bot to check which bot actually responds.
// Captures all SSE events with full frontendNodeId details.
import fs from 'fs';
const CB = 'https://api.closebot.com';
const CB_KEY = process.env.CB_GS_API_KEY;
const BOT_ID = 'bot_DR18GF3ZG7IH5QOM';
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
  console.log(`Session created. leadId: ${leadId}`);

  const bind = await req('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: MIMIC_SRC });
  console.log(`mimicBind: ${bind.status}`);

  // Start SSE stream
  const events = [];
  let stopReader = false;
  const readLoop = async () => {
    while (!stopReader) {
      try {
        const res = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
          headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' }
        });
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (!stopReader) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const ev = JSON.parse(line.slice(6));
                events.push(ev);
                console.log(`EVENT: type=${ev.type} nodeId=${ev.action?.frontendNodeId || '-'} text="${(ev.message || ev.text || '').slice(0, 100)}"`);
              } catch {}
            }
          }
        }
      } catch {}
      if (!stopReader) await new Promise(r => setTimeout(r, 50));
    }
  };
  readLoop();

  await new Promise(r => setTimeout(r, 600));
  console.log(`\n>>> Sending: "hi, do you have bjj classes?"`);
  await req('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: 'hi, do you have bjj classes?' });

  // Wait 90 seconds for bot replies
  await new Promise(r => setTimeout(r, 90000));
  stopReader = true;
  await new Promise(r => setTimeout(r, 200));

  console.log('\n=== SUMMARY ===');
  const nodeIds = [...new Set(events.filter(e => e.action?.frontendNodeId).map(e => e.action.frontendNodeId))];
  console.log(`Total events: ${events.length}`);
  console.log(`Unique frontendNodeIds: ${JSON.stringify(nodeIds)}`);
  console.log(`\nIs v4? ${nodeIds.some(n => n === 'n10_intro' || n === 'n20_details' || n === 'n30_book') ? 'YES' : 'NO'}`);
  console.log(`Is v3? ${nodeIds.some(n => n.includes('adult_lastname') || n === 'n02_getname' || n === 'n06_whofor_ask') ? 'YES' : 'NO'}`);

  fs.writeFileSync('shared/logs/v4_diagnostic_events.json', JSON.stringify(events, null, 2));
  console.log(`\nFull events → shared/logs/v4_diagnostic_events.json`);
})();
