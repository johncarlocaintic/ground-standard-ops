import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'agent_b_multikid.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }

const CB = 'https://api.closebot.com';
const CB_H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const OAIK = process.env.OPENAI_API_KEY;
const GHL_H = { Authorization: `Bearer ${process.env.GHL_GS_API_TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };
const LOC = process.env.GHL_GS_LOCATION_ID;
const BOT = 'bot_UHSNAPCCCNLEN2JH';
const SRC = 'src_4R4DUIQTMMX2NFPU';

const MAX_TURNS = 22;
const BOT_TIMEOUT_MS = 40000;
const DRAIN_MS = 3500;

const CAL_3_5 = 'VzusiMBZhpLauldz1Xcv';   // Kids 3-5 BJJ
const CAL_7_13 = 'GWdabDvAgRFHZGsBN9Fq';  // Kids 7-13 Jiu-Jitsu
const CAL_10_14 = 'W9sKR4wWzEGUw4zTzIZJ'; // Kids 10-14 BJJ (just in case)

async function cb(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: CB_H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t } }; }
}
async function ghl(method, ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { method, headers: GHL_H });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t } }; }
}

async function gptReply(convo, persona) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAIK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Simulate a real person texting a martial arts academy bot. Persona: ${persona}
Rules: 1-2 sentences max. Natural, casual. Never break character. Answer the question asked; don't volunteer extra info. STAY CONSISTENT — do not swap kid names or DOBs.` },
        ...convo.map(m => ({ role: m.sender === 'bot' ? 'user' : 'assistant', content: m.message })),
      ],
      max_tokens: 80,
      temperature: 0.5,
    }),
  });
  const j = await r.json();
  return j.choices[0].message.content.trim();
}

function startSseReader(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const queue = [];
  let w = null;
  const allEvents = [];
  function deliver(m) { if (w) { clearTimeout(w.t); w.resolve(m); w = null; } else queue.push(m); }
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { if (w) { w.reject(new Error('SSE closed')); w = null; } break; }
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) !== -1) {
          const blk = buf.slice(0, i); buf = buf.slice(i + 2);
          let data = '';
          for (const ln of blk.split('\n')) if (ln.startsWith('data: ')) data = ln.slice(6).trim();
          if (!data) continue;
          try {
            const p = JSON.parse(data);
            if (p.type !== 'ping') allEvents.push(p);
            if (p.type === 'message-sent' && p.sender === 'bot' && p.message?.trim()) deliver(p.message.trim());
          } catch {}
        }
      }
    } catch (e) { if (w) { w.reject(e); w = null; } }
  })();
  return {
    next(to) { return new Promise((res, rej) => { if (queue.length) return res(queue.shift()); const t = setTimeout(() => { w = null; rej(new Error(`timeout ${to/1000}s`)); }, to); w = { resolve: res, reject: rej, t }; }); },
    events: allEvents,
  };
}

async function collect(r) { const m = [await r.next(BOT_TIMEOUT_MS)]; try { while (true) m.push(await r.next(DRAIN_MS)); } catch {} return m.join('\n'); }

async function main() {
  log(`=== MULTI-KID booking test (Agent B) ===`);

  const since = Date.now() - 5 * 60 * 1000;
  const until = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const pre35 = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${CAL_3_5}&startTime=${since}&endTime=${until}`);
  const pre713 = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${CAL_7_13}&startTime=${since}&endTime=${until}`);
  const pre35Ids = (pre35.json.events || []).map(e => e.id);
  const pre713Ids = (pre713.json.events || []).map(e => e.id);
  log(`[pre] Kids 3-5: ${pre35Ids.length} appts, Kids 7-13: ${pre713Ids.length} appts`);

  const s = await cb('POST', `/bot/${BOT}/testSession`, {});
  const leadId = s.json.leadId;
  await cb('PUT', `/bot/${BOT}/testSession/${leadId}`, { mimicSourceId: SRC });
  log(`[setup] leadId=${leadId}  mimic bound (PUT 200)`);

  const sseRes = await fetch(`${CB}/bot/${BOT}/testSession/messages/${leadId}`, { headers: { 'X-CB-KEY': process.env.CB_GS_API_KEY, Accept: 'text/event-stream' } });
  const reader = startSseReader(sseRes);

  const PERSONA = `Rachel Chen, 40 y/o mother, DOB November 20, 1984. Email: rachel.chen.test@example.invalid. Phone: 415-555-0222 (give as full US number with area code). You want to book FREE TRIAL classes for your TWO daughters.

CRITICAL KID INFO (do not mix these up, ever):
- KID 1: Lily Chen, age 5, DOB August 15, 2020.
- KID 2: Max Chen, age 10, DOB June 22, 2015. (Yes, Max is a daughter — it's short for Maxine.)

RULES:
1. When the bot first asks for kid info, give Lily Chen and her DOB (2020-08-15).
2. When bot asks "anyone else?" or similar after confirming kid 1, say YES — you have one more, your other daughter.
3. Then give Max Chen and her DOB (2015-06-22).
4. When bot asks "anyone else?" again after kid 2, say NO that's all / just the two.
5. If bot offers specific time slots, pick the first one it offers for each kid.
6. If asked about which class, say "whatever fits her age best, you pick".
7. NEVER swap the names or DOBs between the two kids. Lily=5=2020, Max=10=2015. Always.`;

  const convo = [];
  const OPENING = "Hi! I want to book my 2 daughters for trial classes.";

  for (let i = 0; i < MAX_TURNS; i++) {
    const leadMsg = i === 0 ? OPENING : await gptReply(convo, PERSONA);
    log(`[T${i+1}] LEAD: ${leadMsg}`);
    convo.push({ sender: 'lead', message: leadMsg });
    await cb('POST', `/bot/${BOT}/testSession/message`, { leadId, message: leadMsg });
    try {
      const r = await collect(reader);
      log(`[T${i+1}] BOT:  ${r.slice(0, 500)}`);
      convo.push({ sender: 'bot', message: r });
      if (/have a great day|take care|see you on the mat|bye!|goodbye|talk soon/i.test(r) && i >= 10) {
        log('[end] wrap-up detected'); break;
      }
    } catch (e) {
      log(`[T${i+1}] BOT: no reply (${e.message})`); break;
    }
  }

  // Booking/calendar logs
  const bookingLogs = reader.events.flatMap(e => (e.type === 'logs' && Array.isArray(e.logs)) ? e.logs.filter(l => /Booking|Available|calendar/i.test(l.message || '')).map(l => l.message) : []);
  log('\n=== Booking/calendar log events ===');
  for (const m of bookingLogs) log(`  - ${m}`);

  const nodesFired = [...new Set(reader.events.filter(e => e.type === 'action').map(e => e.action?.frontendNodeId))].filter(Boolean);
  log(`\n=== Nodes fired (unique): ${nodesFired.join(', ')}`);

  // GHL check - both calendars
  await new Promise(r => setTimeout(r, 4000));

  const post35 = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${CAL_3_5}&startTime=${since}&endTime=${until}`);
  const post713 = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${CAL_7_13}&startTime=${since}&endTime=${until}`);

  const new35 = (post35.json.events || []).filter(e => !pre35Ids.includes(e.id));
  const new713 = (post713.json.events || []).filter(e => !pre713Ids.includes(e.id));

  log(`\n[post] Kids 3-5: ${(post35.json.events||[]).length} total, ${new35.length} NEW`);
  for (const e of new35) log(`  NEW-3-5: id=${e.id} title="${e.title}" start=${e.startTime} contactId=${e.contactId}`);

  log(`[post] Kids 7-13: ${(post713.json.events||[]).length} total, ${new713.length} NEW`);
  for (const e of new713) log(`  NEW-7-13: id=${e.id} title="${e.title}" start=${e.startTime} contactId=${e.contactId}`);

  // Fetch full details of each new event
  log('\n=== Full event detail fetch ===');
  const allNew = [...new35.map(e => ({ cal: '3-5', ...e })), ...new713.map(e => ({ cal: '7-13', ...e }))];
  for (const e of allNew) {
    const d = await ghl('GET', `/calendars/events/appointments/${e.id}`);
    log(`  [${e.cal}] ${e.id}: ${JSON.stringify(d.json).slice(0, 600)}`);
  }

  // Cleanup: collect contact IDs from new events, delete appointments then contacts
  log('\n=== Cleanup ===');
  const contactIds = new Set();
  for (const e of allNew) if (e.contactId) contactIds.add(e.contactId);

  for (const e of allNew) {
    const del = await fetch(`https://services.leadconnectorhq.com/calendars/events/${e.id}`, { method: 'DELETE', headers: GHL_H });
    log(`  DELETE appt ${e.id}: ${del.status}`);
  }

  // Also search for contact by email in case no appointment was created
  const searchR = await ghl('GET', `/contacts/?locationId=${LOC}&query=rachel.chen.test@example.invalid`);
  const foundContacts = searchR.json.contacts || [];
  for (const c of foundContacts) contactIds.add(c.id);

  for (const cid of contactIds) {
    const del = await fetch(`https://services.leadconnectorhq.com/contacts/${cid}`, { method: 'DELETE', headers: GHL_H });
    log(`  DELETE contact ${cid}: ${del.status}`);
  }

  log('\n=== done ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
