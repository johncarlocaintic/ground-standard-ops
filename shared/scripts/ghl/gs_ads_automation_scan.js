import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'gs_ads_automation_scan.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

const TOKEN = process.env.GHL_GS_API_TOKEN;
const LOC = process.env.GHL_GS_LOCATION_ID;
const GHL = 'https://services.leadconnectorhq.com';
const H = {
  'Authorization': `Bearer ${TOKEN}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
};

async function get(ep) {
  const r = await fetch(`${GHL}${ep}`, { headers: H });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; }
  catch { return { status: r.status, json: { raw: t.slice(0, 400) } }; }
}

async function main() {
  log(`=== Phase A: scan GS Ads for active automations before writing ===`);

  // Workflows
  log('\n[1] GET /workflows/?locationId={loc}');
  const wf = await get(`/workflows/?locationId=${LOC}`);
  log(`  → ${wf.status}`);
  if (wf.status === 200) {
    const flows = wf.json?.workflows || [];
    log(`  ${flows.length} workflow(s) found`);
    for (const f of flows) {
      log(`    - ${(f.name||'').padEnd(50)} status=${f.status||'?'}  id=${f.id}`);
    }
    logJson('Workflows', wf.json);
  } else {
    logJson('Workflows error', wf.json);
  }

  // Pipelines
  log('\n[2] GET /opportunities/pipelines?locationId={loc}');
  const pipe = await get(`/opportunities/pipelines?locationId=${LOC}`);
  log(`  → ${pipe.status}`);
  if (pipe.status === 200) {
    const pipes = pipe.json?.pipelines || [];
    log(`  ${pipes.length} pipeline(s)`);
    for (const p of pipes) log(`    - ${p.name} (${p.id})`);
  }

  // Tags in use
  log('\n[3] GET /locations/{loc}/tags');
  const tags = await get(`/locations/${LOC}/tags`);
  log(`  → ${tags.status}`);
  if (tags.status === 200) {
    const tagList = tags.json?.tags || [];
    log(`  ${tagList.length} tag(s) in use`);
    // flag any that would collide with our test tags
    const collision = tagList.filter(t => /test|youth|do-not-use|multi-kid/i.test(t.name || ''));
    if (collision.length > 0) {
      log('  ⚠ potential tag collisions with test tags:');
      collision.forEach(t => log(`    - ${t.name}`));
    } else {
      log('  ✅ no collision risk with planned test tags');
    }
  }

  log('\n=== Phase A done — see log + json dumps for detail ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
