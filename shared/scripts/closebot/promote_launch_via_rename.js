/**
 * Promote bot_J56AWZ5TYQI9HKJS (test-bench source-of-truth) to LAUNCH:
 *   1. Rename "[BROKEN-API-DUPLICATE-2026-05-04]" the partial /duplicate bot bot_SJNN1QEOEJUUU2MH
 *      and detach Vacaville source from it (so two bots aren't fighting over the source).
 *   2. Rename bot_J56AWZ5TYQI9HKJS to "Vacaville PROD - Launch v1.0 (2026-05-04)"
 *   3. Detach its GS Ads sandbox source
 *   4. Attach Vacaville prod source with concierge required + 7 exclusions tag filter
 *   5. Verify final state
 */
const KEY = process.env.CB_GS_API_KEY;
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/promote_launch_via_rename.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const SOURCE_BOT = 'bot_J56AWZ5TYQI9HKJS';   // become the launch
const PARTIAL_DUP = 'bot_SJNN1QEOEJUUU2MH';  // /duplicate skeleton from try-2 — to detach + rename
const GS_ADS_SRC  = 'src_4R4DUIQTMMX2NFPU';
const VACAVILLE_SRC = 'src_GDKORXSW4Q8RQUQ8';

const REQUIRED_TAGS = ['concierge'];
const EXCLUDED_TAGS = ['booked', 'member', 'alumni', 'spam', 'staff', 'service', 'showed'];

async function req(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

async function main() {
  log('=== Promote source-of-truth to LAUNCH (rename strategy) ===');

  // STEP 1: Detach + rename the partial /duplicate bot
  log('[1] Cleanup partial /duplicate bot');
  const dup = await req('GET', `/bot/${PARTIAL_DUP}`);
  if (dup.ok) {
    for (const s of (dup.json.sources || [])) {
      const r = await req('DELETE', `/bot/${PARTIAL_DUP}/source/${s.id}`);
      log(`    detach ${s.id} from partial → ${r.status}`);
    }
    const rn = await req('PUT', `/bot/${PARTIAL_DUP}`, { name: '[BROKEN-API-DUPLICATE-2026-05-04] no persona attached' });
    log(`    rename partial → ${rn.status}`);
  }
  log('');

  // STEP 2: Rename source-of-truth → launch name
  log('[2] Rename source-of-truth → launch name');
  const launchName = 'Vacaville PROD - Launch v1.0 (2026-05-04)';
  const rn = await req('PUT', `/bot/${SOURCE_BOT}`, { name: launchName });
  log(`    PUT name → ${rn.status}`);
  log('');

  // STEP 3: Detach GS Ads source
  log('[3] Detach GS Ads sandbox');
  const det = await req('GET', `/bot/${SOURCE_BOT}`);
  for (const s of (det.json?.sources || [])) {
    if (s.id === GS_ADS_SRC) {
      const r = await req('DELETE', `/bot/${SOURCE_BOT}/source/${s.id}`);
      log(`    DELETE GS Ads → ${r.status}`);
    } else {
      log(`    keeping unrelated source ${s.id} (${s.name})`);
    }
  }
  log('');

  // STEP 4: Attach Vacaville with tag filter
  log('[4] Attach Vacaville source with tag filter');
  const tagFilter = [
    ...REQUIRED_TAGS.map(t => ({ name: t, approveDeny: true,  id: t })),
    ...EXCLUDED_TAGS.map(t => ({ name: t, approveDeny: false, id: t })),
  ];
  for (const t of tagFilter) log(`    ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}`);
  const attach = await req('POST', `/bot/${SOURCE_BOT}/source/${VACAVILLE_SRC}`, {
    tags: tagFilter,
    channels: [],
    enabled: true,
  });
  log(`    attach → ${attach.status}`);
  if (!attach.ok) {
    log(`    body: ${attach.raw.slice(0, 400)}`);
    log('    FATAL: attach failed');
    process.exit(1);
  }
  log('');

  // STEP 5: Verify
  log('[5] Verify final state');
  const final = await req('GET', `/bot/${SOURCE_BOT}`);
  if (final.ok) {
    const b = final.json;
    log(`    name:       ${b.name}`);
    log(`    versions:   ${(b.versions || []).length}`);
    log(`    personaIds: ${JSON.stringify(b.personaIds)}`);
    log(`    tools:      ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
    for (const s of (b.sources || [])) {
      log(`    source:     ${s.name}(${s.id})`);
      for (const t of (s.tags || [])) log(`      ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}`);
    }
  }

  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/vacaville_launch_state.json'), JSON.stringify({
    launchBotId: SOURCE_BOT,
    launchBotName: launchName,
    method: 'rename strategy (API duplication blocked: persona attach is UI-only)',
    vacavilleSrc: VACAVILLE_SRC,
    requiredTags: REQUIRED_TAGS,
    excludedTags: EXCLUDED_TAGS,
    aiOffPending: true,
    deployedAt: new Date().toISOString(),
  }, null, 2));
  log('');
  log(`=== DONE ===`);
  log(`Launch bot: ${SOURCE_BOT} ("${launchName}")`);
}

main().catch(e => log(`FATAL: ${e.message}`));
