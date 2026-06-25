/**
 * Smoke test: KDL export → trivial edit → re-import → publish → verify → attach to sandbox.
 *
 * Goal: prove the old API-driven bot-edit workflow still works end-to-end on
 * bot_GBIF5HQVM8FPQ0XJ (live Vacaville PROD). If round-trip succeeds, we can
 * take over bot edits ourselves without waiting on CloseBot support to ship
 * the phone / youth_birthday / booking fabrication fixes.
 *
 * Safety:
 *   - Live bot bot_GBIF5HQVM8FPQ0XJ is NOT modified or detached.
 *   - New test bot is created with a clearly labeled name.
 *   - New test bot is attached to src_4R4DUIQTMMX2NFPU (GS Ads sandbox), never prod.
 *   - Original KDL is archived to archive/closebot-bots/ before any edits.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const LIVE_BOT_ID = 'bot_GBIF5HQVM8FPQ0XJ';
const SANDBOX_SOURCE_ID = 'src_4R4DUIQTMMX2NFPU'; // GS Ads sandbox
const SMOKE_MARKER = `[SMOKE_TEST_${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '')}]`;

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
  // Each block in the KDL export contains TWO __zIndex lines — one right after
  // the block opener `{`, and a second one a few lines later (after __position).
  // The importer rejects duplicates per block. Strategy: track block depth via
  // brace nesting and only keep the FIRST __zIndex seen between any `{` ... `}`
  // pair at any depth where we just entered (push) or matched.
  const lines = kdl.split('\n');
  const out = [];
  const seenZAtDepth = []; // stack: index = nesting depth, value = bool (have we kept a __zIndex at this depth since last `{`)
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    const isZ = /^__zIndex\b/.test(trimmed);
    if (isZ) {
      if (seenZAtDepth[depth]) {
        // already kept one at this depth in this block — skip
        continue;
      } else {
        seenZAtDepth[depth] = true;
      }
    }
    out.push(line);

    // Apply brace changes AFTER processing the line so a `{` on the line
    // increments depth for subsequent lines.
    for (let i = 0; i < opens; i++) {
      depth++;
      seenZAtDepth[depth] = false;
    }
    for (let i = 0; i < closes; i++) {
      seenZAtDepth[depth] = false;
      depth = Math.max(0, depth - 1);
    }
  }
  return out.join('\n');
}

async function main() {
  const ts = new Date().toISOString().slice(0, 10);
  console.log(`=== Smoke test: round-trip KDL on ${LIVE_BOT_ID} ===`);
  console.log(`Marker: ${SMOKE_MARKER}\n`);

  // Step 1: Export live bot KDL + snapshot
  console.log('--- Step 1: Export live KDL ---');
  const exp = await api('GET', `/bot/${LIVE_BOT_ID}/export`);
  if (!exp.ok) { console.error(`FATAL: export failed: ${exp.status}`, exp.json); process.exit(1); }
  const liveKdl = exp.json.kdl;
  console.log(`  exported: ${liveKdl.length} chars`);

  const archiveDir = path.join(REPO_ROOT, 'archive/closebot-bots');
  fs.mkdirSync(archiveDir, { recursive: true });
  const snapshotPath = path.join(archiveDir, `vacaville-prod-launch-v1_${ts}.kdl`);
  fs.writeFileSync(snapshotPath, liveKdl);
  console.log(`  archived: ${path.relative(REPO_ROOT, snapshotPath)}\n`);

  // Step 2: Inject a smoke-test marker into conversationReason
  // This is the safest place to put a non-functional marker — it's read by the
  // bot as goal/voice context, doesn't change routing.
  console.log('--- Step 2: Inject smoke marker into conversationReason ---');
  let editedKdl = liveKdl;
  const matches = editedKdl.match(/conversationReason "([^"]+)"/);
  if (!matches) { console.error('FATAL: no conversationReason found in KDL'); process.exit(1); }
  const oldReason = matches[1];
  const newReason = `${oldReason} ${SMOKE_MARKER}`;
  editedKdl = editedKdl.replace(`conversationReason "${oldReason}"`, `conversationReason "${newReason}"`);
  console.log(`  conversationReason length: ${oldReason.length} → ${newReason.length}\n`);

  // Step 3: Dedupe __zIndex (required for import per 2026-05-04 lesson)
  console.log('--- Step 3: Dedupe __zIndex before import ---');
  const before = (editedKdl.match(/__zIndex/g) || []).length;
  editedKdl = dedupeZIndex(editedKdl);
  const after = (editedKdl.match(/__zIndex/g) || []).length;
  console.log(`  __zIndex count: ${before} → ${after}\n`);

  fs.writeFileSync(path.join(archiveDir, `smoke-test-edited_${ts}.kdl`), editedKdl);

  // Step 4: POST /bot to create new bot
  console.log('--- Step 4: Create new bot via POST /bot { importKdl } ---');
  const newName = `Vacaville SMOKE TEST (${ts}) - delete after verify`;
  const create = await api('POST', '/bot', { name: newName, importKdl: editedKdl });
  console.log(`  POST /bot → ${create.status}`);
  if (!create.ok) {
    console.error('FATAL: create failed:', JSON.stringify(create.json).slice(0, 400));
    process.exit(1);
  }
  const newBotId = create.json.id || create.json._id;
  console.log(`  new bot id: ${newBotId}\n`);

  // Step 5: Publish new bot
  console.log('--- Step 5: Publish new bot ---');
  const pub = await api('POST', `/bot/${newBotId}/publish`, {});
  console.log(`  publish → ${pub.status}`);
  if (!pub.ok) {
    console.error('WARN: publish failed:', JSON.stringify(pub.json).slice(0, 400));
    // Don't bail — we still want to inspect what was created.
  } else {
    console.log(`  published OK\n`);
  }

  // Step 6: Re-export new bot and verify marker is present
  console.log('--- Step 6: Re-export new bot to verify marker landed ---');
  const verify = await api('GET', `/bot/${newBotId}/export`);
  if (!verify.ok) { console.error('FATAL: verify export failed:', verify.status); process.exit(1); }
  const verifiedKdl = verify.json.kdl;
  const hasMarker = verifiedKdl.includes(SMOKE_MARKER);
  console.log(`  re-exported: ${verifiedKdl.length} chars`);
  console.log(`  marker "${SMOKE_MARKER}" present in re-export: ${hasMarker ? 'YES ✅' : 'NO ❌'}\n`);

  // Step 7: Attach new bot to GS Ads sandbox source
  console.log('--- Step 7: Attach new bot to GS Ads sandbox (src_4R4DUIQTMMX2NFPU) ---');
  const attach = await api('POST', `/bot/${newBotId}/source/${SANDBOX_SOURCE_ID}`, {
    tags: [],
    channels: [],
  });
  console.log(`  attach → ${attach.status}`);
  if (!attach.ok) {
    console.error('WARN: attach failed:', JSON.stringify(attach.json).slice(0, 400));
  } else {
    console.log(`  attached to GS Ads sandbox\n`);
  }

  // Step 8: Confirm live bot was not modified
  console.log('--- Step 8: Confirm live bot is untouched ---');
  const liveCheck = await api('GET', `/bot/${LIVE_BOT_ID}/export`);
  const liveStillClean = !liveCheck.json.kdl.includes(SMOKE_MARKER);
  console.log(`  live bot (${LIVE_BOT_ID}) marker absent: ${liveStillClean ? 'YES ✅' : 'NO ❌'}`);

  console.log(`\n=== Summary ===`);
  console.log(`  Archive snapshot: ${path.relative(REPO_ROOT, snapshotPath)}`);
  console.log(`  New test bot:     ${newBotId}`);
  console.log(`  New bot name:     ${newName}`);
  console.log(`  Marker round-trip: ${hasMarker ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  Live bot untouched: ${liveStillClean ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  GS Ads attach:    ${attach.ok ? 'PASS ✅' : 'FAIL ❌'}`);
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
