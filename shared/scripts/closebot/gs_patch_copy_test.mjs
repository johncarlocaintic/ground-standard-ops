// Export bot_EEVFM3NI3296R60R (working copy), apply v1+v2 tag patches, deploy as new bot, test
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';
const SOURCE_BOT = 'bot_EEVFM3NI3296R60R'; // Bobby's working copy
const TEST_SRC = 'src_4R4DUIQTMMX2NFPU'; // GS Ads test source — for mimicSourceId only

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

function removeTagEntry(kdl, tagValue) {
  const pattern = new RegExp(
    `\\s*_ \\{[^}]*Tag "${tagValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\}`,
    'g'
  );
  return kdl.replace(pattern, '');
}

function patchKdl(kdl) {
  let k = kdl;
  // v1: tag renames
  k = k.replaceAll("'concierge - failed booking'", "'alert'");
  k = k.replaceAll('"concierge - failed booking"', '"alert"');
  k = k.replaceAll("'appointment booked'", "'booked'");
  k = k.replaceAll('"appointment booked"', '"booked"');
  k = k.replaceAll('"concierge - booking handoff"', '"alert"');
  k = k.replaceAll("'concierge - booking handoff'", "'alert'");
  k = k.replaceAll('"Aggression detected - human handoff"', '"aggressive"');
  k = k.replaceAll("'Aggression detected - human handoff'", "'aggressive'");
  k = k.replaceAll('"aggression detected - human handoff"', '"aggressive"');
  k = k.replaceAll('"parent referral lead"', '"youth"');
  k = k.replaceAll("'parent referral lead'", "'youth'");
  k = removeTagEntry(k, 'unaccompanied_minor');
  k = k.replaceAll('Title "Tag: concierge - booking handoff"', 'Title "Tag: alert (booking failed)"');
  k = k.replaceAll('Title "Agression Detected tag"', 'Title "Tag: aggressive"');
  k = k.replaceAll('Title "Tag: parent referral lead + unaccompanied_minor"', 'Title "Tag: youth"');
  k = k.replaceAll("contains 'concierge - failed booking'", "contains 'alert'");

  // v2: underage correction — only within b8a54e7b block
  k = k.replace(
    'ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc" {\n    Title "Tag: youth"',
    'ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc" {\n    Title "Tag: underage"'
  );
  const markerIdx = k.indexOf('ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc"');
  if (markerIdx !== -1) {
    const blockEnd = k.indexOf('\n}', markerIdx) + 2;
    const before = k.slice(0, markerIdx);
    let block = k.slice(markerIdx, blockEnd);
    const after = k.slice(blockEnd);
    block = block.replace('Tag "youth"', 'Tag "underage"');
    k = before + block + after;
  }
  return k;
}

// ── Step 1: Export ──
console.log('Step 1: Export KDL from', SOURCE_BOT);
const exp = await req('GET', `/bot/${SOURCE_BOT}/export`);
if (!exp.ok || !exp.json?.kdl) { console.log('FATAL: export failed', exp.status, exp.raw || JSON.stringify(exp.json).slice(0,200)); process.exit(1); }
const raw = exp.json.kdl;
console.log('Exported:', raw.length, 'chars');

// ── Step 2: Patch ──
console.log('\nStep 2: Apply tag patches');
let patched = patchKdl(raw);
patched = dedupeZIndex(patched);
console.log('Patched:', patched.length, 'chars');

const checks = [
  { label: "'alert' present",              pass: patched.includes("'alert'") },
  { label: "'booked' present",             pass: patched.includes("'booked'") },
  { label: '"aggressive" present',         pass: patched.includes('"aggressive"') },
  { label: '"underage" present (b8a54e7b)',pass: patched.includes('"underage"') },
  { label: 'no concierge - failed',        pass: !patched.includes('concierge - failed booking') },
  { label: 'no appointment booked',        pass: !patched.includes('appointment booked') },
  { label: 'no Aggression detected',       pass: !patched.includes('Aggression detected - human handoff') },
  { label: 'no parent referral lead',      pass: !patched.includes('parent referral lead') },
  { label: 'no unaccompanied_minor',       pass: !patched.includes('unaccompanied_minor') },
];
let allPass = true;
for (const c of checks) {
  console.log(' ', c.pass ? '✅' : '❌', c.label);
  if (!c.pass) allPass = false;
}
if (!allPass) { console.log('FATAL: verification failed'); process.exit(1); }

// ── Step 3: Create ──
console.log('\nStep 3: Create patched bot');
const create = await req('POST', '/bot', { name: 'Vacaville PROD - Launch v1.0 [TAG-PATCHED v1+v2] (2026-05-07)', importKdl: patched });
if (!create.ok || !create.json?.id) {
  console.log('FATAL: create failed', create.status, JSON.stringify(create.json || create.raw).slice(0,300));
  process.exit(1);
}
const newId = create.json.id;
console.log('Created:', newId);

// ── Step 4: Publish ──
console.log('\nStep 4: Publish');
const pub = await req('POST', `/bot/${newId}/publish`, {});
if (!pub.ok) { console.log('FATAL: publish failed', pub.status); process.exit(1); }
console.log('Published:', newId);

// ── Step 5: Test session ──
console.log('\nStep 5: Test session');
const sess = await req('POST', `/bot/${newId}/testSession`, {});
const leadId = sess.json?.leadId || sess.json?.lead?.id;
console.log('Session:', sess.status, '| leadId:', leadId);
if (!leadId) { console.log('FATAL: no leadId', JSON.stringify(sess.json).slice(0,200)); process.exit(1); }

const send = await req('POST', `/bot/${newId}/testSession/message`, { leadId, message: "Hey I saw your ad and I'm interested in trying a class" });
console.log('Send msg:', send.status);

console.log('Polling for bot reply (60s max)...');
let replied = false;
for (let i = 0; i < 12; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const poll = await req('GET', `/bot/${newId}/testSession/messages/${leadId}`);
  const msgs = Array.isArray(poll.json) ? poll.json : (poll.json?.messages || []);
  const botMsgs = msgs.filter(m => m.direction === 'out' || m.sender === 'bot');
  if (botMsgs.length) {
    console.log(`BOT REPLIED at ${(i+1)*5}s:`);
    for (const m of botMsgs) console.log(' >', (m.content || m.message || m.text || '').slice(0, 250));
    replied = true;
    break;
  }
  const lr = await req('GET', `/lead/${leadId}`);
  const fail = lr.json?.mostRecentFailureReason;
  if (fail) { console.log(`FAILURE at ${(i+1)*5}s:`, fail); break; }
  process.stdout.write('.');
}
if (!replied) {
  console.log('\nChecking lead for failure reason...');
  const lr = await req('GET', `/lead/${leadId}`);
  console.log('failureReason:', lr.json?.mostRecentFailureReason || 'none');
  console.log('lastMessageDirection:', lr.json?.lastMessageDirection);
}

console.log('\nNew bot ID:', newId);
console.log('Result:', replied ? 'PASS — bot replied' : 'FAIL — no reply');
