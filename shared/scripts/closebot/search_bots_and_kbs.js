// Search CloseBot for bots and KB files whose name matches one or more substrings.
// Usage:
//   node --env-file=.env --env-file=clients/ground-standard/.env \
//        shared/scripts/closebot/search_bots_and_kbs.js mason dixon
//
// Matches are case-insensitive. Logical OR across args: a bot is reported if its
// name contains ANY of the supplied substrings.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_search.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function cb(method, endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { method, headers: HEADERS });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

const terms = process.argv.slice(2).map(s => s.toLowerCase()).filter(Boolean);
if (terms.length === 0) {
  log('Usage: node search_bots_and_kbs.js <term1> [term2] ...');
  process.exit(1);
}
log(`Search terms (OR): ${terms.join(', ')}`);

function nameMatches(name) {
  if (!name) return false;
  const lower = String(name).toLowerCase();
  return terms.some(t => lower.includes(t));
}

function listFromResponse(res) {
  if (Array.isArray(res.json)) return res.json;
  if (Array.isArray(res.json?.data)) return res.json.data;
  if (Array.isArray(res.json?.bots)) return res.json.bots;
  if (Array.isArray(res.json?.files)) return res.json.files;
  return [];
}

async function main() {
  log('=== CloseBot search ===');

  // Bots
  log('\n[1/3] GET /bot');
  const bots = await cb('GET', '/bot');
  if (!bots.ok) {
    log(`FAIL ${bots.status}: ${JSON.stringify(bots.json).slice(0, 300)}`);
  } else {
    const list = listFromResponse(bots);
    log(`Total bots: ${list.length}`);
    const matches = list.filter(b => nameMatches(b.name || b.botName));
    log(`Matches: ${matches.length}`);
    matches.forEach(b => {
      log(`  • "${b.name || b.botName}" — id=${b.id || b._id} version=${b.version ?? '?'} active=${b.active ?? '?'}`);
    });
    if (matches.length === 0) {
      log('  (no name matches in /bot)');
      log('  Sample of bot names found:');
      list.slice(0, 15).forEach(b => log(`    - ${b.name || b.botName}`));
    }
  }

  // KB files (Knowledge Library)
  log('\n[2/3] GET /library/files');
  const files = await cb('GET', '/library/files');
  if (!files.ok) {
    log(`Endpoint /library/files returned ${files.status}; trying /library`);
    const lib = await cb('GET', '/library');
    if (!lib.ok) {
      log(`FAIL ${lib.status}: ${JSON.stringify(lib.json).slice(0, 300)}`);
    } else {
      const list = listFromResponse(lib);
      log(`Total library entries: ${list.length}`);
      const matches = list.filter(f => nameMatches(f.name || f.fileName || f.title));
      log(`Matches: ${matches.length}`);
      matches.forEach(f => log(`  • "${f.name || f.fileName || f.title}" — id=${f.id || f._id || f.fileId}`));
    }
  } else {
    const list = listFromResponse(files);
    log(`Total KB files: ${list.length}`);
    const matches = list.filter(f => nameMatches(f.name || f.fileName || f.title));
    log(`Matches: ${matches.length}`);
    matches.forEach(f => log(`  • "${f.name || f.fileName || f.title}" — id=${f.id || f._id || f.fileId}`));
    if (matches.length === 0) {
      log('  Sample of file names found:');
      list.slice(0, 15).forEach(f => log(`    - ${f.name || f.fileName || f.title}`));
    }
  }

  // Sources (also useful — a gym may have a source named for it even before the bot exists)
  log('\n[3/3] GET /agency/sources (or /source)');
  let srcRes = await cb('GET', '/agency/sources');
  if (!srcRes.ok) srcRes = await cb('GET', '/source');
  if (!srcRes.ok) {
    log(`FAIL on both /agency/sources and /source: ${srcRes.status}`);
  } else {
    const list = listFromResponse(srcRes);
    log(`Total sources: ${list.length}`);
    const matches = list.filter(s => nameMatches(s.name || s.title || s.locationName));
    log(`Matches: ${matches.length}`);
    matches.forEach(s => log(`  • "${s.name || s.title || s.locationName}" — id=${s.id || s._id || s.sourceId}`));
  }

  log('\n=== Search complete ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
