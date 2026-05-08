/**
 * v5.1 — v4.1 source + Statement preamble + dedup __zIndex.
 *
 * Architecture:
 *   Source → Statement(MoveOn=true, "How can I help you?") → n10_intro (Agent Node) → rest of v4.1
 *
 * Hypothesis: maybe Agent Node throws exception when it's the FIRST node in
 * a fresh conversation. Statement preamble greets + hands off without waiting,
 * so Agent Node enters mid-conversation instead of cold-start.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_deploy_v5_1.log');
fs.writeFileSync(LOG, '');

const KDL_SOURCE = path.join(logDir, 'vacaville_v4.1.kdl');
const VERSION_LABEL = 'v5.1';

function log(m) { const line = `[${new Date().toISOString()}] ${m}`; console.log(line); fs.appendFileSync(LOG, line + '\n'); }
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': getEnv('CB_GS_API_KEY'), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 400) } }; }
}

// Strip duplicate __zIndex per node block (required for import)
function stripDuplicateZIndex(kdl) {
  const lines = kdl.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isZIndex = /^__zIndex\b/.test(line.trim());
    if (isZIndex) {
      const prev1 = (out[out.length - 1] || '').trim();
      const prev2 = (out[out.length - 2] || '').trim();
      const prev3 = (out[out.length - 3] || '').trim();
      // Skip if we already saw __zIndex in this block (look back ~3 lines)
      if (prev1.startsWith('__zIndex') || prev2.startsWith('__zIndex') || prev3.startsWith('__zIndex')) continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

// Inject Statement preamble between Source and n10_intro
function injectPreamble(kdl) {
  // 1. Change Source's Next handle from n10_intro to n00_preamble
  let patched = kdl.replace(
    /(Source id="n01_source" \{[\s\S]*?Next handle=")n10_intro(")/,
    '$1n00_preamble$2'
  );

  // 2. Insert Statement node before "Method id=\"n10_intro\""
  const preambleNode = `Statement id="n00_preamble" {
    Attachment ""
    MoveOn true
    UseAI false
    Title "Greeting Preamble"
    Statement "How can I help you?"
    Next handle="n10_intro"
}
`;

  patched = patched.replace(
    /(Method id="n10_intro" \{)/,
    preambleNode + '$1'
  );

  return patched;
}

async function main() {
  log(`=== ${VERSION_LABEL} deploy — v4.1 source + Statement preamble + __zIndex dedup ===`);

  let kdl = fs.readFileSync(KDL_SOURCE, 'utf8');
  log(`Source KDL: ${kdl.length} chars`);

  // Step 1: dedup __zIndex
  kdl = stripDuplicateZIndex(kdl);
  log(`After dedup: ${kdl.length} chars`);

  // Step 2: inject Statement preamble
  kdl = injectPreamble(kdl);
  log(`After preamble injection: ${kdl.length} chars`);
  fs.writeFileSync(path.join(logDir, 'vacaville_v5.1.kdl'), kdl);
  log(`Wrote: shared/logs/vacaville_v5.1.kdl`);

  // Verify the injection happened
  if (!kdl.includes('id="n00_preamble"')) {
    log('FAIL: preamble injection did not match. Check regex.');
    process.exit(1);
  }
  if (!kdl.includes('Next handle="n00_preamble"')) {
    log('FAIL: Source rewire did not match. Check regex.');
    process.exit(1);
  }
  log('Preamble + rewire verified');

  const name = `Vacaville ${VERSION_LABEL} TEST - Statement preamble + Agent Node chain (${new Date().toISOString().slice(0, 16)})`;
  log(`name: ${name}`);

  log('--- Step 1: Create ---');
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  if (!c.ok) { log(`FAIL: ${c.status} ${JSON.stringify(c.json).slice(0,500)}`); process.exit(1); }
  const botId = c.json.id;
  log(`bot ID: ${botId}`);

  log('--- Step 2: Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  log(`publish → ${pub.status}`);

  log('--- Step 3: saveTools ---');
  const tools = await api('POST', `/bot/${botId}/saveTools`, [
    { type: 'SmartFAQ', enabled: true, options: { '$type': 'smart_faq' } }
  ]);
  log(`saveTools → ${tools.status}`);

  log('--- Step 4: Attach to GS Ads source (Test Chat 12) ---');
  const attach = await api('POST', `/bot/${botId}/source/src_4R4DUIQTMMX2NFPU`, {
    tags: [],
    channels: ['Test Chat 12 [VACAVILLE ]'],
    enabled: true,
  });
  log(`attach → ${attach.status}`);

  log('--- Step 5: Re-publish ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  log(`re-publish → ${pub2.status}`);

  log(`\n=== DEPLOY COMPLETE ===`);
  log(`v5.1 bot ID: ${botId}`);
  log('NEXT: deep diagnostic + eval test');
  log(`  $env:CB_TEST_BOT_ID="${botId}"; node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_deep_diagnostic.js`);
}

main().catch(e => { log(`FATAL: ${e.message}`); console.error(e); process.exit(1); });
