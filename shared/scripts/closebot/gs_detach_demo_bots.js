/**
 * Detach old (DEMO) bots from REAL gym GHL sources so nothing accidental
 * is left answering. DEFAULT = DRY (read-only enumerate + classify, no
 * writes). Pass --execute to actually detach.
 *
 * HARD GUARDS (never violated, even with --execute):
 *   - NEVER touch src_GDKORXSW4Q8RQUQ8  (Vacaville production)
 *   - NEVER touch src_4R4DUIQTMMX2NFPU  (GS Ads eval sandbox, by design)
 *   - Only bots whose NAME contains "(DEMO)" (case-insensitive)
 *   - Only sources of category GHLS
 *   - Per-item FRESH re-check immediately before each DELETE (no stale
 *     snapshot — this is the Breathe-JJ mis-detach guard)
 *   - Detach only (DELETE /bot/{id}/source/{srcId}); bots are NOT deleted
 *
 * Run (DRY):     node --env-file=.env --env-file=clients/ground-standard/.env \
 *                  shared/scripts/closebot/gs_detach_demo_bots.js
 * Run (EXECUTE): same + ` --execute`
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'detach_demo_bots.log');
const revertFile = path.join(logDir, 'detach_demo_bots_REVERT.json');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
const VACA_PROD = 'src_GDKORXSW4Q8RQUQ8';
const GS_ADS    = 'src_4R4DUIQTMMX2NFPU';
const HARD_SKIP = new Set([VACA_PROD, GS_ADS]);
const isDemo = (n) => /\(demo\)/i.test(n || '');

async function api(method, ep) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}
const sleep = () => new Promise(r => setTimeout(r, 200));

(async () => {
  W(`=== Detach (DEMO) bots from real sources  [${EXECUTE ? 'EXECUTE' : 'DRY RUN'}] ===\n`);
  const list = await api('GET', '/bot');
  const bots = list.ok ? (list.json.bots || list.json.data || list.json) : [];
  if (!Array.isArray(bots)) { W('FATAL: bad /bot shape'); process.exit(1); }

  const candidates = [];   // DEMO bots on a real source -> detach
  const nonDemoFlag = [];  // NON-DEMO bot on a real source -> FLAG, do not auto-touch
  for (const b of bots) {
    const id = b.id || b._id, name = b.name || '(unnamed)';
    const d = await api('GET', `/bot/${id}`);
    if (!d.ok) { W(`  ! detail fail ${name} [${id}] ${d.status}`); continue; }
    for (const s of (d.json.sources || [])) {
      if ((s.category || '') !== 'GHLS') continue;
      if (HARD_SKIP.has(s.id)) continue;            // never the prod/sandbox sources
      const rec = { botId: id, name, srcId: s.id, srcName: s.name, attachment: s };
      if (isDemo(name)) candidates.push(rec);
      else nonDemoFlag.push(rec);
    }
    await sleep();
  }

  W(`--- DETACH CANDIDATES: (DEMO) bots on a real source (${candidates.length}) ---`);
  candidates.forEach(c => W(`  "${c.name}"  [${c.botId}]\n      <- ${c.srcName} [${c.srcId}]`));
  W(`\n--- FLAG ONLY: NON-(DEMO) bots on a real source (${nonDemoFlag.length}) (NOT auto-touched) ---`);
  nonDemoFlag.forEach(c => W(`  "${c.name}"  [${c.botId}]  <- ${c.srcName} [${c.srcId}]`));

  // save revert map regardless (records what was/would be detached)
  fs.writeFileSync(revertFile, JSON.stringify(candidates, null, 2));
  W(`\nRevert map (re-attach source) written: ${revertFile}`);

  if (!EXECUTE) {
    W('\nDRY RUN — no changes made. Re-run with --execute after confirmation.');
    return;
  }

  W('\n=== EXECUTING DETACH (per-item fresh re-check) ===');
  let done = 0, skipped = 0, failed = 0;
  for (const c of candidates) {
    // FRESH re-check right before the write (stale-snapshot guard)
    const fresh = await api('GET', `/bot/${c.botId}`);
    if (!fresh.ok) { W(`  SKIP (refetch fail) "${c.name}"`); skipped++; continue; }
    const stillThere = (fresh.json.sources || []).some(s => s.id === c.srcId);
    const stillDemo = isDemo(fresh.json.name || c.name);
    if (HARD_SKIP.has(c.srcId)) { W(`  SKIP (hard-guard) ${c.srcId}`); skipped++; continue; }
    if (!stillThere) { W(`  SKIP (already detached) "${c.name}" <- ${c.srcName}`); skipped++; continue; }
    if (!stillDemo)  { W(`  SKIP (name no longer DEMO) "${c.name}"`); skipped++; continue; }
    const del = await api('DELETE', `/bot/${c.botId}/source/${c.srcId}`);
    if (del.ok) {
      // confirm gone
      await sleep();
      const chk = await api('GET', `/bot/${c.botId}`);
      const gone = chk.ok && !(chk.json.sources || []).some(s => s.id === c.srcId);
      W(`  ${gone ? 'OK  ' : 'WARN'} detached "${c.name}" <- ${c.srcName} [${del.status}]${gone ? '' : ' (not reflected, verify manually)'}`);
      done += gone ? 1 : 0;
      if (!gone) failed++;
    } else { W(`  FAIL "${c.name}" <- ${c.srcName} [${del.status}] ${JSON.stringify(del.json).slice(0,120)}`); failed++; }
    await sleep();
  }
  W(`\n=== DONE: detached ${done}, skipped ${skipped}, failed ${failed} ===`);
  W(`Revert: re-POST each entry in ${revertFile} to /bot/{botId}/source/{srcId}`);

  // final sweep: confirm no DEMO bot left on any real source
  W('\n=== FINAL SWEEP ===');
  const l2 = await api('GET', '/bot');
  const b2 = l2.ok ? (l2.json.bots || l2.json.data || l2.json) : [];
  let leftover = 0;
  for (const b of b2) {
    if (!isDemo(b.name)) continue;
    const dd = await api('GET', `/bot/${b.id || b._id}`);
    if (!dd.ok) continue;
    for (const s of (dd.json.sources || [])) {
      if ((s.category || '') === 'GHLS' && !HARD_SKIP.has(s.id)) {
        W(`  LEFTOVER: "${b.name}" still on ${s.name} [${s.id}]`); leftover++;
      }
    }
    await sleep();
  }
  W(leftover ? `  ${leftover} leftover(s) — re-run --execute` : '  CLEAN: no (DEMO) bot on any real source.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
