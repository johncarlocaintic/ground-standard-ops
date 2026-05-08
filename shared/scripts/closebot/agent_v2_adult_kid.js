import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'agent_v2_adult_kid.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }

const CB = 'https://api.closebot.com';
const CB_H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };
const OAIK = process.env.OPENAI_API_KEY;
const GHL_H = { Authorization: `Bearer ${process.env.GHL_GS_API_TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };
const LOC = process.env.GHL_GS_LOCATION_ID;
const BOT = 'bot_5DIU3OM57G2P8O59';
const SRC = 'src_4R4DUIQTMMX2NFPU';

const MAX_TURNS = 22;
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
      max_tokens: 80,
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
  log(`=== v2 ADULT + KID false-confirmation fix verification ===`);

  const K_ADULT = 'KKR9rxFq16DS0fykxXMa'; // Adult No-Gi
  const K_KIDS = 'GWdabDvAgRFHZGsBN9Fq'; // Kids 7-13
  const since = Date.now() - 5 * 60 * 1000;
  const until = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const preAdult = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_ADULT}&startTime=${since}&endTime=${until}`);
  const preAdultIds = (preAdult.json.events || []).map(e => e.id);
  log(`[pre] Adult calendar: ${preAdultIds.length} appts`);

  const preKids = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_KIDS}&startTime=${since}&endTime=${until}`);
  const preKidsIds = (preKids.json.events || []).map(e => e.id);
  log(`[pre] Kids 7-13 calendar: ${preKidsIds.length} appts`);

  const s = await cb('POST', `/bot/${BOT}/testSession`, {});
  const leadId = s.json.leadId;
  await cb('PUT', `/bot/${BOT}/testSession/${leadId}`, { mimicSourceId: SRC });
  log(`[setup] leadId=${leadId}  mimic bound (PUT 200)`);

  const sseRes = await fetch(`${CB}/bot/${BOT}/testSession/messages/${leadId}`, { headers: { 'X-CB-KEY': process.env.CB_GS_API_KEY, Accept: 'text/event-stream' } });
  const reader = startSseReader(sseRes);

  const PERSONA = `Leo Garcia, 40 y/o adult, booking a trial class for BOTH yourself AND your daughter Sofia (age 8). Your DOB is February 10, 1986. Sofia's DOB is July 8, 2017. Your email: leo.garcia.test@example.invalid. Phone: 415-555-0555 (full US with area code). You are brand new to grappling/BJJ, never trained before. Sofia is also a complete beginner. You're FLEXIBLE on times — if the bot offers any slot, agree to it. Make sure to clearly communicate you want BOTH yourself AND your daughter booked. Casual friendly.`;
  const convo = [];
  const OPENING = "Hi! I want to book a trial class for myself AND my daughter.";

  for (let i = 0; i < MAX_TURNS; i++) {
    const leadMsg = i === 0 ? OPENING : await gptReply(convo, PERSONA);
    log(`[T${i+1}] LEAD: ${leadMsg}`);
    convo.push({ sender: 'lead', message: leadMsg });
    await cb('POST', `/bot/${BOT}/testSession/message`, { leadId, message: leadMsg });
    try {
      const r = await collect(reader);
      log(`[T${i+1}] BOT:  ${r.slice(0, 500)}`);
      convo.push({ sender: 'bot', message: r });
      if (/have a great day|take care|see you on the mat|bye!|goodbye|talk soon/i.test(r) && i >= 6) {
        log('[end] wrap-up detected'); break;
      }
    } catch (e) {
      log(`[T${i+1}] BOT: no reply (${e.message})`); break;
    }
  }

  // Log booking events
  const bookingLogs = reader.events.flatMap(e => (e.type === 'logs' && Array.isArray(e.logs)) ? e.logs.filter(l => /Booking|Available|calendar|book_appointment|SUCCESS|tool/i.test(l.message || '')).map(l => l.message) : []);
  log('\n=== Booking/calendar log events ===');
  for (const m of bookingLogs) log(`  - ${m}`);

  const nodesFired = [...new Set(reader.events.filter(e => e.type === 'action').map(e => e.action?.frontendNodeId))].filter(Boolean);
  log(`\n=== Nodes fired: ${nodesFired.join(', ')}`);

  // Dump ALL SSE events for diagnostic
  log('\n=== ALL SSE events (types) ===');
  const typeCounts = {};
  for (const e of reader.events) typeCounts[e.type] = (typeCounts[e.type]||0)+1;
  log(JSON.stringify(typeCounts));

  // GHL check
  await new Promise(r => setTimeout(r, 3000));
  const postAdult = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_ADULT}&startTime=${since}&endTime=${until}`);
  const postAdultEvents = postAdult.json.events || [];
  const newAdult = postAdultEvents.filter(e => !preAdultIds.includes(e.id));
  log(`\n[post] Adult calendar: ${postAdultEvents.length} total, ${newAdult.length} NEW`);
  for (const e of newAdult) log(`  NEW ADULT: ${e.id} title="${e.title}" start=${e.startTime} contactId=${e.contactId}`);

  const postKids = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K_KIDS}&startTime=${since}&endTime=${until}`);
  const postKidsEvents = postKids.json.events || [];
  const newKids = postKidsEvents.filter(e => !preKidsIds.includes(e.id));
  log(`\n[post] Kids 7-13 calendar: ${postKidsEvents.length} total, ${newKids.length} NEW`);
  for (const e of newKids) log(`  NEW KID: ${e.id} title="${e.title}" start=${e.startTime} contactId=${e.contactId}`);

  log('\n=== done ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
