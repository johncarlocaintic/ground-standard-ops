/**
 * Vacaville v4.4 deploy — KDL patched.
 *
 * Hypothesis: v4.2/v4.3 silent because their KDL is missing
 * `showTestPortal false` + `activeAiNodeId` on each node block.
 * v4.0/v4.1 have these and respond. Agent Node TEST has them and responds.
 *
 * This script:
 *   1. Pulls v4.3's KDL via GET /bot/{id}/export
 *   2. Injects `showTestPortal false` + `activeAiNodeId` after each node opening brace
 *   3. Creates new bot v4.4 from patched KDL
 *   4. Publishes
 *   5. (Manual) re-test via orchestrator
 *
 * Bot to clone: bot_34R9DX25ITD5DTH0 (v4.3)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'gs_deploy_v4_4_patched.log');
fs.writeFileSync(LOG, '');

const SOURCE_BOT = 'bot_34R9DX25ITD5DTH0'; // v4.3
const VERSION_LABEL = 'v4.4';

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

// Patch: inject `showTestPortal false` + `activeAiNodeId` before each `__position` line.
// Per v4.1 KDL inspection, these fields appear NEAR THE END of each node block (just
// before the `__position` declaration), not after the opening brace.
function patchKdl(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  let injected = 0;
  // Track previous line - if it was already 'activeAiNodeId' or 'showTestPortal', skip injection (idempotent)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const positionMatch = line.match(/^(\s+)__position\b/);
    if (positionMatch) {
      const prev1 = (out[out.length - 1] || '').trim();
      const prev2 = (out[out.length - 2] || '').trim();
      const alreadyPresent = prev1 === 'activeAiNodeId' || prev2.startsWith('showTestPortal');
      if (!alreadyPresent) {
        const indent = positionMatch[1];
        out.push(`${indent}showTestPortal false`);
        out.push(`${indent}activeAiNodeId`);
        injected++;
      }
    }
    out.push(line);
  }
  log(`  Patched ${injected} node blocks (injected before __position)`);
  return out.join('\n');
}

async function main() {
  log(`=== ${VERSION_LABEL} deploy — KDL patched ===`);

  // 1. Pull v4.3 KDL
  log(`--- Step 1: Pull KDL from ${SOURCE_BOT} ---`);
  const exp = await api('GET', `/bot/${SOURCE_BOT}/export`);
  if (!exp.ok || !exp.json?.kdl) {
    log(`FAIL export: ${exp.status} ${JSON.stringify(exp.json).slice(0, 300)}`);
    process.exit(1);
  }
  const originalKdl = exp.json.kdl;
  log(`  Original KDL: ${originalKdl.length} chars`);
  fs.writeFileSync(path.join(logDir, 'v4_4_kdl_original.txt'), originalKdl);

  // 2. Patch
  log(`--- Step 2: Patch KDL ---`);
  const patchedKdl = patchKdl(originalKdl);
  fs.writeFileSync(path.join(logDir, 'v4_4_kdl_patched.txt'), patchedKdl);
  log(`  Patched KDL: ${patchedKdl.length} chars (delta: +${patchedKdl.length - originalKdl.length})`);

  // 3. Create new bot
  log(`--- Step 3: Create v4.4 bot ---`);
  const name = `Vacaville ${VERSION_LABEL} TEST - patched (${new Date().toISOString().slice(0, 16)})`;
  const create = await api('POST', '/bot', { name, importKdl: patchedKdl });
  if (!create.ok) {
    log(`FAIL create: ${create.status} ${JSON.stringify(create.json).slice(0, 500)}`);
    process.exit(1);
  }
  const botId = create.json?.id || create.json?.bot?.id;
  log(`  bot ID: ${botId}`);

  // 4. Publish
  log(`--- Step 4: Publish ---`);
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish → ${pub.status}`);
  if (!pub.ok) log(`  WARN publish: ${JSON.stringify(pub.json).slice(0, 300)}`);

  log(`\n=== DEPLOY COMPLETE ===`);
  log(`v4.4 bot ID: ${botId}`);
  log(`To test:`);
  log(`  $env:CB_TEST_BOT_ID="${botId}"; node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/orchestrator.js`);
}

main().catch(err => { log(`FATAL: ${err.message}`); console.error(err); process.exit(1); });
