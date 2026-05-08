/**
 * SSE diagnostic — runs a single test session and dumps ALL raw SSE events
 * (including pings) for 75 seconds. Used to debug why certain openers
 * produce zero bot replies in the adversarial harness.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_sse_diagnostic.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

const BOT_ID  = process.env.V3_BOT_ID || 'bot_7O3AD9UZ0CHRD2HE';
const SRC_ID  = 'src_4R4DUIQTMMX2NFPU';
const CB      = 'https://api.closebot.com';
const WATCH_MS = 75_000;

// Test the two most interesting cases: one that always fails, one that always works
const TESTS = [
  { label: 'FAIL - single word',  opener: 'interested' },
  { label: 'FAIL - pricing',      opener: 'How much does it cost per month?' },
  { label: 'FAIL - identity',     opener: 'hi are you a real person or a bot?' },
  { label: 'FAIL - wrong sport',  opener: 'Do you guys teach karate? I did it as a kid and want to get back into it.' },
  { label: 'WORK - standard',     opener: "hi I'm interested in adult jiu jitsu classes" },
];

async function api(method, ep, body) {
  const H = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };
  const r = await fetch(`${CB}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 300) }; }
}

async function runDiagnostic(test) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${test.label}`);
  console.log(`OPENER: "${test.opener}"`);
  console.log(`${'='.repeat(70)}`);

  // Create session
  const s = await api('POST', `/bot/${BOT_ID}/testSession`, {});
  console.log(`createSession → ${s.status}  leadId: ${s.json?.leadId}`);
  if (!s.ok) { console.error('FAIL create session'); return; }
  const leadId = s.json.leadId;

  // Bind source
  const b = await api('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: SRC_ID });
  console.log(`mimicBind → ${b.status}  response: ${JSON.stringify(b.json || b.raw).slice(0, 100)}`);

  // Open SSE stream
  const sseRes = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' },
  });
  console.log(`SSE open → ${sseRes.status}`);

  const reader = sseRes.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const events = [];

  // Read loop in background
  let done = false;
  const readLoop = (async () => {
    try {
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) { console.log('[SSE] stream closed by server'); break; }
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) !== -1) {
          const blk = buf.slice(0, i); buf = buf.slice(i + 2);
          let data = '';
          for (const ln of blk.split('\n')) if (ln.startsWith('data: ')) data = ln.slice(6).trim();
          if (!data) continue;
          try {
            const p = JSON.parse(data);
            events.push(p);
            const ts = new Date().toISOString().slice(11, 23);
            if (p.type === 'ping') {
              process.stdout.write(`[${ts}] PING\n`);
            } else {
              console.log(`[${ts}] EVENT: ${JSON.stringify(p).slice(0, 300)}`);
            }
          } catch { console.log(`[RAW] ${data.slice(0, 200)}`); }
        }
      }
    } catch (e) { console.log(`[SSE read error] ${e.message}`); }
  })();

  // Wait 2 seconds then send message
  await new Promise(r => setTimeout(r, 2000));
  console.log(`\n[SEND] "${test.opener}"`);
  const send = await api('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: test.opener });
  console.log(`send → ${send.status}  ${JSON.stringify(send.json || send.raw).slice(0, 100)}`);

  // Watch for WATCH_MS ms
  await new Promise(r => setTimeout(r, WATCH_MS));
  done = true;
  reader.cancel().catch(() => {});

  const nonPing = events.filter(e => e.type !== 'ping');
  console.log(`\n[SUMMARY] ${events.length} total events, ${nonPing.length} non-ping`);
  console.log(`[SUMMARY] event types: ${[...new Set(events.map(e => e.type))].join(', ')}`);
  const botMsgs = nonPing.filter(e => e.type === 'message-sent' && e.sender === 'bot');
  console.log(`[SUMMARY] bot messages: ${botMsgs.length}`);
  if (botMsgs.length) {
    botMsgs.forEach(m => console.log(`  BOT: "${m.message?.slice(0, 200)}"`));
  }

  return nonPing;
}

(async () => {
  for (const t of TESTS) {
    await runDiagnostic(t);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('\n=== DIAGNOSTIC COMPLETE ===');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
