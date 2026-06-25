// Multi-turn live test against bot_ZXYBAYGE06NC6DDW (current Vacaville prod bot, v1+v2 tag patches).
// Source is already attached. Uses randomized identity to avoid GHL collision.
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const BOT = 'bot_ZXYBAYGE06NC6DDW';

const stamp = Date.now().toString().slice(-6);
const persona = {
  firstName: 'Tester',
  lastName: `Live${stamp}`,
  email: `tester+live${stamp}@example.com`,
  phone: `+1555${stamp}001`,
};

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

async function waitForReply(leadId, prevContent) {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const lr = await req('GET', `/lead/${leadId}`);
    const j = lr.json;
    if (j?.mostRecentFailureReason) return { fail: j.mostRecentFailureReason };
    if (j?.lastMessageDirection === 'out' && j.lastMessage && j.lastMessage !== prevContent) {
      return { reply: j.lastMessage, tags: j.tags || [] };
    }
  }
  return { timeout: true };
}

console.log(`Persona: ${persona.firstName} ${persona.lastName}`);
console.log(`Bot: ${BOT}\n`);

// Create test session
const sess = await req('POST', `/bot/${BOT}/testSession`, {});
const leadId = sess.json?.leadId;
if (!leadId) { console.log('FATAL: session failed', sess.status, sess.raw || ''); process.exit(1); }
console.log(`Lead: ${leadId}\n`);

const turns = [
  'Hey saw your ad on facebook, looking to get into jiu jitsu',
  `My name is ${persona.firstName} ${persona.lastName}`,
  `email is ${persona.email}, phone is ${persona.phone}`,
  'i was born July 4 1995',
  'whats available next week?',
];

let prev = '';
let lastTags = [];
for (let i = 0; i < turns.length; i++) {
  const msg = turns[i];
  console.log(`\n[T${i+1}] LEAD: ${msg}`);
  const send = await req('POST', `/bot/${BOT}/testSession/message`, { leadId, message: msg });
  if (!send.ok && send.status !== 204) { console.log(`Send fail: ${send.status}`); break; }

  const result = await waitForReply(leadId, prev);
  if (result.fail) { console.log(`     FAILURE: ${result.fail}`); break; }
  if (result.timeout) { console.log('     TIMEOUT — no new bot reply in 60s'); break; }
  console.log(`     BOT: ${result.reply.slice(0, 300)}`);
  prev = result.reply;
  lastTags = result.tags;
}

// Final state check
console.log('\n--- Final Lead State ---');
const final = await req('GET', `/lead/${leadId}`);
console.log('Tags:', JSON.stringify((final.json?.tags || []).map(t => t.name || t)));
console.log('Failure:', final.json?.mostRecentFailureReason || 'none');
console.log('LastMessageDirection:', final.json?.lastMessageDirection);
console.log('LeadId:', leadId);
