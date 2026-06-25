/**
 * Deploy: Vacaville v4.2 — DOB ISO normalization fix
 *
 * Patches two nodes to force YYYY-MM-DD format on all date fields before
 * Update Contact fires. Ships to GS Ads sandbox only — never touches prod.
 *
 * Nodes patched:
 *   n20_details-1777550082426  (Data Capture v2)  — date_of_birth + youth_birthday
 *   c48ed054-9eef-4341-abed-ca84cc63ac39 (Capture Kid Info) — youth_birthday
 *
 * Set DRY_RUN=1 to preview without creating a bot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const SANDBOX_SOURCE_ID = 'src_4R4DUIQTMMX2NFPU';
const BOT_NAME = 'Vacaville SANDBOX - v4.2 DOB ISO fix (2026-05-12)';
const KDL_SNAPSHOT = path.join(REPO_ROOT, 'archive/closebot-bots/vacaville-prod-launch-v1_2026-05-11.kdl');
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

function patchDOBInstructions(kdl) {
  // In KDL files, \n inside quoted strings are the two-char sequence backslash+n.
  // JS string literals use \\n to represent that two-char sequence.

  // --- Patch 1: n20_details (Data Capture v2) ---
  // Covers contact.date_of_birth (adult) AND contact.youth_birthday (kid).
  // Injects ISO instruction between the youth_birthday line and "Save each field".
  // Appears in both the Sections Body and Instructions fields — replaceAll hits both.
  const N20_ANCHOR = '- Kid\'s date of birth → {{contact.youth_birthday}}\\n\\nSave each field immediately when received.';
  const N20_PATCH = [
    '- Kid\'s date of birth → {{contact.youth_birthday}}',
    '\\n\\nDates: before calling @@[Update Contact] for any date field',
    ' (contact.date_of_birth or contact.youth_birthday), always convert to',
    ' YYYY-MM-DD format first (e.g. August 12 2016 → 2016-08-12,',
    ' 08/12/2016 → 2016-08-12). Never pass plain English or MM/DD/YYYY.',
    '\\n\\nSave each field immediately when received.',
  ].join('');

  const n20Count = kdl.split(N20_ANCHOR).length - 1;
  if (n20Count === 0) {
    console.error('ERROR: n20_details anchor not found — check KDL snapshot');
    process.exit(1);
  }
  kdl = kdl.replaceAll(N20_ANCHOR, N20_PATCH);
  console.log(`  n20_details: found ${n20Count} occurrence(s) → patched`);

  // --- Patch 2: c48ed054 (Capture Kid Info — minor flow) ---
  // Appends ISO instruction at the end of the kid-capture instructions.
  // Appears in both Body and Instructions — replaceAll hits both.
  const C48_ANCHOR = 'contact.date_of_birth so the next node can populate them with parent info."';
  const C48_PATCH = [
    'contact.date_of_birth so the next node can populate them with parent info.',
    '\\n\\nAlways convert contact.youth_birthday to YYYY-MM-DD format before',
    ' calling @@[Update Contact] (e.g. August 12 2016 → 2016-08-12).',
    ' Never pass plain English or MM/DD/YYYY."',
  ].join('');

  const c48Count = kdl.split(C48_ANCHOR).length - 1;
  if (c48Count === 0) {
    console.error('ERROR: c48ed054 anchor not found — check KDL snapshot');
    process.exit(1);
  }
  kdl = kdl.replaceAll(C48_ANCHOR, C48_PATCH);
  console.log(`  c48ed054: found ${c48Count} occurrence(s) → patched`);

  return kdl;
}

async function main() {
  console.log('=== Deploy: Vacaville v4.2 DOB ISO fix ===');
  if (DRY_RUN) console.log('  [DRY RUN — will not call API]\n');

  const base = fs.readFileSync(KDL_SNAPSHOT, 'utf8');
  console.log(`Loaded snapshot: ${base.length} chars\n`);

  console.log('--- Patching ---');
  let kdl = patchDOBInstructions(base);

  console.log('\n--- Deduping __zIndex ---');
  const before = (kdl.match(/__zIndex/g) || []).length;
  kdl = dedupeZIndex(kdl);
  const after = (kdl.match(/__zIndex/g) || []).length;
  console.log(`  __zIndex: ${before} → ${after}`);

  const archiveDir = path.join(REPO_ROOT, 'archive/closebot-bots');
  const patchedPath = path.join(archiveDir, 'vacaville-v4.2-dob-fix_2026-05-12.kdl');
  fs.writeFileSync(patchedPath, kdl);
  console.log(`  archived: ${path.relative(REPO_ROOT, patchedPath)}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Stopped before API calls. Review the archived KDL to verify patch.');
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
  if (!attach.ok) console.error('  WARN attach failed:', JSON.stringify(attach.json).slice(0, 200));

  console.log('\n=== Done ===');
  console.log(`  Bot ID:   ${newBotId}`);
  console.log(`  Bot name: ${BOT_NAME}`);
  console.log(`  Source:   ${SANDBOX_SOURCE_ID} (GS Ads sandbox)`);
  console.log(`  Archive:  ${path.relative(REPO_ROOT, patchedPath)}`);
  console.log('\n  Next: run eval with cooperative_scheduler + multi_kid_family personas');
  console.log('        verify contact.youth_birthday = YYYY-MM-DD in GHL directly');
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
