// Comprehensive cross-reference audit:
//   1. Run full conversation against bot_GBIF5HQVM8FPQ0XJ (Bobby's tag logic)
//   2. Pull CloseBot chat history + lead state
//   3. Pull Vacaville GHL contact (fields, tags, appointments)
// All bot tools have the latest support fix applied (per CloseBot).

const CB_KEY = process.env.CB_GS_API_KEY;
const GHL_TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const GHL_LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const CB = 'https://api.closebot.com';
const GHL = 'https://services.leadconnectorhq.com';

const BOT = 'bot_GBIF5HQVM8FPQ0XJ';
const SRC = 'src_GDKORXSW4Q8RQUQ8';

const stamp = Date.now().toString().slice(-6);
const persona = {
  firstName: 'Tester',
  lastName: `Xref${stamp}`,
  email: `tester+xref${stamp}@example.com`,
  phone: `+1555${stamp}`.slice(0, 12),
};
console.log('=== Cross-Reference Audit ===');
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
async function ghlReq(method, ep, body) {
  const r = await fetch(GHL + ep, { method, headers: ghH, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

async function waitForReply(leadId, prev) {
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const lr = await cbReq('GET', `/lead/${leadId}`);
    const j = lr.json;
    if (j?.mostRecentFailureReason) return { fail: j.mostRecentFailureReason };
    if (j?.lastMessageDirection === 'out' && j.lastMessage && j.lastMessage !== prev) return { reply: j.lastMessage };
  }
  return { timeout: true };
}

// === Run conversation ===
const sess = await cbReq('POST', `/bot/${BOT}/testSession`, { mimicSourceId: SRC });
const leadId = sess.json?.leadId;
if (!leadId) { console.log('FATAL session:', sess.status, sess.raw || JSON.stringify(sess.json).slice(0,200)); process.exit(1); }
console.log('Lead:', leadId, '\n');

const turns = [
  'Hey saw your ad on facebook, looking to get into jiu jitsu',
  `My name is ${persona.firstName} ${persona.lastName}`,
  `email ${persona.email}, phone ${persona.phone}`,
  'i was born July 4 1995',
  'sounds good, what is available next week for adult class?',
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

// Wait a few seconds for tools to finish writing
await new Promise(r => setTimeout(r, 5000));

// === CloseBot audit ===
console.log('\n=== CLOSEBOT AUDIT ===');
const final = await cbReq('GET', `/lead/${leadId}`);
const fj = final.json || {};
console.log('Lead state:');
console.log('  firstName:', fj.firstName, '| lastName:', fj.lastName);
console.log('  email:    ', fj.email, '| phone:', fj.phone);
console.log('  tags:     ', JSON.stringify((fj.tags || []).map(t => t.name || t)));
console.log('  failure:  ', fj.mostRecentFailureReason || 'none');
console.log('  lastDir:  ', fj.lastMessageDirection);

console.log('\nChat history:');
const hist = await cbReq('GET', `/bot/${BOT}/testSession/messages/${leadId}`);
const msgs = Array.isArray(hist.json) ? hist.json : (hist.json?.messages || []);
for (const m of msgs.slice(0, 30)) {
  const dir = m.direction || m.sender || '?';
  const txt = (m.content || m.message || m.text || '').slice(0, 200);
  console.log(`  [${dir}] ${txt}`);
}

// === Vacaville GHL audit ===
console.log('\n=== VACAVILLE GHL AUDIT ===');
const byEmail = await ghlReq('GET', `/contacts/search/duplicate?locationId=${GHL_LOC}&email=${encodeURIComponent(persona.email)}`);
let contact = byEmail.json?.contact;
if (!contact) {
  const byPhone = await ghlReq('GET', `/contacts/search/duplicate?locationId=${GHL_LOC}&phone=${encodeURIComponent(persona.phone)}`);
  contact = byPhone.json?.contact;
}

if (!contact) {
  console.log('  No contact found in Vacaville GHL by email or phone.');
} else {
  console.log('Contact:');
  console.log('  id:       ', contact.id);
  console.log('  name:     ', contact.firstName, contact.lastName);
  console.log('  email:    ', contact.email);
  console.log('  phone:    ', contact.phone);
  console.log('  tags:     ', JSON.stringify(contact.tags || []));
  console.log('  dateAdded:', contact.dateAdded);

  // Custom fields
  const detail = await ghlReq('GET', `/contacts/${contact.id}`);
  const cfs = detail.json?.contact?.customFields || [];
  if (cfs.length) {
    console.log('  Custom fields:');
    for (const cf of cfs) console.log(`    ${cf.id}: ${JSON.stringify(cf.value || cf.field_value)}`);
  } else {
    console.log('  (no custom fields populated)');
  }

  // Appointments
  const appts = await ghlReq('GET', `/contacts/${contact.id}/appointments`);
  const apptList = appts.json?.events || appts.json?.appointments || [];
  console.log('  Appointments:', apptList.length);
  for (const a of apptList) console.log(`    ${a.id} | ${a.startTime} → ${a.endTime} | ${a.title || a.calendarId}`);

  console.log('  GHL UI:    https://app.gohighlevel.com/v2/location/' + GHL_LOC + '/contacts/detail/' + contact.id);
}

// === Verification links ===
console.log('\n=== MANUAL VERIFICATION ===');
console.log('CloseBot:', 'https://app.closebot.com/support/impersonate?userId=user_354OLaugcVE6lzKSRFaDTkYv7bV&leadId=' + leadId);
console.log('Lead ID: ', leadId);
