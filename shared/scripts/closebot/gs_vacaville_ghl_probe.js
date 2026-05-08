import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'vacaville_ghl_probe.log');
fs.writeFileSync(logFile, '');

function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(logFile, l + '\n'); }
function logJson(label, d) { fs.appendFileSync(logFile, `\n--- ${label} ---\n${JSON.stringify(d, null, 2)}\n`); }

// Load the Vacaville source from the saved dump
const sources = JSON.parse(fs.readFileSync(path.join(logDir, 'agency_sources_full.json'), 'utf8'));
const vac = sources.find(s => s.name === 'Vacaville Grappling Academy');
if (!vac) { log('FATAL: Vacaville source not found in dump'); process.exit(1); }

const JWT = vac.accessToken;
const LOC = vac.key;
log(`Target: Vacaville Grappling Academy (loc=${LOC})`);
log(`JWT len: ${JWT.length}`);

// Peek JWT payload (base64) to see claims + exp
try {
  const payload = JSON.parse(Buffer.from(JWT.split('.')[1], 'base64').toString());
  log(`JWT claims: authClass=${payload.authClass} authClassId=${payload.authClassId} ` +
      `iss=${payload.iss} exp=${new Date((payload.exp||0)*1000).toISOString()} ` +
      `scope=${Array.isArray(payload.oauthMeta?.scopes) ? payload.oauthMeta.scopes.slice(0,5).join(',')+'...' : payload.scope}`);
  logJson('JWT payload (claims only, for audit)', { ...payload, accessToken: undefined });
} catch (e) { log(`JWT decode failed: ${e.message}`); }

const GHL = 'https://services.leadconnectorhq.com';
const H = {
  'Authorization': `Bearer ${JWT}`,
  'Version': '2021-07-28',
  'Accept': 'application/json',
};

async function get(ep) {
  try {
    const res = await fetch(`${GHL}${ep}`, { headers: H });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
    return { status: res.status, ok: res.ok, json };
  } catch (e) { return { status: 0, ok: false, json: { error: e.message } }; }
}

async function main() {
  log('\n=== Probing GHL API with CloseBot-issued access token ===');

  const probes = [
    { name: 'Location info', ep: `/locations/${LOC}` },
    { name: 'Custom fields', ep: `/locations/${LOC}/customFields` },
    { name: 'Custom values', ep: `/locations/${LOC}/customValues` },
    { name: 'Tags', ep: `/locations/${LOC}/tags` },
    { name: 'Pipelines', ep: `/opportunities/pipelines?locationId=${LOC}` },
    { name: 'Calendars', ep: `/calendars/?locationId=${LOC}` },
    { name: 'Users', ep: `/users/?locationId=${LOC}` },
    { name: 'Contacts (first page)', ep: `/contacts/?locationId=${LOC}&limit=5` },
  ];

  const results = {};
  for (const p of probes) {
    const r = await get(p.ep);
    const statusMark = r.ok ? '✅' : (r.status === 401 ? '🔒' : (r.status === 403 ? '⛔' : '❌'));
    log(`  ${statusMark} ${p.name.padEnd(22)} → ${r.status}`);
    if (r.ok) {
      // show summary only in stdout; full to file
      const sample = r.json;
      let summary = '';
      if (Array.isArray(sample)) summary = `${sample.length} items`;
      else if (sample.customFields) summary = `${sample.customFields.length} customFields`;
      else if (sample.customValues) summary = `${sample.customValues.length} customValues`;
      else if (sample.tags) summary = `${sample.tags.length} tags`;
      else if (sample.pipelines) summary = `${sample.pipelines.length} pipelines`;
      else if (sample.calendars) summary = `${sample.calendars.length} calendars`;
      else if (sample.contacts) summary = `${sample.contacts.length} contacts (of ${sample.meta?.total ?? '?'} total)`;
      else if (sample.location) summary = `name="${sample.location.name}"`;
      else if (sample.users) summary = `${sample.users.length} users`;
      log(`      → ${summary}`);
      logJson(p.name, sample);
      results[p.name] = { ok: true, count: summary };
    } else {
      logJson(`  error: ${p.name}`, r.json);
      results[p.name] = { ok: false, status: r.status };
    }
  }

  log('\n=== Summary ===');
  for (const [name, r] of Object.entries(results)) {
    log(`  ${r.ok ? '✅' : '❌'} ${name.padEnd(22)} ${r.ok ? r.count : `(status ${r.status})`}`);
  }

  log(`\nFull dumps saved to ${logFile}`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
