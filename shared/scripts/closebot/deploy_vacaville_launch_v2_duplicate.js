/**
 * Deploy Vacaville LAUNCH v1.0 — try 2 (using /duplicate endpoint, not importKdl).
 *
 * Plan:
 *   1. Mark broken try-1 bot (bot_WCRA0CQ8YDBN26M0) for cleanup
 *   2. POST /bot/bot_J56AWZ5TYQI9HKJS/duplicate → new bot
 *   3. Rename the duplicate
 *   4. Attach Vacaville source with concierge required + 7 exclusions
 *   5. Verify final state
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/vacaville_launch_v2_deploy.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const SOURCE_BOT_ID = 'bot_J56AWZ5TYQI9HKJS'; // proven-working test bench
const BROKEN_TRY1   = 'bot_WCRA0CQ8YDBN26M0'; // try-1 importKdl bot (broken at runtime)
const VACAVILLE_SRC = 'src_GDKORXSW4Q8RQUQ8';

const REQUIRED_TAGS = ['concierge'];
const EXCLUDED_TAGS = ['booked', 'member', 'alumni', 'spam', 'staff', 'service', 'showed'];
// "ai off" omitted: tag doesn't exist in Vacaville source yet, PIT lacks scope to create.

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function main() {
  log('=== Vacaville LAUNCH v1.0 deploy (try 2: /duplicate endpoint) ===');

  // STEP 0: Detach the broken try-1 bot from any source it grabbed, rename it [BROKEN]
  log(`[0] Cleanup try-1 bot: ${BROKEN_TRY1}`);
  const try1 = await req('GET', `/bot/${BROKEN_TRY1}`);
  if (try1.ok) {
    for (const s of (try1.json.sources || [])) {
      const sid = s.id;
      const d = await req('DELETE', `/bot/${BROKEN_TRY1}/source/${sid}`);
      log(`    detach ${sid} → ${d.status}`);
    }
    const rn = await req('PUT', `/bot/${BROKEN_TRY1}`, { name: '[BROKEN-API-IMPORT-2026-05-04] Vacaville LAUNCH try1' });
    log(`    rename try-1 → ${rn.status}`);
  } else {
    log(`    GET → ${try1.status} — try-1 bot already gone or unfetchable`);
  }
  log('');

  // STEP 1: Duplicate via /duplicate endpoint
  log(`[1] POST /bot/${SOURCE_BOT_ID}/duplicate`);
  const dup = await req('POST', `/bot/${SOURCE_BOT_ID}/duplicate`, {});
  log(`    → ${dup.status}`);
  if (!dup.ok) {
    log(`    body: ${dup.raw.slice(0, 400)}`);
    log('    FATAL: /duplicate endpoint also failing');
    process.exit(1);
  }
  const launchBotId = dup.json.id || dup.json.bot?.id;
  log(`    ✅ duplicated → ${launchBotId}`);
  log('');

  // STEP 2: Rename
  log(`[2] Rename launch bot`);
  const launchName = 'Vacaville PROD - Launch v1.0 (2026-05-04)';
  const rn = await req('PUT', `/bot/${launchBotId}`, { name: launchName });
  log(`    PUT name → ${rn.status}`);
  if (!rn.ok) log(`    body: ${rn.raw.slice(0, 200)}`);
  log('');

  // STEP 3: Pull state and confirm persona/SmartFAQ are inherited
  log('[3] Verify inherited state');
  const det = await req('GET', `/bot/${launchBotId}`);
  if (det.ok) {
    const b = det.json;
    log(`    name:       ${b.name}`);
    log(`    versions:   ${(b.versions || []).length}`);
    log(`    personaIds: ${JSON.stringify(b.personaIds)}`);
    log(`    tools:      ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
    log(`    sources:    ${(b.sources || []).map(s => `${s.name}(${s.id})`).join(', ') || 'none'}`);
  }
  log('');

  // STEP 4: If duplicate inherited the GS Ads source, detach it first
  log('[4] Detach any inherited sources');
  const inheritedSources = (det.json.sources || []);
  for (const s of inheritedSources) {
    const dr = await req('DELETE', `/bot/${launchBotId}/source/${s.id}`);
    log(`    detach ${s.id} → ${dr.status}`);
  }
  log('');

  // STEP 5: Attach Vacaville source with tag filter
  log('[5] Attach Vacaville source with tag filter');
  const tagFilter = [
    ...REQUIRED_TAGS.map(t => ({ name: t, approveDeny: true,  id: t })),
    ...EXCLUDED_TAGS.map(t => ({ name: t, approveDeny: false, id: t })),
  ];
  log(`    tag filter (${tagFilter.length} rules):`);
  for (const t of tagFilter) log(`      ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}`);
  const attach = await req('POST', `/bot/${launchBotId}/source/${VACAVILLE_SRC}`, {
    tags: tagFilter,
    channels: [],
    enabled: true,
  });
  log(`    POST attach → ${attach.status}`);
  if (!attach.ok) {
    log(`    body: ${attach.raw.slice(0, 400)}`);
    log('    FATAL: attach failed');
    process.exit(1);
  }
  log('');

  // STEP 6: Final verification
  log('[6] Final state');
  const final = await req('GET', `/bot/${launchBotId}`);
  if (final.ok) {
    const b = final.json;
    log(`    name:       ${b.name}`);
    log(`    personaIds: ${JSON.stringify(b.personaIds)}`);
    log(`    tools:      ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
    for (const s of (b.sources || [])) {
      log(`    source:     ${s.name}(${s.id})`);
      for (const t of (s.tags || [])) log(`      ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}`);
    }
  }

  // Persist state
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/vacaville_launch_state.json'), JSON.stringify({
    launchBotId,
    launchBotName: launchName,
    sourceBotId: SOURCE_BOT_ID,
    vacavilleSrc: VACAVILLE_SRC,
    requiredTags: REQUIRED_TAGS,
    excludedTags: EXCLUDED_TAGS,
    aiOffPending: true,
    deployedAt: new Date().toISOString(),
    method: '/duplicate (importKdl path is vendor-broken)',
  }, null, 2));
  log('');
  log(`=== DEPLOY COMPLETE ===`);
  log(`Launch bot: ${launchBotId}`);
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
