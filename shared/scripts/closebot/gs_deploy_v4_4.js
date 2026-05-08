/**
 * Vacaville v4.4 deploy — clean source with duplicate-__zIndex fix.
 *
 * Root cause discovered 2026-04-25: hand-maintained Vacaville KDL files
 * contain `__zIndex 1` declared TWICE per node block (once at top, once at
 * bottom). CloseBot's import endpoint rejects duplicate field names with 500.
 *
 * This script strips the SECOND `__zIndex 1` from each node block before
 * importing.
 *
 * Source: shared/logs/vacaville_v4.2.kdl (full Vacaville flow)
 *
 * IMPORTANT after deploy: do NOT edit in CloseBot UI before testing.
 * UI saves can also corrupt KDL fields per earlier observations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_v4_4.log');
fs.writeFileSync(LOG, '');

const KDL_SOURCE = path.join(logDir, 'vacaville_v4.1.kdl');
const VERSION_LABEL = 'v4.4-from-v4.1-source';

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); }
  return process.env[k];
}
async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

// Strip duplicate `__zIndex 1` declarations within each node block.
// Walks block by block (depth-tracked), deduplicates `__zIndex` lines per block.
function stripDuplicateZIndex(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  let depth = 0;
  let zIndexSeenAtDepth = []; // per-depth tracker

  for (const line of lines) {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    const trim = line.trim();

    // Check if this is a __zIndex declaration at the current node depth
    const isZIndex = /^__zIndex\b/.test(trim);

    if (isZIndex && depth >= 1) {
      // Initialize tracker if needed
      while (zIndexSeenAtDepth.length <= depth) zIndexSeenAtDepth.push(false);
      if (zIndexSeenAtDepth[depth]) {
        // Skip duplicate
        depth += opens - closes;
        continue;
      }
      zIndexSeenAtDepth[depth] = true;
    }

    out.push(line);

    // Update depth AFTER push
    depth += opens - closes;
    // When closing a block, reset the tracker for that depth
    if (closes > 0) {
      while (zIndexSeenAtDepth.length > depth + 1) zIndexSeenAtDepth.pop();
      if (zIndexSeenAtDepth.length > 0) zIndexSeenAtDepth[zIndexSeenAtDepth.length - 1] = false;
    }
  }
  return out.join('\n');
}

async function main() {
  log(`=== ${VERSION_LABEL} deploy — clean source + duplicate __zIndex stripped ===`);

  const kdl = fs.readFileSync(KDL_SOURCE, 'utf8');
  const beforeCount = (kdl.match(/__zIndex/g) || []).length;
  log(`Source KDL: ${kdl.length} chars, __zIndex occurrences (before): ${beforeCount}`);

  const patched = stripDuplicateZIndex(kdl);
  const afterCount = (patched.match(/__zIndex/g) || []).length;
  log(`Patched KDL: ${patched.length} chars, __zIndex occurrences (after): ${afterCount}, removed ${beforeCount - afterCount} duplicates`);
  fs.writeFileSync(path.join(logDir, 'v4_4_kdl_dedup.txt'), patched);

  const name = `Vacaville ${VERSION_LABEL} TEST - dedup zIndex (${new Date().toISOString().slice(0, 16)})`;
  log(`name: ${name}`);

  log('--- Step 1: Create bot ---');
  const c = await api('POST', '/bot', { name, importKdl: patched });
  if (!c.ok) {
    log(`FAIL create: ${c.status} ${JSON.stringify(c.json).slice(0, 500)}`);
    process.exit(1);
  }
  const botId = c.json?.id || c.json?.bot?.id;
  log(`bot ID: ${botId}`);

  log('--- Step 2: Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`publish → ${pub.status}`);
  if (!pub.ok) log(`WARN publish: ${JSON.stringify(pub.json).slice(0, 300)}`);

  log('--- Step 3: saveTools (SmartFAQ) ---');
  const tools = await api('POST', `/bot/${botId}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }
  ]);
  log(`saveTools → ${tools.status}`);

  log('--- Step 4: Attach to GS Ads source (no tag filter, Test Chat 12 channel) ---');
  const attach = await api('POST', `/bot/${botId}/source/src_4R4DUIQTMMX2NFPU`, {
    tags: [],
    channels: ['Test Chat 12 [VACAVILLE ]'],
    enabled: true,
  });
  log(`attach → ${attach.status}`);

  log('--- Step 5: Re-publish after attach ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  log(`re-publish → ${pub2.status}`);

  log('--- Step 6: Verify deployed KDL ---');
  const exp = await api('GET', `/bot/${botId}/export`);
  if (exp.ok && exp.json?.kdl) {
    const liveZIndex = (exp.json.kdl.match(/__zIndex/g) || []).length;
    const liveShowTestPortal = (exp.json.kdl.match(/showTestPortal/g) || []).length;
    log(`Live KDL: ${exp.json.kdl.length} chars, __zIndex: ${liveZIndex}, showTestPortal: ${liveShowTestPortal}`);
  }

  log('');
  log('=== DEPLOY COMPLETE ===');
  log(`v4.4 bot ID: ${botId}`);
  log('');
  log('NEXT: test via orchestrator BEFORE any UI edits:');
  log(`  $env:CB_TEST_BOT_ID="${botId}"; node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/orchestrator.js`);
}

main().catch(err => { log(`FATAL: ${err.message}`); console.error(err); process.exit(1); });
