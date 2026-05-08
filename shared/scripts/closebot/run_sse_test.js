import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_sse_test.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE           = 'https://api.closebot.com';
const CB_KEY         = getEnv('CB_GS_API_KEY');   // swap key for other clients as needed
const OAIK           = getEnv('OPENAI_API_KEY');
const BOT_ID         = getEnv('CB_TEST_BOT_ID');  // CB_TEST_BOT_ID=bot_xxx node --env-file=...
const MAX_TURNS      = 12;
const BOT_TIMEOUT_MS = 60000;  // per-turn wait for first bot message
const DRAIN_MS       = 4000;   // extra wait after first message to catch follow-ups

const CB_HEADERS = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cbReq(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: CB_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function gptReply(conversation, persona) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OAIK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are simulating a real person texting a business chatbot. Persona: ${persona}
Keep replies short and natural — 1-2 sentences. Never break character. Never ask multiple questions at once.`,
        },
        ...conversation.map(m => ({
          role: m.sender === 'bot' ? 'user' : 'assistant',
          content: m.message,
        })),
      ],
      max_tokens: 120,
      temperature: 0.8,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ── SSE reader — single continuous pump feeding a queue ───────────────────────
// One pump loop runs for the entire conversation. Each call to reader.next()
// pulls the next bot message off the queue (or waits for one to arrive).
// This eliminates the race condition where multiple pump loops compete for
// the same ReadableStream reader.

function startSseReader(fetchRes) {
  const reader  = fetchRes.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';
  const queue   = [];      // bot messages waiting to be consumed
  let   waiter  = null;    // { resolve, reject, timer } for the current next() caller

  function deliver(msg) {
    if (waiter) {
      clearTimeout(waiter.timer);
      const { resolve } = waiter;
      waiter = null;
      resolve(msg);
    } else {
      queue.push(msg);
    }
  }

  // Background pump — runs for the lifetime of the conversation
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { if (waiter) { waiter.reject(new Error('SSE stream closed')); waiter = null; } break; }

        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let data = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('data: ')) data = line.slice(6).trim();
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'message-sent' && parsed.sender === 'bot' && parsed.message?.trim()) {
              deliver(parsed.message.trim());
            }
          } catch {}
        }
      }
    } catch (err) {
      if (waiter) { waiter.reject(err); waiter = null; }
    }
  })();

  return {
    // Pull next bot message from queue, or wait up to timeoutMs
    next(timeoutMs) {
      return new Promise((resolve, reject) => {
        if (queue.length > 0) { resolve(queue.shift()); return; }
        const timer = setTimeout(() => {
          waiter = null;
          reject(new Error(`No bot reply within ${timeoutMs / 1000}s`));
        }, timeoutMs);
        waiter = { resolve, reject, timer };
      });
    },
  };
}

// Waits for the first bot message, then drains briefly for follow-up messages
async function collectBotReply(sseReader) {
  const messages = [];
  messages.push(await sseReader.next(BOT_TIMEOUT_MS));   // wait for first (strict timeout)
  try {
    while (true) messages.push(await sseReader.next(DRAIN_MS)); // drain follow-ups (short timeout)
  } catch {}  // short timeout = no more follow-ups, that's fine
  return messages.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`=== CloseBot SSE Test — Bot: ${BOT_ID} ===`);

  // 1. Create test session
  log('Creating test session...');
  const session = await cbReq('POST', `/bot/${BOT_ID}/testSession`, {});
  if (!session.ok) {
    log(`FAIL — testSession: ${session.status} ${JSON.stringify(session.json)}`);
    process.exit(1);
  }

  const leadId = session.json?.leadId || session.json?.lead?.id || session.json?.id;
  if (!leadId) {
    log(`FAIL — no leadId in response: ${JSON.stringify(session.json)}`);
    process.exit(1);
  }
  log(`Session created. Lead ID: ${leadId}`);

  // 2. Open SSE stream BEFORE sending any messages
  log('Opening SSE stream...');
  const sseRes = await fetch(`${BASE}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': CB_KEY, 'Accept': 'text/event-stream' },
  });
  if (!sseRes.ok) {
    log(`FAIL — SSE stream: ${sseRes.status}`);
    process.exit(1);
  }

  const sseReader = startSseReader(sseRes);
  log('SSE stream open. Starting conversation...\n');

  // 3. Conversation loop — GPT-4o-mini generates all lead replies after the opening
  const PERSONA = "You are Alex, a potential customer who saw an ad and wants to learn more about this business — what they offer, who it's for, and whether it's worth trying. You are mildly skeptical but open to being convinced.";
  const OPENING = "Hey, saw your ad. What exactly do you guys do?";
  const conversation = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const leadMsg = turn === 0 ? OPENING : await gptReply(conversation, PERSONA);
    log(`[Turn ${turn + 1}] LEAD: ${leadMsg}`);
    conversation.push({ sender: 'lead', message: leadMsg });

    const send = await cbReq('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: leadMsg });
    if (!send.ok) {
      log(`FAIL — send message: ${send.status} ${JSON.stringify(send.json)}`);
      break;
    }

    try {
      const botReply = await collectBotReply(sseReader);
      log(`[Turn ${turn + 1}] BOT:  ${botReply}`);
      conversation.push({ sender: 'bot', message: botReply });
    } catch (err) {
      log(`[Turn ${turn + 1}] BOT:  NO REPLY — ${err.message}`);
      break;
    }
  }

  // 4. Summary
  const botTurns = conversation.filter(m => m.sender === 'bot').length;
  log(`\n=== TEST COMPLETE — ${botTurns} bot replies over ${conversation.length} total messages ===`);
  log(`Full transcript: shared/logs/closebot_sse_test.log`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
