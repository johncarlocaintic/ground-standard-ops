import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_attach_source.log');
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
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  return { status: res.status, ok: res.ok, json };
}

const BOT_ID = 'bot_MHAFTF25QVPIQLUI'; // Vacaville v2 REBUILD TEST T07:13

// GS Ads source — attached with empty tags/channelList to prevent accidental triggering
const GS_ADS_SOURCE = {
  id: 'src_4R4DUIQTMMX2NFPU',
  category: 'GHLS',
  key: 'isGl70YkeLEAiVckMhgT',
  name: 'GS Ads',
  tags: [],
  channelList: [],
  personaNameOverride: null,
  enabled: true,
};

async function verify() {
  const r = await req('GET', `/bot/${BOT_ID}`);
  const sources = r.json?.sources;
  log(`  verify → status ${r.status}, sources count: ${Array.isArray(sources) ? sources.length : 'n/a'}`);
  if (Array.isArray(sources)) logJson('  bot.sources after attempt', sources);
  return Array.isArray(sources) && sources.some(s => s.name === 'GS Ads' || s.id === GS_ADS_SOURCE.id);
}

async function main() {
  log(`=== Attach GS Ads source to bot ${BOT_ID} ===`);

  // Confirm current state
  log('\n[pre] Current bot state');
  const pre = await req('GET', `/bot/${BOT_ID}`);
  log(`  name: ${pre.json?.name}`);
  log(`  sources: ${JSON.stringify(pre.json?.sources)}`);

  if (pre.json?.sources?.length > 0) {
    log('  WARNING: bot already has sources. Aborting to avoid clobbering.');
    process.exit(1);
  }

  const attempts = [
    {
      label: 'POST /bot/{id}/source (single add)',
      method: 'POST',
      ep: `/bot/${BOT_ID}/source`,
      body: GS_ADS_SOURCE,
    },
    {
      label: 'POST /bot/{id}/sources (single add)',
      method: 'POST',
      ep: `/bot/${BOT_ID}/sources`,
      body: GS_ADS_SOURCE,
    },
    {
      label: 'PATCH /bot/{id} with sources array',
      method: 'PATCH',
      ep: `/bot/${BOT_ID}`,
      body: { sources: [GS_ADS_SOURCE] },
    },
    {
      label: 'PUT /bot/{id} with sources array',
      method: 'PUT',
      ep: `/bot/${BOT_ID}`,
      body: { sources: [GS_ADS_SOURCE] },
    },
    {
      label: 'POST /bot/{id} with sources array',
      method: 'POST',
      ep: `/bot/${BOT_ID}`,
      body: { sources: [GS_ADS_SOURCE] },
    },
    {
      label: 'PUT /bot/{id}/sources',
      method: 'PUT',
      ep: `/bot/${BOT_ID}/sources`,
      body: [GS_ADS_SOURCE],
    },
  ];

  for (const a of attempts) {
    log(`\n[try] ${a.label}`);
    const r = await req(a.method, a.ep, a.body);
    log(`  → ${r.status}`);
    if (r.status !== 404) logJson(`  response`, r.json);

    // If the request did not return a hard 404, check if sources got set
    if (r.status !== 404) {
      const attached = await verify();
      if (attached) {
        log(`\n✅ SUCCESS via: ${a.method} ${a.ep}`);
        log('=== Attach complete ===');
        return;
      }
    }
  }

  log('\n❌ None of the attempted methods attached the source. See log for details.');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
