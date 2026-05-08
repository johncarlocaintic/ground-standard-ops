// gs_probe_custom_tools.js
// Probes the Custom Tool API endpoints to discover the creation schema.
// Since no custom tools exist in this account, we POST test payloads and
// read validation errors to reverse-engineer the required fields.
//
// Usage:
//   node --env-file=.env --env-file=clients/ground-standard/.env \
//     shared/scripts/closebot/gs_probe_custom_tools.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'custom_tools_probe.log');

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

async function cbReq(method, endpoint, body) {
  const key = getEnv('CB_GS_API_KEY');
  const opts = {
    method,
    headers: { 'X-CB-KEY': key, 'Accept': 'application/json', 'Content-Type': 'application/json' }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.closebot.com${endpoint}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function probe(label, method, endpoint, body) {
  log(`\n--- ${label} ---`);
  log(`${method} ${endpoint}`);
  if (body !== undefined) log(`Body: ${JSON.stringify(body, null, 2)}`);
  const r = await cbReq(method, endpoint, body);
  log(`Status: ${r.status}`);
  log(`Response: ${JSON.stringify(r.data, null, 2)}`);
  return r;
}

async function main() {
  log('=== Custom Tool API Probe ===');

  // ── 1. GET list (baseline) ────────────────────────────────────────────────
  await probe('1. GET /bot/customTool (list)', 'GET', '/bot/customTool');

  // ── 2. POST empty body ────────────────────────────────────────────────────
  await probe('2. POST /bot/customTool empty', 'POST', '/bot/customTool', {});

  // ── 3. POST minimal — just name+description ───────────────────────────────
  await probe('3. POST minimal (name+description)', 'POST', '/bot/customTool', {
    name: 'Test GIF Tool',
    description: 'Use this tool when the user requests a GIF. Returns a GIF URL.'
  });

  // ── 4. POST with method+url ───────────────────────────────────────────────
  await probe('4. POST with method+url', 'POST', '/bot/customTool', {
    name: 'Test GIF Tool',
    description: 'Use this tool when the user requests a GIF. Returns a GIF URL.',
    method: 'GET',
    url: 'https://api.giphy.com/v1/gifs/search'
  });

  // ── 5. POST fuller payload ────────────────────────────────────────────────
  await probe('5. POST fuller payload', 'POST', '/bot/customTool', {
    name: 'Test GIF Tool',
    description: 'Use this tool when the user requests a GIF. Returns a GIF URL.',
    method: 'GET',
    url: 'https://api.giphy.com/v1/gifs/search',
    headers: [],
    queryParams: [{ key: 'api_key', value: 'test' }],
    body: null,
    customParameters: [
      { name: 'search_term', description: 'The search query for the GIF' }
    ],
    restrictedFields: []
  });

  // ── 6. Try alternate field names ──────────────────────────────────────────
  await probe('6. POST with requestMethod (alt name)', 'POST', '/bot/customTool', {
    name: 'Test GIF Tool',
    description: 'Use this tool when the user requests a GIF.',
    requestMethod: 'GET',
    endpoint: 'https://api.giphy.com/v1/gifs/search',
    parameters: [
      { name: 'search_term', description: 'The search query' }
    ]
  });

  // ── 7. Try /bot/tools or /bot/customtools (alt paths) ────────────────────
  await probe('7. GET /bot/tools', 'GET', '/bot/tools');
  await probe('8. GET /bot/customtools (lowercase)', 'GET', '/bot/customtools');
  await probe('9. GET /customTool', 'GET', '/customTool');
  await probe('10. GET /bot/customTool/list', 'GET', '/bot/customTool/list');

  // ── 8. Check swagger for custom tool schemas ──────────────────────────────
  log('\n--- 11. GET swagger (look for customTool schema) ---');
  const sw = await cbReq('GET', '/swagger/v1/swagger.json');
  log(`Swagger status: ${sw.status}`);
  if (typeof sw.data === 'object' && sw.data?.paths) {
    const customToolPaths = Object.keys(sw.data.paths).filter(p =>
      p.toLowerCase().includes('custom') || p.toLowerCase().includes('tool')
    );
    log(`Paths containing 'custom' or 'tool': ${JSON.stringify(customToolPaths, null, 2)}`);

    // Dump schemas if found
    if (sw.data.components?.schemas) {
      const toolSchemas = Object.keys(sw.data.components.schemas).filter(k =>
        k.toLowerCase().includes('custom') || k.toLowerCase().includes('tool')
      );
      log(`Schemas containing 'custom' or 'tool': ${JSON.stringify(toolSchemas)}`);
      for (const key of toolSchemas) {
        log(`\nSchema [${key}]:`);
        log(JSON.stringify(sw.data.components.schemas[key], null, 2));
      }
    }
  } else if (typeof sw.data === 'string') {
    // String response — scan for 'customTool' occurrences
    const idx = sw.data.indexOf('customTool');
    if (idx >= 0) {
      log(`Found 'customTool' at index ${idx}:`);
      log(sw.data.slice(Math.max(0, idx - 200), idx + 2000));
    } else {
      log('No customTool in swagger text response');
      log(`First 500 chars: ${sw.data.slice(0, 500)}`);
    }
  }

  log('\n=== Probe complete ===');
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
