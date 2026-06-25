/**
 * gs_patch_v5_from_test.js
 * Uses the working TEST VERSION (bot_IAYFNT0ZXIJRKH74) as the clean base —
 * it has all required Agent Node metadata fields (ToolOrder, EnabledCustomTools,
 * __dynamicVariables, MustHaveTags) that get stripped by export/import cycles.
 *
 * Applies v1 tag patches + v2 underage correction on top of the clean base,
 * then deploys as v5.
 *
 * Tag map (v1 + v2 combined):
 *   concierge - failed booking  → alert
 *   concierge - booking handoff → alert
 *   appointment booked          → booked
 *   Aggression detected - human handoff → aggressive
 *   parent referral lead        → youth
 *   unaccompanied_minor         → removed
 *   youth (in b8a54e7b block)   → underage  (v2 correction)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_patch_v5.log');
fs.writeFileSync(logFile, '');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); }
  return process.env[k];
}

const CB_KEY        = getEnv('CB_GS_API_KEY');
const BASE_BOT_ID   = 'bot_IAYFNT0ZXIJRKH74';  // TEST VERSION — clean base
const LIVE_BOT_ID   = 'bot_71ZSOTGUDVL4QZS8';  // current live (v4) to archive
const SOURCE_ID     = 'src_GDKORXSW4Q8RQUQ8';
const NEW_BOT_NAME  = 'Vacaville Grappling Academy v5 (clean base + all tag patches 2026-05-07)';
const CB = 'https://api.closebot.com';
const H  = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
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

(async () => {
  log('=== v5 patch — clean base from TEST VERSION ===');
  log(`Base bot: ${BASE_BOT_ID} (TEST VERSION)`);
  log(`Archiving: ${LIVE_BOT_ID} (v4)`);

  log('\n── Step 1: Load TEST VERSION KDL ──');
  const cachedKdl = path.join(logDir, 'kdl_test.kdl');
  let raw;
  if (fs.existsSync(cachedKdl)) {
    raw = fs.readFileSync(cachedKdl, 'utf8');
    log(`Using cached KDL: ${raw.length} chars`);
  } else {
    const exp = await req('GET', `/bot/${BASE_BOT_ID}/export`);
    if (!exp.ok || !exp.json?.kdl) { log(`FATAL: export failed (${exp.status})`); process.exit(1); }
    raw = exp.json.kdl;
    log(`Exported: ${raw.length} chars`);
  }
  fs.writeFileSync(path.join(logDir, 'pre_v5_patch.kdl'), raw);

  log('\n── Step 2: Apply tag patches ──');
  let patched = patchKdl(raw);
  patched = dedupeZIndex(patched);
  log(`Patched: ${patched.length} chars`);
  fs.writeFileSync(path.join(logDir, 'post_v5_patch.kdl'), patched);

  // Verify
  const checks = [
    { label: "'alert' present",          pass: patched.includes("'alert'") },
    { label: "'booked' present",         pass: patched.includes("'booked'") },
    { label: '"aggressive" present',     pass: patched.includes('"aggressive"') },
    { label: 'underage present (b8a54e7b)',  pass: patched.includes('"underage"') },
    { label: '"underage" present',       pass: patched.includes('"underage"') },
    { label: 'no concierge - failed',    pass: !patched.includes('concierge - failed booking') },
    { label: 'no appointment booked',    pass: !patched.includes('appointment booked') },
    { label: 'no Aggression detected',   pass: !patched.includes('Aggression detected - human handoff') },
    { label: 'no parent referral lead',  pass: !patched.includes('parent referral lead') },
    { label: 'no unaccompanied_minor',   pass: !patched.includes('unaccompanied_minor') },
    { label: 'ToolOrder preserved',      pass: patched.includes('ToolOrder') },
    { label: '__dynamicVariables preserved', pass: patched.includes('__dynamicVariables') },
  ];
  let allPass = true;
  for (const c of checks) {
    log(`  ${c.pass ? '✅' : '❌'} ${c.label}`);
    if (!c.pass) allPass = false;
  }
  if (!allPass) { log('FATAL: verification failed — aborting'); process.exit(1); }

  log('\n── Step 3: Create new bot ──');
  const create = await req('POST', '/bot', { name: NEW_BOT_NAME, importKdl: patched });
  if (!create.ok || !create.json?.id) {
    log(`FATAL: create failed (${create.status}): ${JSON.stringify(create.json || create.raw).slice(0, 300)}`);
    process.exit(1);
  }
  const newId = create.json.id;
  log(`Created: ${newId}`);

  log('\n── Step 4: Publish ──');
  const pub = await req('POST', `/bot/${newId}/publish`, {});
  if (!pub.ok) { log(`FATAL: publish failed (${pub.status})`); process.exit(1); }
  log(`Published: ${newId}`);

  log('\n── Step 5: Swap source ──');
  const det = await req('DELETE', `/bot/${LIVE_BOT_ID}/source/${SOURCE_ID}`);
  log(`Detach old: ${det.status}`);
  const att = await req('POST', `/bot/${newId}/source/${SOURCE_ID}`, { tags: [], channels: [], input: {} });
  log(`Attach new: ${att.status}`);

  log('\n── Step 6: Archive old ──');
  const ren = await req('PUT', `/bot/${LIVE_BOT_ID}`, { name: `[LEGACY] Vacaville v4 (RemoveLimits-stripped, archived 2026-05-07)` });
  log(`Archive old: ${ren.status}`);

  log('\n=== DONE ===');
  log(`New live bot: ${newId}`);
  log(`Archived:     ${LIVE_BOT_ID}`);
  log(`Base used:    ${BASE_BOT_ID} (TEST VERSION)`);
})().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
