/**
 * Archive Vacaville v3 — end of v3 track.
 * Detaches v3.20 test bot from GS Ads source + renames [LEGACY].
 * Also renames v3.18 superseded bot [LEGACY] if not already done.
 * Does NOT touch VGA prod bot (bot_FTK1X8SRFCFBD8TM) — that stays.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_archive_v3.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const V320_BOT     = 'bot_YN0X0DR7R6A1ZGKH';
const V318_BOT     = 'bot_53U4B10WEWQH4IHU';

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
  const r = await fetch(`https://api.closebot.com${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

async function archiveBot(botId, currentName, label) {
  log(`--- Archive ${label} (${botId}) ---`);

  const detach = await api('DELETE', `/bot/${botId}/source/${GS_ADS_SOURCE}`);
  log(`  detach from GS Ads → ${detach.status}${detach.status === 404 ? ' (already detached, ok)' : ''}`);

  const legacyName = `[LEGACY] ${currentName}`;
  const rename = await api('PUT', `/bot/${botId}`, { name: legacyName });
  log(`  rename to "${legacyName}" → ${rename.status}`);
  if (!rename.ok) log(`  WARN rename: ${JSON.stringify(rename.json).slice(0, 300)}`);
}

async function main() {
  log('=== Vacaville v3 archive — end of v3 track ===');

  await archiveBot(
    V320_BOT,
    'Vacaville v3.20 TEST — GS Ads',
    'v3.20 (last active)'
  );

  await archiveBot(
    V318_BOT,
    'Vacaville v3.18 TEST — GS Ads',
    'v3.18 (superseded)'
  );

  log('');
  log('=== ARCHIVE COMPLETE ===');
  log('  VGA prod bot (bot_FTK1X8SRFCFBD8TM) untouched.');
  log('  v4 Agent Node bot (bot_P3WU0IFASM9DDPWA) untouched.');
  log('  Note: 36 older [LEGACY] bots still need manual UI deletion (API DELETE 500s — platform bug).');
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
