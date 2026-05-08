import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_sim_sse_calid.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const s = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(s); fs.appendFileSync(logFile, s + '\n'); }

const CB = 'https://api.closebot.com';
const CB_KEY = process.env.CB_GS_API_KEY;
const OAIK = process.env.OPENAI_API_KEY;
const BOT_ID = 'bot_CLOQLG8MZ76NFG2P';
const MAX_TURNS = 20;
const BOT_TIMEOUT_MS = 60000;
const DRAIN_MS = 4000;

const CB_H = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

const GHL = 'https://services.leadconnectorhq.com';
const LOC = process.env.GHL_GS_LOCATION_ID;
const GHL_H = {
  'Authorization': `Bearer ${process.env.GHL_GS_API_TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

async function cb(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: CB_H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}
async function ghl(method, ep, body) {
  const r = await fetch(`${GHL}${ep}`, { method, headers: GHL_H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
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
          content: `You are simulating a real parent texting a martial arts academy chatbot to book their kid's trial class. Persona:
${persona}

RULES:
- Keep replies short and natural — 1-2 sentences max, like texting.
- Stay consistent with your persona's facts.
- Answer the exact question the bot asked; do not volunteer extra info.
- Use real-looking but test values: email "sammy.test@example.invalid", phone "555-0142".
- Your birthday: June 12, 1988. Alice's birthday: May 10, 2017 (she's 8).
- Bob's birthday: Sept 22, 2013 (he's 12).
- Your name: Sammy Johnson.
- You want to book ONLY Alice on this conversation — one kid only.
- When asked if booking is for you, kids, or both: say "just my daughter".
- When asked if anyone else needs booking: say "no, just her".
- If bot asks about preferences beyond what persona knows, give a short realistic answer.`,
        },
        ...conversation.map(m => ({
          role: m.sender === 'bot' ? 'user' : 'assistant',
          content: m.message,
        })),
      ],
      max_tokens: 80,
      temperature: 0.6,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

function startSseReader(fetchRes) {
  const reader = fetchRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const queue = [];
  let waiter = null;
  function deliver(msg) {
    if (waiter) { clearTimeout(waiter.timer); waiter.resolve(msg); waiter = null; }
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
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let data = '';
          for (const line of block.split('\n')) if (line.startsWith('data: ')) data = line.slice(6).trim();
          try {
            const p = JSON.parse(data);
            if (p.type === 'message-sent' && p.sender === 'bot' && p.message?.trim()) deliver(p.message.trim());
          } catch {}
        }
      }
    } catch (e) { if (waiter) { waiter.reject(e); waiter = null; } }
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

async function collect(reader) {
  const msgs = [];
  msgs.push(await reader.next(BOT_TIMEOUT_MS));
  try { while (true) msgs.push(await reader.next(DRAIN_MS)); } catch {}
  return msgs.join('\n');
}

async function main() {
  log(`=== SSE single-kid booking test — ${BOT_ID} ===`);

  // Snapshot GS Ads contacts before we start (to detect new contacts)
  log('\n[pre] Snapshot contacts in GS Ads');
  const preContacts = await ghl('GET', `/contacts/?locationId=${LOC}&limit=100`);
  const preCount = preContacts.json?.meta?.total ?? preContacts.json?.contacts?.length ?? 0;
  log(`  ${preCount} contacts`);

  // Start CloseBot test session
  log('\n[1] POST /bot/{id}/testSession');
  const session = await cb('POST', `/bot/${BOT_ID}/testSession`, {});
  if (!session.ok) { log(`FAIL: ${session.status}`); logJson('err', session.json); return; }
  logJson('session', session.json);
  const leadId = session.json?.leadId || session.json?.lead?.id || session.json?.id;
  log(`  leadId: ${leadId}`);

  // Open SSE
  log('\n[2] Opening SSE stream');
  const sseRes = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': CB_KEY, 'Accept': 'text/event-stream' },
  });
  if (!sseRes.ok) { log(`FAIL SSE: ${sseRes.status}`); return; }
  const reader = startSseReader(sseRes);

  // Conversation
  const PERSONA = "Sammy Johnson, a parent with one daughter Alice (age 8). Wants to book Alice for a trial class at Vacaville Grappling Academy. Casual, friendly, just inquiring.";
  const OPENING = "Hi, interested in a free trial class for my daughter";
  const conversation = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const leadMsg = turn === 0 ? OPENING : await gptReply(conversation, PERSONA);
    log(`\n[T${turn+1}] LEAD: ${leadMsg}`);
    conversation.push({ sender: 'lead', message: leadMsg });

    const send = await cb('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: leadMsg });
    if (!send.ok) { log(`send fail: ${send.status}`); break; }

    try {
      const reply = await collect(reader);
      log(`[T${turn+1}] BOT:  ${reply}`);
      conversation.push({ sender: 'bot', message: reply });

      // Heuristic end: bot said something like wrap-up
      if (/any questions|all set|wrap up|thanks for reaching|all done|see you/i.test(reply)) {
        log('[end heuristic] conversation appears complete — stopping');
        break;
      }
    } catch (err) {
      log(`[T${turn+1}] BOT: no reply (${err.message})`);
      break;
    }
  }

  log(`\n[3] Conversation ended. Inspecting GHL for side effects.`);

  // Check for new contacts
  log('\n[3a] GET contacts since test started');
  const postContacts = await ghl('GET', `/contacts/?locationId=${LOC}&limit=100&query=sammy`);
  const hits = postContacts.json?.contacts || [];
  log(`  "sammy" query matches: ${hits.length}`);
  for (const c of hits.slice(0, 5)) {
    log(`    - ${c.id}  ${c.firstName||''} ${c.lastName||''}  email=${c.email||'-'}  created=${c.dateAdded||'?'}`);
  }

  // Check for new appointments on the relevant calendars
  log('\n[3b] GET recent appointments on GS Ads calendars');
  const cals = ['GWdabDvAgRFHZGsBN9Fq', 'W9sKR4wWzEGUw4zTzIZJ', 'VzusiMBZhpLauldz1Xcv', 'KKR9rxFq16DS0fykxXMa'];
  const since = Date.now() - 30*60*1000; // last 30 min
  const until = Date.now() + 60*24*60*60*1000;
  for (const c of cals) {
    const ep = `/calendars/events?locationId=${LOC}&calendarId=${c}&startTime=${since}&endTime=${until}`;
    const r = await ghl('GET', ep);
    const events = r.json?.events || [];
    log(`  cal=${c}: ${events.length} event(s)`);
    for (const e of events) {
      log(`    - ${e.id}  title="${e.title}"  start=${e.startTime}  contact=${e.contactId}`);
      // Full dump if this looks like a CloseBot-created one (contact likely new)
      if (e.title && !e.title.startsWith('CLAUDE-TEST')) {
        logJson(`  CLOSEBOT-CREATED appointment`, e);
      }
    }
  }

  // Save transcript
  fs.writeFileSync(path.join(logDir, 'sim_sse_transcript.json'), JSON.stringify(conversation, null, 2));
  log('\nTranscript saved → shared/logs/sim_sse_transcript.json');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
