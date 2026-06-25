/**
 * gs_patch_tags_v2.js
 * Targeted fix: changes the minor self-booking ModifyTags node (b8a54e7b)
 * from tag "youth" → "underage" per Bobby's 2026-05-07 correction.
 *
 * youth = kid included in a booking (parent booking for kid)
 * underage = minor attempting to self-book (fires custom scenario for parent capture)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_patch_tags_v2.log');
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

const CB_KEY      = getEnv('CB_GS_API_KEY');
const LIVE_BOT_ID = 'bot_VKXCXVKM4S16G0P0';
const SOURCE_ID   = 'src_GDKORXSW4Q8RQUQ8';
const NEW_BOT_NAME = 'Vacaville Grappling Academy v3 (underage tag fix 2026-05-07)';
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

// Targeted patch: only modify the b8a54e7b block
function patchKdl(kdl) {
  let k = kdl;

  // Change title and tag ONLY within the b8a54e7b block
  // The block starts at 'ModifyTags id="b8a54e7b-...' and contains Tag "youth"
  k = k.replace(
    'ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc" {\n    Title "Tag: youth"',
    'ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc" {\n    Title "Tag: underage"'
  );

  // Replace the Tag value within that block — use a targeted string replace
  // Safe because "youth" only appears as a tag value in this block (other refs are field names like youth_name)
  k = k.replace(
    'ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc"',
    'UNDERAGE_BLOCK_MARKER'
  );
  // Now replace Tag "youth" only after the marker
  const markerIdx = k.indexOf('UNDERAGE_BLOCK_MARKER');
  const blockEnd = k.indexOf('\n}', markerIdx) + 2;
  const before = k.slice(0, markerIdx);
  let block = k.slice(markerIdx, blockEnd);
  const after = k.slice(blockEnd);

  block = block.replace('UNDERAGE_BLOCK_MARKER', 'ModifyTags id="b8a54e7b-ecd4-404a-b5be-7cc3249af1fc"');
  block = block.replace('Tag "youth"', 'Tag "underage"');

  k = before + block + after;
  return k;
}

(async () => {
  log('=== Tag patch v2 — underage fix ===');
  log(`Current bot: ${LIVE_BOT_ID}`);

  // 1. Export current live bot
  log('\n── Step 1: Export ──');
  const exp = await req('GET', `/bot/${LIVE_BOT_ID}/export`);
  if (!exp.ok || !exp.json?.kdl) { log(`FATAL: export failed (${exp.status})`); process.exit(1); }
  const raw = exp.json.kdl;
  log(`Exported: ${raw.length} chars`);

  // 2. Patch
  log('\n── Step 2: Patch ──');
  let patched = patchKdl(raw);
  patched = dedupeZIndex(patched);

  // Verify
  const hasUnderage = patched.includes('Tag "underage"');
  const youthTagCount = (patched.match(/Tag "youth"/g) || []).length;
  log(`  ✅ 'underage' tag present: ${hasUnderage}`);
  log(`  ℹ️  'youth' tag occurrences remaining: ${youthTagCount} (should be 0 — youth applied by Agent node instructions only)`);
  if (!hasUnderage) { log('FATAL: patch failed'); process.exit(1); }

  fs.writeFileSync(path.join(logDir, 'post_patch_v2.kdl'), patched);

  // 3. Create new bot
  log('\n── Step 3: Create new bot ──');
  const create = await req('POST', '/bot', { name: NEW_BOT_NAME, importKdl: patched });
  if (!create.ok || !create.json?.id) {
    log(`FATAL: create failed (${create.status}): ${JSON.stringify(create.json || create.raw).slice(0, 300)}`);
    process.exit(1);
  }
  const newId = create.json.id;
  log(`Created: ${newId}`);

  // 4. Publish
  log('\n── Step 4: Publish ──');
  const pub = await req('POST', `/bot/${newId}/publish`, {});
  if (!pub.ok) { log(`FATAL: publish failed (${pub.status})`); process.exit(1); }
  log(`Published: ${newId}`);

  // 5. Detach old, attach new
  log('\n── Step 5: Swap source attachment ──');
  const det = await req('DELETE', `/bot/${LIVE_BOT_ID}/source/${SOURCE_ID}`);
  log(`Detach old: ${det.status}`);

  const att = await req('POST', `/bot/${newId}/source/${SOURCE_ID}`, { tags: [], channels: [], input: {} });
  log(`Attach new: ${att.status}`);

  // 6. Archive old
  log('\n── Step 6: Archive old bot ──');
  const ren = await req('PUT', `/bot/${LIVE_BOT_ID}`, { name: `[LEGACY] Vacaville tag-patch-v1 (superseded 2026-05-07)` });
  log(`Archive old: ${ren.status}`);

  log('\n=== DONE ===');
  log(`New live bot: ${newId}`);
  log(`Archived:     ${LIVE_BOT_ID}`);
})().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
