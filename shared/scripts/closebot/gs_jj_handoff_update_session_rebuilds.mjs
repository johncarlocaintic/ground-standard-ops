/**
 * gs_jj_handoff_update_session_rebuilds.mjs (v2 — POST /save pattern)
 *
 * Applies two fixes to the 8 Agent Node bots we (re)built THIS session:
 *   1. "jiu-jitsu" / "jiu jitsu" / "jiujitsu" → "Jiu-Jitsu" (regex on serialized botSteps JSON)
 *   2. Handoff instruction appended to variables.business.whyText (conversationReason):
 *      when bot can't answer from KB → apply 'alert' tag + tell lead team will follow up
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_jj_handoff_update_session_rebuilds.mjs [--execute]
 *
 * MUST run after all chain sweeps complete — never POST /save mid-test.
 *
 * IMPORTANT: This supersedes the prior PUT /bot/{id} { importKdl } approach which
 * silently dropped updates. See tasks/lessons.md 2026-05-22 PUT silent-fail entry.
 *
 * Working pattern:
 *   1. GET /bot/{id} to find latest version
 *   2. GET /bot/{id}/steps?botVersion=X.X.X
 *   3. Mutate the JSON (apply fixes)
 *   4. POST /bot/{id}/save { botSteps, layoutOnly: false } → creates new version 0.0.X+1
 *   5. POST /bot/{id}/publish
 *   6. Verify by re-fetching /export and checking for handoff marker
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'jj_handoff_update_session_v2.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const BASE = 'https://api.closebot.com';
const HJ = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
const HB = { 'X-CB-KEY': key };

async function getJson(url, headers = HB) {
  const r = await fetch(url, { headers });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { _raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function postJson(url, body, headers = HJ) {
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { _raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

const BOTS = [
  { slug: 'royaljj',       id: 'bot_4N8WBIF210AU944O' },
  { slug: 'allinjujitsu',  id: 'bot_15WPBGYMS6HLGC5E' },
  { slug: 'graciefv',      id: 'bot_J7WW9BOARJK0NI9F' },
  { slug: 'hammersports',  id: 'bot_AFKR1QYFJ3VKYF3W' },
  { slug: 'invertedgear',  id: 'bot_FIWVSZBWNX546KKA' },
  { slug: 'hamptonsjj',    id: 'bot_WWB97FEM611TC5SY' },
  { slug: 'masondixon',    id: 'bot_0HQBLZA2NO9T1ZFM' },
  { slug: 'graciejjsj',    id: 'bot_UMEBUHOW9YQOLIHU' },
];

const HANDOFF_MARKER = 'outside your scope';
const HANDOFF_TEXT = '\n\nIf a lead asks something not covered by the knowledge base or outside your scope: tell them "That is a great question — let me get the team to follow up with you on that." Then use @@[Update Tags] to add the alert tag. Do not guess or fabricate an answer.';

function applyJjCap(steps) {
  // Serialize, regex-replace, parse back. Safe because Jiu-Jitsu inside JSON strings serializes identically.
  const s = JSON.stringify(steps);
  const fixed = s.replace(/jiu[\s-]?jitsu/gi, 'Jiu-Jitsu');
  return { steps: JSON.parse(fixed), wrongCaseFound: (s.match(/jiu[\s-]?jitsu/gi) || []).filter(m => m !== 'Jiu-Jitsu').length };
}

function applyHandoff(steps) {
  const why = steps?.variables?.business?.whyText || '';
  if (why.includes(HANDOFF_MARKER)) return { steps, alreadyPresent: true };
  steps.variables.business.whyText = why + HANDOFF_TEXT;
  return { steps, alreadyPresent: false };
}

function pickLatestVersion(bot) {
  const versions = bot.versions || [];
  if (!versions.length) return null;
  // Prefer the latest published version, fall back to most-recent modifiedAt
  const published = versions.filter(v => v.published);
  const pool = published.length ? published : versions;
  return pool.slice().sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))[0]?.version;
}

(async () => {
  W(`=== Session-rebuild Jiu-Jitsu + Handoff Update (POST /save path) — ${new Date().toISOString()} ===\n`);
  const results = {};

  for (const g of BOTS) {
    W(`--- ${g.slug} (${g.id}) ---`);

    // 1. Get bot to find latest version
    const br = await getJson(`${BASE}/bot/${g.id}`);
    if (!br.ok) { W(`  SKIP: bot fetch failed ${br.status}`); results[g.slug] = 'BOT_FETCH_FAIL'; continue; }
    const ver = pickLatestVersion(br.json);
    if (!ver) { W('  SKIP: no version found'); results[g.slug] = 'NO_VERSION'; continue; }
    W(`  latest version: ${ver}`);

    // 2. Get botSteps for that version
    const sr = await getJson(`${BASE}/bot/${g.id}/steps?botVersion=${encodeURIComponent(ver)}`);
    if (!sr.ok) { W(`  SKIP: steps fetch failed ${sr.status}`); results[g.slug] = 'STEPS_FETCH_FAIL'; continue; }
    let steps = sr.json;
    if (!steps?.variables?.business) { W('  SKIP: unexpected steps shape (no variables.business)'); results[g.slug] = 'BAD_SHAPE'; continue; }

    // 3. Apply fixes
    const beforeJj = applyJjCap(steps);
    steps = beforeJj.steps;
    const ho = applyHandoff(steps);
    steps = ho.steps;
    W(`  jiu-jitsu wrong-case found: ${beforeJj.wrongCaseFound} | handoff already present: ${ho.alreadyPresent}`);

    if (beforeJj.wrongCaseFound === 0 && ho.alreadyPresent) {
      W('  no-op — bot already clean');
      results[g.slug] = 'NOOP';
      continue;
    }

    if (!EXECUTE) {
      W('  [DRY] would POST /save then publish');
      results[g.slug] = 'DRY';
      continue;
    }

    // 4. POST /bot/{id}/save with modified botSteps
    const saveR = await postJson(`${BASE}/bot/${g.id}/save`, { botSteps: steps, layoutOnly: false });
    if (!saveR.ok) { W(`  FAIL save: ${saveR.status} ${JSON.stringify(saveR.json).slice(0, 200)}`); results[g.slug] = 'SAVE_FAIL'; continue; }
    const newVer = saveR.json.version;
    const invalidPaths = saveR.json.invalidPaths || [];
    W(`  saved: new version ${newVer} | invalidPaths=${invalidPaths.length}`);
    if (invalidPaths.length) W(`  invalidPaths: ${JSON.stringify(invalidPaths).slice(0, 400)}`);

    await new Promise(r => setTimeout(r, 1200));

    // 5. POST /bot/{id}/publish
    const pubR = await postJson(`${BASE}/bot/${g.id}/publish`, {});
    if (!pubR.ok && pubR.status !== 204) { W(`  FAIL publish: ${pubR.status} ${JSON.stringify(pubR.json).slice(0, 200)}`); results[g.slug] = 'PUBLISH_FAIL'; continue; }
    W(`  publish: ${pubR.status}`);

    await new Promise(r => setTimeout(r, 1500));

    // 6. Verify via /export round-trip
    const exR = await getJson(`${BASE}/bot/${g.id}/export`);
    const expKdl = exR.json?.kdl || '';
    const handoffLanded = expKdl.includes(HANDOFF_MARKER);
    const stillWrongJj = (expKdl.match(/jiu[\s-]?jitsu/gi) || []).filter(m => m !== 'Jiu-Jitsu').length;
    W(`  verify: handoff in export=${handoffLanded} | wrong-case-jj remaining=${stillWrongJj}`);

    if (handoffLanded && stillWrongJj === 0) {
      results[g.slug] = `PASS v${newVer}`;
    } else {
      results[g.slug] = `PARTIAL v${newVer} (handoff=${handoffLanded}, jj-remaining=${stillWrongJj})`;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  W('\n=== RESULTS ===');
  for (const [slug, v] of Object.entries(results)) W(`  ${slug}: ${v}`);
  const passCount = Object.values(results).filter(v => v.startsWith('PASS')).length;
  const noopCount = Object.values(results).filter(v => v === 'NOOP').length;
  W(`\n${passCount} updated | ${noopCount} no-op | ${BOTS.length - passCount - noopCount} other`);
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.stack || e.message); process.exit(1); });
