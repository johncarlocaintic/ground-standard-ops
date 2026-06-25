/**
 * gs_patch_remove_limits.js
 * Flips RemoveLimits true → false on n10_intro and n30_book agent nodes.
 * RemoveLimits true is causing a backend exception at n10_intro, silencing
 * the bot. TEST VERSION (RemoveLimits false) works fine — this restores parity.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_patch_remove_limits.log');
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
const LIVE_BOT_ID = 'bot_PZOCDUEO686MS1O3';
const SOURCE_ID   = 'src_GDKORXSW4Q8RQUQ8';
const NEW_BOT_NAME = 'Vacaville Grappling Academy v4 (RemoveLimits fix 2026-05-07)';
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

// Flip RemoveLimits true → false within a specific node block only
function patchKdl(kdl) {
  // RemoveLimits only appears in agent nodes — safe to replace globally
  return kdl.replaceAll('RemoveLimits true', 'RemoveLimits false');
}

(async () => {
  log('=== RemoveLimits patch — Vacaville bot ===');
  log(`Current bot: ${LIVE_BOT_ID}`);

  log('\n── Step 1: Export ──');
  const exp = await req('GET', `/bot/${LIVE_BOT_ID}/export`);
  if (!exp.ok || !exp.json?.kdl) { log(`FATAL: export failed (${exp.status})`); process.exit(1); }
  const raw = exp.json.kdl;
  log(`Exported: ${raw.length} chars`);
  fs.writeFileSync(path.join(logDir, 'pre_rl_patch.kdl'), raw);

  log('\n── Step 2: Patch ──');
  let patched = patchKdl(raw);
  patched = dedupeZIndex(patched);

  const n10Before = (raw.match(/RemoveLimits true/g) || []).length;
  const n10After  = (patched.match(/RemoveLimits true/g) || []).length;
  const falseCount = (patched.match(/RemoveLimits false/g) || []).length;
  log(`  RemoveLimits true  before: ${n10Before}`);
  log(`  RemoveLimits true  after:  ${n10After}  (should be 0)`);
  log(`  RemoveLimits false after:  ${falseCount}  (should be 2)`);

  if (n10After !== 0 || falseCount < 2) {
    log('FATAL: patch verification failed — aborting');
    process.exit(1);
  }
  fs.writeFileSync(path.join(logDir, 'post_rl_patch.kdl'), patched);

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
  const ren = await req('PUT', `/bot/${LIVE_BOT_ID}`, { name: `[LEGACY] Vacaville v3 (RemoveLimits-true, archived 2026-05-07)` });
  log(`Archive old: ${ren.status}`);

  log('\n=== DONE ===');
  log(`New live bot: ${newId}`);
  log(`Archived:     ${LIVE_BOT_ID}`);
})().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
