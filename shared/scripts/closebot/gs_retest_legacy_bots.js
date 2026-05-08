/**
 * Re-test the 3 previously-working Agent Node bots, following attach/detach protocol.
 * Each iteration: detach all → attach target → run deep diagnostic → detach target.
 */
import { spawnSync } from 'child_process';
import path from 'path';

const CB_KEY = process.env.CB_GS_API_KEY;
const SOURCE = 'src_4R4DUIQTMMX2NFPU';
const CHANNEL = 'Test Chat 12 [VACAVILLE ]';

const BOTS = [
  { id: 'bot_P3WU0IFASM9DDPWA', label: 'v4.0 legacy (LEGACY rename, multi-Agent-Node)' },
  { id: 'bot_DR18GF3ZG7IH5QOM', label: 'v4.1 legacy (LEGACY rename, multi-Agent-Node)' },
  { id: 'bot_8PWPJTCFSYBPRP06', label: 'Agent Node TEST (single Agent Node, agency template)' },
];

// Bots whose attachment state we want to restore at the end (the active test bot)
const RESTORE_AFTER = 'bot_AGA56NVRWBASJ0CT'; // v6.1

async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.text() };
}

async function detachAll() {
  // Get all bots, detach any that have the source attached
  const list = JSON.parse((await api('GET', '/bot')).body);
  for (const b of list) {
    const detail = JSON.parse((await api('GET', `/bot/${b.id}`)).body);
    if (detail.sources?.some(s => s.id === SOURCE)) {
      const r = await api('DELETE', `/bot/${b.id}/source/${SOURCE}`);
      console.log(`  detach ${b.id} → ${r.status}`);
    }
  }
}

async function attach(botId) {
  const r = await api('POST', `/bot/${botId}/source/${SOURCE}`, {
    tags: [],
    channels: [CHANNEL],
    enabled: true,
  });
  console.log(`  attach ${botId} → ${r.status}`);
}

function runDiagnostic(botId) {
  console.log(`  running deep diagnostic on ${botId}...`);
  const env = { ...process.env, CB_TEST_BOT_ID: botId };
  const result = spawnSync('node', [
    '--env-file=.env',
    '--env-file=clients/ground-standard/.env',
    'shared/scripts/closebot/gs_deep_diagnostic.js',
  ], { env, encoding: 'utf8', maxBuffer: 10_000_000 });

  // Extract just bot replies and exception logs
  const lines = result.stdout.split('\n');
  let botReplies = [];
  let exceptions = [];
  for (const line of lines) {
    if (line.includes('"sender":"bot"') && line.includes('"message"')) {
      const m = line.match(/"message":"([^"]+)"/);
      if (m) botReplies.push(m[1]);
    }
    if (line.includes('"severity":4')) {
      const m = line.match(/"message":"([^"]+)"/);
      if (m) exceptions.push(m[1]);
    }
  }
  return { botReplies, exceptions, exitCode: result.status };
}

(async () => {
  console.log(`\n=== Legacy bot retest with attach/detach protocol ===\n`);

  console.log('--- Initial detach all ---');
  await detachAll();

  const results = [];
  for (const bot of BOTS) {
    console.log(`\n--- ${bot.label} (${bot.id}) ---`);
    await attach(bot.id);
    const result = runDiagnostic(bot.id);
    results.push({ ...bot, ...result });
    console.log(`  → ${result.botReplies.length} bot replies, ${result.exceptions.length} exceptions`);
    await api('DELETE', `/bot/${bot.id}/source/${SOURCE}`);
    console.log(`  detach ${bot.id} after test`);
  }

  console.log('\n--- Restore: re-attach v6.1 ---');
  await attach(RESTORE_AFTER);

  console.log(`\n=== RESULTS ===\n`);
  for (const r of results) {
    console.log(`${r.label}:`);
    console.log(`  Bot ID: ${r.id}`);
    console.log(`  Bot replies: ${r.botReplies.length}`);
    console.log(`  Exceptions:  ${r.exceptions.length}`);
    if (r.botReplies.length > 0) {
      console.log(`  First reply: "${r.botReplies[0].slice(0, 120)}"`);
    }
    if (r.exceptions.length > 0) {
      console.log(`  Exception:   "${r.exceptions[0].slice(0, 120)}"`);
    }
    console.log('');
  }
})();
