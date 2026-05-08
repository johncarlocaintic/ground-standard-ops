/**
 * Deploy Utility Valet live-chat bot to PropertyBots CloseBot account.
 *
 * Builds a new bot from clients/propertybots/closebot/utility-valet-outbound/bot.kdl.
 * Does NOT replace the existing draft `[UTV] Inbound Setter - Draft`.
 * Creates + publishes. Does NOT attach to source — JC inspects in UI first, then
 * a separate attach step binds it to src_UPYVX058EPQM8GVA with the widget tag.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../../..');
const logDir = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'pb_deploy_utv_livechat.log');

const KDL_PATH = path.join(repoRoot, 'clients/propertybots/closebot/utility-valet-outbound/bot.kdl');
const SOURCE_ID = 'src_UPYVX058EPQM8GVA';
const STAMP = new Date().toISOString().slice(0, 16);
const BOT_NAME = `[UTV] Inbound Setter - Livechat [TEST] (${STAMP})`;

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
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 800) }; }
  return { status: r.status, ok: r.ok, json };
}

async function main() {
  log('=== PB Utility Valet livechat deploy ===');
  log(`  source (will NOT auto-attach): ${SOURCE_ID}`);
  log(`  bot name: ${BOT_NAME}`);

  const kdl = fs.readFileSync(KDL_PATH, 'utf8');
  log(`  KDL size: ${kdl.length} chars`);

  log('--- Step 1: Create bot ---');
  const create = await api('POST', '/bot', { name: BOT_NAME, importKdl: kdl });
  log(`  create -> ${create.status}`);
  if (!create.ok) {
    log('FAIL create: ' + JSON.stringify(create.json).slice(0, 800));
    process.exit(1);
  }
  const botId = create.json?.id || create.json?.bot?.id;
  if (!botId) {
    log('FAIL: no bot id in response: ' + JSON.stringify(create.json).slice(0, 400));
    process.exit(1);
  }
  log(`  bot ID: ${botId}`);

  log('--- Step 2: Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish -> ${pub.status}`);
  if (!pub.ok) {
    log('FAIL publish: ' + JSON.stringify(pub.json).slice(0, 500));
    process.exit(1);
  }

  log('--- Step 3: Read-back verify (prohibitedWords strip check) ---');
  const exp = await api('GET', `/bot/${botId}/export`);
  if (!exp.ok) {
    log('WARN: export fetch failed ' + exp.status);
  } else {
    const kdlLive = typeof exp.json === 'string' ? exp.json : (exp.json.kdl || exp.json.exportKdl || '');
    fs.writeFileSync(path.join(logDir, `pb_utv_livechat_readback_${botId}.kdl`), kdlLive);
    const pwLine = (kdlLive.match(/prohibitedWords[^\n]*/) || ['(not found)'])[0];
    const pwHasValues = /prohibitedWords\s+"/.test(pwLine);
    log(`  prohibitedWords line: ${pwLine.slice(0, 120)}`);
    if (!pwHasValues) {
      log('  prohibitedWords values STRIPPED on deploy (known bug). Restoring via PUT /bot...');
      const put = await fetch(`https://api.closebot.com/bot/${botId}`, {
        method: 'PUT',
        headers: { 'X-CB-KEY': getEnv('CB_PB_API_KEY'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ importKdl: kdl }),
      });
      log(`  PUT restore -> ${put.status}`);
      const exp2 = await api('GET', `/bot/${botId}/export`);
      if (exp2.ok) {
        const kdl2 = typeof exp2.json === 'string' ? exp2.json : (exp2.json.kdl || exp2.json.exportKdl || '');
        const pw2 = (kdl2.match(/prohibitedWords[^\n]*/) || [''])[0];
        const pw2Has = /prohibitedWords\s+"/.test(pw2);
        log(pw2Has ? '  prohibitedWords restored via PUT' : '  STILL stripped after PUT — manual UI restore needed (see bot.kdl for full list)');
      }
    } else {
      log('  prohibitedWords survived deploy');
    }
  }

  log('--- Step 4: State file ---');
  const stateFile = path.join(logDir, 'pb_utv_livechat_state.json');
  const state = {
    botId,
    botName: BOT_NAME,
    sourceId: SOURCE_ID,
    sourceName: '[CLIENT] Utility Valet',
    attached: false,
    attachmentPlan: {
      tags: [{ name: 'lead - replied - widget', approveDeny: true, id: 'lead - replied - widget' }],
      channels: ['Live_Chat'],
      enabled: true,
    },
    builtAt: new Date().toISOString(),
    kdlPath: 'clients/propertybots/closebot/utility-valet-outbound/bot.kdl',
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  log(`  state -> ${stateFile}`);

  log('');
  log('=== DEPLOY COMPLETE (bot created + published, NOT attached) ===');
  log(`  Bot ID: ${botId}`);
  log(`  Next step to go live: POST /bot/${botId}/source/${SOURCE_ID}`);
  log(`    body: ${JSON.stringify(state.attachmentPlan)}`);
}

main().catch(e => { log('FATAL: ' + (e.stack || e.message)); process.exit(1); });
