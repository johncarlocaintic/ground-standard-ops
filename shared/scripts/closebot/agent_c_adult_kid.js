import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'agent_c_adult_kid.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }

const CB = 'https://api.closebot.com';
const CB_H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const OAIK = process.env.OPENAI_API_KEY;
const GHL_H = { Authorization: `Bearer ${process.env.GHL_GS_API_TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };
const LOC = process.env.GHL_GS_LOCATION_ID;
const BOT = 'bot_UHSNAPCCCNLEN2JH';
const SRC = 'src_4R4DUIQTMMX2NFPU';

const MAX_TURNS = 20;
const BOT_TIMEOUT_MS = 40000;
const DRAIN_MS = 3500;

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
async function ghlDel(ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { method: 'DELETE', headers: GHL_H });
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
Rules: 1-2 sentences max. Natural, casual. Never break character. Answer the question asked; don't volunteer extra info.` },
        ...convo.map(m => ({ role: m.sender === 'bot' ? 'user' : 'assistant', content: m.message })),
      ],
      max_tokens: 100,
      temperature: 0.6,
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
  log(`=== ADULT + KID COMBINED booking test (Agent C) ===`);

  const K_ADULT = 'KKR9rxFq16DS0fykxXMa'; // Adult No-Gi Submission Grappling
  const K_KID_7_13 = 'GWdabDvAgRFHZGsBN9Fq'; // Kids 7-13 Jiu-Jitsu
  const since = Date.now() - 5 * 60 * 1000;
  const until = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const preAdult = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_ADULT}&startTime=${since}&endTime=${until}`);
  const preAdultIds = (preAdult.json.events || []).map(e => e.id);
  log(`[pre] Adult calendar: ${preAdultIds.length} appts`);

  const preKid = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_KID_7_13}&startTime=${since}&endTime=${until}`);
  const preKidIds = (preKid.json.events || []).map(e => e.id);
  log(`[pre] Kids 7-13 calendar: ${preKidIds.length} appts`);

  const s = await cb('POST', `/bot/${BOT}/testSession`, {});
  const leadId = s.json.leadId;
  await cb('PUT', `/bot/${BOT}/testSession/${leadId}`, { mimicSourceId: SRC });
  log(`[setup] leadId=${leadId}  mimic bound (PUT)`);

  const sseRes = await fetch(`${CB}/bot/${BOT}/testSession/messages/${leadId}`, { headers: { 'X-CB-KEY': process.env.CB_GS_API_KEY, Accept: 'text/event-stream' } });
  const reader = startSseReader(sseRes);

  const PERSONA = `You are Mike Thompson, 38 years old, DOB July 15, 1986. Email: mike.thompson.test@example.invalid. Phone: 415-555-0333 (give as full US number with area code).
You want to book a trial class for BOTH YOURSELF (adult) AND for your son Jake Thompson (age 8, DOB April 10, 2017).
When bot asks "who is this for?" or similar, say clearly: it is for BOTH you AND your son.
You are brand new to grappling, never trained before. Your son Jake is also new.
SCHEDULING RULES:
- When bot asks about scheduling for YOURSELF (the adult class): say "Thursday at 6:30 PM works for me".
- When bot asks about scheduling for your SON/Jake (the kids class): say "Thursday at 5:15 PM works for Jake".
- If bot offers a specific slot for either, confirm it.
- Stay consistent: you = Mike (adult), son = Jake (age 8).
Casual friendly tone.`;

  const convo = [];
  const OPENING = "Hi, I want to book a trial class for myself AND for my son.";

  for (let i = 0; i < MAX_TURNS; i++) {
    const leadMsg = i === 0 ? OPENING : await gptReply(convo, PERSONA);
    log(`[T${i+1}] LEAD: ${leadMsg}`);
    convo.push({ sender: 'lead', message: leadMsg });
    await cb('POST', `/bot/${BOT}/testSession/message`, { leadId, message: leadMsg });
    try {
      const r = await collect(reader);
      log(`[T${i+1}] BOT:  ${r.slice(0, 500)}`);
      convo.push({ sender: 'bot', message: r });
      if (/have a great day|take care|see you on the mat|bye!|goodbye|talk soon/i.test(r) && i >= 8) {
        log('[end] wrap-up detected'); break;
      }
    } catch (e) {
      log(`[T${i+1}] BOT: no reply (${e.message})`); break;
    }
  }

  const bookingLogs = reader.events.flatMap(e => (e.type === 'logs' && Array.isArray(e.logs)) ? e.logs.filter(l => /Booking|Available|calendar/i.test(l.message || '')).map(l => l.message) : []);
  log('\n=== Booking/calendar log events ===');
  for (const m of bookingLogs) log(`  - ${m}`);

  const nodesFired = [...new Set(reader.events.filter(e => e.type === 'action').map(e => e.action?.frontendNodeId))].filter(Boolean);
  log(`\n=== Nodes fired: ${nodesFired.join(', ')}`);

  await new Promise(r => setTimeout(r, 4000));

  const postAdult = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_ADULT}&startTime=${since}&endTime=${until}`);
  const postAdultEvents = postAdult.json.events || [];
  const newAdult = postAdultEvents.filter(e => !preAdultIds.includes(e.id));
  log(`\n[post] Adult calendar: ${postAdultEvents.length} total, ${newAdult.length} NEW`);
  for (const e of newAdult) log(`  NEW ADULT: id=${e.id} contactId=${e.contactId} title="${e.title}" start=${e.startTime}`);

  const postKid = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_KID_7_13}&startTime=${since}&endTime=${until}`);
  const postKidEvents = postKid.json.events || [];
  const newKid = postKidEvents.filter(e => !preKidIds.includes(e.id));
  log(`\n[post] Kids 7-13 calendar: ${postKidEvents.length} total, ${newKid.length} NEW`);
  for (const e of newKid) log(`  NEW KID: id=${e.id} contactId=${e.contactId} title="${e.title}" start=${e.startTime}`);

  // CLEANUP
  log('\n=== CLEANUP ===');
  const contactIds = new Set();
  for (const e of newAdult) {
    if (e.contactId) contactIds.add(e.contactId);
    const d = await ghlDel(`/calendars/events/${e.id}`);
    log(`  del adult appt ${e.id} -> ${d.status}`);
  }
  for (const e of newKid) {
    if (e.contactId) contactIds.add(e.contactId);
    const d = await ghlDel(`/calendars/events/${e.id}`);
    log(`  del kid appt ${e.id} -> ${d.status}`);
  }
  for (const cid of contactIds) {
    const d = await ghlDel(`/contacts/${cid}`);
    log(`  del contact ${cid} -> ${d.status}`);
  }

  log('\n=== done ===');
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
