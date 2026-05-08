/**
 * Archive all legacy Vacaville test bots in Bobby's CloseBot:
 *   1. Detach from any sources (so they can't fire)
 *   2. Rename with "[LEGACY]" prefix
 *
 * Skips:
 *   - VGA prod bot (bot_FTK1X8SRFCFBD8TM)
 *   - Current v3.6 test bot (bot_RM6K4L3V42E4VOS0)
 *   - Any DEMO bot (stock template, not a build of ours)
 */
import fs from 'fs';

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }

const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };

const SKIP = new Set([
  'bot_FTK1X8SRFCFBD8TM',  // VGA prod
  'bot_RM6K4L3V42E4VOS0',  // v3.6 current test
  'bot_9SWB45KI6PAJMX4Y',  // DEMO template (Bobby's)
]);

async function listBots() {
  const r = await fetch('https://api.closebot.com/bot', { headers: H });
  const j = await r.json();
  return (j.bots || j.data || j).filter(b => /vacaville|VGA|vaca/i.test(b.name || '') && !b.name.startsWith('[LEGACY]'));
}

async function detachSource(botId, sourceId) {
  const r = await fetch(`https://api.closebot.com/bot/${botId}/source/${sourceId}`, { method: 'DELETE', headers: H });
  return { status: r.status, ok: r.ok };
}

async function renameBot(botId, newName) {
  const r = await fetch(`https://api.closebot.com/bot/${botId}`, { method: 'PUT', headers: H, body: JSON.stringify({ name: newName }) });
  const t = await r.text();
  return { status: r.status, ok: r.ok, body: t.slice(0, 200) };
}

async function main() {
  const all = await listBots();
  const targets = all.filter(b => !SKIP.has(b.id) && !/DEMO/i.test(b.name));
  console.log(`Found ${all.length} Vacaville bots. Archiving ${targets.length} (skipping ${all.length - targets.length}).\n`);

  const results = [];
  for (const b of targets) {
    // Fetch full detail for sources
    const d = await fetch(`https://api.closebot.com/bot/${b.id}`, { headers: H });
    const dj = await d.json();
    const sources = dj.sources || [];
    const detachResults = [];
    for (const s of sources) {
      const sid = s.id || s.sourceId || s;
      const r = await detachSource(b.id, sid);
      detachResults.push(`${sid}→${r.status}`);
    }
    const newName = '[LEGACY] ' + b.name;
    const rn = await renameBot(b.id, newName);
    const line = `${b.id} | detached=[${detachResults.join(',') || 'none'}] | rename=${rn.status} | "${newName.slice(0, 70)}..."`;
    console.log(line);
    results.push(line);
  }

  fs.writeFileSync('shared/logs/archive_legacy_vacaville.log', [
    `=== ARCHIVE LEGACY VACAVILLE BOTS ===`,
    `Run: ${new Date().toISOString()}`,
    `Total found: ${all.length}`,
    `Archived: ${targets.length}`,
    `Skipped: ${[...SKIP].join(', ')}`,
    '',
    ...results,
  ].join('\n'));

  console.log(`\nDone. Archived ${targets.length} bots. Log: shared/logs/archive_legacy_vacaville.log`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
