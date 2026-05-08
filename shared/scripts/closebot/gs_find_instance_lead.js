import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_find_instance_lead.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function logJson(label, data) {
  fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n\n`);
}

const BASE = 'https://api.closebot.com';
const HEADERS = { 'X-CB-KEY': process.env.CB_GS_API_KEY, 'Content-Type': 'application/json' };

async function GET(endpoint) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS, signal: ctrl.signal });
    clearTimeout(t);
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0,300) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (e) { clearTimeout(t); return { ok: false, err: e.message }; }
}

async function main() {
  log('=== Scanning for any lead with populated instances ===');

  const VACA = 'bot_9SWB45KI6PAJMX4Y';
  const VACA_SRC = 'src_GDKORXSW4Q8RQUQ8';
  let foundAny = null;
  let foundVaca = null;
  let vacaStats = { total: 0, withBot: 0, withInstances: 0 };

  for (let page = 1; page <= 30; page++) {
    const r = await GET(`/lead?page=${page}&pageSize=100`);
    if (!r.ok) { log(`Page ${page} FAIL ${r.status||r.err}`); break; }
    const results = r.json?.results || [];
    if (results.length === 0) { log(`Page ${page} empty — done.`); break; }

    // Vacaville stats
    const vaca = results.filter(l => l.source?.id === VACA_SRC);
    vacaStats.total += vaca.length;
    vacaStats.withBot += vaca.filter(l => l.lastMessageBotId).length;
    vacaStats.withInstances += vaca.filter(l => l.instances?.length > 0).length;

    // First lead anywhere with instances > 0
    if (!foundAny) {
      const withInst = results.find(l => l.instances?.length > 0);
      if (withInst) {
        foundAny = withInst;
        log(`Page ${page}: FIRST LEAD WITH INSTANCES: ${withInst.id} source="${withInst.source?.name}" instances.length=${withInst.instances.length}`);
        logJson('First instance-bearing lead', withInst);
      }
    }

    // First Vacaville lead with bot interaction
    if (!foundVaca) {
      const vacaConvo = vaca.find(l => l.lastMessageBotId || l.instances?.length > 0);
      if (vacaConvo) {
        foundVaca = vacaConvo;
        log(`Page ${page}: Vacaville lead with bot: ${vacaConvo.id}`);
        logJson('Vacaville bot-touched lead', vacaConvo);
      }
    }

    if (foundAny && foundVaca) break;
  }

  log(`\nVacaville stats across scanned pages: total=${vacaStats.total}, lastMessageBotId!=null: ${vacaStats.withBot}, instances>0: ${vacaStats.withInstances}`);

  if (foundAny) {
    log(`\n=== Probing transcript endpoints on ${foundAny.id} ===`);
    const leadId = foundAny.id;
    const botId = foundAny.lastMessageBotId || foundAny.instances?.[0]?.botId;
    log(`Associated botId: ${botId}`);

    const eps = [
      `/lead/${leadId}`,
      `/lead/${leadId}/messages`,
      `/lead/${leadId}/instances`,
      `/bot/${botId}/lead/${leadId}`,
      `/bot/${botId}/lead/${leadId}/messages`,
      `/instance/${foundAny.instances?.[0]?.id || 'none'}`,
      `/instance/${foundAny.instances?.[0]?.id || 'none'}/messages`,
    ];
    for (const ep of eps) {
      const r = await GET(ep);
      log(`  [${r.ok ? 'PASS' : r.status || 'ERR'}] ${ep}`);
      if (r.ok) logJson(ep, r.json);
    }
  } else {
    log('\nNo lead with populated instances found in scanned pages.');
  }
}

main().catch(e => { log(`FATAL ${e.message}`); process.exit(1); });
