// Pull a bot's full state + a KB file's content from CloseBot.
// Saves bot JSON + KDL export and KB content to a destination folder.
//
// Usage:
//   node --env-file=.env --env-file=clients/ground-standard/.env \
//        shared/scripts/closebot/pull_existing_artifacts.js \
//        --bot bot_QN6JIZE313IIQQHP --kb file_K8E6900W9STUOHBZ \
//        --out clients/ground-standard/closebot/mason-dixon/existing

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const logDir = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_pull_artifacts.log');
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

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) return null;
  return process.argv[i + 1];
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY };

const BOT_ID = getArg('bot');
const KB_ID = getArg('kb');
const OUT_REL = getArg('out');

if (!OUT_REL || (!BOT_ID && !KB_ID)) {
  log('Usage: --out <path> [--bot <id>] [--kb <id>]');
  process.exit(1);
}

const OUT_DIR = path.resolve(repoRoot, OUT_REL);
fs.mkdirSync(OUT_DIR, { recursive: true });
log(`Output dir: ${OUT_DIR}`);

async function cb(method, endpoint, opts = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { ...HEADERS, ...(opts.headers || {}) },
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text };
}

async function main() {
  if (BOT_ID) {
    log(`\n=== Pulling bot ${BOT_ID} ===`);

    log(`GET /bot/${BOT_ID}`);
    const detail = await cb('GET', `/bot/${BOT_ID}`);
    log(`  status ${detail.status} (${detail.text.length} bytes)`);
    if (detail.ok) {
      const dst = path.join(OUT_DIR, 'bot-detail.json');
      fs.writeFileSync(dst, detail.text);
      log(`  → ${dst}`);
      try {
        const j = JSON.parse(detail.text);
        log(`  name: ${j.name}`);
        log(`  version: ${j.version ?? '?'}`);
        log(`  active: ${j.active ?? '?'}`);
        log(`  personaIds: ${JSON.stringify(j.personaIds || [])}`);
        log(`  sourceIds: ${JSON.stringify(j.sourceIds || j.sources || [])}`);
        log(`  botSteps length: ${Array.isArray(j.botSteps) ? j.botSteps.length : '(not array)'}`);
      } catch (e) { log(`  JSON parse failed: ${e.message}`); }
    } else {
      log(`  FAIL: ${detail.text.slice(0, 300)}`);
    }

    log(`GET /bot/${BOT_ID}/export`);
    const ex = await cb('GET', `/bot/${BOT_ID}/export`);
    log(`  status ${ex.status} (${ex.text.length} bytes)`);
    if (ex.ok) {
      // Export usually returns JSON with a `kdl` field; save raw response + extracted KDL if present.
      const dstJson = path.join(OUT_DIR, 'bot-export.json');
      fs.writeFileSync(dstJson, ex.text);
      log(`  → ${dstJson}`);
      try {
        const j = JSON.parse(ex.text);
        const kdl = j.kdl || j.export || j.content || null;
        if (kdl && typeof kdl === 'string') {
          const dstKdl = path.join(OUT_DIR, 'bot-export.kdl');
          fs.writeFileSync(dstKdl, kdl);
          log(`  → ${dstKdl} (${kdl.length} bytes of KDL)`);
        }
      } catch { /* ignore */ }
    } else {
      log(`  FAIL: ${ex.text.slice(0, 300)}`);
    }

    log(`GET /bot/${BOT_ID}/versions`);
    const ver = await cb('GET', `/bot/${BOT_ID}/versions`);
    log(`  status ${ver.status} (${ver.text.length} bytes)`);
    if (ver.ok) {
      const dst = path.join(OUT_DIR, 'bot-versions.json');
      fs.writeFileSync(dst, ver.text);
      log(`  → ${dst}`);
    }
  }

  if (KB_ID) {
    log(`\n=== Pulling KB ${KB_ID} ===`);

    // Try a few known shapes: /library/files/{id}, /library/files/{id}/content, /library/{id}
    const candidates = [
      `/library/files/${KB_ID}`,
      `/library/files/${KB_ID}/content`,
      `/library/files/${KB_ID}/download`,
      `/library/${KB_ID}`,
    ];
    for (const ep of candidates) {
      log(`GET ${ep}`);
      const r = await cb('GET', ep);
      log(`  status ${r.status} (${r.text.length} bytes)`);
      if (r.ok) {
        // Save under endpoint-derived filename.
        const safe = ep.replace(/[\/]/g, '_').replace(/^_/, '');
        const dst = path.join(OUT_DIR, `kb_${safe}.txt`);
        fs.writeFileSync(dst, r.text);
        log(`  → ${dst}`);
      } else {
        log(`  ${r.text.slice(0, 200)}`);
      }
    }
  }

  log('\n=== Done ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
