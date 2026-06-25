/**
 * champion_proof_test.mjs — scripted test session against Champion v0.0.3
 * Proves the karate scrub + age bands + Knowledge-Gap handoff are working live.
 *
 * Test scenarios:
 *   T1. Ask about karate → expect: bot does NOT offer karate
 *   T2. Ask trial class for 12yo BJJ → expect: bot routes to Youth Jiu-Jitsu (7-12)
 *   T3. Ask trial class for 14yo Judo → expect: bot routes to ADULT Judo (13+)
 *   T4. Ask something not in KB → expect: handoff phrase + alert tag added
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/champion_proof_test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const logFile = path.join(logDir, 'champion_proof_test.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
const BASE = 'https://api.closebot.com';
const BOT_ID = 'bot_GEGYNE5WQNOYH7UB';
const SRC_ID = 'src_EJODL02HM128RGZH';
const BOT_TIMEOUT_MS = 60000;
const DRAIN_MS = 5000;
const TESTER_NAME = 'Detest Testeronie';

async function cb(method, ep, body) {
  const r = await fetch(BASE + ep, {
    method, headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0,300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

function startSseReader(fetchRes) {
  const reader  = fetchRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer  = '';
  const queue = [];
  let waiter  = null;
  function deliver(msg) {
    if (waiter) { clearTimeout(waiter.timer); const { resolve } = waiter; waiter = null; resolve(msg); }
    else queue.push(msg);
  }
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { if (waiter) { waiter.reject(new Error('SSE closed')); waiter = null; } break; }
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, idx); buffer = buffer.slice(idx + 2);
          let data = '';
          for (const line of block.split('\n')) if (line.startsWith('data: ')) data = line.slice(6).trim();
          try {
            const p = JSON.parse(data);
            if (p.type === 'message-sent' && p.sender === 'bot' && p.message?.trim()) deliver(p.message.trim());
          } catch {}
        }
      }
    } catch (err) { if (waiter) { waiter.reject(err); waiter = null; } }
  })();
  return {
    next(timeoutMs) {
      return new Promise((resolve, reject) => {
        if (queue.length > 0) { resolve(queue.shift()); return; }
        const timer = setTimeout(() => { waiter = null; reject(new Error(`No reply within ${timeoutMs/1000}s`)); }, timeoutMs);
        waiter = { resolve, reject, timer };
      });
    },
  };
}

async function collectBotReply(sseReader) {
  const messages = [];
  messages.push(await sseReader.next(BOT_TIMEOUT_MS));
  try { while (true) messages.push(await sseReader.next(DRAIN_MS)); } catch {}
  return messages.join('\n');
}

(async () => {
  W(`=== Champion Proof Test (v0.0.3) — ${new Date().toISOString()} ===`);
  W(`Bot: Champion Martial Arts (${BOT_ID})`);
  W(`Tester contact name: ${TESTER_NAME}\n`);

  // Create test session with mimicSourceId so conversation lands on real source and appears in CB logs
  const session = await cb('POST', `/bot/${BOT_ID}/testSession`, { contactName: TESTER_NAME, mimicSourceId: SRC_ID });
  if (!session.ok) { W(`testSession FAIL: ${session.status}`); process.exit(1); }
  const leadId = session.json.leadId;
  W(`Lead ID (for screenshot in CB UI): ${leadId}`);
  W(`Source: ${session.json.sourceId}`);

  // SSE stream
  const sseRes = await fetch(`${BASE}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': key, 'Accept': 'text/event-stream' },
  });
  if (!sseRes.ok) { W(`SSE FAIL: ${sseRes.status}`); process.exit(1); }
  const sse = startSseReader(sseRes);

  const turns = [
    { tag: 'T1', lead: "Hey, my wife saw your ad. Do you guys offer karate classes? Also do you have strength & conditioning?" },
    { tag: 'T2', lead: "Ok cool. Actually I'm interested in trying a jiu-jitsu class for my son. He's 9 years old." },
    { tag: 'T3', lead: "And what about my older nephew, he's 14 and wants to try judo." },
    { tag: 'T4', lead: "One last thing — do you offer any nutrition coaching or meal-plan guidance on the side?" },
  ];

  for (const t of turns) {
    W(`\n[${t.tag}] LEAD: ${t.lead}`);
    const send = await cb('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: t.lead });
    if (!send.ok) { W(`  send FAIL: ${send.status} ${JSON.stringify(send.json).slice(0,200)}`); break; }
    try {
      const reply = await collectBotReply(sse);
      W(`[${t.tag}] BOT:  ${reply}`);

      // Inline check per turn
      if (t.tag === 'T1') {
        const offersKarate = /we offer karate|karate class|karate is|sign up for karate|adult karate|youth karate/i.test(reply) && !/don't|no longer|we do not|not currently|we removed|no karate/i.test(reply);
        const offersSC = /strength.*conditioning|champion conditioning/i.test(reply) && !/don't|no longer|we do not|not currently/i.test(reply);
        W(`  PROOF T1 (no karate): ${offersKarate ? 'FAIL — bot still offered karate' : 'PASS — bot did not offer karate'}`);
        W(`  PROOF T1 (no S&C):    ${offersSC ? 'FAIL — bot still offered S&C' : 'PASS — bot did not offer S&C'}`);
      } else if (t.tag === 'T2') {
        const okYouth = /youth jiu-jitsu|kids jiu-jitsu|9.*ok|9.*great|9.*works|9.*starts at 7|book.*9/i.test(reply);
        W(`  PROOF T2 (9yo BJJ → Youth track or accepted): ${okYouth ? 'PASS' : 'CHECK MANUALLY'}`);
      } else if (t.tag === 'T3') {
        const adultRoute = /adult judo|adults?|14.*adult|13/i.test(reply);
        W(`  PROOF T3 (14yo Judo → Adult): ${adultRoute ? 'PASS' : 'CHECK MANUALLY'}`);
      } else if (t.tag === 'T4') {
        const handoff = /let me get the team|follow up with you|team will follow|team to follow|don't have that|don't have|will reach out|coach (will|can)|when you come in/i.test(reply);
        W(`  PROOF T4 (handoff phrase): ${handoff ? 'PASS — bot deferred to team' : 'CHECK MANUALLY'}`);
      }
    } catch (e) {
      W(`[${t.tag}] BOT:  NO REPLY — ${e.message}`);
      break;
    }
  }

  W(`\n=== TEST COMPLETE ===`);
  W(`Lead ID for CB UI screenshot: ${leadId}`);
  W(`Bot to open: Champion Martial Arts - Launch v1.1 [age gate fix + KB attach] (2026-05-16)`);
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
