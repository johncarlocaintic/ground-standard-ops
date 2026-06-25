/**
 * cb_kb_swap_sandbox.js — GS Ads sandbox KB swap protocol.
 *   1. Detach EVERY KB file currently on the sandbox source (sandbox attachment
 *      only — never touches a file's other (prod) source attachments).
 *   2. Create a new library file from the gym's local KB.
 *   3. Wait for it to index, then attach it to the sandbox source.
 *
 * Usage:
 *   node --env-file=.env --env-file=clients/ground-standard/.env \
 *     shared/scripts/closebot/cb_kb_swap_sandbox.js <localKbPath> <uploadFileName> [sandboxSrc]
 */
import { readFileSync, appendFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(__dirname, '../../../shared/logs'), { recursive: true });
const logFile = path.join(__dirname, '../../../shared/logs/closebot_test.log');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); appendFileSync(logFile, l + '\n'); }

const K = process.env.CB_GS_API_KEY;
if (!K) { log('ERROR: CB_GS_API_KEY missing'); process.exit(1); }
const KB_PATH = process.argv[2];
const UP_NAME = process.argv[3];
const SANDBOX = process.argv[4] || 'src_4R4DUIQTMMX2NFPU';
if (!KB_PATH || !UP_NAME) { log('ERROR: usage: <localKbPath> <uploadFileName> [sandboxSrc]'); process.exit(1); }

const BASE = 'https://api.closebot.com';
const authH = { 'X-CB-KEY': K };
const jsonH = { 'X-CB-KEY': K, 'Content-Type': 'application/json' };

async function listFiles() {
  const r = await fetch(`${BASE}/library/files`, { headers: authH });
  const j = await r.json();
  return Array.isArray(j) ? j : (j.files || j.results || []);
}

async function main() {
  // 1. detach all KB files from sandbox (sandbox attachment only)
  const files = await listFiles();
  const onSandbox = files.filter(f => (f.sources || []).some(s => s.id === SANDBOX));
  log(`Sandbox ${SANDBOX} currently has ${onSandbox.length} KB file(s) attached.`);
  for (const f of onSandbox) {
    const r = await fetch(`${BASE}/library/files/${f.fileId}/source/${SANDBOX}`, { method: 'DELETE', headers: jsonH });
    const otherSrcs = (f.sources || []).filter(s => s.id !== SANDBOX).map(s => s.id);
    log(`  detached "${f.fileName}" (${f.fileId}) from sandbox → ${r.status}  [keeps: ${otherSrcs.join(',') || 'none'}]`);
    await new Promise(z => setTimeout(z, 150));
  }

  // 2. create new library file from local KB
  const buf = readFileSync(KB_PATH);
  const form = new globalThis.FormData();
  form.append('file', new Blob([buf], { type: 'text/plain' }), UP_NAME);
  const c = await fetch(`${BASE}/library/files`, { method: 'POST', headers: authH, body: form });
  const ct = await c.text(); let cj; try { cj = JSON.parse(ct); } catch { cj = { raw: ct.slice(0, 400) }; }
  if (!c.ok) { log(`CREATE FAILED ${c.status}: ${JSON.stringify(cj)}`); process.exit(1); }
  const newId = cj.fileId || cj.id || (cj.file && cj.file.fileId);
  log(`Created library file "${UP_NAME}" → ${newId} (${buf.length} bytes)`);

  // 3. poll for indexed; if it stalls at "uploaded", PUT content-replace to
  // re-trigger indexing (reference_closebot_kb_index_stall), then poll again.
  async function pollIndexed(maxTicks) {
    let s = '?';
    for (let i = 0; i < maxTicks; i++) {
      await new Promise(z => setTimeout(z, 4000));
      const fs2 = await listFiles();
      s = fs2.find(f => f.fileId === newId)?.fileStatus || '?';
      log(`  index poll ${i + 1}: status=${s}`);
      if (s === 'indexed') break;
    }
    return s;
  }
  let status = await pollIndexed(20);
  if (status !== 'indexed') {
    log(`  stalled at "${status}" — PUT content-replace re-trigger`);
    const f2 = new globalThis.FormData();
    f2.append('newFile', new Blob([buf], { type: 'text/plain' }), UP_NAME);
    const pr = await fetch(`${BASE}/library/files/${newId}`, { method: 'PUT', headers: authH, body: f2 });
    log(`  PUT re-trigger → ${pr.status}`);
    status = await pollIndexed(45);
  }
  if (status !== 'indexed') log(`  WARN: file still not 'indexed' (status=${status}) — do NOT trust eval until indexed`);

  // 4. attach to sandbox
  const a = await fetch(`${BASE}/library/files/${newId}/source/${SANDBOX}`, { method: 'POST', headers: jsonH, body: JSON.stringify({}) });
  log(`Attach ${newId} → ${SANDBOX}: ${a.status}`);

  // 5. verify
  const fin = await listFiles();
  const me = fin.find(f => f.fileId === newId);
  const okAttached = (me?.sources || []).some(s => s.id === SANDBOX);
  log(`Verify: "${me?.fileName}" status=${me?.fileStatus} sources=[${(me?.sources || []).map(s => s.id).join(',')}]`);
  log(okAttached ? '✅ Eden KB attached to sandbox' : '❌ attach not reflected');
  const stillOther = fin.filter(f => f.fileId !== newId && (f.sources || []).some(s => s.id === SANDBOX));
  log(stillOther.length ? `⚠️ other KB still on sandbox: ${stillOther.map(f => f.fileName).join(', ')}` : '✅ sandbox has only the Eden KB');
  console.log(`KB_FILE_ID=${newId}`);
}
main().catch(e => { log(`FATAL: ${e.stack || e.message}`); process.exit(1); });
