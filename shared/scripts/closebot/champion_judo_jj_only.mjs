/**
 * champion_judo_jj_only.mjs
 * Bobby clarified Champion Martial Arts offers ONLY Judo + Jiu-Jitsu (youth + adult).
 * No Karate, no Strength & Conditioning.
 *
 * Steps:
 *   1. GHL: disable the Adult Karate calendar (S&C already inactive)
 *   2. KB: scrub karate + strength/conditioning mentions, push to CB
 *   3. Bot KDL: scrub same, PUT + publish
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/champion_judo_jj_only.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'champion_judo_jj_only.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to apply.\n');

const cbKey = process.env.CB_GS_API_KEY;
const ghlPit = 'pit-1a1635b5-4cb9-404a-a7ba-9d03e3d99185';
const ghlLoc = 'ffkMyOy6QOwqrvn4OvoK';
const botId  = 'bot_GEGYNE5WQNOYH7UB';
const kbFid  = 'file_KNVD94TXIV2LNDZ7';

async function ghl(method, ep, body) {
  const r = await fetch('https://services.leadconnectorhq.com' + ep, {
    method,
    headers: { Authorization: 'Bearer ' + ghlPit, Version: '2021-07-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0,200) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function cb(method, ep, body, isForm) {
  const r = await fetch('https://api.closebot.com' + ep, {
    method,
    headers: isForm ? { 'X-CB-KEY': cbKey } : { 'X-CB-KEY': cbKey, 'Content-Type': 'application/json' },
    body: isForm ? body : (body ? JSON.stringify(body) : undefined),
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0,200) }; }
  return { status: r.status, ok: r.ok, json: j };
}

// Scrub karate + strength/conditioning from text content
function scrub(text) {
  let t = text;

  // 1. Kill entire lines that are predominantly about karate or S&C
  // Lines like: "Adult Karate: ...", "- Karate (age 14+): ...", "Strength and Conditioning Schedule:"
  const lineKill = [
    /^.*\b(adult\s+karate|youth\s+karate|kids?\s+karate)\b[^\n]*$/gim,
    /^.*\bstrength\s+(and|&)\s+conditioning\b[^\n]*$/gim,
    /^.*\b(adult\s+)?(strength|conditioning)\s+(schedule|class|program|training)[^\n]*$/gim,
    /^[\s\-•*]*karate\b[^\n]*$/gim,
  ];
  for (const re of lineKill) t = t.replace(re, '');

  // 2. Remove karate from inline program lists
  // "Judo, Jiu-Jitsu, Karate, and Conditioning" → "Judo and Jiu-Jitsu"
  // Common Spanish patterns: "Judo, Jiu-Jitsu, Karate o Conditioning" → "Judo o Jiu-Jitsu"
  t = t.replace(/,?\s*karate\s+(starts?|begins?|is\s+(for|available))\s+at\s+(?:age\s+)?\d+\s*[+]?/gi, '');
  t = t.replace(/\s*,\s*karate\s*(and|,|\s+or)\b/gi, '$1');
  t = t.replace(/,\s*karate\b/gi, '');
  t = t.replace(/\bkarate\s*,\s*/gi, '');
  t = t.replace(/\band\s+karate\b/gi, '');
  t = t.replace(/\bor\s+karate\b/gi, '');
  t = t.replace(/\bkarate\s+and\s+/gi, '');
  t = t.replace(/\bkarate\s+or\s+/gi, '');

  // 3. Remove S&C / Champion Conditioning from inline lists + lines
  t = t.replace(/^.*\bchampion\s+conditioning\b[^\n]*$/gim, '');
  t = t.replace(/\s*\(\s*champion\s+conditioning\s*\)/gi, '');
  t = t.replace(/\s*,\s*champion\s+conditioning\b/gi, '');
  t = t.replace(/\bchampion\s+conditioning\s*,\s*/gi, '');
  t = t.replace(/\band\s+champion\s+conditioning\b/gi, '');
  t = t.replace(/\bor\s+champion\s+conditioning\b/gi, '');
  t = t.replace(/\s*,\s*(strength\s+(and|&)\s+conditioning|conditioning)\s*(and|,|\s+or)\b/gi, '$3');
  t = t.replace(/,\s*(strength\s+(and|&)\s+conditioning|conditioning)\b/gi, '');
  t = t.replace(/\band\s+(strength\s+(and|&)\s+conditioning|conditioning)\b/gi, '');
  t = t.replace(/\bor\s+(strength\s+(and|&)\s+conditioning|conditioning)\b/gi, '');

  // 4. Catch any remaining standalone "karate" word
  t = t.replace(/\bkarate\b/gi, '');

  // 5. Cleanup: empty list-item lines, double commas, "and and"
  t = t.replace(/,\s*,/g, ',');
  t = t.replace(/\band\s+and\b/gi, 'and');
  t = t.replace(/,\s*$/gm, '');
  t = t.replace(/^\s*[\-•*]\s*$/gm, '');  // empty bullet lines
  t = t.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return t;
}

(async () => {
  W(`=== Champion: Judo + Jiu-Jitsu ONLY — ${new Date().toISOString()} ===\n`);

  // ── STEP 1: GHL calendar audit + disable Adult Karate ────────────
  W('--- STEP 1: GHL calendars ---');
  const calR = await ghl('GET', `/calendars/?locationId=${ghlLoc}`);
  const cals = calR.json.calendars || [];
  let karateCal = null, scCal = null;
  for (const c of cals) {
    const flag = /karate/i.test(c.name) ? ' ← KARATE' : (/strength|conditioning/i.test(c.name) ? ' ← S&C' : '');
    W(`  ${c.isActive ? 'ACTIVE  ' : 'inactive'} | ${c.id} | ${c.name}${flag}`);
    if (/karate/i.test(c.name)) karateCal = c;
    if (/strength|conditioning/i.test(c.name)) scCal = c;
  }

  if (karateCal && karateCal.isActive) {
    W(`\n  → Will disable: ${karateCal.name} (${karateCal.id})`);
    if (EXECUTE) {
      const dr = await ghl('PUT', `/calendars/${karateCal.id}`, { isActive: false });
      W(`  PUT /calendars/${karateCal.id} { isActive:false } → ${dr.status}`);
      if (!dr.ok) W(`  FAIL: ${JSON.stringify(dr.json).slice(0,200)}`);
    } else {
      W(`  [DRY] would PUT isActive:false`);
    }
  } else if (karateCal) {
    W(`  Karate cal already inactive`);
  } else {
    W(`  No karate cal found`);
  }

  if (scCal && scCal.isActive) {
    W(`\n  → Will disable: ${scCal.name} (${scCal.id})`);
    if (EXECUTE) {
      const dr = await ghl('PUT', `/calendars/${scCal.id}`, { isActive: false });
      W(`  PUT /calendars/${scCal.id} { isActive:false } → ${dr.status}`);
    } else {
      W(`  [DRY] would PUT isActive:false`);
    }
  } else if (scCal) {
    W(`  S&C cal already inactive`);
  }

  // ── STEP 2: KB scrub ──────────────────────────────────────────────
  W('\n--- STEP 2: KB scrub ---');
  const meta = await cb('GET', `/library/files/${kbFid}`);
  const original = await (await fetch(meta.json.uri)).text();
  const scrubbed = scrub(original);

  const karateBefore = (original.match(/karate/gi) || []).length;
  const scBefore = (original.match(/strength\s+(and|&)\s+conditioning|conditioning/gi) || []).length;
  const karateAfter = (scrubbed.match(/karate/gi) || []).length;
  const scAfter = (scrubbed.match(/strength\s+(and|&)\s+conditioning|conditioning/gi) || []).length;
  W(`  karate: ${karateBefore} → ${karateAfter}`);
  W(`  S&C:    ${scBefore} → ${scAfter}`);
  W(`  size:   ${original.length} → ${scrubbed.length} bytes`);

  if (karateAfter > 0 || scAfter > 0) {
    W(`  WARN: residue remains — review`);
    const r1 = scrubbed.match(/[^\n]*karate[^\n]*/gi) || [];
    const r2 = scrubbed.match(/[^\n]*(strength\s+(and|&)\s+conditioning|conditioning)[^\n]*/gi) || [];
    for (const s of [...r1, ...r2].slice(0, 6)) W(`    "${s.trim().slice(0,140)}"`);
  }

  if (EXECUTE && (karateBefore > 0 || scBefore > 0)) {
    const form = new FormData();
    form.append('newFile', new Blob([scrubbed], { type: 'text/plain' }), meta.json.fileName);
    const pr = await cb('PUT', `/library/files/${kbFid}`, form, true);
    W(`  KB PUT → ${pr.status}`);
    // Wait for re-index
    const start = Date.now();
    while (Date.now() - start < 90000) {
      await new Promise(r => setTimeout(r, 4000));
      const mr = await cb('GET', `/library/files/${kbFid}`);
      if (mr.json.fileStatus === 'indexed') { W(`  KB re-indexed`); break; }
      W(`    still ${mr.json.fileStatus}...`);
    }
  } else if (!EXECUTE) {
    W(`  [DRY] would PUT scrubbed KB`);
  }

  // ── STEP 3: Bot KDL scrub ─────────────────────────────────────────
  W('\n--- STEP 3: Bot KDL scrub ---');
  const ex = await cb('GET', `/bot/${botId}/export`);
  const kdlOriginal = ex.json.kdl || '';
  const kdlScrubbed = scrub(kdlOriginal);

  const kKarate = (kdlOriginal.match(/karate/gi) || []).length;
  const kSC = (kdlOriginal.match(/strength\s+(and|&)\s+conditioning|conditioning/gi) || []).length;
  const kKarateA = (kdlScrubbed.match(/karate/gi) || []).length;
  const kSCa = (kdlScrubbed.match(/strength\s+(and|&)\s+conditioning|conditioning/gi) || []).length;
  W(`  KDL karate: ${kKarate} → ${kKarateA}`);
  W(`  KDL S&C:    ${kSC} → ${kSCa}`);
  W(`  KDL size:   ${kdlOriginal.length} → ${kdlScrubbed.length} bytes`);

  if (EXECUTE && (kKarate > 0 || kSC > 0)) {
    const pr = await cb('PUT', `/bot/${botId}`, { importKdl: kdlScrubbed });
    W(`  KDL PUT → ${pr.status}`);
    if (pr.ok) {
      await new Promise(r => setTimeout(r, 1200));
      const pub = await cb('POST', `/bot/${botId}/publish`, {});
      W(`  Publish → ${pub.status}`);
      await new Promise(r => setTimeout(r, 1200));
      const vr = await cb('GET', `/bot/${botId}`);
      const attached = (vr.json.sources || []).some(s => s.id === 'src_EJODL02HM128RGZH');
      W(`  Source attached after publish: ${attached}`);
    } else {
      W(`  KDL PUT FAIL: ${JSON.stringify(pr.json).slice(0,200)}`);
    }
  } else if (!EXECUTE) {
    W(`  [DRY] would PUT KDL + publish`);
  }

  W(`\nLog: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
