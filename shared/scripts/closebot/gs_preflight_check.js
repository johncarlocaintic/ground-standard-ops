/**
 * Pre-flight check before phone number test.
 * Verifies: source attachment, GHL location, calendar IDs in bot KDL.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

function getEnv(k) {
  if (!process.env[k]) { console.error(`FATAL: missing ${k}`); process.exit(1); }
  return process.env[k];
}

const CB_KEY      = getEnv('CB_GS_API_KEY');
const GHL_TOKEN   = getEnv('GHL_GS_API_TOKEN');
const GHL_LOC     = getEnv('GHL_GS_LOCATION_ID');

const BOT_ID      = 'bot_J56AWZ5TYQI9HKJS';
const SRC_SANDBOX = 'src_4R4DUIQTMMX2NFPU';
const CAL_ADULT   = 'KKR9rxFq16DS0fykxXMa';
const CAL_KIDS    = 'GWdabDvAgRFHZGsBN9Fq';

const CB  = 'https://api.closebot.com';
const GHL = 'https://services.leadconnectorhq.com';

async function cbReq(ep) {
  const r = await fetch(`${CB}${ep}`, { headers: { 'X-CB-KEY': CB_KEY } });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
}

async function ghlReq(ep) {
  const r = await fetch(`${GHL}${ep}`, {
    headers: { 'Authorization': `Bearer ${GHL_TOKEN}`, 'Version': '2021-07-28' }
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 500) }; }
}

function ok(label) { console.log(`  ✅  ${label}`); }
function fail(label) { console.log(`  ❌  ${label}`); }
function info(label) { console.log(`  ℹ️   ${label}`); }

(async () => {
  console.log('\n=== Pre-flight check ===');
  console.log(`Bot:           ${BOT_ID}`);
  console.log(`Sandbox src:   ${SRC_SANDBOX}`);
  console.log(`Expected loc:  ${GHL_LOC}`);
  console.log(`Adult cal:     ${CAL_ADULT}`);
  console.log(`Kids cal:      ${CAL_KIDS}\n`);

  // ── 1. Export bot KDL and verify calendar IDs ────────────────────────────
  console.log('── 1. Bot KDL export + calendar check ──');
  const exp = await cbReq(`/bot/${BOT_ID}/export`);
  if (!exp.ok || !exp.json?.kdl) {
    fail(`Bot export failed (status ${exp.status})`);
  } else {
    const kdl = exp.json.kdl;
    const hasAdult = kdl.includes(CAL_ADULT);
    const hasKids  = kdl.includes(CAL_KIDS);
    hasAdult ? ok(`Adult No-Gi calendar ID found in KDL`) : fail(`Adult No-Gi calendar ID MISSING from KDL`);
    hasKids  ? ok(`Kids 7-13 calendar ID found in KDL`)   : fail(`Kids 7-13 calendar ID MISSING from KDL`);
    fs.writeFileSync(path.join(logDir, 'preflight_bot_export.kdl'), kdl);
    info(`KDL saved to shared/logs/preflight_bot_export.kdl (${kdl.length} chars)`);
  }

  // ── 2. Check which bot is attached to the sandbox source ─────────────────
  console.log('\n── 2. Source attachment check ──');
  const srcCalendars = await cbReq(`/agency/source/${SRC_SANDBOX}/calendars`);
  const srcTags      = await cbReq(`/agency/source/${SRC_SANDBOX}/tags`);

  if (srcCalendars.ok) {
    const cals = srcCalendars.json?.calendars || srcCalendars.json?.data || srcCalendars.json || [];
    info(`Source calendars: ${JSON.stringify(cals).slice(0, 300)}`);
  } else {
    info(`Source calendars endpoint: status ${srcCalendars.status}`);
  }

  // Check the source fields to see GHL location key
  const srcFields = await cbReq(`/agency/source/${SRC_SANDBOX}/fields`);
  if (srcFields.ok) {
    const locationKey = srcFields.json?.locationId || srcFields.json?.key || null;
    if (locationKey) {
      locationKey === GHL_LOC
        ? ok(`Source maps to expected GHL location: ${locationKey}`)
        : fail(`Source maps to WRONG GHL location: ${locationKey} (expected ${GHL_LOC})`);
    } else {
      info(`Source fields response (no locationId field visible): ${JSON.stringify(srcFields.json).slice(0, 200)}`);
    }
  } else {
    info(`Source fields endpoint: status ${srcFields.status}`);
  }

  // ── 3. Verify GHL calendars exist at expected location ───────────────────
  console.log('\n── 3. GHL calendar verification ──');
  const cals = await ghlReq(`/calendars/?locationId=${GHL_LOC}`);
  if (!cals.ok) {
    fail(`GHL calendars fetch failed (status ${cals.status})`);
  } else {
    const list = cals.json?.calendars || [];
    info(`Total GHL calendars at location: ${list.length}`);
    const adult = list.find(c => c.id === CAL_ADULT);
    const kids  = list.find(c => c.id === CAL_KIDS);
    adult ? ok(`Adult No-Gi cal exists: "${adult.name}"`) : fail(`Adult No-Gi cal ${CAL_ADULT} NOT found in GHL`);
    kids  ? ok(`Kids 7-13 cal exists:   "${kids.name}"`)  : fail(`Kids 7-13 cal ${CAL_KIDS} NOT found in GHL`);
  }

  console.log('\n=== Pre-flight complete ===\n');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
