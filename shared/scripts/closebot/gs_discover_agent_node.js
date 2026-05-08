// gs_discover_agent_node.js
// Maps Agent Node KDL format, tool type enum, nodeDescriptors, and per-node tool config.
// Run AFTER manually building a minimal Agent Node bot in the CloseBot UI.
//
// Usage:
//   node --env-file=.env --env-file=clients/ground-standard/.env \
//     shared/scripts/closebot/gs_discover_agent_node.js <botId>
//
// Outputs:
//   shared/logs/agent_node_discovery.log   — timestamped full log
//   shared/logs/agent_node_<botId>.kdl     — raw KDL for easy reading
//   shared/logs/agent_node_<botId>.json    — full structured discovery dump

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'agent_node_discovery.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) { console.error(`Missing env var: ${key}`); process.exit(1); }
  return val;
}

async function cbGet(endpoint) {
  const key = getEnv('CB_GS_API_KEY');
  const res = await fetch(`https://api.closebot.com${endpoint}`, {
    headers: { 'X-CB-KEY': key, 'Accept': 'application/json' }
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, raw: text };
  }
}

async function main() {
  const botId = process.argv[2];
  if (!botId) {
    console.error('Usage: node gs_discover_agent_node.js <botId>');
    console.error('Build a minimal Agent Node bot in the UI first, then pass its ID here.');
    process.exit(1);
  }

  log(`=== Agent Node Discovery — bot ${botId} ===`);

  const dump = { botId, timestamp: new Date().toISOString() };

  // ── 1. nodeDescriptors ────────────────────────────────────────────────────
  log('\n--- 1. GET /bot/nodeDescriptors ---');
  const desc = await cbGet('/bot/nodeDescriptors');
  dump.nodeDescriptors = desc.data ?? desc.raw;
  log(`Status: ${desc.status}`);

  if (desc.data?.atomicNodes) {
    log(`Found ${desc.data.atomicNodes.length} atomic node types:`);
    for (const n of desc.data.atomicNodes) {
      log(`  className: ${n.className}  |  label: ${n.label ?? n.name ?? '?'}`);
    }
  } else {
    log('Raw nodeDescriptors response:');
    log(JSON.stringify(dump.nodeDescriptors, null, 2));
  }

  // ── 2. GET /bot/{id} — bot object + tools array ───────────────────────────
  log(`\n--- 2. GET /bot/${botId} ---`);
  const botRes = await cbGet(`/bot/${botId}`);
  dump.bot = botRes.data ?? botRes.raw;
  log(`Status: ${botRes.status}`);

  if (botRes.data) {
    log(`Bot name: ${botRes.data.name}`);
    log(`Tools (${botRes.data.tools?.length ?? 0}):`);
    for (const t of (botRes.data.tools ?? [])) {
      log(`  type: ${t.type}  |  enabled: ${t.enabled}  |  id: ${t.id}`);
      if (t.options && Object.keys(t.options).length > 0) {
        log(`    options: ${JSON.stringify(t.options)}`);
      }
    }
    log(`PersonaIds: ${JSON.stringify(botRes.data.personaIds)}`);
    log(`Sources: ${botRes.data.sources?.map(s => s.id || s.sourceId).join(', ')}`);
  }

  // ── 3. GET /bot/{id}/steps — step structure ───────────────────────────────
  log(`\n--- 3. GET /bot/${botId}/steps ---`);
  const stepsRes = await cbGet(`/bot/${botId}/steps`);
  dump.steps = stepsRes.data ?? stepsRes.raw;
  log(`Status: ${stepsRes.status}`);
  log('Steps response:');
  log(JSON.stringify(dump.steps, null, 2).slice(0, 2000)); // first 2000 chars

  // ── 4. GET /bot/{id}/export — KDL ────────────────────────────────────────
  log(`\n--- 4. GET /bot/${botId}/export ---`);
  const exportRes = await cbGet(`/bot/${botId}/export`);
  dump.export = exportRes.data ?? exportRes.raw;
  log(`Status: ${exportRes.status}`);

  if (exportRes.data?.kdl) {
    log(`Version: ${exportRes.data.version}`);
    log(`KDL length: ${exportRes.data.kdl.length} chars`);

    const kdlFile = path.join(logDir, `agent_node_${botId}.kdl`);
    fs.writeFileSync(kdlFile, exportRes.data.kdl);
    log(`KDL written → ${kdlFile}`);
    log('\nKDL preview (first 3000 chars):');
    log(exportRes.data.kdl.slice(0, 3000));
  } else {
    log('No KDL in response:');
    log(JSON.stringify(dump.export, null, 2));
  }

  // ── 5. Write full JSON dump ───────────────────────────────────────────────
  const jsonFile = path.join(logDir, `agent_node_${botId}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(dump, null, 2));
  log(`\nFull dump written → ${jsonFile}`);
  log('=== Discovery complete ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
