/**
 * gs_kb_jj_update_session_rebuilds.mjs
 *
 * Applies the same KB Jiu-Jitsu capitalization fix from commit 07c05c3 to the
 * 8 Agent Node bots' KBs that we (re)built THIS session.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_kb_jj_update_session_rebuilds.mjs [--execute]
 *
 * MUST run after all 6 chain sweeps complete — never PUT a KB mid-test.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'kb_jj_update_session.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': key };

const KB_DIR = path.join(__dirname, '../../../clients/ground-standard/closebot');

// 8 session-rebuilt KBs: bot slug → KB file ID in CB library → local KB filename
// Gracie East SJ uses legacy CB library KB (no local file maintained)
const KBS = [
  { slug: 'royaljj',       fileId: 'file_FUODHVT0SZTQEMA8',  local: 'royaljj-kb-v1.0.0.txt' },
  { slug: 'allinjujitsu',  fileId: 'file_SGIMS85LUBZWM456',  local: 'allinjujitsu-kb-v1.0.0.txt' },
  { slug: 'graciefv',      fileId: 'file_Y12JSQXU63UJ9Z0N',  local: 'graciefarmingtonvalley-kb-v1.0.0.txt' },
  { slug: 'hammersports',  fileId: 'file_2WNTLIZS3TRK33BF',  local: 'hammersports-kb-v1.0.0.txt' },
  { slug: 'invertedgear',  fileId: 'file_AKJCQBGF2EBZEY46',  local: 'invertedgear-kb-v1.0.0.txt' },
  { slug: 'hamptonsjj',    fileId: 'file_R2H1G3T1XFE4NRMR',  local: 'hamptonsjj-kb-v1.0.0.txt' },
  { slug: 'masondixon',    fileId: 'file_K8E6900W9STUOHBZ',  local: 'masondixon-kb-v1.0.0.txt' },
  { slug: 'graciejjsj',    fileId: 'file_TVNOGGMULZXWL4L1',  local: null }, // legacy CB library KB
];

function fixJiuJitsu(text) {
  return text.replace(/jiu[\s-]?jitsu/gi, 'Jiu-Jitsu');
}

async function getFileUri(fileId) {
  const r = await fetch(`${BASE}/library/files/${fileId}`, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { return null; }
  return j.uri || null;
}

async function getFileMeta(fileId) {
  const r = await fetch(`${BASE}/library/files/${fileId}`, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { return null; }
  return j;
}

async function putKb(fileId, filename, content) {
  const form = new FormData();
  const blob = new Blob([content], { type: 'text/plain' });
  form.append('newFile', blob, filename);
  const r = await fetch(`${BASE}/library/files/${fileId}`, {
    method: 'PUT',
    headers: H,
    body: form,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 200) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function waitIndexed(fileId, maxWait = 90000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 4000));
    const r = await fetch(`${BASE}/library/files/${fileId}`, { headers: H });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch { continue; }
    const status = j.fileStatus || (Array.isArray(j) && j[0]?.fileStatus);
    if (status === 'indexed') return true;
    W(`    still ${status}...`);
  }
  return false;
}

(async () => {
  W(`=== Session-rebuild KB Jiu-Jitsu Update — ${new Date().toISOString()} ===\n`);
  const results = {};

  for (const g of KBS) {
    W(`--- ${g.slug} (${g.fileId}) ---`);

    const meta = await getFileMeta(g.fileId);
    if (!meta) { W(`  SKIP: file fetch failed`); results[g.slug] = 'META_FAIL'; continue; }
    W(`  CB file: ${meta.fileName} status=${meta.fileStatus}`);

    let original;
    const uri = await getFileUri(g.fileId);
    if (uri) {
      const dr = await fetch(uri);
      original = await dr.text();
      W(`  source: CB blob (uri available)`);
    } else if (g.local) {
      const localPath = path.join(KB_DIR, g.local);
      if (fs.existsSync(localPath)) {
        original = fs.readFileSync(localPath, 'utf8');
        W(`  source: local file (uri null)`);
      } else {
        W(`  SKIP: no local file at ${g.local}`);
        results[g.slug] = 'NO_LOCAL'; continue;
      }
    } else {
      W(`  SKIP: no uri and no local fallback`);
      results[g.slug] = 'NO_CONTENT'; continue;
    }

    const fixed = fixJiuJitsu(original);
    const changeCount = (original.match(/jiu[\s-]?jitsu/gi) || []).filter(m => m !== 'Jiu-Jitsu').length;

    if (changeCount === 0) {
      W(`  already clean — no JJ fixes needed`);
      results[g.slug] = 'CLEAN';
      continue;
    }

    W(`  ${changeCount} JJ fixes to apply`);

    if (!EXECUTE) {
      W('  [DRY] would PUT updated KB');
      results[g.slug] = 'DRY';
      continue;
    }

    // Save fixed local file (if we have one)
    if (g.local) {
      const localPath = path.join(KB_DIR, g.local);
      if (fs.existsSync(localPath)) {
        fs.writeFileSync(localPath, fixed, 'utf8');
        W(`  local file updated`);
      }
    }

    const fixedName = meta.fileName;
    const pr = await putKb(g.fileId, fixedName, fixed);
    W(`  PUT: ${pr.status}`);
    if (!pr.ok) {
      W(`  FAIL: ${JSON.stringify(pr.json).slice(0, 200)}`);
      results[g.slug] = 'PUT_FAIL';
      continue;
    }

    W(`  waiting for re-index...`);
    const indexed = await waitIndexed(g.fileId);
    W(`  indexed: ${indexed}`);
    results[g.slug] = indexed ? 'PASS' : 'INDEX_TIMEOUT';

    await new Promise(r => setTimeout(r, 500));
  }

  W('\n=== RESULTS ===');
  for (const [slug, v] of Object.entries(results)) W(`  ${slug}: ${v}`);

  const pass = Object.values(results).filter(v => v === 'PASS').length;
  const clean = Object.values(results).filter(v => v === 'CLEAN').length;
  W(`\n${pass} updated | ${clean} already clean`);
  W(`Log: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
