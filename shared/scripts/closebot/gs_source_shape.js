import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_source_shape.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function logJson(label, data) {
  const block = `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n`;
  console.log(block);
  fs.appendFileSync(logFile, block + '\n');
}

const BASE = 'https://api.closebot.com';
const API_KEY = process.env.CB_GS_API_KEY;
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function req(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  const bots = await req('GET', '/bot');
  const list = Array.isArray(bots.json) ? bots.json : (bots.json?.data || []);
  log(`Total bots: ${list.length}`);

  // All Vacaville rebuild variants
  const vacavilleRebuilds = list.filter(b =>
    (b.name || '').toLowerCase().includes('vacaville grappling academy v2')
  );
  log(`\nVacaville v2 / rebuild bots (${vacavilleRebuilds.length}):`);
  vacavilleRebuilds.forEach(b => {
    log(`  - "${b.name}" (${b.id}) — sources: ${JSON.stringify(b.sources)}`);
  });

  // Any bot with non-empty sources — so we can see the shape
  const withSources = list.filter(b => Array.isArray(b.sources) && b.sources.length > 0);
  log(`\nBots WITH sources populated (${withSources.length}):`);
  withSources.slice(0, 5).forEach(b => {
    log(`  - "${b.name}" (${b.id})`);
    logJson(`sources for ${b.name}`, b.sources);
  });

  // Look for "GS Ads" or similar anywhere in any bot's sources
  log('\nSearching all bot.sources for "GS Ads" / "ads" / "bobby"...');
  const searchTerms = ['gs ads', 'ads', 'bobby', 'ground'];
  for (const b of list) {
    if (!Array.isArray(b.sources) || b.sources.length === 0) continue;
    const s = JSON.stringify(b.sources).toLowerCase();
    for (const term of searchTerms) {
      if (s.includes(term)) {
        log(`  MATCH "${term}" in bot "${b.name}"`);
        logJson(`  sources`, b.sources);
        break;
      }
    }
  }

  // Probe a few more endpoints that might list/find sources
  log('\nMore endpoint probes:');
  const probes = [
    '/bot/source',
    '/bot/sources',
    '/source/list',
    '/crm',
    '/account/source',
    '/account/sources',
    '/subaccount',
    '/subaccounts',
    '/connected-accounts',
    '/connectedAccounts',
  ];
  for (const p of probes) {
    const r = await req('GET', p);
    log(`  ${p.padEnd(28)} → ${r.status}`);
    if (r.ok) logJson(`  GET ${p}`, r.json);
  }
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
