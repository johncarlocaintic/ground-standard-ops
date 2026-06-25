/**
 * gs_kb_contact_strip.mjs
 * Strip phone numbers + emails from the 4 dirty KBs missed in the original
 * contact-info cleanup (ombjj, sugoi, montgomery, simpleman).
 *
 * Approach:
 *   1. Kill standalone "Phone:/Email:/Cell:" field lines entirely
 *   2. Replace inline phone/email patterns with "the gym"
 *   3. De-dupe stacked "the gym or the gym" phrases
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_kb_contact_strip.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'kb_contact_strip.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': key };

const DIRTY = [
  { slug: 'ombjj',      fid: 'file_GHITSJJ81K8566YD' },
  { slug: 'sugoi',      fid: 'file_WSF3D54UJ6PGSX7M' },
  { slug: 'montgomery', fid: 'file_SOOF4GONA6RA1TN8' },
  { slug: 'simpleman',  fid: 'file_8PWH43F1MZQG5EHG' },
];

function scrub(text) {
  let t = text;
  // 1. Kill standalone contact-label lines (Phone: X, Email: X, Cell: X, etc.)
  t = t.replace(/^[\s]*(?:[\-•*]\s*)?(?:public\s+|business\s+|cell\s+|main\s+|owner['']?s?\s+|after[-\s]?hours?\s+|primary\s+)?(?:phone|email|cell|fax|e[\-\s]?mail|telephone)\s*[:=]\s*[^\n]*$/gim, '');
  // 2. Replace inline phone numbers
  t = t.replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, 'the gym');
  // 3. Replace inline emails
  t = t.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'the gym');
  // 4. De-dupe stacked "the gym or the gym" / "the gym and the gym" / "the gym, the gym"
  t = t.replace(/the gym(?:\s*[,;]\s*|\s+(?:or|and|via|through|by)\s+)the gym/gi, 'the gym');
  // 5. Collapse 3+ blank lines into 2
  t = t.replace(/\n\s*\n\s*\n+/g, '\n\n');
  return t;
}

async function putKb(fileId, filename, content) {
  const form = new FormData();
  const blob = new Blob([content], { type: 'text/plain' });
  form.append('newFile', blob, filename);
  const r = await fetch(`${BASE}/library/files/${fileId}`, {
    method: 'PUT', headers: H, body: form,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0,200) }; }
  return { status: r.status, ok: r.ok, json: j };
}

async function waitIndexed(fileId, maxWait = 90000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 4000));
    const r = await fetch(`${BASE}/library/files/${fileId}`, { headers: H });
    const j = await r.json();
    if (j.fileStatus === 'indexed') return true;
    W(`    still ${j.fileStatus}...`);
  }
  return false;
}

(async () => {
  W(`=== GS KB Contact-Info Strip — ${new Date().toISOString()} ===\n`);

  for (const { slug, fid } of DIRTY) {
    W(`--- ${slug} (${fid}) ---`);
    const meta = await fetch(`${BASE}/library/files/${fid}`, { headers: H }).then(r => r.json());
    if (!meta.uri) { W(`  SKIP: no URI`); continue; }
    const original = await fetch(meta.uri).then(r => r.text());
    const scrubbed = scrub(original);

    const phoneBefore = (original.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || []).length;
    const emailBefore = (original.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length;
    const phoneAfter  = (scrubbed.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || []).length;
    const emailAfter  = (scrubbed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length;

    W(`  before: ${phoneBefore} phones | ${emailBefore} emails`);
    W(`  after:  ${phoneAfter} phones | ${emailAfter} emails`);
    W(`  size:   ${original.length} → ${scrubbed.length} bytes`);

    if (phoneAfter > 0 || emailAfter > 0) {
      W(`  WARN: scrub left residue — review regex`);
      // print residue snippets
      const r1 = scrubbed.match(/[^\n]*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}[^\n]*/g) || [];
      const r2 = scrubbed.match(/[^\n]*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\n]*/g) || [];
      for (const s of [...r1, ...r2].slice(0, 5)) W(`    ${s.trim().slice(0,120)}`);
    }

    if (!EXECUTE) { W(`  [DRY] would PUT scrubbed content`); continue; }

    const pr = await putKb(fid, meta.fileName, scrubbed);
    W(`  PUT: ${pr.status}`);
    if (!pr.ok) { W(`  FAIL`); continue; }

    W(`  waiting for re-index...`);
    const ok = await waitIndexed(fid);
    W(`  indexed: ${ok}`);
  }

  W(`\nLog: ${logFile}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
