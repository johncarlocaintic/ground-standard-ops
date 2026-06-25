/**
 * Batch-2 GS gym launch — 4 gyms, Agent Node, prod sources.
 * Centerline excluded (no CB source — blocked).
 *
 * Steps:
 *   1. Pre-flight: confirm bot clean (Logica is on sandbox — special detach)
 *   2. KB pre-flight: attach Logica KB to its prod source (others already attached)
 *   3. Bot-source attach with canonical filter
 *   4. Read-back verify + revert map
 *
 * DRY RUN by default — pass --execute to write.
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_batch2_launch.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'batch2_launch.log');
const revertFile = path.join(logDir, 'batch2_launch_revert.json');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write. Showing plan only.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';

const VGA_PROD_BOT = 'bot_F0VNPTPCIW88YI3J';
const VGA_PROD_SRC = 'src_GDKORXSW4Q8RQUQ8';
const GS_ADS_SRC   = 'src_4R4DUIQTMMX2NFPU';

// Batch-2 round 1 (Artistry/Grit/Champion/Centerline) already LIVE — they
// pre-flight as SKIPPED_ALREADY_ON_PROD if left here. This run adds Paragon
// (Agent Node v2.0, QA-PASSED 2026-05-20) as Logica's replacement.
// Logica REMOVED: bot spec's src_0HFNJJIYASHOG06Y is a phantom (no Logica
// source exists in CB across all 52, by key AND name). Blocked pending Bobby.
// Batch-4 (2026-05-21): Signature, Roberts, Simple Man, Killer B — Agent Node,
// QA-PASSED 2026-05-20. All on sandbox, all sources key-verified + PIT
// cross-checked. KBs attached to prod source for 3/4; Simple Man's KB needs
// attach during launch.
const BATCH2 = [
  {
    slug: 'signature',
    botId: 'bot_QDSOGLYJA9B4HIO0',
    srcId: 'src_HHSREAS1NVHJMDSR',     // "Signature of Jiu Jitsu", key-verified (loc UOoHf3aLtbRc8fc68KiS), spec matches, PIT 200/4cals
    kbFileId: 'file_OI3QDWCKPA9BGFK7', // verified v1.1.2, ALREADY attached to prod
    kbAlreadyAttached: true,
    detachSandbox: true,
  },
  {
    slug: 'roberts',
    botId: 'bot_YUMT096UZ49BH7AV',
    srcId: 'src_E4ZQBA8ABFBDK5RM',     // "Roberts Family MMA", key-verified (loc aTIcApLzaP3lirDWJfKW), spec matches, PIT 200/9cals
    kbFileId: 'file_Y75EMLFIA8Q2IV5P', // verified v1.1.2, ALREADY attached to prod
    kbAlreadyAttached: true,
    detachSandbox: true,
  },
  {
    slug: 'simpleman',
    botId: 'bot_97Q687NTPLF6GHC7',
    srcId: 'src_XZH7NHD2M8NF0EQL',     // "Simple Man Martial Arts", key-verified (loc aKQzZVFXhecYncsbvsOH), spec matches, PIT 200/5cals
    kbFileId: 'file_77SE33FQ3OK6SIKT', // v1.0.0 indexed but NOT yet attached to prod — script will attach
    kbAlreadyAttached: false,
    detachSandbox: true,
  },
  {
    slug: 'killerb',
    botId: 'bot_FMMFAFOFG7IG89XI',
    srcId: 'src_YJOFG6926ILNHH1R',     // "Killer B Combat Sports Academy", key-verified (loc uIW84chF6pVm03ifxxlB), spec matches, PIT 200/13cals
    kbFileId: 'file_XPQ1Y8AMAB862NIY', // verified v1.1.2, ALREADY attached to prod
    kbAlreadyAttached: true,
    detachSandbox: true,
  },
];

const CANONICAL_TAGS = [
  { name: 'concierge',  approveDeny: true,  id: 'concierge' },
  { name: 'booked',     approveDeny: false, id: 'booked' },
  { name: 'member',     approveDeny: false, id: 'member' },
  { name: 'alumni',     approveDeny: false, id: 'alumni' },
  { name: 'spam',       approveDeny: false, id: 'spam' },
  { name: 'staff',      approveDeny: false, id: 'staff' },
  { name: 'service',    approveDeny: false, id: 'service' },
  { name: 'showed',     approveDeny: false, id: 'showed' },
  { name: 'alert',      approveDeny: false, id: 'alert' },
  { name: 'aggressive', approveDeny: false, id: 'aggressive' },
];
const CANONICAL_CHANNELS = ['WhatsApp', 'GMB', 'Live_Chat', 'SMS', 'FB', 'IG'];

async function api(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

function tagsOf(src) {
  const tg = src.tags || [];
  return {
    req: tg.filter(t => t.approveDeny === true).map(t => t.name),
    exc: tg.filter(t => t.approveDeny === false).map(t => t.name),
  };
}

(async () => {
  const revert = {};
  const results = {};

  // GUARD
  for (const g of BATCH2) {
    if (g.botId === VGA_PROD_BOT || g.srcId === VGA_PROD_SRC || g.srcId === GS_ADS_SRC) {
      W(`FATAL: ${g.slug} maps to a protected source/bot — aborting`);
      process.exit(1);
    }
  }

  // ── PRE-FLIGHT ──────────────────────────────────────────────────────────
  W('=== PRE-FLIGHT ===');
  for (const g of BATCH2) {
    const r = await api('GET', `/bot/${g.botId}`);
    if (!r.ok) { W(`  ${g.slug}: FATAL GET /bot ${r.status}`); process.exit(1); }
    const srcs = r.json.sources || [];
    const onSandbox = srcs.some(s => s.id === GS_ADS_SRC);
    const onProdSrcs = srcs.filter(s => s.id !== GS_ADS_SRC && s.id !== VGA_PROD_SRC);

    if (onProdSrcs.length > 0) {
      W(`  ${g.slug}: already on prod source(s) ${onProdSrcs.map(s=>s.id).join(',')} — ABORT this gym`);
      results[g.slug] = 'SKIPPED_ALREADY_ON_PROD';
      continue;
    }
    if (onSandbox && !g.detachSandbox) {
      W(`  ${g.slug}: on sandbox but detachSandbox=false — ABORT (unexpected)`);
      results[g.slug] = 'SKIPPED_UNEXPECTED_SANDBOX';
      continue;
    }
    if (onSandbox && g.detachSandbox) {
      W(`  ${g.slug}: on sandbox ${GS_ADS_SRC} — will detach then attach prod`);
      results[g.slug] = 'pending';
      continue;
    }
    W(`  ${g.slug}: CLEAN (no sources)`);
    results[g.slug] = 'pending';
  }
  W('');

  // ── SANDBOX DETACH (Logica) ─────────────────────────────────────────────
  W('=== SANDBOX DETACH ===');
  for (const g of BATCH2) {
    if (results[g.slug] !== 'pending' || !g.detachSandbox) continue;
    W(`  ${g.slug}: DELETE /bot/${g.botId}/source/${GS_ADS_SRC}`);
    if (!EXECUTE) { W('    [DRY] would detach from sandbox'); continue; }
    const d = await api('DELETE', `/bot/${g.botId}/source/${GS_ADS_SRC}`);
    W(`    DELETE -> ${d.status} ${d.ok ? 'OK' : JSON.stringify(d.json).slice(0,200)}`);
    if (!d.ok) { W(`    FATAL: sandbox detach failed — skipping ${g.slug}`); results[g.slug] = 'SANDBOX_DETACH_FAILED'; continue; }
    await new Promise(r => setTimeout(r, 1000));
  }
  W('');

  // ── KB PRE-FLIGHT ────────────────────────────────────────────────────────
  W('=== KB PRE-FLIGHT ===');
  for (const g of BATCH2) {
    if (results[g.slug] !== 'pending') continue;
    if (g.kbAlreadyAttached) { W(`  ${g.slug}: KB already on source — skip`); continue; }
    W(`  ${g.slug}: attach KB ${g.kbFileId} -> ${g.srcId}`);
    if (!EXECUTE) { W('    [DRY] would POST /library/files/.../source/...'); continue; }
    const a = await api('POST', `/library/files/${g.kbFileId}/source/${g.srcId}`);
    W(`    POST -> ${a.status} ${a.ok ? 'OK' : JSON.stringify(a.json).slice(0,200)}`);
    if (!a.ok) { W(`    FATAL: KB attach failed — skipping ${g.slug}`); results[g.slug] = 'KB_ATTACH_FAILED'; continue; }
    await new Promise(r => setTimeout(r, 800));
  }
  W('');

  // ── BOT ATTACH ───────────────────────────────────────────────────────────
  W('=== BOT-SOURCE ATTACH ===');
  W('Filter: REQUIRED=[concierge] EXCLUDED=[booked,member,alumni,spam,staff,service,showed,alert,aggressive]');
  W('Channels: [WhatsApp,GMB,Live_Chat,SMS,FB,IG]\n');
  const attachBody = { tags: CANONICAL_TAGS, channels: CANONICAL_CHANNELS, personaNameOverride: null, enabled: true };

  for (const g of BATCH2) {
    if (results[g.slug] !== 'pending') continue;
    W(`  ${g.slug}: POST /bot/${g.botId}/source/${g.srcId}`);
    if (!EXECUTE) { W('    [DRY] would attach with canonical filter'); continue; }

    const wr = await api('POST', `/bot/${g.botId}/source/${g.srcId}`, attachBody);
    W(`    POST -> ${wr.status}`);
    if (!wr.ok) { W(`    FAILED: ${JSON.stringify(wr.json).slice(0,300)}`); results[g.slug] = 'ATTACH_FAILED'; continue; }

    await new Promise(r => setTimeout(r, 1500));
    const vr = await api('GET', `/bot/${g.botId}`);
    const vSrc = (vr.json.sources || []).find(s => s.id === g.srcId);
    if (!vSrc) { W(`    VERIFY: source missing post-attach`); results[g.slug] = 'VERIFY_FAILED'; continue; }

    revert[g.slug] = { botId: g.botId, srcId: g.srcId, wasOnSandbox: g.detachSandbox };

    const tags = tagsOf(vSrc);
    const reqOK = tags.req.length === 1 && tags.req[0] === 'concierge';
    const excOK = ['booked','member','alumni','spam','staff','service','showed','alert','aggressive'].every(x => tags.exc.includes(x));
    const chArr = vSrc.channelList || [];
    const chOK  = CANONICAL_CHANNELS.every(c => chArr.includes(c)) && !chArr.some(c => /email|custom|widget/i.test(c));
    const verdict = reqOK && excOK && chOK ? 'PASS' : 'FAIL';
    W(`    VERIFY ${verdict}: req=${tags.req} | exc=[${tags.exc.join(',')}] | ch=${JSON.stringify(chArr)}`);
    results[g.slug] = verdict;
    fs.appendFileSync(logFile, '\n--- ' + g.slug + ' POST-STATE ---\n' + JSON.stringify(vSrc, null, 2) + '\n');
    await new Promise(r => setTimeout(r, 500));
  }
  W('');

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  W('=== SUMMARY ===');
  for (const [slug, v] of Object.entries(results)) W(`  ${slug}: ${v}`);
  if (EXECUTE) {
    fs.writeFileSync(revertFile, JSON.stringify(revert, null, 2));
    W(`\nRevert map: ${revertFile}`);
  }
  W(`\nLog: ${logFile}`);
  if (EXECUTE && Object.values(results).every(v => v === 'PASS')) W('\nAll PASS. Batch-2 is live.');
  else if (!EXECUTE) W('\nDRY RUN complete. Re-run with --execute to launch.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
