/**
 * Deploy: Vacaville v4.6 → Production
 *
 * Promotes bot_F0VNPTPCIW88YI3J (v4.6, no hardcoded calendar IDs) to the
 * Vacaville production source (src_GDKORXSW4Q8RQUQ8).
 *
 * Archives prior prod bot (bot_GBIF5HQVM8FPQ0XJ) with all three steps:
 *   1. Detach source
 *   2. Rename to [LEGACY]
 *   3. Clear tag filter
 *
 * Then attaches v4.6 with the same trigger tag config as the prior prod bot:
 *   - Must contain:     concierge
 *   - Must NOT contain: booked, member, alumni, spam, staff, service, showed, alert, aggressive
 *
 * Set DRY_RUN=1 to preview without API calls.
 */
const CB_KEY = process.env.CB_GS_API_KEY;
if (!CB_KEY) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const PROD_SOURCE_ID  = 'src_GDKORXSW4Q8RQUQ8';
const V46_BOT_ID      = 'bot_F0VNPTPCIW88YI3J';
const V46_BOT_NAME    = 'Vacaville PROD - v4.6 dynamic calendar IDs (2026-05-12)';
const PRIOR_BOT_ID    = 'bot_GBIF5HQVM8FPQ0XJ';
const PRIOR_BOT_LEGACY_NAME = '[LEGACY] Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)';
const DRY_RUN = process.env.DRY_RUN === '1';

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

async function api(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

const PROD_TAGS = [
  { name: 'concierge', approveDeny: true,  id: 'concierge' },
  { name: 'booked',    approveDeny: false, id: 'booked' },
  { name: 'member',    approveDeny: false, id: 'member' },
  { name: 'alumni',    approveDeny: false, id: 'alumni' },
  { name: 'spam',      approveDeny: false, id: 'spam' },
  { name: 'staff',     approveDeny: false, id: 'staff' },
  { name: 'service',   approveDeny: false, id: 'service' },
  { name: 'showed',    approveDeny: false, id: 'showed' },
  { name: 'alert',     approveDeny: false, id: 'alert' },
  { name: 'aggressive',approveDeny: false, id: 'aggressive' },
];

async function main() {
  console.log('=== Deploy: Vacaville v4.6 → Production ===');
  if (DRY_RUN) console.log('  [DRY RUN]\n');

  // --- Verify v4.6 bot exists and is published ---
  console.log('--- Pre-flight: verify v4.6 bot ---');
  const v46 = await api('GET', `/bot/${V46_BOT_ID}`);
  if (!v46.ok) {
    console.error('FATAL: v4.6 bot not found:', JSON.stringify(v46.json).slice(0, 200));
    process.exit(1);
  }
  console.log(`  v4.6 bot: "${v46.json.name}" — OK`);
  const alreadyOnProd = (v46.json.sources || []).some(s => s.id === PROD_SOURCE_ID);
  if (alreadyOnProd) {
    console.log('  v4.6 already attached to production source — nothing to do');
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would execute:');
    console.log(`  1. Detach ${PRIOR_BOT_ID} from ${PROD_SOURCE_ID}`);
    console.log(`  2. Rename ${PRIOR_BOT_ID} → "${PRIOR_BOT_LEGACY_NAME}"`);
    console.log(`  3. Clear tag filter on ${PRIOR_BOT_ID}/${PROD_SOURCE_ID}`);
    console.log(`  4. Rename ${V46_BOT_ID} → "${V46_BOT_NAME}"`);
    console.log(`  5. Attach ${V46_BOT_ID} to ${PROD_SOURCE_ID} with ${PROD_TAGS.length} tags`);
    process.exit(0);
  }

  // --- Archive prior prod bot ---
  console.log('\n--- Archiving prior prod bot ---');

  const detach = await api('DELETE', `/bot/${PRIOR_BOT_ID}/source/${PROD_SOURCE_ID}`);
  console.log(`  detach → ${detach.status}${!detach.ok ? ': ' + JSON.stringify(detach.json).slice(0, 100) : ''}`);

  const rename = await api('PUT', `/bot/${PRIOR_BOT_ID}`, { name: PRIOR_BOT_LEGACY_NAME });
  console.log(`  rename → ${rename.status}${!rename.ok ? ': ' + JSON.stringify(rename.json).slice(0, 100) : ''}`);

  const clearTags = await api('POST', `/bot/${PRIOR_BOT_ID}/source/${PROD_SOURCE_ID}`, { tags: [], channels: [] });
  console.log(`  clear tag filter → ${clearTags.status}${!clearTags.ok ? ': ' + JSON.stringify(clearTags.json).slice(0, 100) : ''}`);

  // --- Rename v4.6 to production name ---
  console.log('\n--- Renaming v4.6 to production name ---');
  const renameV46 = await api('PUT', `/bot/${V46_BOT_ID}`, { name: V46_BOT_NAME });
  console.log(`  rename v4.6 → ${renameV46.status}`);

  // --- Attach v4.6 to production source ---
  console.log('\n--- Attaching v4.6 to production source ---');
  const attach = await api('POST', `/bot/${V46_BOT_ID}/source/${PROD_SOURCE_ID}`, { tags: PROD_TAGS, channels: [] });
  console.log(`  attach → ${attach.status}`);
  if (!attach.ok) {
    console.error('FATAL attach failed:', JSON.stringify(attach.json).slice(0, 400));
    process.exit(1);
  }

  // Retry if needed
  const verify = await api('GET', `/bot/${V46_BOT_ID}`);
  const attached = (verify.json.sources || []).some(s => s.id === PROD_SOURCE_ID);
  if (!attached) {
    console.log('  attach not reflected — retrying...');
    const retry = await api('POST', `/bot/${V46_BOT_ID}/source/${PROD_SOURCE_ID}`, { tags: PROD_TAGS, channels: [] });
    console.log(`  retry → ${retry.status}`);
  } else {
    console.log('  verified: v4.6 on production source');
  }

  console.log('\n=== Done ===');
  console.log(`  Live bot: ${V46_BOT_ID} ("${V46_BOT_NAME}")`);
  console.log(`  Source:   ${PROD_SOURCE_ID} (Vacaville Grappling Academy)`);
  console.log(`  Archived: ${PRIOR_BOT_ID} → "${PRIOR_BOT_LEGACY_NAME}"`);
  console.log('\n  Next: run final sweep');
  console.log(`    CB_TEST_BOT_ID=${V46_BOT_ID} MIMIC_SOURCE_ID=${PROD_SOURCE_ID} ALLOW_PROD_MIMIC=true \\`);
  console.log(`    node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/sweep_vacaville.js`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
