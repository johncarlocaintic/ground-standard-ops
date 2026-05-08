import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../');
const logDir = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'credentials_check.log');
const ts = () => new Date().toISOString();

function log(msg) {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

function loadAllClientEnvs() {
  const clientsDir = path.join(repoRoot, 'clients');
  if (!fs.existsSync(clientsDir)) return;
  for (const slug of fs.readdirSync(clientsDir)) {
    const envPath = path.join(clientsDir, slug, '.env');
    if (fs.existsSync(envPath)) {
      parseEnvFile(envPath);
      log(`loaded clients/${slug}/.env`);
    }
  }
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`MISSING: ${key} not set`); return null; }
  return val;
}

async function get(label, url, headers) {
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    if (res.ok) {
      log(`OK    ${label} - HTTP ${res.status}`);
      return { ok: true, status: res.status, body };
    } else {
      log(`FAIL  ${label} - HTTP ${res.status} - ${JSON.stringify(body).slice(0, 200)}`);
      return { ok: false, status: res.status, body };
    }
  } catch (err) {
    log(`FAIL  ${label} - NETWORK ERROR: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

async function main() {
  log('=== Credential Diagnostics ===');
  loadAllClientEnvs();
  const results = {};

  // Agency Retell
  const retellKey = getEnv('RETELL_API_KEY');
  if (retellKey) {
    const r = await get('Retell (agency)', 'https://api.retellai.com/list-agents', {
      Authorization: `Bearer ${retellKey}`,
    });
    results['Retell (agency)'] = r.ok;
  }

  // Agency GHL - LeadGen Listings (CHURN RISK)
  const ghlAgencyToken = getEnv('GHL_AGENCY_API_TOKEN');
  const ghlAgencyLoc   = getEnv('GHL_AGENCY_LOCATION_ID');
  if (ghlAgencyToken && ghlAgencyLoc) {
    const r = await get('GHL (agency / LeadGen Listings, CHURN RISK)',
      `https://services.leadconnectorhq.com/locations/${ghlAgencyLoc}`, {
      Authorization: `Bearer ${ghlAgencyToken}`,
      Version: '2021-07-28',
    });
    results['GHL (agency)'] = r.ok;
  }

  // GHL bot-scope check: contacts (covers tags) + calendars (covers booking).
  // Avoid /locations/{id} — it requires a scope most bot PITs don't carry.
  async function checkGhlBotScope(label, token, locId) {
    const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28' };
    const c = await get(`${label} contacts`,
      `https://services.leadconnectorhq.com/contacts/?locationId=${locId}&limit=1`, headers);
    const k = await get(`${label} calendars`,
      `https://services.leadconnectorhq.com/calendars/?locationId=${locId}`, headers);
    results[label] = c.ok && k.ok;
  }

  // GHL - Ground Standard
  const ghlGS    = getEnv('GHL_GS_API_TOKEN');
  const ghlGSLoc = getEnv('GHL_GS_LOCATION_ID');
  if (ghlGS && ghlGSLoc) {
    await checkGhlBotScope('GHL (Ground Standard)', ghlGS, ghlGSLoc);
  }

  // GHL - Vacaville (nested under GS)
  const ghlVac    = getEnv('GHL_VACAVILLE_API_TOKEN');
  const ghlVacLoc = getEnv('GHL_VACAVILLE_LOCATION_ID');
  if (ghlVac && ghlVacLoc) {
    await checkGhlBotScope('GHL (Vacaville)', ghlVac, ghlVacLoc);
  }

  // OpenAI
  const openaiKey = getEnv('OPENAI_API_KEY');
  if (openaiKey) {
    const r = await get('OpenAI', 'https://api.openai.com/v1/models', {
      Authorization: `Bearer ${openaiKey}`,
    });
    results['OpenAI'] = r.ok;
  }

  // CloseBot - Ground Standard
  const cbGS = getEnv('CB_GS_API_KEY');
  if (cbGS) {
    const r = await get('CloseBot (GS)', 'https://api.closebot.com/bot', {
      'X-CB-KEY': cbGS,
    });
    results['CloseBot (GS)'] = r.ok;
  }

  // CloseBot - PropertyBots
  const cbPB = getEnv('CB_PB_API_KEY');
  if (cbPB) {
    const r = await get('CloseBot (PropertyBots)', 'https://api.closebot.com/bot', {
      'X-CB-KEY': cbPB,
    });
    results['CloseBot (PB)'] = r.ok;
  }

  // ClickUp - PropertyBots workspace
  const clickupPB = getEnv('CLICKUP_PB_API_KEY');
  if (clickupPB) {
    const r = await get('ClickUp (PB workspace)', 'https://api.clickup.com/api/v2/team', {
      Authorization: clickupPB,
    });
    results['ClickUp (PB)'] = r.ok;
  }

  log('');
  log('=== SUMMARY ===');
  for (const [label, ok] of Object.entries(results)) {
    log(`${ok ? 'OK  ' : 'FAIL'}  ${label}`);
  }
  const passed = Object.values(results).filter(Boolean).length;
  log(`${passed}/${Object.keys(results).length} credentials OK`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
