import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_vacaville_inspect.log');
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
function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function request(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  log('=== Vacaville Bot Inspection ===');

  log('\n[1/5] GET /bot — list all bots');
  const bots = await request('GET', '/bot');
  if (!bots.ok) { log(`FAIL — ${bots.status}`); logJson('err', bots.json); process.exit(1); }
  const botList = Array.isArray(bots.json) ? bots.json : (bots.json?.data || []);
  log(`Found ${botList.length} bot(s).`);
  log('\nBot names:');
  botList.forEach(b => log(`  - ${b.name || b.botName || '(no name)'} | id: ${b.id || b._id}`));

  const vacaville = botList.find(b => {
    const n = (b.name || b.botName || '').toLowerCase();
    return n.includes('vacaville') || n.includes('vgp') || n.includes('grappling');
  });

  if (!vacaville) { log('\nERROR: No Vacaville bot found.'); process.exit(1); }
  const botId = vacaville.id || vacaville._id;
  log(`\nTarget bot: "${vacaville.name || vacaville.botName}" (${botId})`);
  logJson('Bot metadata', vacaville);

  log(`\n[2/5] GET /bot/${botId}/export — KDL export`);
  const exported = await request('GET', `/bot/${botId}/export`);
  if (exported.ok) {
    logJson('KDL Export', exported.json);
    const kdlPath = path.join(logDir, 'vacaville_export.json');
    fs.writeFileSync(kdlPath, JSON.stringify(exported.json, null, 2));
    log(`Saved full export to ${kdlPath}`);
    if (typeof exported.json === 'object' && exported.json.kdl) {
      const kdlTxt = path.join(logDir, 'vacaville_export.kdl');
      fs.writeFileSync(kdlTxt, exported.json.kdl);
      log(`Saved KDL text to ${kdlTxt}`);
    }
  } else {
    log(`FAIL — ${exported.status}`);
    logJson('export err', exported.json);
  }

  log(`\n[3/5] GET /bot/${botId}/versions`);
  const versions = await request('GET', `/bot/${botId}/versions`);
  if (versions.ok) {
    logJson('Versions', versions.json);
    const vList = Array.isArray(versions.json) ? versions.json : (versions.json?.data || []);
    const latest = vList[0]?.version || vList[0]?.id || vList[0]?._id || 1;

    log(`\n[4/5] GET /bot/${botId}/steps?botVersion=${latest}`);
    const steps = await request('GET', `/bot/${botId}/steps?botVersion=${latest}`);
    if (steps.ok) {
      logJson('Steps (nodes + connections)', steps.json);
      const stepsPath = path.join(logDir, 'vacaville_steps.json');
      fs.writeFileSync(stepsPath, JSON.stringify(steps.json, null, 2));
      log(`Saved steps to ${stepsPath}`);
    } else {
      log(`FAIL — ${steps.status}`);
      logJson('steps err', steps.json);
    }
  } else {
    log(`FAIL — ${versions.status}`);
    logJson('versions err', versions.json);
  }

  log(`\n[5/5] GET /bot/${botId} — bot detail`);
  const detail = await request('GET', `/bot/${botId}`);
  if (detail.ok) {
    logJson('Bot detail', detail.json);
  } else {
    log(`FAIL — ${detail.status}`);
    logJson('detail err', detail.json);
  }

  log('\n=== DONE ===');
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
