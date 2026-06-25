/**
 * gs_session_bot_bugfixes.mjs
 *
 * Applies two REAL-BUG fixes uncovered by the 6-gym chain sweep cross-exam:
 *
 *   1. Gracie Farmington Valley (bot_J7WW9BOARJK0NI9F) — youth no-cal gate broken.
 *      Bug: 15yo Jayden Garza booked into "Kids 8-13 BJJ" (above the 13 cap).
 *      Fix: append explicit age-cap rule to variables.business.whyText.
 *
 *   2. Mason Dixon (bot_0HQBLZA2NO9T1ZFM) — discipline switch defaults to BJJ silently.
 *      Bug: bot offers Adult Fundamentals BJJ times without asking BJJ vs Striking.
 *      Fix: append explicit discipline-question rule to whyText.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_session_bot_bugfixes.mjs [--execute]
 *
 * Uses the verified POST /save pattern (see tasks/lessons.md 2026-05-22).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'session_bot_bugfixes.log');
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

function pickLatestVersion(bot) {
  const versions = bot.versions || [];
  if (!versions.length) return null;
  const published = versions.filter(v => v.published);
  const pool = published.length ? published : versions;
  return pool.slice().sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))[0]?.version;
}

const BUGFIXES = [
  {
    slug: 'graciefv',
    id: 'bot_J7WW9BOARJK0NI9F',
    marker: 'Kids 8-13 program caps at age 13',
    addendum: '\n\nCRITICAL AGE-CAP RULE: The Kids 8-13 Brazilian Jiu-Jitsu program caps at age 13. If a child is 14 or older, do NOT book them into Kids 8-13 or any other calendar — Gracie Farmington Valley has no online calendar for ages 14-17. Capture the parent contact info, tell the parent the team will follow up, and add the alert tag via @@[Update Tags]. Never assume a 14, 15, 16, or 17 year old belongs in Kids 8-13.',
  },
  {
    slug: 'masondixon',
    id: 'bot_0HQBLZA2NO9T1ZFM',
    marker: 'TWO adult disciplines',
    addendum: '\n\nCRITICAL DISCIPLINE RULE: Mason Dixon Jiu-Jitsu offers TWO adult disciplines — Adult Fundamentals BJJ AND Adult Striking. BEFORE offering any adult booking times or calendar slots, you MUST ask the lead explicitly: "Are you interested in Adult Fundamentals BJJ or Adult Striking?" Never assume or default to one discipline. Only after the lead chooses should you proceed with booking. This rule applies to every adult lead, even if their opening message mentions one discipline — confirm explicitly.',
  },
];

(async () => {
  W(`=== Session bot bug-fixes — ${new Date().toISOString()} ===\n`);
  const results = {};

  for (const g of BUGFIXES) {
    W(`--- ${g.slug} (${g.id}) ---`);

    const br = await getJson(`${BASE}/bot/${g.id}`);
    if (!br.ok) { W(`  SKIP: bot fetch failed ${br.status}`); results[g.slug] = 'BOT_FETCH_FAIL'; continue; }
    const ver = pickLatestVersion(br.json);
    if (!ver) { W('  SKIP: no version'); results[g.slug] = 'NO_VERSION'; continue; }
    W(`  latest version: ${ver}`);

    const sr = await getJson(`${BASE}/bot/${g.id}/steps?botVersion=${encodeURIComponent(ver)}`);
    if (!sr.ok) { W(`  SKIP: steps fetch failed ${sr.status}`); results[g.slug] = 'STEPS_FETCH_FAIL'; continue; }
    const steps = sr.json;
    if (!steps?.variables?.business) { W('  SKIP: bad shape'); results[g.slug] = 'BAD_SHAPE'; continue; }

    const why = steps.variables.business.whyText || '';
    if (why.includes(g.marker)) {
      W(`  no-op — bug-fix already present (marker found)`);
      results[g.slug] = 'NOOP';
      continue;
    }

    steps.variables.business.whyText = why + g.addendum;
    W(`  appending ${g.addendum.length} chars to whyText`);

    if (!EXECUTE) {
      W('  [DRY] would POST /save then publish');
      results[g.slug] = 'DRY';
      continue;
    }

    const saveR = await postJson(`${BASE}/bot/${g.id}/save`, { botSteps: steps, layoutOnly: false });
    if (!saveR.ok) { W(`  FAIL save: ${saveR.status} ${JSON.stringify(saveR.json).slice(0, 200)}`); results[g.slug] = 'SAVE_FAIL'; continue; }
    const newVer = saveR.json.version;
    W(`  saved: new version ${newVer}`);

    await new Promise(r => setTimeout(r, 1200));

    const pubR = await postJson(`${BASE}/bot/${g.id}/publish`, {});
    if (!pubR.ok && pubR.status !== 204) { W(`  FAIL publish: ${pubR.status}`); results[g.slug] = 'PUBLISH_FAIL'; continue; }
    W(`  publish: ${pubR.status}`);

    await new Promise(r => setTimeout(r, 1500));

    const exR = await getJson(`${BASE}/bot/${g.id}/export`);
    const kdl = exR.json?.kdl || '';
    const markerLanded = kdl.includes(g.marker);
    W(`  verify: marker in export = ${markerLanded}`);
    results[g.slug] = markerLanded ? `PASS v${newVer}` : `PARTIAL v${newVer}`;

    await new Promise(r => setTimeout(r, 500));
  }

  W('\n=== RESULTS ===');
  for (const [slug, v] of Object.entries(results)) W(`  ${slug}: ${v}`);
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.stack || e.message); process.exit(1); });
