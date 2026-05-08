/**
 * Vacaville v4.0 patch — fix saveTools SmartFAQ + restore prohibitedWords.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/gs_patch_v4_0.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_patch_v4_0.log');

const BOT_ID = 'bot_P3WU0IFASM9DDPWA';

function log(m) { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); fs.appendFileSync(LOG, line + '\n'); }
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(method, ep, body) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' };
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

async function main() {
  log(`=== v4.0 patch — bot ${BOT_ID} ===`);

  // ── 1. saveTools with correct type/$type pairing ──────────────────────────
  log('--- 1. saveTools (SmartFAQ) ---');
  const tools = await api('POST', `/bot/${BOT_ID}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }
  ]);
  log(`  saveTools → ${tools.status}: ${JSON.stringify(tools.json).slice(0, 300)}`);

  // ── 2. Restore prohibitedWords via PUT importKdl ──────────────────────────
  log('--- 2. Restore prohibitedWords ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v4.0.kdl'), 'utf8');
  const putResp = await fetch(`https://api.closebot.com/bot/${BOT_ID}`, {
    method: 'PUT',
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ importKdl: kdl }),
  });
  log(`  PUT importKdl → ${putResp.status}`);

  // Re-publish after PUT (KDL re-imports create a draft version)
  log('--- 3. Re-publish ---');
  const pub = await api('POST', `/bot/${BOT_ID}/publish`, {});
  log(`  publish → ${pub.status}`);

  // ── 4. Verify ─────────────────────────────────────────────────────────────
  log('--- 4. Read-back verify ---');
  const exp = await api('GET', `/bot/${BOT_ID}/export`);
  if (exp.ok) {
    const kdlLive = exp.json?.kdl || '';
    const pwLine = kdlLive.match(/prohibitedWords([^\n]*)/)?.[0] || '(not found)';
    const pwHasValues = /prohibitedWords\s+"/.test(pwLine);
    log(`  prohibitedWords: ${pwLine.slice(0, 150).trim()}`);
    log(pwHasValues ? '  ✓ prohibitedWords RESTORED' : '  ⚠️  still stripped — manual UI restore needed');
  }

  // Verify tools via GET /bot/{id}
  const botResp = await api('GET', `/bot/${BOT_ID}`);
  if (botResp.ok) {
    const toolsList = botResp.json?.tools || [];
    log(`  Tools: ${JSON.stringify(toolsList)}`);
  }

  log('\n=== Patch complete ===');
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
