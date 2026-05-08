/**
 * Finalize Utility Valet livechat bot after manual persona attachment in the UI.
 *
 * Why this is a second script: CloseBot's API has no endpoint for binding a persona
 * to a bot — it's a UI-only action (confirmed via developers.closebot.com
 * inventory: neither PUT /bot nor PUT /persona accepts bot-persona binding fields,
 * and the personaIds field on the bot is read-only).
 *
 * Workflow:
 *   1. pb_deploy_utv_livechat.js creates the bot + persona (already run)
 *   2. JC opens the bot in CloseBot UI → picks "Val | Utility Valet" as the persona
 *   3. JC runs THIS script → publishes + attaches to source
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../../..');
const logDir = path.join(repoRoot, 'shared/logs');
const LOG = path.join(logDir, 'pb_finalize_utv_livechat.log');

const BOT_ID = 'bot_EU8HIUGHMIIIEDT6';
const PERSONA_ID = 'pers_HDX2LOIVBQWYQXD9';
const SOURCE_ID = 'src_UPYVX058EPQM8GVA';
const TRIGGER_TAG = 'lead - replied - widget';
const CHANNEL = 'Live_Chat';
const KDL_PATH = path.join(repoRoot, 'clients/propertybots/closebot/utility-valet-outbound/bot.kdl');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing env var ${k}`); process.exit(1); }
  return process.env[k];
}
async function api(method, ep, body) {
  const headers = { 'X-CB-KEY': getEnv('CB_PB_API_KEY') };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let json; try { json = JSON.parse(t); } catch { json = { raw: t.slice(0, 500) }; }
  return { status: r.status, ok: r.ok, json };
}

async function main() {
  log('=== PB Utility Valet livechat finalize ===');

  log('--- Step 1: Pre-flight — confirm persona is attached ---');
  const bot = await api('GET', `/bot/${BOT_ID}`);
  if (!bot.ok) { log('FAIL bot fetch: ' + bot.status); process.exit(1); }
  const personaIds = bot.json.personaIds || [];
  log(`  bot.personaIds: ${JSON.stringify(personaIds)}`);
  if (!personaIds.includes(PERSONA_ID)) {
    log(`  FAIL: persona ${PERSONA_ID} not yet attached to bot ${BOT_ID}.`);
    log(`  Open CloseBot UI → bot "[UTV] Inbound Setter - Livechat [TEST]" → assign "Val | Utility Valet" → rerun this script.`);
    process.exit(1);
  }
  log(`  persona confirmed attached`);

  log('--- Step 2: Publish ---');
  const pub = await api('POST', `/bot/${BOT_ID}/publish`, {});
  log(`  publish -> ${pub.status}`);
  if (!pub.ok) {
    log('FAIL publish: ' + JSON.stringify(pub.json).slice(0, 500));
    process.exit(1);
  }

  log('--- Step 3: prohibitedWords read-back check ---');
  const kdlSrc = fs.readFileSync(KDL_PATH, 'utf8');
  const exp = await api('GET', `/bot/${BOT_ID}/export`);
  if (exp.ok) {
    const kdlLive = typeof exp.json === 'string' ? exp.json : (exp.json.kdl || exp.json.exportKdl || '');
    fs.writeFileSync(path.join(logDir, `pb_utv_livechat_readback_${BOT_ID}.kdl`), kdlLive);
    const pwLine = (kdlLive.match(/prohibitedWords[^\n]*/) || ['(not found)'])[0];
    const pwHasValues = /prohibitedWords\s+"/.test(pwLine);
    if (!pwHasValues) {
      log('  prohibitedWords STRIPPED on publish — restoring via PUT...');
      const put = await fetch(`https://api.closebot.com/bot/${BOT_ID}`, {
        method: 'PUT',
        headers: { 'X-CB-KEY': getEnv('CB_PB_API_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ importKdl: kdlSrc }),
      });
      log(`  PUT restore -> ${put.status}`);
      const exp2 = await api('GET', `/bot/${BOT_ID}/export`);
      if (exp2.ok) {
        const kdl2 = typeof exp2.json === 'string' ? exp2.json : (exp2.json.kdl || exp2.json.exportKdl || '');
        const pw2 = (kdl2.match(/prohibitedWords[^\n]*/) || [''])[0];
        const pw2Has = /prohibitedWords\s+"/.test(pw2);
        log(pw2Has ? '  restored' : '  STILL stripped — manual UI restore required');
      }
    } else {
      log('  prohibitedWords survived');
    }
  }

  log('--- Step 4: Attach to source ---');
  const attach = await api('POST', `/bot/${BOT_ID}/source/${SOURCE_ID}`, {
    tags: [{ name: TRIGGER_TAG, approveDeny: true, id: TRIGGER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach -> ${attach.status}`);
  if (!attach.ok) log('  WARN: ' + JSON.stringify(attach.json).slice(0, 400));

  log('');
  log('=== FINALIZE COMPLETE ===');
  log(`  Bot: ${BOT_ID} ([UTV] Inbound Setter - Livechat [TEST])`);
  log(`  Persona: ${PERSONA_ID} (Val | Utility Valet)`);
  log(`  Source: ${SOURCE_ID} ([CLIENT] Utility Valet)`);
  log(`  Channel: ${CHANNEL}`);
  log(`  Trigger tag: ${TRIGGER_TAG}`);
}

main().catch(e => { log('FATAL: ' + (e.stack || e.message)); process.exit(1); });
