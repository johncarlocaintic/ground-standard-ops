/**
 * Deploy: Vacaville v4.5 — Fix booking exit (n20_details never reached n30_book)
 *
 * Root cause: n20_details exit instruction referenced the FrontendExitId UUID
 * (@@@[bd2fccdb-9297-40be-9705-b13e72e1f6b7]) instead of the exit path title
 * (@@@[Ready to Book]). The bot did not recognize the UUID as a valid exit,
 * never called exit_method, stayed stuck in n20_details, and fabricated booking
 * confirmations by reading the static KB schedule via get_library_context.
 * n30_book was never entered — confirmed via events.json (0 n30_book node events).
 *
 * Fix: replaceAll @@@[bd2fccdb-9297-40be-9705-b13e72e1f6b7] → @@@[Ready to Book]
 * (hits both Sections.Body and Instructions — 2 occurrences).
 *
 * Base KDL: archive/closebot-bots/vacaville-v4.4-qualification-flow_2026-05-12.kdl
 * Set DRY_RUN=1 to preview without creating a bot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const SANDBOX_SOURCE_ID = 'src_4R4DUIQTMMX2NFPU';
const BOT_NAME = 'Vacaville SANDBOX - v4.5 booking exit fix (2026-05-12)';
const KDL_BASE = path.join(REPO_ROOT, 'archive/closebot-bots/vacaville-v4.4-qualification-flow_2026-05-12.kdl');
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
  // Fix: replace UUID exit reference with the actual exit path title.
  // The UUID @@@[bd2fccdb-9297-40be-9705-b13e72e1f6b7] is the FrontendExitId
  // of the "Ready to Book" exit path. CloseBot's LLM resolves exits by title,
  // not by UUID — using the UUID causes exit_method to never fire.
  const ANCHOR = '@@@[bd2fccdb-9297-40be-9705-b13e72e1f6b7]';
  const PATCH  = '@@@[Ready to Book]';

  const count = kdl.split(ANCHOR).length - 1;
  if (count === 0) {
    console.error('ERROR: UUID exit anchor not found — check base KDL');
    process.exit(1);
  }
  kdl = kdl.replaceAll(ANCHOR, PATCH);
  console.log(`  UUID exit → @@@[Ready to Book]: ${count} occurrence(s) patched`);
  return kdl;
}

async function main() {
  console.log('=== Deploy: Vacaville v4.5 booking exit fix ===');
  if (DRY_RUN) console.log('  [DRY RUN — will not call API]\n');

  const base = fs.readFileSync(KDL_BASE, 'utf8');
  console.log(`Loaded base KDL (v4.4): ${base.length} chars\n`);

  console.log('--- Patching ---');
  let kdl = patchAll(base);

  // Verify no UUID exit references remain
  const remaining = (kdl.match(/@@@\[bd2fccdb/g) || []).length;
  if (remaining > 0) {
    console.error(`ERROR: ${remaining} UUID exit reference(s) still present after patch`);
    process.exit(1);
  }
  console.log('  Verification: 0 UUID exit references remaining — OK');

  console.log('\n--- Deduping __zIndex ---');
  const before = (kdl.match(/__zIndex/g) || []).length;
  kdl = dedupeZIndex(kdl);
  const after = (kdl.match(/__zIndex/g) || []).length;
  console.log(`  __zIndex: ${before} → ${after}`);

  const archiveDir = path.join(REPO_ROOT, 'archive/closebot-bots');
  const patchedPath = path.join(archiveDir, 'vacaville-v4.5-booking-exit-fix_2026-05-12.kdl');
  fs.writeFileSync(patchedPath, kdl);
  console.log(`  archived: ${path.relative(REPO_ROOT, patchedPath)}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Stopped before API calls. Review archived KDL to verify patch.');
    process.exit(0);
  }

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
    console.log('  attach got non-200, retrying once...');
    const retry = await api('POST', `/bot/${newBotId}/source/${SANDBOX_SOURCE_ID}`, { tags: [], channels: [] });
    console.log(`  retry → ${retry.status}`);
  }

  console.log('\n=== Done ===');
  console.log(`  Bot ID:   ${newBotId}`);
  console.log(`  Bot name: ${BOT_NAME}`);
  console.log(`  Source:   ${SANDBOX_SOURCE_ID} (GS Ads sandbox)`);
  console.log(`  Archive:  ${path.relative(REPO_ROOT, patchedPath)}`);
  console.log('\n  Next eval: vac_cooperative_scheduler — n30_book MUST be touched, appointment MUST appear in GHL');
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
