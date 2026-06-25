/**
 * cb_import_publish.js — import a KDL as a new CloseBot bot, then publish it.
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_import_publish.js "BOT NAME" path/to/clean.kdl
 */
import { readFileSync, appendFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_test.log');
function log(m) {
  const l = `[${new Date().toISOString()}] ${m}`;
  console.log(l);
  appendFileSync(logFile, l + '\n');
}

const API_KEY = process.env.CB_GS_API_KEY;
if (!API_KEY) { log('ERROR: CB_GS_API_KEY missing'); process.exit(1); }
const BOT_NAME = process.argv[2];
const KDL_PATH = process.argv[3];
if (!BOT_NAME || !KDL_PATH) { log('ERROR: usage: "BOT NAME" clean.kdl'); process.exit(1); }

const H = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };
const kdl = readFileSync(KDL_PATH, 'utf8');

async function main() {
  log(`Importing "${BOT_NAME}" from ${KDL_PATH} (${kdl.length} chars)`);
  const r = await fetch('https://api.closebot.com/bot', {
    method: 'POST', headers: H,
    body: JSON.stringify({ name: BOT_NAME, importKdl: kdl }),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 800) }; }
  if (!r.ok) { log(`IMPORT FAILED ${r.status}: ${JSON.stringify(j)}`); process.exit(1); }
  const botId = j.bot?.id || j.id;
  log(`Bot created. ID: ${botId}`);

  const r2 = await fetch(`https://api.closebot.com/bot/${botId}/publish`, {
    method: 'POST', headers: H, body: JSON.stringify({}),
  });
  if (!r2.ok) {
    const et = await r2.text();
    log(`PUBLISH FAILED ${r2.status}: ${et.slice(0, 800)}`);
    log(`(bot ${botId} imported but unpublished — fix KDL and re-import as new bot)`);
    process.exit(1);
  }
  log(`Published. BOT_ID=${botId}`);
}
main().catch(e => { log(`FATAL: ${e.stack || e.message}`); process.exit(1); });
