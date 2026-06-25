/**
 * Batch-1 GS gym launch — 5 gyms, Agent Node, prod sources.
 *
 * Steps:
 *   1. KB pre-flight: detach stale KBs, attach missing KBs to each source
 *   2. Bot-source attach with canonical filter (concierge + 9 excludes, standard channels)
 *   3. Read-back verify each attachment
 *   4. Write revert map to shared/logs/batch1_launch_revert.json
 *
 * DRY RUN by default — shows plan without writing.
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_batch1_launch.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'batch1_launch.log');
const revertFile = path.join(logDir, 'batch1_launch_revert.json');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write. Showing plan only.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
const BASE = 'https://api.closebot.com';

const BATCH1 = [
  {
    slug: '10p-miami',
    botId: 'bot_ZC2MREMJ87S77LH1',
    srcId: 'src_MXT2RCPXUZNTOP0S',
    kbFileId: 'file_ZMTWH9BDVHNP9KB0',    // v1_1_4_10th_Planet_Miami_KB.txt — already attached
    kbAlreadyAttached: true,
    kbStaleId: null,
  },
  {
    slug: 'academyjjscottsdale',
    botId: 'bot_01MYV7I9IWMHYPCF',
    srcId: 'src_G95K8VC8HQTNWPGL',
    kbFileId: 'file_1RJFHTXQC9VJOT5O',    // academyjjscottsdale_kb_v1.0.0.txt — NOT attached
    kbAlreadyAttached: false,
    kbStaleId: null,
  },
  {
    slug: 'academyedenprairie',
    botId: 'bot_20P7NZ6ZMRY37GC4',
    srcId: 'src_OJO9E23V1JJSRJLN',
    kbFileId: 'file_BN2CMCY9D4TFQO4S',    // academyedenprairie_kb_v1.0.0.txt — NOT attached
    kbAlreadyAttached: false,
    kbStaleId: null,
  },
  {
    slug: 'ballantynemartialarts',
    botId: 'bot_SYX87T5XAAKPCUDE',
    srcId: 'src_5E8F1KTYKN51FWK5',
    kbFileId: 'file_Z0W3G3CCKBHC2TTL',    // ballantyne_kb_v5.txt — already attached
    kbAlreadyAttached: true,
    kbStaleId: 'file_Z6Y0N4CN3V1SPY9I',  // ballantyne_kb_v4.txt — must detach (bleed risk)
  },
  {
    slug: 'breathejiujitsu',
    botId: 'bot_3TG2JEKB8YHKZ711',
    srcId: 'src_J4AHQWBOVA6ZXV0Y',
    kbFileId: 'file_4V41X4L2UNHKAW2U',    // breathejiujitsu_kb_v1.0.0.txt — NOT attached
    kbAlreadyAttached: false,
    kbStaleId: null,
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

  // GUARD: Vacaville prod must never appear in this script's scope
  const VGA_PROD_BOT = 'bot_F0VNPTPCIW88YI3J';
  const VGA_PROD_SRC = 'src_GDKORXSW4Q8RQUQ8';
  const GS_ADS_SRC   = 'src_4R4DUIQTMMX2NFPU';
  for (const g of BATCH1) {
    if (g.botId === VGA_PROD_BOT || g.srcId === VGA_PROD_SRC || g.srcId === GS_ADS_SRC) {
      W(`FATAL: ${g.slug} maps to a protected source/bot — aborting`);
      process.exit(1);
    }
  }

  // ── PRE-FLIGHT ──────────────────────────────────────────────────────────
  W('=== PRE-FLIGHT ===');
  for (const g of BATCH1) {
    const r = await api('GET', `/bot/${g.botId}`);
    if (!r.ok) { W(`  ${g.slug}: FATAL GET /bot failed ${r.status}`); process.exit(1); }
    const srcs = r.json.sources || [];
    const attached = srcs.filter(s => s.id !== VGA_PROD_SRC && s.id !== GS_ADS_SRC);
    if (attached.length > 0) {
      W(`  ${g.slug}: already attached to ${attached.map(s=>s.id).join(',')} — ABORTING this gym (manual check needed)`);
      results[g.slug] = 'SKIPPED_ALREADY_ATTACHED';
      continue;
    }
    W(`  ${g.slug}: CLEAN (no sources)`);
    results[g.slug] = 'pending';
  }
  W('');

  // ── KB PRE-FLIGHT ────────────────────────────────────────────────────────
  W('=== KB PRE-FLIGHT ===');
  for (const g of BATCH1) {
    if (results[g.slug] !== 'pending') continue;

    // Detach stale KB if present
    if (g.kbStaleId) {
      W(`  ${g.slug}: detaching stale KB ${g.kbStaleId} from ${g.srcId}...`);
      if (EXECUTE) {
        const d = await api('DELETE', `/library/files/${g.kbStaleId}/source/${g.srcId}`);
        W(`    DELETE -> ${d.status} ${d.ok ? 'OK' : JSON.stringify(d.json).slice(0,200)}`);
        if (!d.ok) { W(`    WARN: stale detach failed — proceeding (double KB may persist)`); }
        await new Promise(r => setTimeout(r, 600));
      } else {
        W(`    [DRY] would DELETE /library/files/${g.kbStaleId}/source/${g.srcId}`);
      }
    }

    // Attach KB to source if not already attached
    if (!g.kbAlreadyAttached) {
      W(`  ${g.slug}: attaching KB ${g.kbFileId} to ${g.srcId}...`);
      if (EXECUTE) {
        const a = await api('POST', `/library/files/${g.kbFileId}/source/${g.srcId}`);
        W(`    POST -> ${a.status} ${a.ok ? 'OK' : JSON.stringify(a.json).slice(0,200)}`);
        if (!a.ok) {
          W(`    FATAL: KB attach failed for ${g.slug} — skipping gym`);
          results[g.slug] = 'KB_ATTACH_FAILED';
          continue;
        }
        await new Promise(r => setTimeout(r, 800));
      } else {
        W(`    [DRY] would POST /library/files/${g.kbFileId}/source/${g.srcId}`);
      }
    } else {
      W(`  ${g.slug}: KB already on source — skipping attach`);
    }
  }
  W('');

  // ── BOT ATTACH ───────────────────────────────────────────────────────────
  W('=== BOT-SOURCE ATTACH ===');
  const attachBody = {
    tags: CANONICAL_TAGS,
    channels: CANONICAL_CHANNELS,
    personaNameOverride: null,
    enabled: true,
  };
  W('Filter: REQUIRED=[concierge] EXCLUDED=[booked,member,alumni,spam,staff,service,showed,alert,aggressive]');
  W('Channels: [WhatsApp,GMB,Live_Chat,SMS,FB,IG] (Email,Custom,widget excluded)\n');

  for (const g of BATCH1) {
    if (results[g.slug] !== 'pending') continue;

    W(`  ${g.slug}: POST /bot/${g.botId}/source/${g.srcId}`);
    if (!EXECUTE) {
      W(`    [DRY] would attach with canonical filter`);
      continue;
    }

    const wr = await api('POST', `/bot/${g.botId}/source/${g.srcId}`, attachBody);
    W(`    POST -> ${wr.status}`);
    if (!wr.ok) {
      W(`    FAILED: ${JSON.stringify(wr.json).slice(0,300)}`);
      results[g.slug] = 'ATTACH_FAILED';
      continue;
    }

    // Read-back verify (1.5s settle)
    await new Promise(r => setTimeout(r, 1500));
    const vr = await api('GET', `/bot/${g.botId}`);
    const vSrc = (vr.json.sources || []).find(s => s.id === g.srcId);
    if (!vSrc) {
      W(`    VERIFY: source missing post-attach — manual check needed`);
      results[g.slug] = 'VERIFY_FAILED';
      continue;
    }

    revert[g.slug] = { botId: g.botId, srcId: g.srcId, preState: null }; // pre was clean

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
  for (const [slug, verdict] of Object.entries(results)) {
    W(`  ${slug}: ${verdict}`);
  }

  if (EXECUTE) {
    fs.writeFileSync(revertFile, JSON.stringify(revert, null, 2));
    W(`\nRevert map: ${revertFile}`);
    W('To detach any gym: DELETE /bot/{botId}/source/{srcId}');
  }

  W(`\nLog: ${logFile}`);
  const failed = Object.values(results).filter(v => !['PASS','pending'].includes(v) && v !== 'PASS');
  if (EXECUTE && Object.values(results).every(v => v === 'PASS')) W('\nAll 5 PASS. Batch-1 is live.');
  else if (!EXECUTE) W('\nDRY RUN complete. Re-run with --execute to launch.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
