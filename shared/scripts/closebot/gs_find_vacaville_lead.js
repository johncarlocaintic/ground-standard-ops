import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_find_vacaville_lead.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function logJson(label, data) {
  const s = JSON.stringify(data, null, 2);
  fs.appendFileSync(logFile, `\n--- ${label} ---\n${s}\n\n`);
}
const BASE = 'https://api.closebot.com';
const API_KEY = process.env.CB_GS_API_KEY;
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function GET(endpoint, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS, signal: ctrl.signal });
    clearTimeout(t);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, err: e.message };
  }
}

async function main() {
  log('=== Scan for Vacaville lead with bot interaction ===');

  let vacavilleSourceId = null;
  let candidate = null;
  let page = 1;
  const maxPages = 20;

  while (page <= maxPages && !candidate) {
    log(`\nPage ${page}...`);
    const r = await GET(`/lead?page=${page}&pageSize=100`);
    if (!r.ok) { log(`  FAIL ${r.status || r.err}`); break; }
    const results = r.json?.results || [];
    log(`  ${results.length} leads, total=${r.json?.total}`);

    if (results.length === 0) break;

    // Find Vacaville sources from this page (strict)
    const vacaNames = results.filter(l => {
      const n = (l.source?.name || '').toLowerCase();
      return n.includes('vacaville');
    });
    if (vacaNames.length > 0 && !vacavilleSourceId) {
      vacavilleSourceId = vacaNames[0].source.id;
      log(`  Found Vacaville source on page ${page}: ${vacavilleSourceId} — "${vacaNames[0].source.name}"`);
    }

    // Find candidate: Vacaville lead with real conversation
    const withConvo = results.find(l => {
      const n = (l.source?.name || '').toLowerCase();
      if (!n.includes('vacaville')) return false;
      return l.lastMessageBotId || (l.lastMessage && l.lastMessage.length > 0) || l.instances?.length > 0;
    });
    if (withConvo) {
      candidate = withConvo;
      log(`  CANDIDATE FOUND: ${candidate.id} name="${candidate.name}" lastMessage="${(candidate.lastMessage || '').slice(0,60)}"`);
      break;
    }
    page++;
  }

  if (!candidate) {
    log('\nNo ideal candidate. Scanning filter ?sourceId= if source known...');
    if (vacavilleSourceId) {
      const filt = await GET(`/lead?sourceId=${vacavilleSourceId}&pageSize=50`);
      if (filt.ok) {
        const results = filt.json?.results || [];
        log(`  sourceId filter returned ${results.length} leads (total=${filt.json?.total})`);
        logJson('Vacaville lead list', results);
        candidate = results.find(l => l.lastMessageBotId || (l.lastMessage && l.lastMessage.length) || l.instances?.length);
        if (!candidate && results[0]) candidate = results[0];
      }
    }
  }

  if (!candidate) { log('\nNo Vacaville lead found.'); return; }

  log(`\n=== Exploring lead ${candidate.id} ===`);
  logJson('candidate list entry', candidate);
  await deepProbe(candidate.id);
}

async function deepProbe(leadId) {
  const VACA = 'bot_9SWB45KI6PAJMX4Y';
  const eps = [
    `/lead/${leadId}`,
    `/bot/${VACA}/lead/${leadId}`,
    `/bot/${VACA}/lead/${leadId}/messages`,
    `/bot/${VACA}/lead/${leadId}/transcript`,
    `/bot/${VACA}/messages/${leadId}`,
    `/bot/${VACA}/testSession/messages/${leadId}`,
    `/bot/${VACA}/sessionMessages/${leadId}`,
    `/instance/${leadId}`,
    `/conversation/${leadId}`,
  ];
  for (const ep of eps) {
    const r = await GET(ep);
    const m = r.ok ? 'PASS' : (r.status === 404 ? '404' : (r.status || 'ERR'));
    log(`  [${m}] ${ep}`);
    if (r.ok) logJson(ep, r.json);
  }
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
