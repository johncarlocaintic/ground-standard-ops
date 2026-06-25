/**
 * champion_age_bands_update.mjs
 * Bobby's update for Champion:
 *   - Judo: ages 5+ (kids), 13+ (adult)
 *   - Jiu-Jitsu: ages 7+ (kids), 13+ (adult)
 *   - No karate, no strength & conditioning
 *
 * Also: previous karate scrub script's PUT silently dropped — diagnose + retry.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/champion_age_bands_update.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const logFile = path.join(logDir, 'champion_age_bands.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to apply.\n');

const cbKey = process.env.CB_GS_API_KEY;
const botId = 'bot_GEGYNE5WQNOYH7UB';
const kbFid = 'file_KNVD94TXIV2LNDZ7';

async function cb(method, ep, body, isForm) {
  const r = await fetch('https://api.closebot.com' + ep, {
    method,
    headers: isForm ? { 'X-CB-KEY': cbKey } : { 'X-CB-KEY': cbKey, 'Content-Type': 'application/json' },
    body: isForm ? body : (body ? JSON.stringify(body) : undefined),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0,300) }; }
  return { status: r.status, ok: r.ok, json: j, raw: t };
}

// Karate / S&C scrub (same as before)
function scrubKarateSC(text) {
  let t = text;
  t = t.replace(/^.*\b(adult\s+karate|youth\s+karate|kids?\s+karate)\b[^\n]*$/gim, '');
  t = t.replace(/^.*\bstrength\s+(and|&)\s+conditioning\b[^\n]*$/gim, '');
  t = t.replace(/^.*\b(adult\s+)?(strength|conditioning)\s+(schedule|class|program|training)[^\n]*$/gim, '');
  t = t.replace(/^[\s\-•*]*karate\b[^\n]*$/gim, '');
  t = t.replace(/^.*\bchampion\s+conditioning\b[^\n]*$/gim, '');
  t = t.replace(/\s*\(\s*champion\s+conditioning\s*\)/gi, '');
  t = t.replace(/,?\s*karate\s+(starts?|begins?|is\s+(for|available))\s+at\s+(?:age\s+)?\d+\s*[+]?/gi, '');
  t = t.replace(/\s*,\s*karate\s*(and|,|\s+or)\b/gi, '$1');
  t = t.replace(/,\s*karate\b/gi, '');
  t = t.replace(/\bkarate\s*,\s*/gi, '');
  t = t.replace(/\band\s+karate\b/gi, '');
  t = t.replace(/\bor\s+karate\b/gi, '');
  t = t.replace(/\bkarate\s+and\s+/gi, '');
  t = t.replace(/\bkarate\s+or\s+/gi, '');
  t = t.replace(/\bkarate\b/gi, '');
  t = t.replace(/,\s*,/g, ',');
  t = t.replace(/\band\s+and\b/gi, 'and');
  t = t.replace(/,\s*$/gm, '');
  t = t.replace(/^\s*[\-•*]\s*$/gm, '');
  t = t.replace(/\n\s*\n\s*\n+/g, '\n\n');
  return t;
}

// Age band updates: Judo starts at 5, JJ at 7, both move to adult at 13
function applyAgeBands(text) {
  let t = text;
  // Judo: replace "Judo starts at age N" with "Judo starts at age 5"
  t = t.replace(/Judo\s+(starts|begins|is\s+available\s+from)\s+at\s+age\s+\d+\+?/gi, 'Judo starts at age 5');
  t = t.replace(/(judo[^.\n]*?age)\s+\d+\+?/gi, '$1 5+');
  // BJJ / Jiu-Jitsu: replace age refs to 7
  t = t.replace(/(Brazilian\s+Jiu-Jitsu|Jiu-Jitsu|BJJ|jiu jitsu)\s+(starts|begins|is\s+available\s+from)\s+at\s+age\s+\d+\+?/gi, 'Jiu-Jitsu starts at age 7');
  // Adult cutoff: standardize at 13+
  t = t.replace(/adult\s+(programs?|classes?)\s+(start|begin)\s+at\s+age\s+\d+\+?/gi, 'Adult classes start at age 13');
  // Karate-age refs should already be gone after scrub; nothing to do
  return t;
}

(async () => {
  W(`=== Champion: Karate scrub + Age bands — ${new Date().toISOString()} ===\n`);

  // ── KB ────────────────────────────────────────────────────────────
  W('--- KB ---');
  const meta = await cb('GET', `/library/files/${kbFid}`);
  const kbOriginal = await (await fetch(meta.json.uri)).text();
  let kbNew = scrubKarateSC(kbOriginal);
  kbNew = applyAgeBands(kbNew);

  // Inject canonical age-band fact at top of KB (in case the scrub blew it away)
  const ageFact = `\n\n# Program Age Bands (canonical, Bobby 2026-05-21)\n- Youth Judo: ages 5-12\n- Youth Jiu-Jitsu: ages 7-12\n- Adult Judo: ages 13+\n- Adult Brazilian Jiu-Jitsu: ages 13+\n- We no longer offer Karate or Strength & Conditioning.\n`;
  if (!/canonical, Bobby 2026-05-21/.test(kbNew)) kbNew = ageFact + kbNew;

  W(`  karate before: ${(kbOriginal.match(/karate/gi)||[]).length}, after: ${(kbNew.match(/karate/gi)||[]).length}`);
  W(`  S&C before:    ${(kbOriginal.match(/conditioning/gi)||[]).length}, after: ${(kbNew.match(/conditioning/gi)||[]).length}`);
  W(`  size:          ${kbOriginal.length} → ${kbNew.length}`);

  if (EXECUTE) {
    const form = new FormData();
    form.append('newFile', new Blob([kbNew], { type: 'text/plain' }), meta.json.fileName);
    const pr = await cb('PUT', `/library/files/${kbFid}`, form, true);
    W(`  KB PUT: ${pr.status}`);
    const start = Date.now();
    while (Date.now() - start < 90000) {
      await new Promise(r => setTimeout(r, 4000));
      const mr = await cb('GET', `/library/files/${kbFid}`);
      if (mr.json.fileStatus === 'indexed') { W(`  KB re-indexed`); break; }
    }
  } else {
    W(`  [DRY] would PUT KB`);
  }

  // ── BOT KDL: incremental retry ────────────────────────────────────
  W('\n--- Bot KDL ---');
  const ex = await cb('GET', `/bot/${botId}/export`);
  const kdlOriginal = ex.json.kdl || '';
  let kdlNew = scrubKarateSC(kdlOriginal);
  kdlNew = applyAgeBands(kdlNew);

  W(`  karate: ${(kdlOriginal.match(/karate/gi)||[]).length} → ${(kdlNew.match(/karate/gi)||[]).length}`);
  W(`  S&C:    ${(kdlOriginal.match(/conditioning/gi)||[]).length} → ${(kdlNew.match(/conditioning/gi)||[]).length}`);
  W(`  size:   ${kdlOriginal.length} → ${kdlNew.length}`);

  if (!EXECUTE) { W('  [DRY] would PUT + publish'); return; }

  // Strategy: PUT, wait, verify by re-export, then publish
  W('\n  attempting PUT...');
  const pr1 = await cb('PUT', `/bot/${botId}`, { importKdl: kdlNew });
  W(`  PUT: ${pr1.status}`);
  if (!pr1.ok) { W(`  PUT body: ${pr1.raw.slice(0, 300)}`); }

  await new Promise(r => setTimeout(r, 3000));

  // Re-export to check if change persisted
  const ex2 = await cb('GET', `/bot/${botId}/export`);
  const kdlAfter = ex2.json.kdl || '';
  const persisted = (kdlAfter.match(/karate/gi)||[]).length === 0;
  W(`  AFTER PUT karate count: ${(kdlAfter.match(/karate/gi)||[]).length} (persisted: ${persisted})`);

  if (!persisted) {
    // Try alternative endpoints
    W('\n  PUT silently dropped. Trying alternative endpoints...');

    W('  Try 1: POST /bot/{id}/publish { importKdl }');
    const pr2 = await cb('POST', `/bot/${botId}/publish`, { importKdl: kdlNew });
    W(`    status: ${pr2.status}, body: ${pr2.raw.slice(0, 200)}`);
    await new Promise(r => setTimeout(r, 2000));
    const ex3 = await cb('GET', `/bot/${botId}/export`);
    W(`    karate after: ${(ex3.json.kdl.match(/karate/gi)||[]).length}`);

    if ((ex3.json.kdl.match(/karate/gi)||[]).length === 0) {
      W('    ✓ Worked — publish accepts importKdl');
    } else {
      W('  Try 2: PATCH /bot/{id} { importKdl }');
      const pr3 = await cb('PATCH', `/bot/${botId}`, { importKdl: kdlNew });
      W(`    status: ${pr3.status}, body: ${pr3.raw.slice(0, 200)}`);
      await new Promise(r => setTimeout(r, 2000));
      const ex4 = await cb('GET', `/bot/${botId}/export`);
      W(`    karate after: ${(ex4.json.kdl.match(/karate/gi)||[]).length}`);
    }
  } else {
    // Persisted via PUT — now publish
    const pub = await cb('POST', `/bot/${botId}/publish`, {});
    W(`  Publish: ${pub.status}`);
  }

  // Final state
  const final = await cb('GET', `/bot/${botId}/export`);
  W(`\n  FINAL karate count: ${(final.json.kdl.match(/karate/gi)||[]).length}`);
  W(`  FINAL size: ${final.json.kdl.length}`);

  W(`\nLog: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
