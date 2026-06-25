/**
 * READ-ONLY. Scan the Vacaville GHL sub-account for any workflow that could
 * be auto-sending the canned Facebook pricing reply. The GHL public API
 * lists workflows (id/name/status) but does NOT expose internal action
 * bodies (UI-only), so this flags suspicious workflows by name/status for
 * manual UI inspection. Also lists conversation providers if exposed.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_vacaville_workflow_scan.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'vacaville_workflow_scan.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

function getEnv(k) { const v = process.env[k]; if (!v) { console.error('FATAL: missing ' + k); process.exit(1); } return v; }
const TOKEN = getEnv('GHL_VACAVILLE_API_TOKEN');
const LOC = getEnv('GHL_VACAVILLE_LOCATION_ID');
const GHL = 'https://services.leadconnectorhq.com';
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };
const SUS = /facebook|messenger|fb|price|pricing|cost|tuition|auto.?reply|instant|canned|inquiry|enquiry|lead.?reply|new lead|summer/i;

async function get(ep) {
  const r = await fetch(`${GHL}${ep}`, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  W(`Vacaville loc=${LOC}\n`);

  // 1. Workflows
  W('=== Workflows ===');
  const wf = await get(`/workflows/?locationId=${LOC}`);
  if (!wf.ok) { W(`  workflows fetch failed ${wf.status}: ${JSON.stringify(wf.json).slice(0, 300)}`); }
  else {
    const list = wf.json.workflows || wf.json.data || [];
    W(`  total: ${list.length}`);
    fs.appendFileSync(out, '\n--- raw workflows ---\n' + JSON.stringify(list, null, 2) + '\n');
    const flagged = [];
    for (const w of list) {
      const line = `  [${w.status || '?'}] ${w.name || '(unnamed)'}  id=${w.id}`;
      W(line);
      if (SUS.test(`${w.name || ''}`)) flagged.push(w);
    }
    W(`\n  >>> name-flagged as possible FB/pricing auto-reply (${flagged.length}):`);
    flagged.forEach(w => W(`      [${w.status}] ${w.name}  id=${w.id}  (open in GHL UI to read its actions)`));
  }

  // 2. Conversation providers (which apps can send on channels)
  W('\n=== Conversation providers (apps that can send messages) ===');
  for (const ep of [
    `/conversations/providers?locationId=${LOC}`,
    `/locations/${LOC}/conversationProviders`,
  ]) {
    const r = await get(ep);
    W(`  ${ep} -> ${r.status}`);
    if (r.ok) { W('    ' + JSON.stringify(r.json).slice(0, 600)); fs.appendFileSync(out, `\n--- ${ep} ---\n` + JSON.stringify(r.json, null, 2) + '\n'); }
  }

  // 3. Installed apps / integrations (best-effort; may be UI-only)
  W('\n=== Location integrations (best-effort) ===');
  for (const ep of [`/locations/${LOC}`, `/locations/${LOC}/installedApps`]) {
    const r = await get(ep);
    W(`  ${ep} -> ${r.status}`);
    if (r.ok) fs.appendFileSync(out, `\n--- ${ep} ---\n` + JSON.stringify(r.json, null, 2).slice(0, 4000) + '\n');
  }

  W(`\nFull raw in: ${out}`);
  W('Note: GHL public API does not expose workflow action bodies. Open any');
  W('flagged workflow in the GHL UI to confirm it is the pricing auto-reply.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
