/**
 * gs_patch_tags_v1.js
 * Patches tag names in the live Vacaville bot KDL per Bobby's 2026-05-07 feedback:
 *   - 'concierge - failed booking' → 'alert'
 *   - 'concierge - booking handoff' → 'alert'
 *   - 'appointment booked' → 'booked'
 *   - 'Aggression detected - human handoff' → 'aggressive'
 *   - 'parent referral lead' → 'youth'
 *   - 'unaccompanied_minor' → removed
 *
 * Flow: export live KDL → patch → dedupe __zIndex → create new bot → publish
 *       → detach old from source → archive old → attach new to source
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_patch_tags_v1.log');
fs.writeFileSync(logFile, '');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing env var ${k}`); process.exit(1); }
  return process.env[k];
}

const CB_KEY       = getEnv('CB_GS_API_KEY');
const LIVE_BOT_ID  = 'bot_J56AWZ5TYQI9HKJS';
const SOURCE_ID    = 'src_GDKORXSW4Q8RQUQ8'; // Vacaville prod source
const NEW_BOT_NAME = 'Vacaville Grappling Academy v2 (tag patch 2026-05-07)';

const CB = 'https://api.closebot.com';
const H  = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

async function req(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
}

// ── Dedupe __zIndex per KDL block ────────────────────────────────────────────
// Uses indentation depth: when a closing } appears at indent N, clear all
// seenZIndex entries at indent > N so sub-block closings don't reset the
// parent block's tracking.
function dedupeZIndex(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  const seenAtIndent = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.search(/\S/);  // position of first non-space char

    if (trimmed.startsWith('__zIndex')) {
      if (!seenAtIndent.has(indent)) {
        seenAtIndent.add(indent);
        out.push(line);
      }
      // else skip duplicate at same indent level within same block
    } else {
      out.push(line);
      if (trimmed === '}') {
        // Closing this block — clear seen state for all deeper indents only
        for (const i of seenAtIndent) {
          if (i > indent) seenAtIndent.delete(i);
        }
      }
    }
  }
  return out.join('\n');
}

// ── Remove a specific TagsToAdd entry block by tag value ─────────────────────
function removeTagEntry(kdl, tagValue) {
  // Remove the _ { id "..." Tag "tagValue" } block
  const pattern = new RegExp(
    `\\s*_ \\{[^}]*Tag "${tagValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\}`,
    'g'
  );
  return kdl.replace(pattern, '');
}

// ── Apply all tag patches ─────────────────────────────────────────────────────
function patchKdl(kdl) {
  let k = kdl;

  // 1. n30_book instructions: 'concierge - failed booking' → 'alert'
  k = k.replaceAll("'concierge - failed booking'", "'alert'");
  k = k.replaceAll('"concierge - failed booking"', '"alert"');

  // 2. n30_book instructions: 'appointment booked' → 'booked'
  k = k.replaceAll("'appointment booked'", "'booked'");
  k = k.replaceAll('"appointment booked"', '"booked"');

  // 3. ModifyTags booking failure tag value
  k = k.replaceAll('"concierge - booking handoff"', '"alert"');
  k = k.replaceAll("'concierge - booking handoff'", "'alert'");

  // 4. Aggression tag → 'aggressive' (case-insensitive variants)
  k = k.replaceAll('"Aggression detected - human handoff"', '"aggressive"');
  k = k.replaceAll("'Aggression detected - human handoff'", "'aggressive'");
  k = k.replaceAll('"aggression detected - human handoff"', '"aggressive"');

  // 5. parent referral lead → youth
  k = k.replaceAll('"parent referral lead"', '"youth"');
  k = k.replaceAll("'parent referral lead'", "'youth'");

  // 6. Remove unaccompanied_minor tag entry entirely
  k = removeTagEntry(k, 'unaccompanied_minor');

  // 7. Update ModifyTags titles for readability
  k = k.replaceAll(
    'Title "Tag: concierge - booking handoff"',
    'Title "Tag: alert (booking failed)"'
  );
  k = k.replaceAll(
    'Title "Agression Detected tag"',
    'Title "Tag: aggressive"'
  );
  k = k.replaceAll(
    'Title "Tag: parent referral lead + unaccompanied_minor"',
    'Title "Tag: youth"'
  );

  // 8. Scenario description update
  k = k.replaceAll(
    "contains 'concierge - failed booking'",
    "contains 'alert'"
  );

  return k;
}

(async () => {
  log('=== Tag patch deploy — Vacaville bot ===');
  log(`Live bot: ${LIVE_BOT_ID}`);
  log(`Target source: ${SOURCE_ID}`);

  // ── 1. Export live KDL ────────────────────────────────────────────────────
  log('\n── Step 1: Export live bot KDL ──');
  const exp = await req('GET', `/bot/${LIVE_BOT_ID}/export`);
  if (!exp.ok || !exp.json?.kdl) {
    log(`FATAL: export failed (status ${exp.status})`);
    process.exit(1);
  }
  const rawKdl = exp.json.kdl;
  log(`Exported KDL: ${rawKdl.length} chars`);
  fs.writeFileSync(path.join(logDir, 'pre_patch_export.kdl'), rawKdl);

  // ── 2. Apply patches ──────────────────────────────────────────────────────
  log('\n── Step 2: Apply tag patches ──');
  let patchedKdl = patchKdl(rawKdl);
  patchedKdl = dedupeZIndex(patchedKdl);
  log(`Patched KDL: ${patchedKdl.length} chars`);
  fs.writeFileSync(path.join(logDir, 'post_patch_export.kdl'), patchedKdl);

  // Verify key replacements
  const checks = [
    { label: "'alert' present",        pass: patchedKdl.includes("'alert'") },
    { label: "'booked' in n30",        pass: patchedKdl.includes("'booked'") },
    { label: "'aggressive' present",   pass: patchedKdl.includes('"aggressive"') },
    { label: "'youth' present",        pass: patchedKdl.includes('"youth"') },
    { label: "no 'concierge - failed booking'", pass: !patchedKdl.includes('concierge - failed booking') },
    { label: "no 'appointment booked'",         pass: !patchedKdl.includes('appointment booked') },
    { label: "no 'Aggression detected - human handoff'", pass: !patchedKdl.includes('Aggression detected - human handoff') },
    { label: "no 'parent referral lead'",        pass: !patchedKdl.includes('parent referral lead') },
    { label: "no 'unaccompanied_minor'",         pass: !patchedKdl.includes('unaccompanied_minor') },
  ];

  let allPass = true;
  for (const c of checks) {
    log(`  ${c.pass ? '✅' : '❌'} ${c.label}`);
    if (!c.pass) allPass = false;
  }
  if (!allPass) { log('FATAL: patch verification failed — aborting deploy'); process.exit(1); }

  // ── 3. Create new bot ─────────────────────────────────────────────────────
  log('\n── Step 3: Create new bot with patched KDL ──');
  const create = await req('POST', '/bot', { name: NEW_BOT_NAME, importKdl: patchedKdl });
  if (!create.ok || !create.json?.id) {
    log(`FATAL: bot create failed (status ${create.status}): ${JSON.stringify(create.json || create.raw).slice(0, 300)}`);
    process.exit(1);
  }
  const newBotId = create.json.id;
  log(`New bot created: ${newBotId}`);

  // ── 4. Publish new bot ────────────────────────────────────────────────────
  log('\n── Step 4: Publish new bot ──');
  const pub = await req('POST', `/bot/${newBotId}/publish`, {});
  if (!pub.ok) {
    log(`FATAL: publish failed (status ${pub.status}): ${JSON.stringify(pub.json || pub.raw).slice(0, 300)}`);
    process.exit(1);
  }
  log(`Published: ${newBotId}`);

  // ── 5. Detach old bot from source ─────────────────────────────────────────
  log('\n── Step 5: Detach old bot from source ──');
  const detach = await req('DELETE', `/agency/source/${SOURCE_ID}/bot/${LIVE_BOT_ID}`);
  log(`Detach old bot: status ${detach.status}`);

  // ── 6. Attach new bot to source ───────────────────────────────────────────
  log('\n── Step 6: Attach new bot to source ──');
  const attach = await req('POST', `/agency/source/${SOURCE_ID}/bot/${newBotId}`);
  if (!attach.ok) {
    log(`WARN: attach failed (status ${attach.status}): ${JSON.stringify(attach.json || attach.raw).slice(0, 300)}`);
  } else {
    log(`Attached new bot ${newBotId} to source ${SOURCE_ID}`);
  }

  // ── 7. Rename old bot to LEGACY ───────────────────────────────────────────
  log('\n── Step 7: Archive old bot (rename LEGACY) ──');
  const rename = await req('PATCH', `/bot/${LIVE_BOT_ID}`, {
    name: `LEGACY — Vacaville Grappling Academy (pre-tag-patch, archived 2026-05-07)`
  });
  log(`Rename old bot: status ${rename.status}`);

  log('\n=== DEPLOY COMPLETE ===');
  log(`Old bot (archived): ${LIVE_BOT_ID}`);
  log(`New bot (live):     ${newBotId}`);
  log(`Source:             ${SOURCE_ID}`);
  log(`Log: shared/logs/gs_patch_tags_v1.log`);
})().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
