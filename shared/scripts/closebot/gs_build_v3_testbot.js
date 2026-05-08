/**
 * One-off: builds a TEST copy of Vacaville v3.2, attached to GS Ads source
 * for live chat widget testing. Does not touch VGA prod bot.
 *
 *   Source:   src_4R4DUIQTMMX2NFPU (GS Ads GHL)
 *   Filter:   tag "test - live chat" (must-contain)
 *   Channel:  Live_Chat only
 *   KDL:      reuses shared/logs/vacaville_v3.kdl (CalendarName resolves against
 *             GS Ads's 4 dummy calendars: Adult No-Gi, Kids 3-5, 7-13, 10-14)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_build_v3_testbot.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG = 'test - live chat';
const CHANNEL = 'Live_Chat';

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
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log('=== Vacaville v3.2 TEST BOT build (GS Ads / Live_Chat) ===');

  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v3.kdl'), 'utf8');
  const name = `Vacaville v3.9 TEST — GS Ads Live Chat (${new Date().toISOString().slice(0, 16)})`;
  log(`name: ${name}`);
  log(`KDL size: ${kdl.length} chars`);

  const c = await api('POST', '/bot', { name, importKdl: kdl });
  log(`create → ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json).slice(0, 500)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  log(`bot ID: ${botId}`);

  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`publish → ${p.status}`);
  if (!p.ok) log('WARN publish: ' + JSON.stringify(p.json).slice(0, 300));

  const a = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`attach GS Ads → ${a.status}`);
  if (!a.ok) log('WARN attach: ' + JSON.stringify(a.json).slice(0, 300));

  const stateFile = path.join(logDir, 'v3_testbot_state.json');
  fs.writeFileSync(stateFile, JSON.stringify({
    botId,
    botName: name,
    sourceId: GS_ADS_SOURCE,
    sourceName: 'GS Ads (GHL testing)',
    filterTag: FILTER_TAG,
    channel: CHANNEL,
    builtAt: new Date().toISOString(),
    purpose: 'Live chat widget testing on dummy JH site. Separate from v3.2 prod on VGA.',
  }, null, 2));
  log(`state → ${stateFile}`);

  log('');
  log('=== BUILD COMPLETE ===');
  log(`  Bot:     ${botId}`);
  log(`  Source:  ${GS_ADS_SOURCE} (GS Ads)`);
  log(`  Trigger: contact must have tag "${FILTER_TAG}"`);
  log(`  Channel: ${CHANNEL} only`);
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
