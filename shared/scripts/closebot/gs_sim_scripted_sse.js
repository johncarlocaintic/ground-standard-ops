import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_sim_scripted_sse.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { const s = `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`; console.log(s); fs.appendFileSync(logFile, s + '\n'); }

const CB = 'https://api.closebot.com';
const CB_H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

const GHL = 'https://services.leadconnectorhq.com';
const LOC = process.env.GHL_GS_LOCATION_ID;
const GHL_H = {
  'Authorization': `Bearer ${process.env.GHL_GS_API_TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
};

async function cb(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: CB_H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}
async function ghl(method, ep) {
  const r = await fetch(`${GHL}${ep}`, { method, headers: GHL_H });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

const BOT_ID = process.env.CALID_BOT || 'bot_CLOQLG8MZ76NFG2P';
const BOT_TIMEOUT_MS = 90000;
const DRAIN_MS = 6000;

// Scripted conversation — deterministic, no GPT
const SCRIPT = [
  "Hi, I want to book my daughter for a free trial class",
  "Johnson",
  "June 12, 1988",
  "sammy.test@example.invalid",
  "555-0142",
  "Alice Johnson, September 15, 2015",
  "No, just her",
  "No questions, thanks!",
  "Thanks!",
];

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
          if (!data) continue;
          try {
            const p = JSON.parse(data);
            // log ALL events for diagnostic
            if (p.type && p.type !== 'ping') {
              fs.appendFileSync(logFile, `\n[sse event] ${JSON.stringify(p)}\n`);
            }
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
        const timer = setTimeout(() => { waiter = null; reject(new Error(`No bot reply within ${timeoutMs/1000}s`)); }, timeoutMs);
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
  log(`=== SCRIPTED SSE booking test — ${BOT_ID} ===`);

  // Snapshot: current appointments on Kids 7-13 BEFORE we start
  const K713 = 'GWdabDvAgRFHZGsBN9Fq';
  const since = Date.now() - 10*60*1000;
  const until = Date.now() + 90*24*60*60*1000;
  const pre = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K713}&startTime=${since}&endTime=${until}`);
  const preIds = (pre.json?.events || []).map(e => e.id);
  log(`[pre] Kids 7-13 appointments: ${preIds.length} (ids: ${preIds.join(', ')})`);

  // Step A: Create empty test session (per UI behavior captured via DevTools)
  const MIMIC_SRC = 'src_4R4DUIQTMMX2NFPU'; // GS Ads
  const session = await cb('POST', `/bot/${BOT_ID}/testSession`, {});
  if (!session.ok) { log(`FAIL session create: ${session.status}`); logJson('err', session.json); return; }
  const leadId = session.json?.leadId;
  log(`[A] session created leadId=${leadId} initial sourceId=${session.json?.sourceId}`);

  // Step B: PUT to bind mimic source (the step the UI does that I was missing)
  const mimic = await cb('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: MIMIC_SRC });
  log(`[B] mimic bind → ${mimic.status}`);
  if (mimic.ok) logJson('mimic response', mimic.json);
  else logJson('mimic err', mimic.json);

  // Open SSE
  const sseRes = await fetch(`${CB}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Accept': 'text/event-stream' },
  });
  if (!sseRes.ok) { log(`FAIL sse: ${sseRes.status}`); return; }
  const reader = startSseReader(sseRes);

  for (let i = 0; i < SCRIPT.length; i++) {
    const msg = SCRIPT[i];
    log(`\n[T${i+1}] LEAD: ${msg}`);
    const send = await cb('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: msg });
    if (!send.ok) { log(`  send fail: ${send.status}`); break; }
    try {
      const reply = await collect(reader);
      log(`[T${i+1}] BOT:  ${reply}`);
      if (/all set|no questions|have a great|take care|see you/i.test(reply) && i >= 5) {
        log('[end] wrap-up detected, stopping scripted loop');
        break;
      }
    } catch (err) {
      log(`[T${i+1}] BOT: no reply (${err.message})`);
      break;
    }
  }

  // Wait a bit for booking to flush (if async)
  log('\n[post] Waiting 5s for any async GHL writes to land...');
  await new Promise(r => setTimeout(r, 5000));

  // Re-check Kids 7-13
  const post = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K713}&startTime=${since}&endTime=${until}`);
  const postList = post.json?.events || [];
  const newEvents = postList.filter(e => !preIds.includes(e.id));
  log(`\n[post] Kids 7-13 appointments now: ${postList.length} (was ${preIds.length})`);
  log(`[post] NEW events: ${newEvents.length}`);
  for (const e of newEvents) logJson(`NEW appointment`, e);

  // Also check Kids 10-14 (in case age was routed differently)
  const K1014 = 'W9sKR4wWzEGUw4zTzIZJ';
  const post1014 = await ghl('GET', `/calendars/events?locationId=${LOC}&calendarId=${K1014}&startTime=${since}&endTime=${until}`);
  const list1014 = post1014.json?.events || [];
  log(`\n[post] Kids 10-14 appointments: ${list1014.length}`);
  for (const e of list1014) log(`    - ${e.id} title="${e.title}" contact=${e.contactId}`);

  // Check for new contacts
  const c = await ghl('GET', `/contacts/?locationId=${LOC}&limit=10&query=johnson`);
  const matches = (c.json?.contacts || []).filter(x =>
    (x.firstName||'').toLowerCase().includes('sammy') ||
    (x.lastName||'').toLowerCase().includes('johnson') ||
    (x.email||'').includes('sammy.test')
  );
  log(`\n[post] New "johnson/sammy" contacts: ${matches.length}`);
  for (const m of matches) {
    log(`  - ${m.id} ${m.firstName} ${m.lastName} ${m.email} dateAdded=${m.dateAdded}`);
  }

  log('\n=== DONE ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
