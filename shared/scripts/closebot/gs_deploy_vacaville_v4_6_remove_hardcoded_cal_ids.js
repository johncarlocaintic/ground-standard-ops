/**
 * Deploy: Vacaville v4.6 — Remove hardcoded calendar IDs from n30_book
 *
 * Root cause: n30_book Instructions/Body hardcoded production Vacaville GHL
 * calendar IDs (eP72M7eCi37bpN7Shg2a, 5BZ9V5do89DR1sKxXfrM). These IDs don't
 * match the sandbox GHL (different IDs per account), causing the bot to burn
 * 2 wasted check_availability calls on "calendar not found" before recovering
 * via the tool's available-calendars list.
 *
 * Fix: strip IDs from both occurrences, leaving just the calendar names.
 * Bot discovers the correct IDs dynamically from the tool response — works in
 * both sandbox and production without environment-specific hardcoding.
 *
 * Base KDL: archive/closebot-bots/vacaville-v4.5-booking-exit-fix_2026-05-12.kdl
 * Set DRY_RUN=1 to preview without creating a bot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const SANDBOX_SOURCE_ID = 'src_4R4DUIQTMMX2NFPU';
const BOT_NAME = 'Vacaville SANDBOX - v4.6 remove hardcoded cal IDs (2026-05-12)';
const KDL_BASE = path.join(REPO_ROOT, 'archive/closebot-bots/vacaville-v4.5-booking-exit-fix_2026-05-12.kdl');
const PRIOR_BOT_ID = 'bot_YYTM0WSX00RK4L0V'; // v4.5 — archived on deploy
const PRIOR_BOT_LEGACY_NAME = '[LEGACY] Vacaville SANDBOX - v4.5 booking exit fix (2026-05-12)';
const DRY_RUN = process.env.DRY_RUN === '1';

const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

async function api(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

function dedupeZIndex(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  const seenZAtDepth = [];
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    const isZ = /^__zIndex\b/.test(trimmed);
    if (isZ) {
      if (seenZAtDepth[depth]) { continue; }
      else { seenZAtDepth[depth] = true; }
    }
    out.push(line);
    for (let i = 0; i < opens; i++) { depth++; seenZAtDepth[depth] = false; }
    for (let i = 0; i < closes; i++) { seenZAtDepth[depth] = false; depth = Math.max(0, depth - 1); }
  }
  return out.join('\n');
}

function patchAll(kdl) {
  // Remove hardcoded calendar IDs from n30_book instructions.
  // Before: "Adult No-Gi (eP72M7eCi37bpN7Shg2a) runs Mon-Fri, Kids 7-13 (5BZ9V5do89DR1sKxXfrM) runs Mon-Thu only"
  // After:  "Adult No-Gi runs Mon-Fri, Kids 7-13 runs Mon-Thu only"
  // The bot will discover the correct IDs from the check_availability tool response.
  const BEFORE = ' — Adult No-Gi (eP72M7eCi37bpN7Shg2a) runs Mon-Fri, Kids 7-13 (5BZ9V5do89DR1sKxXfrM) runs Mon-Thu only';
  const AFTER  = ' — Adult No-Gi runs Mon-Fri, Kids 7-13 runs Mon-Thu only';

  const count = kdl.split(BEFORE).length - 1;
  if (count === 0) {
    console.error('ERROR: hardcoded calendar ID anchor not found — check base KDL');
    process.exit(1);
  }
  kdl = kdl.replaceAll(BEFORE, AFTER);
  console.log(`  hardcoded calendar IDs removed: ${count} occurrence(s) patched`);
  return kdl;
}

async function main() {
  console.log('=== Deploy: Vacaville v4.6 remove hardcoded calendar IDs ===');
  if (DRY_RUN) console.log('  [DRY RUN — will not call API]\n');

  const base = fs.readFileSync(KDL_BASE, 'utf8');
  console.log(`Loaded base KDL (v4.5): ${base.length} chars\n`);

  console.log('--- Patching ---');
  let kdl = patchAll(base);

  // Verify no hardcoded IDs remain
  const remaining = (kdl.match(/eP72M7eCi37bpN7Shg2a|5BZ9V5do89DR1sKxXfrM/g) || []).length;
  if (remaining > 0) {
    console.error(`ERROR: ${remaining} hardcoded calendar ID(s) still present after patch`);
    process.exit(1);
  }
  console.log('  Verification: 0 hardcoded calendar IDs remaining — OK');

  console.log('\n--- Deduping __zIndex ---');
  const before = (kdl.match(/__zIndex/g) || []).length;
  kdl = dedupeZIndex(kdl);
  const after = (kdl.match(/__zIndex/g) || []).length;
  console.log(`  __zIndex: ${before} → ${after}`);

  const archiveDir = path.join(REPO_ROOT, 'archive/closebot-bots');
  const patchedPath = path.join(archiveDir, 'vacaville-v4.6-remove-hardcoded-cal-ids_2026-05-12.kdl');
  fs.writeFileSync(patchedPath, kdl);
  console.log(`  archived: ${path.relative(REPO_ROOT, patchedPath)}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Stopped before API calls. Review archived KDL to verify patch.');
    process.exit(0);
  }

  console.log('\n--- Archiving prior bot (v4.5) ---');
  const detach = await api('DELETE', `/bot/${PRIOR_BOT_ID}/source/${SANDBOX_SOURCE_ID}`);
  console.log(`  detach prior → ${detach.status}`);
  const rename = await api('PUT', `/bot/${PRIOR_BOT_ID}`, { name: PRIOR_BOT_LEGACY_NAME });
  console.log(`  rename prior → ${rename.status}`);
  const clearTags = await api('POST', `/bot/${PRIOR_BOT_ID}/source/${SANDBOX_SOURCE_ID}`, { tags: [], channels: [] });
  console.log(`  clear tag filter → ${clearTags.status}`);

  console.log('\n--- Creating bot ---');
  const create = await api('POST', '/bot', { name: BOT_NAME, importKdl: kdl });
  console.log(`  POST /bot → ${create.status}`);
  if (!create.ok) {
    console.error('FATAL create failed:', JSON.stringify(create.json).slice(0, 400));
    process.exit(1);
  }
  const newBotId = create.json.id || create.json._id;
  console.log(`  bot id: ${newBotId}`);

  console.log('\n--- Publishing ---');
  const pub = await api('POST', `/bot/${newBotId}/publish`, {});
  console.log(`  publish → ${pub.status}`);
  if (!pub.ok) console.error('  WARN publish failed:', JSON.stringify(pub.json).slice(0, 200));

  console.log('\n--- Attaching to GS Ads sandbox ---');
  const attach = await api('POST', `/bot/${newBotId}/source/${SANDBOX_SOURCE_ID}`, { tags: [], channels: [] });
  console.log(`  attach → ${attach.status}`);
  if (!attach.ok) {
    const retry = await api('POST', `/bot/${newBotId}/source/${SANDBOX_SOURCE_ID}`, { tags: [], channels: [] });
    console.log(`  retry → ${retry.status}`);
  }

  console.log('\n=== Done ===');
  console.log(`  Bot ID:   ${newBotId}`);
  console.log(`  Bot name: ${BOT_NAME}`);
  console.log(`  Source:   ${SANDBOX_SOURCE_ID} (GS Ads sandbox)`);
  console.log(`  Archive:  ${path.relative(REPO_ROOT, patchedPath)}`);
  console.log('\n  Next: run sweep against this bot, verify no wasted calendar ID calls');
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
