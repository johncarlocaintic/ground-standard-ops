/**
 * v4.1.1 hotfix — disable LibraryContext + SmartFAQ on n10_intro to stop hit_exception hang.
 *
 * Bot bot_DR18GF3ZG7IH5QOM was created fresh; SmartFAQ has zero entries seeded; bot hangs in n10_intro.
 * Same symptom as v4.0 → v4.0.1. Fix: turn off both, confirm bot responds, then re-enable in a follow-up
 * after seeding SmartFAQ entries.
 *
 * Bot was just created via API and has NOT been UI-edited yet → PUT importKdl should work here.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_patch_v4_1_disable_kb.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_patch_v4_1_disable_kb.log');
fs.mkdirSync(logDir, { recursive: true });

const BOT_ID = 'bot_DR18GF3ZG7IH5QOM';

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
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

async function main() {
  log('=== v4.1.1 hotfix: disable LibraryContext + SmartFAQ on n10_intro ===');

  // 1. Get current live KDL
  log('--- 1. Export current KDL ---');
  const exp = await api('GET', `/bot/${BOT_ID}/export`);
  if (!exp.ok || !exp.json?.kdl) {
    log('FAIL export: ' + JSON.stringify(exp.json));
    process.exit(1);
  }
  let kdl = exp.json.kdl;
  log(`  KDL size: ${kdl.length}`);

  // 2. Patch n10_intro: disable SmartFAQ + LibraryContext
  log('--- 2. Patch KDL ---');

  // Find n10_intro block
  const start = kdl.indexOf('Method id="n10_intro"');
  const end = kdl.indexOf('Method id="n20_details"');
  if (start < 0 || end < 0) {
    log('FAIL: could not find n10_intro block');
    process.exit(1);
  }
  const n10 = kdl.slice(start, end);
  const before = kdl.slice(0, start);
  const after = kdl.slice(end);

  // Replace EnableSmartFaq and EnableLibraryContext to false
  const patched = n10
    .replace(/EnableSmartFaq\s+true/, 'EnableSmartFaq false')
    .replace(/EnableLibraryContext\s+true/, 'EnableLibraryContext false');

  if (patched === n10) {
    log('WARN: no replacements made — fields may already be false or pattern mismatch');
  } else {
    log('  EnableSmartFaq → false');
    log('  EnableLibraryContext → false');
  }

  kdl = before + patched + after;

  // 3. PUT updated KDL
  log('--- 3. PUT updated KDL ---');
  const put = await api('PUT', `/bot/${BOT_ID}`, { importKdl: kdl });
  log(`  PUT → ${put.status}`);
  if (!put.ok) { log('FAIL PUT: ' + JSON.stringify(put.json)); process.exit(1); }

  // 4. Publish
  log('--- 4. Publish ---');
  const pub = await api('POST', `/bot/${BOT_ID}/publish`, {});
  log(`  publish → ${pub.status}`);
  if (!pub.ok) { log('FAIL publish: ' + JSON.stringify(pub.json)); process.exit(1); }

  // 5. Verify
  log('--- 5. Verify ---');
  const exp2 = await api('GET', `/bot/${BOT_ID}/export`);
  if (exp2.ok && exp2.json?.kdl) {
    const v = exp2.json.kdl;
    const n10v = v.slice(v.indexOf('Method id="n10_intro"'), v.indexOf('Method id="n20_details"'));
    const sfaq = n10v.match(/EnableSmartFaq\s+(\w+)/)?.[1];
    const libctx = n10v.match(/EnableLibraryContext\s+(\w+)/)?.[1];
    log(`  n10_intro EnableSmartFaq: ${sfaq} (expected false)`);
    log(`  n10_intro EnableLibraryContext: ${libctx} (expected false)`);
  }

  log('=== Hotfix complete. Re-test the bot now. ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
