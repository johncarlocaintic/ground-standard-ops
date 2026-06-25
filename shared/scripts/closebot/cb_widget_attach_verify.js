/**
 * READ-ONLY widget-attach verifier (GLENN-widget-proof-of-one Step 3).
 *
 * Asserts the safety-critical state for a chat-widget proof gym WITHOUT writing
 * anything. The CloseBot widget itself is NOT exposed in the API (confirmed
 * 2026-05-20: no widget endpoints, GET /source has no widget/token field), so
 * this verifies the chain we CAN see: which bot sits on the gym source and that
 * the bot is scoped to the Live_Chat channel only (no SMS/FB/IG/email bleed).
 *
 * What it checks for the target source:
 *   1. Exactly one bot is attached.
 *   2. That bot's name matches the expected canon bot (substring, case-insensitive).
 *   3. The bot is enabled on that source.
 *   4. sources[].channelList === ["Live_Chat"] exactly. ANY extra channel = FAIL.
 *   5. Hard guardrail: never the Vacaville prod source.
 *   6. Prints tagFilterConfig for a human eyeball.
 *
 * Usage (either form):
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_widget_attach_verify.js <sourceId> "<expected bot name substring>"
 *
 *   # or drive it from the proof-of-one config file:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_widget_attach_verify.js
 *   # -> reads clients/ground-standard/closebot/widget-sources.input.json
 *   #    { "<slug>": { "sourceId": "src_...", "expectBot": "<name substring>" } }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const LOG_DIR = path.join(REPO_ROOT, 'shared', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'closebot_test.log');
fs.mkdirSync(LOG_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] [widget-verify] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const key = process.env.CB_GS_API_KEY;
if (!key) { log('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const VGA_PROD = 'src_GDKORXSW4Q8RQUQ8';   // Vacaville production — never touch
const WANT_CHANNELS = ['Live_Chat'];        // widget-only target scoping

async function api(method, ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}

function loadTargets() {
  const [argSource, argBot] = process.argv.slice(2);
  if (argSource) return [{ slug: '(arg)', sourceId: argSource, expectBot: argBot || null }];

  const cfgPath = path.join(REPO_ROOT, 'clients', 'ground-standard', 'closebot', 'widget-sources.input.json');
  if (!fs.existsSync(cfgPath)) {
    log(`FATAL: no sourceId arg and no config at ${cfgPath}`);
    log('Pass:  cb_widget_attach_verify.js <sourceId> "<expected bot name>"');
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  return Object.entries(cfg).map(([slug, v]) => ({
    slug, sourceId: v.sourceId, expectBot: v.expectBot || null,
  }));
}

async function verifyOne(t) {
  log(`--- ${t.slug} :: ${t.sourceId} ---`);
  if (t.sourceId === VGA_PROD) {
    log('FAIL: target is the Vacaville PROD source. Refusing. Guardrail hit.');
    return false;
  }

  // Enumerate bots, find those attached to this source.
  const list = await api('GET', '/bot');
  if (!list.ok) { log(`FAIL: GET /bot ${list.status} ${list.raw || ''}`); return false; }
  const bots = list.json.bots || list.json.data || list.json;
  if (!Array.isArray(bots)) { log('FAIL: unexpected /bot shape'); return false; }

  const attached = [];
  for (const b of bots) {
    const id = b.id || b._id;
    const d = await api('GET', `/bot/${id}`);
    if (!d.ok) continue;
    const src = (d.json.sources || []).find(s => (s.id || s.sourceId) === t.sourceId);
    if (src) attached.push({ id, name: b.name || '(unnamed)', src });
    await new Promise(r => setTimeout(r, 150)); // account is throttled
  }

  if (attached.length === 0) {
    log('FAIL: no bot attached to this source. Nothing to test the widget against.');
    return false;
  }
  if (attached.length > 1) {
    log(`FAIL: ${attached.length} bots attached (must be exactly 1):`);
    attached.forEach(a => log(`   - ${a.name} [${a.id}]`));
    return false;
  }

  const { id, name, src } = attached[0];
  log(`Attached bot: ${name} [${id}]`);

  let pass = true;

  if (t.expectBot && !name.toLowerCase().includes(t.expectBot.toLowerCase())) {
    log(`FAIL: bot name does not contain expected "${t.expectBot}".`);
    pass = false;
  }
  if (/\[(LEGACY|WRONG-ARCH|LEGACY-BROKEN|DRAFT)/i.test(name)) {
    log(`FAIL: attached bot is flagged (${name.match(/\[[^\]]+\]/)?.[0]}). Not a canon bot.`);
    pass = false;
  }
  if (src.enabled === false) { log('FAIL: bot is disabled on this source.'); pass = false; }

  const ch = Array.isArray(src.channelList) ? src.channelList : [];
  const extra = ch.filter(c => !WANT_CHANNELS.includes(c));
  const missing = WANT_CHANNELS.filter(c => !ch.includes(c));
  log(`channelList = ${JSON.stringify(ch)}`);
  if (extra.length) {
    log(`FAIL: bleed risk. Extra channels beyond Live_Chat: ${JSON.stringify(extra)}.`);
    pass = false;
  }
  if (missing.length) {
    log(`FAIL: Live_Chat not scoped (missing ${JSON.stringify(missing)}). Widget will not answer.`);
    pass = false;
  }

  log(`tagFilterConfig = ${JSON.stringify(src.tagFilterConfig || null)}`);
  log(pass ? 'PASS: widget-attach state is safe and correct.' : 'RESULT: FAIL (see above).');
  return pass;
}

(async () => {
  const targets = loadTargets();
  log(`Verifying ${targets.length} target(s).`);
  let allPass = true;
  for (const t of targets) { if (!(await verifyOne(t))) allPass = false; }
  log(allPass ? '=== ALL TARGETS PASS ===' : '=== ONE OR MORE FAILED ===');
  process.exit(allPass ? 0 : 1);
})().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
