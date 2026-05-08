/**
 * Deploy Vacaville LAUNCH v1.0.
 *
 * Plan:
 *   1. Export KDL from bot_J56AWZ5TYQI9HKJS (launch source-of-truth, v0.0.32)
 *   2. Sanitize: dedupe per-block __zIndex (workaround for 2026-05-04 import bug)
 *   3. POST /bot { name, importKdl } → new launch bot
 *   4. Publish
 *   5. Enable SmartFAQ tool (matching the test bench config)
 *   6. Attach the global Emma persona (pers_CB1LLPENDKDRB5S2)
 *   7. Attach Vacaville prod source (src_GDKORXSW4Q8RQUQ8) with tag filter:
 *        - REQUIRED: concierge          (approveDeny: true)
 *        - EXCLUDED: booked, member, alumni, spam, staff, service, showed
 *        - ai off omitted (must be added in GHL UI by Bobby first)
 *
 * Side effects:
 *   - Creates one new bot named "Vacaville PROD - Launch v1.0 (2026-05-04)"
 *   - Does NOT detach the launch source-of-truth from GS Ads — that bot is left
 *     intact as the 2nd-latest version-history fallback per Idriss's instruction.
 *   - Writes deploy state to shared/logs/vacaville_launch_state.json for follow-up scripts.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/vacaville_launch_deploy.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const BASE = 'https://api.closebot.com';
const KEY  = process.env.CB_GS_API_KEY;
if (!KEY) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': KEY, 'Content-Type': 'application/json' };

const SOURCE_BOT_ID  = 'bot_J56AWZ5TYQI9HKJS';
const VACAVILLE_SRC  = 'src_GDKORXSW4Q8RQUQ8';
const EMMA_PERSONA   = 'pers_CB1LLPENDKDRB5S2';

const REQUIRED_TAGS  = ['concierge'];
const EXCLUDED_TAGS  = ['booked', 'member', 'alumni', 'spam', 'staff', 'service', 'showed'];
// "ai off" intentionally omitted: tag does not exist on Vacaville source yet, and
// the Vacaville PIT lacks scope to create it. Bobby must add via GHL UI, then run
// shared/scripts/closebot/append_ai_off_filter.js (todo) to append the exclusion.

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

function dedupeZIndex(kdl) {
  // Within each `{ ... }` block, keep only the FIRST `__zIndex N` line.
  const lines = kdl.split('\n');
  const stack = [false];
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (/^__zIndex\s/.test(trimmed)) {
      const top = stack.length - 1;
      if (stack[top]) continue;
      stack[top] = true;
    }
    out.push(line);
    for (let i = 0; i < opens; i++) stack.push(false);
    for (let i = 0; i < closes; i++) {
      stack.pop();
      if (stack.length === 0) stack.push(false);
    }
  }
  return out.join('\n');
}

async function main() {
  log('=== Vacaville LAUNCH v1.0 deploy ===');
  log(`source-of-truth bot: ${SOURCE_BOT_ID}`);
  log('');

  // STEP 1: Export
  log('[1] Export KDL');
  const exp = await req('GET', `/bot/${SOURCE_BOT_ID}/export`);
  log(`    → ${exp.status}`);
  if (!exp.ok || !exp.json.kdl) {
    log(`    FATAL: export failed`);
    process.exit(1);
  }
  const rawKdl = exp.json.kdl;
  log(`    raw KDL: ${rawKdl.length} chars`);
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/launch_kdl_raw.kdl'), rawKdl);

  // STEP 2: Sanitize
  log('[2] Sanitize KDL (dedupe __zIndex)');
  const sanitized = dedupeZIndex(rawKdl);
  const removedLines = rawKdl.split('\n').length - sanitized.split('\n').length;
  log(`    removed ${removedLines} duplicate __zIndex lines`);
  log(`    sanitized KDL: ${sanitized.length} chars`);
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/launch_kdl_sanitized.kdl'), sanitized);

  // STEP 3: Create
  log('[3] POST /bot — create launch bot');
  const newName = 'Vacaville PROD - Launch v1.0 (2026-05-04)';
  const create = await req('POST', '/bot', { name: newName, importKdl: sanitized });
  log(`    → ${create.status}`);
  if (!create.ok) {
    log(`    FATAL: create failed: ${create.raw.slice(0, 400)}`);
    process.exit(1);
  }
  const launchBotId = create.json.id || create.json.bot?.id;
  log(`    ✅ launch bot id: ${launchBotId}`);

  // STEP 4: Publish
  log('[4] POST /bot/{id}/publish');
  const pub = await req('POST', `/bot/${launchBotId}/publish`, {});
  log(`    → ${pub.status}`);
  if (!pub.ok) log(`    WARN publish: ${pub.raw.slice(0, 200)}`);

  // STEP 5: Enable SmartFAQ tool
  // The launch source-of-truth has SmartFAQ enabled. Add it to the new bot.
  // Pattern from gs_seed_smart_faq.js / launch_bot_detail.json: tool with type "SmartFAQ".
  log('[5] Enable SmartFAQ tool');
  const detailBefore = await req('GET', `/bot/${launchBotId}`);
  const toolsBefore = detailBefore.json.tools || [];
  const hasSmartFaq = toolsBefore.some(t => t.type === 'SmartFAQ');
  if (hasSmartFaq) {
    log(`    SmartFAQ already enabled on the new bot — skip`);
  } else {
    // Try the bot tool endpoint
    const seed = await req('POST', `/bot/${launchBotId}/tool`, {
      type: 'SmartFAQ',
      enabled: true,
      options: { $type: 'smart_faq' },
    });
    log(`    POST /bot/${launchBotId}/tool → ${seed.status}`);
    if (!seed.ok) {
      log(`    WARN: SmartFAQ seed failed (${seed.raw.slice(0, 200)}). Bot still works without it; FAQ collection just won't auto-surface knowledge gaps.`);
    } else {
      log(`    ✅ SmartFAQ enabled`);
    }
  }

  // STEP 6: Attach Emma persona
  log('[6] Attach Emma persona');
  // Try PUT /bot/{id} { personaIds: [...] }
  const attachPersona = await req('PUT', `/bot/${launchBotId}`, { personaIds: [EMMA_PERSONA] });
  log(`    PUT /bot/${launchBotId} { personaIds } → ${attachPersona.status}`);
  if (!attachPersona.ok) {
    log(`    WARN persona attach: ${attachPersona.raw.slice(0, 200)}`);
    // Try alt: POST /bot/{id}/persona/{personaId}
    const alt = await req('POST', `/bot/${launchBotId}/persona/${EMMA_PERSONA}`, {});
    log(`    alt POST persona → ${alt.status}`);
  } else {
    log(`    ✅ persona attached`);
  }

  // STEP 7: Attach Vacaville source with tag filter
  log('[7] Attach Vacaville source with tag filter');
  const tagFilter = [
    ...REQUIRED_TAGS.map(t => ({ name: t, approveDeny: true,  id: t })),
    ...EXCLUDED_TAGS.map(t => ({ name: t, approveDeny: false, id: t })),
  ];
  log(`    tag filter (${tagFilter.length} rules):`);
  for (const t of tagFilter) {
    log(`      ${t.approveDeny ? '+ REQUIRED' : '- EXCLUDED'}  ${t.name}`);
  }
  const attach = await req('POST', `/bot/${launchBotId}/source/${VACAVILLE_SRC}`, {
    tags: tagFilter,
    channels: [],
    enabled: true,
  });
  log(`    POST /bot/${launchBotId}/source/${VACAVILLE_SRC} → ${attach.status}`);
  if (!attach.ok) {
    log(`    FATAL attach: ${attach.raw.slice(0, 400)}`);
    process.exit(1);
  }
  log(`    ✅ source attached`);

  // STEP 8: Verify final bot state
  log('[8] Verify final bot state');
  const final = await req('GET', `/bot/${launchBotId}`);
  if (final.ok) {
    const b = final.json;
    log(`    name:       ${b.name}`);
    log(`    versions:   ${(b.versions || []).length} (latest published: ${(b.versions || []).slice(-1)[0]?.published})`);
    log(`    personaIds: ${JSON.stringify(b.personaIds)}`);
    log(`    tools:      ${(b.tools || []).map(t => t.type).join(',') || 'none'}`);
    log(`    sources:    ${(b.sources || []).map(s => `${s.name}(${s.id}) tags=${(s.tags || []).length}`).join(' | ') || 'none'}`);
    if (b.sources?.length) {
      const vs = b.sources.find(s => s.id === VACAVILLE_SRC);
      if (vs) {
        log(`    Vacaville source tags:`);
        for (const t of vs.tags || []) {
          log(`      ${t.approveDeny ? '+REQ' : '-EXC'}  ${t.name}`);
        }
      }
    }
  }

  // Persist state
  const state = {
    launchBotId,
    launchBotName: newName,
    sourceBotId: SOURCE_BOT_ID,
    vacavilleSrc: VACAVILLE_SRC,
    emmaPersona: EMMA_PERSONA,
    requiredTags: REQUIRED_TAGS,
    excludedTags: EXCLUDED_TAGS,
    aiOffPending: true,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(REPO_ROOT, 'shared/logs/vacaville_launch_state.json'), JSON.stringify(state, null, 2));
  log('');
  log(`Wrote deploy state → shared/logs/vacaville_launch_state.json`);
  log(`=== DEPLOY COMPLETE ===`);
  log(`Launch bot: ${launchBotId} ("${newName}")`);
}

main().catch(e => { log(`FATAL: ${e.message}\n${e.stack}`); process.exit(1); });
