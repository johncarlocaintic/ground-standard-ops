/**
 * Archive 4 Vacaville iteration bots — rename only (already detached).
 * Pattern: "[LEGACY] {orig name} (archived 2026-05-07)"
 */
import fs from 'fs';

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('Missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };

const TARGETS = [
  'bot_0DCXD7BHKEV66XPL',
  'bot_DR18GF3ZG7IH5QOM',
  'bot_EEVFM3NI3296R60R',
  'bot_ZXYBAYGE06NC6DDW',
];

const ARCHIVED_TAG = '(archived 2026-05-07)';

async function getBot(id) {
  const r = await fetch(`https://api.closebot.com/bot/${id}`, { headers: H });
  return r.json();
}

async function renameBot(id, newName) {
  const r = await fetch(`https://api.closebot.com/bot/${id}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ name: newName }),
  });
  const t = await r.text();
  return { status: r.status, ok: r.ok, body: t.slice(0, 200) };
}

async function main() {
  const results = [];
  for (const id of TARGETS) {
    const b = await getBot(id);
    const orig = b.name;
    const sources = (b.sources || []).map(s => s.id || s.sourceId || s);
    if (sources.length > 0) {
      const line = `${id} | SKIPPED (still attached to ${sources.join(',')}) | "${orig}"`;
      console.log(line);
      results.push(line);
      continue;
    }
    if (orig.startsWith('[LEGACY]')) {
      const line = `${id} | SKIPPED (already [LEGACY]) | "${orig}"`;
      console.log(line);
      results.push(line);
      continue;
    }
    const newName = `[LEGACY] ${orig} ${ARCHIVED_TAG}`;
    const rn = await renameBot(id, newName);
    const line = `${id} | rename=${rn.status} ${rn.ok ? 'OK' : 'FAIL'} | "${newName}"`;
    console.log(line);
    results.push(line);
    if (!rn.ok) console.log('  body:', rn.body);
  }

  const logDir = 'shared/logs';
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(`${logDir}/archive_vacaville_iterations.log`, [
    `=== ARCHIVE VACAVILLE ITERATION BOTS ===`,
    `Run: ${new Date().toISOString()}`,
    `Targets: ${TARGETS.length}`,
    '',
    ...results,
  ].join('\n') + '\n');

  console.log(`\nDone. Log: ${logDir}/archive_vacaville_iterations.log`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
