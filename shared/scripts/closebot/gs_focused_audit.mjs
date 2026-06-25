// Focused single-conversation test against the LIVE Vacaville prod bot.
// Mimics src_GDKORXSW4Q8RQUQ8 so contact writes hit real Vacaville GHL.
// After test: audit CloseBot lead state + audit Vacaville GHL contact.
// Cleanup: tag test contact 'do-not-use' so Bobby can scrub later.

const CB_KEY = process.env.CB_GS_API_KEY;
const GHL_TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const GHL_LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const CB = 'https://api.closebot.com';
const GHL = 'https://services.leadconnectorhq.com';

const BOT = 'bot_ZXYBAYGE06NC6DDW';
const SRC = 'src_GDKORXSW4Q8RQUQ8';

const stamp = Date.now().toString().slice(-6);
const persona = {
  firstName: 'Tester',
  lastName: `Audit${stamp}`,
  email: `tester+audit${stamp}@example.com`,
  phone: `+1555${stamp.padStart(7, '0').slice(0, 7)}`.slice(0, 12),
};
console.log('Persona:', persona);
console.log('Bot:    ', BOT);
console.log('Source: ', SRC, '(Vacaville PROD)\n');

const cbH = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };
const ghH = { Authorization: `Bearer ${GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

async function cbReq(method, ep, body) {
  const r = await fetch(CB + ep, { method, headers: cbH, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

async function ghlSearch(query) {
  const r = await fetch(`${GHL}/contacts/search/duplicate?locationId=${GHL_LOC}&${query}`, { headers: ghH });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; }
  catch { return { status: r.status, raw: t.slice(0, 300) }; }
}

async function waitForReply(leadId, prev) {
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const lr = await cbReq('GET', `/lead/${leadId}`);
    const j = lr.json;
    if (j?.mostRecentFailureReason) return { fail: j.mostRecentFailureReason };
    if (j?.lastMessageDirection === 'out' && j.lastMessage && j.lastMessage !== prev) {
      return { reply: j.lastMessage };
    }
  }
  return { timeout: true };
}

// === Run test ===
console.log('Creating test session with mimicSourceId =', SRC);
const sess = await cbReq('POST', `/bot/${BOT}/testSession`, { mimicSourceId: SRC });
const leadId = sess.json?.leadId;
if (!leadId) { console.log('FATAL: session failed', sess.status, sess.raw || JSON.stringify(sess.json).slice(0,200)); process.exit(1); }
console.log('Lead:', leadId, '\n');

const turns = [
  'Hey saw your ad on facebook, looking to get into jiu jitsu',
  `My name is ${persona.firstName} ${persona.lastName}`,
  `email ${persona.email}, phone ${persona.phone}`,
  'i was born July 4 1995',
  'whats available next week?',
];

let prev = '';
for (let i = 0; i < turns.length; i++) {
  const msg = turns[i];
  console.log(`[T${i+1}] LEAD: ${msg}`);
  await cbReq('POST', `/bot/${BOT}/testSession/message`, { leadId, message: msg });
  const r = await waitForReply(leadId, prev);
  if (r.fail) { console.log('     FAILURE:', r.fail); break; }
  if (r.timeout) { console.log('     TIMEOUT'); break; }
  console.log('     BOT:', r.reply.slice(0, 280));
  prev = r.reply;
}

// === Audit CloseBot ===
console.log('\n--- CloseBot lead audit ---');
const final = await cbReq('GET', `/lead/${leadId}`);
const fj = final.json || {};
console.log('firstName:', fj.firstName);
console.log('lastName: ', fj.lastName);
console.log('email:    ', fj.email);
console.log('phone:    ', fj.phone);
console.log('tags:     ', JSON.stringify((fj.tags || []).map(t => t.name || t)));
console.log('failure:  ', fj.mostRecentFailureReason || 'none');
console.log('lastDir:  ', fj.lastMessageDirection);
console.log('botId:    ', fj.lastMessageBotId);
console.log('sourceId: ', fj.sourceId);

// === Audit Vacaville GHL ===
console.log('\n--- Vacaville GHL audit ---');
const byEmail = await ghlSearch(`email=${encodeURIComponent(persona.email)}`);
console.log('Search by email:', byEmail.status);
if (byEmail.json?.contact) {
  const c = byEmail.json.contact;
  console.log('  GHL contact id:', c.id);
  console.log('  name:', c.firstName, c.lastName);
  console.log('  email:', c.email);
  console.log('  phone:', c.phone);
  console.log('  tags:', JSON.stringify(c.tags || []));
  console.log('  GHL UI: https://app.gohighlevel.com/v2/location/' + GHL_LOC + '/contacts/detail/' + c.id);
} else {
  console.log('  No contact found by email — checking phone...');
  const byPhone = await ghlSearch(`phone=${encodeURIComponent(persona.phone)}`);
  console.log('  Search by phone:', byPhone.status, byPhone.json?.contact ? 'found' : 'not found');
  if (byPhone.json?.contact) {
    const c = byPhone.json.contact;
    console.log('  id:', c.id, '| name:', c.firstName, c.lastName, '| tags:', JSON.stringify(c.tags || []));
  }
}

// === Verification links ===
console.log('\n--- Manual verification ---');
console.log('CloseBot impersonate link:');
console.log('  https://app.closebot.com/support/impersonate?userId=user_354OLaugcVE6lzKSRFaDTkYv7bV&leadId=' + leadId);
console.log('\nLead ID for cleanup:', leadId);
