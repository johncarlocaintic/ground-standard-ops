/**
 * gs_kb_jj_update.mjs
 * Fix "jiu-jitsu" / "jiu jitsu" → "Jiu-Jitsu" in all KB files attached to
 * the 19 live GS production sources.
 *
 * Steps:
 *   1. Fetch all CB library files → build source→fileId map
 *   2. For each live source, find attached file
 *   3. Read the corresponding local KB file, apply Jiu-Jitsu fix
 *   4. Push via PUT /library/files/{id} with FormData newFile
 *   5. Verify indexed
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_kb_jj_update.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'kb_jj_update.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': key };

const KB_DIR = path.join(__dirname, '../../../clients/ground-standard/closebot');

// 19 live bots: slug → source ID → local KB filename
const GYMS = [
  { slug: 'vacaville',    src: 'src_GDKORXSW4Q8RQUQ8', local: 'vacaville_kb_v2.2.0_calendar_aligned.txt' },
  { slug: '10p-miami',    src: 'src_MXT2RCPXUZNTOP0S', local: '10p-miami-kb-v1.1.4-from-closebot.txt' },
  { slug: 'scottsdale',   src: 'src_G95K8VC8HQTNWPGL', local: 'academyjjscottsdale-kb-v1.0.0.txt' },
  { slug: 'edenprairie',  src: 'src_OJO9E23V1JJSRJLN', local: 'academyedenprairie-kb-v1.0.0.txt' },
  { slug: 'ballantyne',   src: 'src_5E8F1KTYKN51FWK5', local: null },  // will discover from CB
  { slug: 'breathe',      src: 'src_J4AHQWBOVA6ZXV0Y', local: 'breathejiujitsu-kb-v1.0.0.txt' },
  { slug: 'artistry',     src: 'src_D87BKGBV6H9K4WRS', local: 'artistry_bjj_kb_v1.1.0_CLEAN.txt' },
  { slug: 'grit',         src: 'src_6MS3RHIRTR8OEKMO', local: 'gritjiujitsu-kb-v1.1.2-from-closebot.txt' },
  { slug: 'champion',     src: 'src_EJODL02HM128RGZH', local: 'champion-martial-arts-kb-v1.1.2-from-closebot.txt' },
  { slug: 'centerline',   src: 'src_QST1SHU18MPOOHEH', local: 'centerlinejiujitsu-kb-v1.0.0.txt' },
  { slug: 'ombjj',        src: 'src_VGIGZ52AQVQZKXS3', local: 'ombjj-kb-v1.0.0.txt' },
  { slug: 'sugoi',        src: 'src_JPK476A1ODXA5YGB',  local: 'sugoi-kb-v1.0.0.txt' },
  { slug: 'raylongo',     src: 'src_XM58ZT2N3E8A1UDT', local: 'raylongo-kb-v1.0.0.txt' },
  { slug: 'universalmma', src: 'src_4C7CIFW27LLW2TCH', local: null },  // will discover from CB
  { slug: 'montgomery',   src: 'src_4VEFF108BZ7GDG4K', local: 'montgomery-kb-v1.0.0.txt' },
  { slug: 'signature',    src: 'src_HHSREAS1NVHJMDSR', local: 'signature-kb-v1.0.0.txt' },
  { slug: 'roberts',      src: 'src_E4ZQBA8ABFBDK5RM', local: 'roberts-kb-v1.0.0.txt' },
  { slug: 'simpleman',    src: 'src_XZH7NHD2M8NF0EQL', local: 'simpleman-kb-v1.0.0.txt' },
  { slug: 'killerb',      src: 'src_YJOFG6926ILNHH1R', local: 'killerb-kb-v1.0.0.txt' },
];

function fixJiuJitsu(text) {
  return text.replace(/jiu[\s-]?jitsu/gi, 'Jiu-Jitsu');
}

async function fetchAllFiles() {
  // Paginate through all library files
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${BASE}/library/files?limit=100&page=${page}`, { headers: H });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch { break; }
    if (!Array.isArray(j) || j.length === 0) break;
    all.push(...j);
    if (j.length < 100) break;
    page++;
  }
  return all;
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

async function getFileUri(fileId) {
  const r = await fetch(`${BASE}/library/files/${fileId}`, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { return null; }
  return j.uri || null;
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
  W(`=== GS KB Jiu-Jitsu Update — ${new Date().toISOString()} ===\n`);

  // Step 1: fetch all CB files, build source→file map
  W('Fetching CB library files...');
  const allFiles = await fetchAllFiles();
  W(`  ${allFiles.length} total files in account\n`);

  // Build source→{fileId, fileName} map (one KB per source — take the indexed one)
  const srcToFile = {};
  for (const f of allFiles) {
    for (const s of (f.sources || [])) {
      if (!srcToFile[s.id] || f.fileStatus === 'indexed') {
        srcToFile[s.id] = { fileId: f.fileId, fileName: f.fileName, status: f.fileStatus };
      }
    }
  }

  const results = {};

  for (const g of GYMS) {
    W(`--- ${g.slug} ---`);

    const cbFile = srcToFile[g.src];
    if (!cbFile) {
      W(`  SKIP: no KB attached to source ${g.src}`);
      results[g.slug] = 'NO_KB';
      continue;
    }
    W(`  CB file: ${cbFile.fileName} (${cbFile.fileId}) status=${cbFile.status}`);

    // Resolve local file
    let localPath = g.local ? path.join(KB_DIR, g.local) : null;

    // If no local mapping, try to match by source slug pattern
    if (!localPath) {
      const files = fs.readdirSync(KB_DIR).filter(f => !f.startsWith('_') && f.endsWith('.txt'));
      // Try to find by slug keywords in filename
      const slugKey = g.slug.replace(/[-_]/g, '').toLowerCase();
      const match = files.find(f => f.toLowerCase().replace(/[-_]/g, '').includes(slugKey));
      if (match) {
        localPath = path.join(KB_DIR, match);
        W(`  Local (auto-matched): ${match}`);
      }
    }

    if (!localPath || !fs.existsSync(localPath)) {
      W(`  SKIP: no local KB file found`);
      results[g.slug] = 'NO_LOCAL';
      continue;
    }

    // Prefer downloading current CB content (handles version drift like ballantyne v4 local vs v5 CB)
    let original;
    const uri = await getFileUri(cbFile.fileId);
    if (uri) {
      const dr = await fetch(uri);
      original = await dr.text();
      W(`  source: CB blob (uri available)`);
    } else {
      // Recently-pushed files have null uri — local file IS the current CB content
      original = fs.readFileSync(localPath, 'utf8');
      W(`  source: local file (uri null — recently pushed)`);
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

    // Save fixed local file (always update local regardless of source)
    if (localPath) {
      fs.writeFileSync(localPath, fixed, 'utf8');
      W(`  local file updated`);
    }

    // Push to CB
    const fixedName = cbFile.fileName; // keep same filename in CB
    const pr = await putKb(cbFile.fileId, fixedName, fixed);
    W(`  PUT: ${pr.status}`);
    if (!pr.ok) {
      W(`  FAIL: ${JSON.stringify(pr.json).slice(0, 200)}`);
      results[g.slug] = 'PUT_FAIL';
      continue;
    }

    // Wait for re-indexing
    W(`  waiting for re-index...`);
    const indexed = await waitIndexed(cbFile.fileId);
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
