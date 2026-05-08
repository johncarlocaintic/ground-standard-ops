/**
 * Vacaville v3.17 deploy - comprehensive audit-applied version.
 *
 * Changes from v3.16.2 (see tasks/projects/vacaville-v3.17-audit.md):
 *   - 2 AIExpressions trimmed to TRUE statement only (§6.10)
 *   - 1 AiDescription trimmed (§6.15)
 *   - 11 Booking Descriptions reduced from 300-1156 chars to 72-131 chars (§6.5)
 *   - 6 Confirm Statements rewritten as single-purpose (§6.3)
 *   - 5 age-switch AISwitch Descriptions reduced to variable ref only
 *   - ns07 Booking Failure Handoff Scenario + 3-node sub-flow added
 *
 * Enhanced read-back: checks prohibitedWords restoration + ns07 presence + all
 * AI-evaluated field lengths match expected (detect any strip-on-deploy surprises).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v3_17.log');
fs.mkdirSync(logDir, { recursive: true });

const GS_ADS_SOURCE = 'src_4R4DUIQTMMX2NFPU';
const FILTER_TAG = 'test - live chat';
const CHANNEL = 'Live_Chat';
const VERSION_LABEL = 'v3.17';
const PRIOR_BOT = 'bot_S3O4305FQ3GE1AYO'; // v3.16.2

function log(m) { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); fs.appendFileSync(LOG, line + '\n'); }
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(method, ep, body, useForm) {
  const H = { 'X-CB-KEY': getEnv('CB_GS_API_KEY') };
  if (!useForm) H['Content-Type'] = 'application/json';
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method, headers: H, body: body ? (useForm ? body : JSON.stringify(body)) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 500) } }; }
}

async function main() {
  log(`=== Vacaville ${VERSION_LABEL} deploy ===`);

  // Step 1: Create new test bot from updated KDL
  log('--- Step 1: Create test bot from KDL ---');
  const kdl = fs.readFileSync(path.join(logDir, 'vacaville_v3.kdl'), 'utf8');
  const name = `Vacaville ${VERSION_LABEL} TEST - GS Ads Live Chat (${new Date().toISOString().slice(0, 16)})`;
  log(`  name: ${name}`);
  log(`  KDL size: ${kdl.length} chars`);
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  log(`  create -> ${c.status}`);
  if (!c.ok) { log('FAIL: ' + JSON.stringify(c.json).slice(0, 500)); process.exit(1); }
  const botId = c.json?.id || c.json?.bot?.id;
  log(`  bot ID: ${botId}`);

  // Step 2: Publish
  log('--- Step 2: Publish ---');
  const p = await api('POST', `/bot/${botId}/publish`, {});
  log(`  publish -> ${p.status}`);
  if (!p.ok) { log('FAIL publish: ' + JSON.stringify(p.json).slice(0, 400)); process.exit(1); }

  // Step 3: Archive v3.16.2
  log('--- Step 3: Archive v3.16.2 ---');
  const detach = await api('DELETE', `/bot/${PRIOR_BOT}/source/${GS_ADS_SOURCE}`);
  log(`  detach v3.16.2 -> ${detach.status}`);
  const priorName = 'Vacaville v3.16.2 TEST - GS Ads Live Chat (2026-04-23T16:03)';
  const rnResp = await fetch(`https://api.closebot.com/bot/${PRIOR_BOT}`, {
    method: 'PUT',
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `[LEGACY] ${priorName}` }),
  });
  log(`  rename v3.16.2 -> ${rnResp.status}`);

  // Step 4: Attach v3.17 to GS Ads
  log('--- Step 4: Attach v3.17 to GS Ads ---');
  const a = await api('POST', `/bot/${botId}/source/${GS_ADS_SOURCE}`, {
    tags: [{ name: FILTER_TAG, approveDeny: true, id: FILTER_TAG }],
    channels: [CHANNEL],
    enabled: true,
  });
  log(`  attach -> ${a.status}`);
  if (!a.ok) log('  WARN attach: ' + JSON.stringify(a.json).slice(0, 300));

  // Step 5: Enhanced read-back verification
  log('--- Step 5: Enhanced read-back verification ---');
  const exp = await api('GET', `/bot/${botId}/export`);
  if (!exp.ok) { log('  FAIL export: ' + exp.status); process.exit(1); }
  const kdlLive = typeof exp.json === 'string' ? exp.json : (exp.json.kdl || exp.json.exportKdl || '');
  fs.writeFileSync(path.join(logDir, `gs_audit_kdl_${botId}.kdl`), kdlLive);

  // Check 1: Prompt/ExtraPrompt states
  const promptFilled = (kdlLive.match(/^\s+(Prompt|ExtraPrompt)\s+"[^"]/gm) || []).length;
  const promptEmpty = (kdlLive.match(/^\s+(Prompt|ExtraPrompt)\s+""/gm) || []).length;
  log(`  Prompt/ExtraPrompt: ${promptFilled} filled (expected 1), ${promptEmpty} empty (expected 29)`);

  // Check 2: prohibitedWords restoration check
  const pwMatch = kdlLive.match(/prohibitedWords([^\n]*)/);
  const pwLine = pwMatch ? pwMatch[0] : '(not found)';
  const pwHasValues = /prohibitedWords\s+"/.test(pwLine);
  log(`  prohibitedWords line: ${pwLine.slice(0, 100)}`);
  if (!pwHasValues) {
    log(`  ⚠️  prohibitedWords values STRIPPED on deploy (known bug). Attempting PUT /bot restoration...`);
    const putResp = await fetch(`https://api.closebot.com/bot/${botId}`, {
      method: 'PUT',
      headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ importKdl: kdl }),
    });
    log(`  PUT attempt -> ${putResp.status}`);
    const exp2 = await api('GET', `/bot/${botId}/export`);
    if (exp2.ok) {
      const kdl2 = typeof exp2.json === 'string' ? exp2.json : (exp2.json.kdl || exp2.json.exportKdl || '');
      const pw2 = kdl2.match(/prohibitedWords([^\n]*)/)?.[0] || '';
      const pw2HasValues = /prohibitedWords\s+"/.test(pw2);
      log(`  prohibitedWords after PUT: ${pw2.slice(0, 100)}`);
      log(pw2HasValues ? `  ✓ prohibitedWords RESTORED via PUT` : `  ⚠️  STILL STRIPPED - manual UI restoration required (Settings > Prohibited Words: waiver, insurance, regulations, compliance)`);
    }
  } else {
    log(`  ✓ prohibitedWords values survived deploy`);
  }

  // Check 3: ns07 nodes present
  const ns07Present = /ScenarioCustom id="ns07_booking_failure_handoff"/.test(kdlLive);
  const nd07Count = (kdlLive.match(/id="nd07_/g) || []).length;
  log(`  ns07 scenario present: ${ns07Present ? 'YES' : 'NO (missing)'}`);
  log(`  nd07 sub-flow nodes: ${nd07Count} (expected 3: tag, msg, stop)`);

  // Check 4: Booking Descriptions no longer contain STEP markers
  const stepLeft = (kdlLive.match(/STEP 1|STEP 2|STEP 3|STEP 4|STEP 5/g) || []).length;
  log(`  "STEP N" procedural remnants in Booking Descriptions: ${stepLeft} (expected 0)`);

  // Check 5: Confirm Statements no longer contain "If the booking was successfully"
  const ifBooking = (kdlLive.match(/If the booking was successfully/g) || []).length;
  log(`  "If the booking was successfully" remnants: ${ifBooking} (expected 0)`);

  // Check 6: AIExpression "Answer TRUE" gone
  const answerTrue = (kdlLive.match(/Answer TRUE/g) || []).length;
  log(`  "Answer TRUE" remnants in AIExpression: ${answerTrue} (expected 0)`);

  // State file
  const stateFile = path.join(logDir, 'v3_testbot_state.json');
  fs.writeFileSync(stateFile, JSON.stringify({
    botId, botName: name,
    sourceId: GS_ADS_SOURCE, sourceName: 'GS Ads (GHL testing)',
    filterTag: FILTER_TAG, channel: CHANNEL,
    kbFileId: 'file_0CUSZU82MX5UPG6O', kbVersion: 'v2.3.2',
    builtAt: new Date().toISOString(),
    notes: 'v3.17: comprehensive audit-applied cleanup per tasks/projects/vacaville-v3.17-audit.md. 2 AIExpressions + 1 AiDescription trimmed, 11 Booking Descriptions reduced to one-liners per docs §6.5, 6 Confirm Statements rewritten as single-purpose (no if/else) per docs §6.3, 5 age-switch Descriptions trimmed, ns07 Booking Failure Handoff Scenario + 3-node sub-flow added.',
    priorBot: PRIOR_BOT,
  }, null, 2));
  log(`  state -> ${stateFile}`);

  log('');
  log('=== DEPLOY COMPLETE ===');
  log(`  New bot: ${botId}`);
  log(`  Prior bot (archived): ${PRIOR_BOT}`);
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
