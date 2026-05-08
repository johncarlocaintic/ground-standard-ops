import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_source_discovery.log');
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
  const v = process.env[key];
  if (!v) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return v;
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function req(method, endpoint, body) {
  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      method,
      headers: HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (e) {
    return { status: 0, ok: false, json: { error: e.message } };
  }
}

const TARGET_BOT_NAME_FRAGMENT = 'Vacaville Grappling Academy v2';
const TARGET_SOURCE_NAME_FRAGMENT = 'GS Ads';

async function main() {
  log('=== CloseBot Source Discovery — Ground Standard ===');
  log(`Looking for source: "${TARGET_SOURCE_NAME_FRAGMENT}"`);
  log(`Looking for bot: "${TARGET_BOT_NAME_FRAGMENT}"`);

  // --- 1. Probe likely source endpoints (read-only) ---
  const candidates = [
    '/source',
    '/sources',
    '/crmSource',
    '/crmSources',
    '/crm-source',
    '/crm-sources',
    '/integration',
    '/integrations',
    '/ghl',
    '/ghl/source',
    '/ghl/location',
    '/location',
    '/locations',
  ];

  log('\n[1] Probing candidate endpoints (GET)');
  const hits = [];
  for (const ep of candidates) {
    const r = await req('GET', ep);
    log(`  ${ep.padEnd(22)} → ${r.status}`);
    if (r.ok) hits.push({ ep, data: r.json });
  }

  for (const h of hits) {
    logJson(`Response: GET ${h.ep}`, h.data);
  }

  // --- 2. Find GS Ads source in any of the hits ---
  let gsAdsSource = null;
  let sourceEndpointUsed = null;
  for (const h of hits) {
    const arr = Array.isArray(h.data) ? h.data
              : Array.isArray(h.data?.data) ? h.data.data
              : Array.isArray(h.data?.sources) ? h.data.sources
              : Array.isArray(h.data?.items) ? h.data.items
              : null;
    if (!arr) continue;
    const match = arr.find(s =>
      JSON.stringify(s).toLowerCase().includes(TARGET_SOURCE_NAME_FRAGMENT.toLowerCase())
    );
    if (match) {
      gsAdsSource = match;
      sourceEndpointUsed = h.ep;
      break;
    }
  }

  if (gsAdsSource) {
    log(`\n[2] FOUND "${TARGET_SOURCE_NAME_FRAGMENT}" via ${sourceEndpointUsed}`);
    logJson('GS Ads source object', gsAdsSource);
  } else {
    log(`\n[2] "${TARGET_SOURCE_NAME_FRAGMENT}" NOT found in any probed endpoint response.`);
  }

  // --- 3. List bots, find the rebuild test bot ---
  log('\n[3] GET /bot — finding target bot');
  const bots = await req('GET', '/bot');
  const botList = Array.isArray(bots.json) ? bots.json
                : Array.isArray(bots.json?.data) ? bots.json.data : [];
  log(`  ${botList.length} bot(s) total`);

  const targetBot = botList.find(b => {
    const name = (b.name || b.botName || '').toLowerCase();
    return name.includes(TARGET_BOT_NAME_FRAGMENT.toLowerCase());
  });

  if (!targetBot) {
    log(`  Target bot not found. Listing first 10 bot names:`);
    botList.slice(0, 10).forEach(b => log(`    - ${b.name || b.botName} (${b.id || b._id})`));
  } else {
    const botId = targetBot.id || targetBot._id;
    log(`  FOUND bot: "${targetBot.name || targetBot.botName}" (${botId})`);
    logJson('Target bot object', targetBot);

    // --- 4. Probe bot-scoped source endpoints ---
    log(`\n[4] Probing bot-scoped source endpoints for ${botId}`);
    const botScoped = [
      `/bot/${botId}/source`,
      `/bot/${botId}/sources`,
      `/bot/${botId}/crmSource`,
      `/bot/${botId}/crmSources`,
      `/bot/${botId}/integration`,
      `/bot/${botId}/integrations`,
      `/bot/${botId}`,
    ];
    for (const ep of botScoped) {
      const r = await req('GET', ep);
      log(`  ${ep.padEnd(50)} → ${r.status}`);
      if (r.ok) logJson(`GET ${ep}`, r.json);
    }
  }

  log('\n=== Discovery complete. See shared/logs/closebot_source_discovery.log ===');
  log('NO MUTATIONS performed. Awaiting JC confirmation before any POST.');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
