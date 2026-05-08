import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'rebuild_inspect.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function req(ep) {
  const r = await fetch(BASE + ep, { headers: H });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; }
  catch { return { status: r.status, json: { raw: t.slice(0, 500) } }; }
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI';

async function main() {
  log('=== Inspect REBUILD TEST bot structure ===');
  const shell = await req(`/bot/${BOT_ID}`);
  const versions = shell.json?.versions ?? [];
  log(`versions: ${versions.map(v => `${v.version}(pub=${v.published})`).join(', ')}`);

  // Try export first (KDL / full format)
  log('\n[1] GET /bot/{id}/export');
  const exp = await req(`/bot/${BOT_ID}/export`);
  log(`  → ${exp.status}`);
  if (exp.status === 200) {
    fs.writeFileSync(path.join(logDir, 'rebuild_bot_export.json'), JSON.stringify(exp.json, null, 2));
    log(`  saved → shared/logs/rebuild_bot_export.json`);
  }

  // Steps per version — try each published version
  for (const v of versions) {
    log(`\n[2] GET /bot/${BOT_ID}/versions/${v.version}/steps`);
    const s = await req(`/bot/${BOT_ID}/versions/${v.version}/steps`);
    log(`  → ${s.status}`);
    if (s.status === 200) {
      fs.writeFileSync(path.join(logDir, `rebuild_bot_steps_${v.version}.json`), JSON.stringify(s.json, null, 2));
      const steps = Array.isArray(s.json) ? s.json : (s.json?.steps || s.json?.nodes || []);
      log(`  ${steps.length} step(s) / nodes`);
      // Scan for contact-creation / booking nodes + kid vs adult logic
      for (const step of steps) {
        const label = step.name || step.title || step.id || step.type;
        const type = step.type || step.$type || step.kind || '?';
        log(`    - [${type}] ${label}`);
      }
    }
  }
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
