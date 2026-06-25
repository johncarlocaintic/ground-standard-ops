/**
 * Tester — runs a single conversation between a persona-driven Tester agent
 * and a CloseBot bot via the SSE test session API.
 *
 * Inputs (programmatic):
 *   - botId: CloseBot bot ID (string)
 *   - persona: parsed persona JSON ({ persona_id, opening_message, brief })
 *   - opts: { maxTurns?: 25, timeoutMs?: 120000, drainMs?: 4000, mimicSourceId?: string }
 *
 * Output: { transcript: [{sender, message}], terminationReason: string, events: array }
 *
 * Behavior (matches proven v3 adversarial harness):
 *   1. POST /bot/{id}/testSession with empty body → returns leadId
 *   2. PUT /bot/{id}/testSession/{leadId} with mimicSourceId → bind to source
 *   3. Open SSE stream (auto-reconnects when CloseBot closes server-side)
 *   4. 600ms wait so SSE establishes before sending opener
 *   5. 120s timeout per bot reply (Agent Node bots can be slow)
 *
 * Termination signals:
 *   - persona-side: Tester agent emits literal token [END] when objective met
 *   - bot-side: bot timeout
 *   - hard ceiling: maxTurns reached
 */

const BASE = 'https://api.closebot.com';

function getEnv(k) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
  return process.env[k];
}

// CB_API_KEY is the generic key used by all clients.
// CB_GS_API_KEY is the legacy Ground Standard alias — kept for backwards compat.
function getCbKey() {
  const key = process.env.CB_API_KEY || process.env.CB_GS_API_KEY;
  if (!key) throw new Error('Missing env var: CB_API_KEY (or CB_GS_API_KEY for Ground Standard)');
  return key;
}

function cbHeaders() {
  return { 'X-CB-KEY': getCbKey(), 'Content-Type': 'application/json' };
}

async function cbReq(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: cbHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function gptReply(conversation, brief) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getEnv('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are simulating a real person texting a business chatbot.

PERSONA BRIEF:
${brief}

RULES:
- Stay in character. Never break the fourth wall.
- Keep replies short and natural - 1-2 sentences usually.
- Don't ask multiple questions at once.
- STEP-BY-STEP INFO DISCLOSURE: When the bot asks for personal info (name, email, phone, DOB, kid name, kid DOB, etc.), give ONLY the specific field that was asked for. Wait for the bot to ask the next question. Real people don't dump every detail into a single text — they answer the question that was asked.
- Even if the bot asks "what's your name and email?" in one breath, answer with just the name first. Let the bot ask for email separately. This mimics natural SMS rhythm.
- Same rule for kid info: if multiple kids, give ONE kid's details per message, not all kids batched in one reply.
- If the persona's objective has been satisfied (booking confirmed, info obtained, you've given up, or the bot has handed off to a human), reply with the literal token [END] and nothing else.`,
        },
        ...conversation.map(m => ({
          role: m.sender === 'bot' ? 'user' : 'assistant',
          content: m.message,
        })),
      ],
      max_tokens: 150,
      temperature: 0.8,
    }),
  });
  const data = await res.json();
  if (!data.choices) throw new Error(`GPT error: ${JSON.stringify(data).slice(0, 400)}`);
  return data.choices[0].message.content.trim();
}

// Auto-reconnecting SSE reader.
// CloseBot closes the stream server-side shortly after mimicBind; reconnect
// ensures bot replies are captured even when the initial stream dies before
// the bot responds. Lifted from the proven v3 adversarial harness.
function startSseReader(botId, leadId) {
  const queue = [];
  const events = [];
  let waiter = null;
  let stopped = false;

  // Dedupe ledger: bot replies can arrive via both legacy `message-sent` events
  // and the new `activity` event format (vendor change 2026-05-05). The same
  // logical reply may also re-appear after SSE auto-reconnects. Track recently
  // delivered message text in a small sliding window and skip duplicates.
  const recentDelivered = []; // [{ text, ts }]
  const DEDUPE_WINDOW_MS = 10_000;
  const DEDUPE_MAX_ENTRIES = 50;

  function isDuplicate(text) {
    const now = Date.now();
    // Prune entries older than window
    while (recentDelivered.length && now - recentDelivered[0].ts > DEDUPE_WINDOW_MS) recentDelivered.shift();
    return recentDelivered.some(e => e.text === text);
  }

  function deliver(msg) {
    if (isDuplicate(msg)) return; // skip dupes silently
    recentDelivered.push({ text: msg, ts: Date.now() });
    if (recentDelivered.length > DEDUPE_MAX_ENTRIES) recentDelivered.shift();
    if (waiter) {
      clearTimeout(waiter.timer);
      const { resolve } = waiter; waiter = null; resolve(msg);
    } else {
      queue.push(msg);
    }
  }

  async function connect() {
    while (!stopped) {
      let res;
      try {
        res = await fetch(`${BASE}/bot/${botId}/testSession/messages/${leadId}`, {
          headers: { 'X-CB-KEY': getCbKey(), 'Accept': 'text/event-stream' },
        });
      } catch {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let i;
          while ((i = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, i);
            buffer = buffer.slice(i + 2);
            let data = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('data: ')) data = line.slice(6).trim();
            }
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type !== 'ping') events.push(parsed);

              // Legacy event format: bot reply as message-sent event with sender=bot
              if (parsed.type === 'message-sent' && parsed.sender === 'bot' && parsed.message?.trim()) {
                deliver(parsed.message.trim());
                continue;
              }

              // 2026-05-05 vendor format change: bot replies now come through as
              // activity events containing the agent's send_message tool call.
              // The actual message text is buried in activity.data.arguments.message.
              if (parsed.type === 'activity' && parsed.activity) {
                try {
                  const inner = typeof parsed.activity === 'string' ? JSON.parse(parsed.activity) : parsed.activity;
                  if (inner.activity === 'agent_tool_use' && inner.data) {
                    const data = typeof inner.data === 'string' ? JSON.parse(inner.data) : inner.data;
                    if (data.toolName === 'send_message') {
                      const args = typeof data.arguments === 'string' ? JSON.parse(data.arguments) : data.arguments;
                      if (args?.message?.trim()) {
                        deliver(args.message.trim());
                      }
                    }
                  }
                } catch {}
              }
            } catch {}
          }
        }
      } catch {}
      // Stream closed — reconnect immediately to catch bot replies that arrive after server-side close
      if (!stopped) await new Promise(r => setTimeout(r, 10));
    }
  }

  connect();

  return {
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
    stop() { stopped = true; },
    get events() { return events; },
  };
}

async function collectBotReply(sseReader, firstTimeout, drainMs) {
  const messages = [];
  messages.push(await sseReader.next(firstTimeout));
  try {
    while (true) messages.push(await sseReader.next(drainMs));
  } catch {}
  return messages.join('\n');
}

// Generate a random test identity for this run (per the test_identity_randomization rule).
// First name is randomized from a pool that does NOT collide with CloseBot's "Testing"
// placeholder — verified 2026-04-30 that "Tester"/"Testing" similarity caused the LLM to
// skip update_contact("first_name") because it treated them as already-equivalent.
// The "tester" identifier lives in the email (tester.{lastName}.{rand4}@donotuse.com)
// so cleanup scripts can filter test data by email pattern instead of firstName.
function generateTestIdentity() {
  // Adult firstNames — chosen to NOT collide with kidFirstNames AND NOT sound like "Testing".
  const firstNames = ['Marcus', 'Kayla', 'Sage', 'Logan', 'Morgan', 'Skylar', 'Taylor', 'Cameron', 'Devin', 'Kendall', 'Bailey', 'Brennan', 'Carter', 'Dakota', 'Emerson', 'Hayden', 'Jamie', 'Kennedy', 'Mason', 'Peyton', 'Reese', 'Rowan', 'Spencer', 'Tatum', 'Wesley'];
  const lastNames = ['Adler', 'Brooks', 'Carver', 'Doyle', 'Ellis', 'Fenton', 'Garza', 'Hayes', 'Iverson', 'Jasper', 'Kerns', 'Lane', 'Marsh', 'Nolan', 'Owen', 'Paxton', 'Quinn', 'Reyes', 'Stark', 'Tate', 'Underwood', 'Vance', 'Webb', 'Yates', 'Zane'];
  const kidFirstNames = ['Avery', 'Blake', 'Cody', 'Drew', 'Ethan', 'Finn', 'Gavin', 'Hugo', 'Ian', 'Jace', 'Kai', 'Lane', 'Miles', 'Nico', 'Owen', 'Parker', 'Quinn', 'Reed', 'Sam', 'Theo'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const kidName = kidFirstNames[Math.floor(Math.random() * kidFirstNames.length)] + ' ' + lastName;
  const rand4 = Math.random().toString(36).slice(2, 6).toLowerCase();
  // Non-555 phone: 555-0100..0199 is NANP-reserved fictional and may fail GHL's
  // libphonenumber isValidNumber() silently. Using a random non-555 exchange instead.
  // Format: +1[area][exchange][last4] — 11 digits total, valid E.164.
  const usAreaCodes = ['415', '510', '650', '707', '925'];
  const area = usAreaCodes[Math.floor(Math.random() * usAreaCodes.length)];
  const exchange = String(200 + Math.floor(Math.random() * 354)).padStart(3, '0'); // 200-553, avoids 555
  const last4 = String(1000 + Math.floor(Math.random() * 8999)).padStart(4, '0');
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `tester.${lastName.toLowerCase()}.${rand4}@donotuse.com`,
    phone: `${area} ${exchange} ${last4}`,
    kidName,
    kidDOB: 'March 15, 2017',
  };
}

// Substitute {{token}} placeholders in a string with values from the identity object.
function applyIdentity(text, identity) {
  if (!text) return text;
  return text
    .replace(/\{\{firstName\}\}/g, identity.firstName)
    .replace(/\{\{lastName\}\}/g, identity.lastName)
    .replace(/\{\{fullName\}\}/g, identity.fullName)
    .replace(/\{\{email\}\}/g, identity.email)
    .replace(/\{\{phone\}\}/g, identity.phone)
    .replace(/\{\{kidName\}\}/g, identity.kidName)
    .replace(/\{\{kidDOB\}\}/g, identity.kidDOB);
}

export async function runTester(botId, persona, opts = {}) {
  const maxTurns      = opts.maxTurns      ?? 25;
  const timeoutMs     = opts.timeoutMs     ?? 120000;
  const drainMs       = opts.drainMs       ?? 4000;
  const onLog         = opts.onLog         ?? (() => {});
  const mimicSourceId = opts.mimicSourceId || process.env.MIMIC_SOURCE_ID || null;

  // Generate randomized identity and substitute into persona text
  const identity = opts.identity || generateTestIdentity();
  persona = {
    ...persona,
    opening_message: applyIdentity(persona.opening_message, identity),
    brief: applyIdentity(persona.brief, identity),
  };
  onLog(`Tester run: bot=${botId}, persona=${persona.persona_id}, maxTurns=${maxTurns}, timeoutMs=${timeoutMs}${mimicSourceId ? `, mimicSourceId=${mimicSourceId}` : ''}`);
  onLog(`Test identity: ${identity.fullName} | ${identity.email} | ${identity.phone} | kid: ${identity.kidName}`);

  // Step 1: create test session (empty body)
  const session = await cbReq('POST', `/bot/${botId}/testSession`, {});
  if (!session.ok) throw new Error(`testSession failed: ${session.status} ${JSON.stringify(session.json).slice(0, 300)}`);
  const leadId = session.json?.leadId || session.json?.lead?.id || session.json?.id;
  if (!leadId) throw new Error(`No leadId in testSession response: ${JSON.stringify(session.json).slice(0, 300)}`);
  onLog(`Test session created. leadId=${leadId}`);

  // Step 2: mimicBind via PUT (binds the test session to a real source for proper context)
  if (mimicSourceId) {
    const bind = await cbReq('PUT', `/bot/${botId}/testSession/${leadId}`, { mimicSourceId });
    onLog(`mimicBind → ${bind.status}`);
    if (!bind.ok) throw new Error(`mimicBind failed: ${bind.status} ${JSON.stringify(bind.json).slice(0, 300)}`);
  }

  // Step 3: start auto-reconnecting SSE reader
  const sseReader = startSseReader(botId, leadId);

  // Step 4: 600ms wait so first SSE connection establishes before we send the opener
  await new Promise(r => setTimeout(r, 600));
  onLog('SSE reader started; pause done.');

  const transcript = [];
  let terminationReason = `max turns (${maxTurns}) reached`;

  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      let leadMsg;
      if (turn === 0) {
        leadMsg = persona.opening_message;
      } else {
        leadMsg = await gptReply(transcript, persona.brief);
        if (leadMsg.trim() === '[END]' || leadMsg.startsWith('[END]')) {
          terminationReason = 'persona objective met';
          onLog(`[Turn ${turn + 1}] Persona signaled [END] — exiting.`);
          break;
        }
      }
      onLog(`[Turn ${turn + 1}] LEAD: ${leadMsg}`);
      transcript.push({ sender: 'lead', message: leadMsg });

      const send = await cbReq('POST', `/bot/${botId}/testSession/message`, { leadId, message: leadMsg });
      if (!send.ok) {
        onLog(`[Turn ${turn + 1}] send failed: ${send.status}`);
        terminationReason = `send failed at turn ${turn + 1}`;
        break;
      }

      try {
        const botReply = await collectBotReply(sseReader, timeoutMs, drainMs);
        onLog(`[Turn ${turn + 1}] BOT:  ${botReply}`);
        transcript.push({ sender: 'bot', message: botReply });
      } catch (err) {
        onLog(`[Turn ${turn + 1}] BOT:  NO REPLY — ${err.message}`);
        terminationReason = `bot timeout at turn ${turn + 1}`;
        break;
      }
    }
  } finally {
    sseReader.stop();
  }

  return { transcript, terminationReason, events: sseReader.events, identity };
}
