import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_transcript_probe.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function logJson(label, data, max = 3000) {
  const s = JSON.stringify(data, null, 2);
  const snippet = s.length > max ? s.slice(0, max) + '\n...[truncated]' : s;
  fs.appendFileSync(logFile, `\n--- ${label} ---\n${snippet}\n\n`);
}
function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };
const VACAVILLE_BOT_ID = 'bot_9SWB45KI6PAJMX4Y';

async function probe(endpoint, label, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS, signal: ctrl.signal });
    clearTimeout(t);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
    const marker = res.ok ? 'PASS' : res.status === 404 ? 'NOT FOUND' : 'FAIL';
    log(`[${marker}] ${res.status} ${endpoint}   (${label})`);
    return { status: res.status, ok: res.ok, json };
  } catch (e) {
    clearTimeout(t);
    log(`[TIMEOUT/ERR] ${endpoint} — ${e.message}`);
    return { ok: false, err: e.message };
  }
}

async function main() {
  log('=== CloseBot Transcript Probe ===');

  // Step 1: get Vacaville leads specifically
  log('\n[1] GET /lead?botId=VACAVILLE');
  const vLeads = await probe(`/lead?botId=${VACAVILLE_BOT_ID}&limit=5`, 'Vacaville leads by botId');
  if (vLeads.ok) logJson('Vacaville leads (filter)', vLeads.json);

  // Step 2: try source filter — Vacaville source
  log('\n[2] GET /lead?sourceId=... (will pick from first probe)');
  const vList = Array.isArray(vLeads.json?.results) ? vLeads.json.results : [];
  const firstLead = vList[0];
  if (!firstLead) {
    log('No Vacaville leads returned via botId filter. Trying unfiltered /lead to find one...');
    const all = await probe('/lead?limit=50', 'first 50 leads');
    if (all.ok) {
      const results = all.json?.results || [];
      // find any lead with lastMessageBotId matching Vacaville
      const match = results.find(l => l.lastMessageBotId === VACAVILLE_BOT_ID);
      if (match) {
        log(`Found via scan: lead ${match.id} (source: ${match.source?.name})`);
        await exploreLead(match.id);
      } else {
        log('No Vacaville lead in first 50 results.');
        log('Sample lead to test transcript endpoints:');
        const sample = results[0];
        if (sample) await exploreLead(sample.id);
      }
    }
  } else {
    log(`First Vacaville lead: ${firstLead.id} (name: ${firstLead.name})`);
    await exploreLead(firstLead.id);
  }

  log('\n=== DONE ===');
}

async function exploreLead(leadId) {
  log(`\n--- Exploring lead ${leadId} ---`);

  const endpoints = [
    [`/lead/${leadId}`, 'lead detail'],
    [`/lead/${leadId}/messages`, 'lead messages'],
    [`/lead/${leadId}/transcript`, 'lead transcript'],
    [`/lead/${leadId}/conversation`, 'lead conversation'],
    [`/lead/${leadId}/history`, 'lead history'],
    [`/lead/${leadId}/instances`, 'lead instances'],
  ];

  for (const [ep, label] of endpoints) {
    const r = await probe(ep, label);
    if (r.ok) logJson(label, r.json);
  }
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
