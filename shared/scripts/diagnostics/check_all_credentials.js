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

  // GHL - Ground Standard
  const ghlGS    = getEnv('GHL_GS_API_TOKEN');
  const ghlGSLoc = getEnv('GHL_GS_LOCATION_ID');
  if (ghlGS && ghlGSLoc) {
    const r = await get('GHL (Ground Standard)',
      `https://services.leadconnectorhq.com/locations/${ghlGSLoc}`, {
      Authorization: `Bearer ${ghlGS}`,
      Version: '2021-07-28',
    });
    results['GHL (GS)'] = r.ok;
  }

  // GHL - Vacaville (nested under GS)
  const ghlVac    = getEnv('GHL_VACAVILLE_API_TOKEN');
  const ghlVacLoc = getEnv('GHL_VACAVILLE_LOCATION_ID');
  if (ghlVac && ghlVacLoc) {
    const r = await get('GHL (Vacaville)',
      `https://services.leadconnectorhq.com/locations/${ghlVacLoc}`, {
      Authorization: `Bearer ${ghlVac}`,
      Version: '2021-07-28',
    });
    results['GHL (Vacaville)'] = r.ok;
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
