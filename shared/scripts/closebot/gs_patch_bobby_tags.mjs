// Export bot_ZXYBAYGE06NC6DDW (v1+v2 tag patches), apply Bobby's new tag logic:
//   - adult/youth + action opt-in added at end of both data capture nodes
//   - interested tag removed (it was just a routing exit, not a tag — confirmed)
// Archives bot_ZXYBAYGE06NC6DDW, attaches source BEFORE testing.

const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const SOURCE_BOT  = 'bot_ZXYBAYGE06NC6DDW'; // current live — v1+v2 tag patches
const PROD_SRC    = 'src_GDKORXSW4Q8RQUQ8';
const NEW_NAME    = 'Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)';
const LEGACY_NAME = '[LEGACY] Vacaville tag-patch v1+v2 (superseded 2026-05-07)';

const PROD_TAGS = [
  { name: 'concierge', approveDeny: true,  id: 'concierge' },
  { name: 'booked',    approveDeny: false, id: 'booked'    },
  { name: 'member',    approveDeny: false, id: 'member'    },
  { name: 'alumni',    approveDeny: false, id: 'alumni'    },
  { name: 'spam',      approveDeny: false, id: 'spam'      },
  { name: 'staff',     approveDeny: false, id: 'staff'     },
  { name: 'service',   approveDeny: false, id: 'service'   },
  { name: 'showed',    approveDeny: false, id: 'showed'    },
];

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

function dedupeZIndex(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  const seenAtIndent = new Set();
  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    if (trimmed.startsWith('__zIndex')) {
      if (!seenAtIndent.has(indent)) { seenAtIndent.add(indent); out.push(line); }
    } else {
      out.push(line);
      if (trimmed === '}') {
        for (const i of seenAtIndent) { if (i > indent) seenAtIndent.delete(i); }
      }
    }
  }
  return out.join('\n');
}

// Tagging instruction appended before the exit in data capture nodes
const TAG_INSTRUCTION = `Once you know who is enrolling, use @@[Update Tags] to add 'adult' if enrolling an adult, 'youth' if enrolling a child, or both if enrolling both an adult and a child. Then add 'action opt-in'. After tagging, `;

function patchKdl(kdl) {
  let k = kdl;

  // Data Capture v1 — "Exit to Booking" section body
  k = k.replace(
    `Once all contact info and enrollee names and dates of birth are confirmed, exit with @@@[Ready to Book]. Do NOT confirm, suggest, or mention any booking time or date in this node — booking happens in the next step only.`,
    `Once all contact info and enrollee names and dates of birth are confirmed, ${TAG_INSTRUCTION}exit with @@@[Ready to Book]. Do NOT confirm, suggest, or mention any booking time or date in this node — booking happens in the next step only.`
  );

  // Data Capture v2 — "Instruction" section body + Instructions field (same trailing text)
  const v2Exit = `exit with @@@[Ready to Book]. `;
  const v2Replacement = `${TAG_INSTRUCTION}exit with @@@[Ready to Book]. `;
  // Only replace the first occurrence that follows the data capture instructions (not inside other nodes)
  // The v2 node ends its instructions with this exact phrase — replace all occurrences in that node's text
  k = k.replaceAll(
    `Once all contact info and enrollee names and dates of birth are confirmed, exit with @@@[Ready to Book]. `,
    `Once all contact info and enrollee names and dates of birth are confirmed, ${TAG_INSTRUCTION}exit with @@@[Ready to Book]. `
  );

  return k;
}

// ── Step 1: Export ──
console.log('Step 1: Export from', SOURCE_BOT);
const exp = await req('GET', `/bot/${SOURCE_BOT}/export`);
if (!exp.ok || !exp.json?.kdl) { console.log('FATAL: export failed', exp.status); process.exit(1); }
const raw = exp.json.kdl;
console.log('Exported:', raw.length, 'chars');

// ── Step 2: Patch ──
console.log('\nStep 2: Apply Bobby tag logic');
let patched = patchKdl(raw);
patched = dedupeZIndex(patched);

const checks = [
  { label: 'action opt-in in Data Capture v1', pass: patched.includes("add 'action opt-in'") },
  { label: 'adult/youth tagging present',       pass: patched.includes("add 'adult'") },
  { label: 'alert still present',               pass: patched.includes("'alert'") },
  { label: 'booked still present',              pass: patched.includes("'booked'") },
  { label: 'aggressive still present',          pass: patched.includes('"aggressive"') },
  { label: 'underage still present',            pass: patched.includes('"underage"') },
  { label: 'no appointment booked',             pass: !patched.includes('appointment booked') },
  { label: 'no concierge - failed booking',     pass: !patched.includes('concierge - failed booking') },
];
let allPass = true;
for (const c of checks) {
  console.log(' ', c.pass ? '✅' : '❌', c.label);
  if (!c.pass) allPass = false;
}
if (!allPass) { console.log('FATAL: verification failed'); process.exit(1); }

// ── Step 3: Create ──
console.log('\nStep 3: Create new bot');
const create = await req('POST', '/bot', { name: NEW_NAME, importKdl: patched });
if (!create.ok || !create.json?.id) {
  console.log('FATAL: create failed', create.status, JSON.stringify(create.json || create.raw).slice(0, 300));
  process.exit(1);
}
const newId = create.json.id;
console.log('Created:', newId);

// ── Step 4: Publish ──
console.log('\nStep 4: Publish');
const pub = await req('POST', `/bot/${newId}/publish`, {});
if (!pub.ok) { console.log('FATAL: publish failed', pub.status); process.exit(1); }
console.log('Published');

// ── Step 5: Swap source (attach new BEFORE testing) ──
console.log('\nStep 5: Swap source');
const det = await req('DELETE', `/bot/${SOURCE_BOT}/source/${PROD_SRC}`);
console.log('Detach old:', det.status);
const att = await req('POST', `/bot/${newId}/source/${PROD_SRC}`, { tags: PROD_TAGS, channels: [], input: {} });
console.log('Attach new:', att.status);

// Verify source attached
const verify = await req('GET', `/bot/${newId}`);
const src = (verify.json?.sources || []).find(s => s.id === PROD_SRC);
if (!src) { console.log('FATAL: source not attached'); process.exit(1); }
console.log('Source verified:', src.name);
for (const t of src.tags) console.log(' ', t.approveDeny ? '+REQ' : '-EXC', t.name);

// ── Step 6: Test ──
console.log('\nStep 6: Test session');
const sess = await req('POST', `/bot/${newId}/testSession`, {});
const leadId = sess.json?.leadId || sess.json?.lead?.id;
console.log('Session:', sess.status, '| leadId:', leadId);
if (!leadId) { console.log('FATAL: no leadId'); process.exit(1); }

const send = await req('POST', `/bot/${newId}/testSession/message`, {
  leadId, message: 'Hey I saw your ad, want to try a class'
});
console.log('Send:', send.status);

console.log('Polling for reply (60s)...');
let replied = false;
for (let i = 0; i < 12; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const lr = await req('GET', `/lead/${leadId}`);
  if (lr.json?.lastMessageDirection === 'out') {
    console.log('BOT REPLIED at ' + (i+1)*5 + 's:', (lr.json.lastMessage || '').slice(0, 250));
    replied = true;
    break;
  }
  const fail = lr.json?.mostRecentFailureReason;
  if (fail) { console.log('FAILURE:', fail); break; }
  process.stdout.write('.');
}

// ── Step 7: Archive old ──
console.log('\nStep 7: Archive old bot');
const ren = await req('PUT', `/bot/${SOURCE_BOT}`, { name: LEGACY_NAME });
console.log('Archive:', ren.status, ren.json?.name || '');

console.log('\n=== DONE ===');
console.log('New live bot:', newId, '—', NEW_NAME);
console.log('Archived:   ', SOURCE_BOT, '—', LEGACY_NAME);
console.log('Test result:', replied ? 'PASS' : 'FAIL');
