/**
 * READ-ONLY. Verify the real CloseBot source for each batch-1 gym by
 * matching CloseBot source.key === the gym's GHL location id (authoritative
 * from pit-inventory). Uses the proven endpoint GET /agency/source?page=N
 * (fields: sourceId, key, category, name). Surfaces stale/wrong inventory
 * source ids and name-confusion (e.g. Hamptons South vs West).
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_batch1_source_verify.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'batch1_source_verify.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };

const GYMS = {
  allinjujitsu: { ghlLoc: '7jz3trWsyu4R0zBlnCRI', invSrc: 'src_PQQCANSMZ8CS09UA', invName: 'All in Jiu-Jitsu' },
  bodegajj:     { ghlLoc: '0svdYcor6p7eXPqx7hVA', invSrc: 'src_GYUQQATOAUB6UFM3', invName: 'Bodega Jiu-Jitsu' },
  invertedgear: { ghlLoc: 'ajf9RVwQJUGwU900yGEq', invSrc: 'src_P6B5M60UZ6B3QDQR', invName: 'Inverted Gear Academy' },
  gritjiujitsu: { ghlLoc: 'JPFHqtf4KnkqVtiUU9Bk', invSrc: 'src_6MS3RHIRTR8OEKMO', invName: 'Grit Jiu-Jitsu' },
  hamptonsjj:   { ghlLoc: '7rOciO3DHa7ZfaXTZ0CC', invSrc: 'src_3HPZKL5NULBRLNLX', invName: 'Hamptons Jiu-Jitsu South' },
};

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  // /agency/source returns a rotating window; accumulate across many rounds
  // until every target GHL location key is found (or attempts exhausted).
  const wantKeys = new Set(Object.values(GYMS).map(g => g.ghlLoc));
  const byId = new Map();
  const foundKeys = () => new Set([...byId.values()].map(s => s.key));
  for (let round = 1; round <= 40; round++) {
    for (const p of [1, 2, 3]) {
      const r = await api(`/agency/source?page=${p}`);
      if (!r.ok) continue;
      for (const s of (r.json.results || r.json.data || [])) {
        const id = s.sourceId || s.id;
        if (id && !byId.has(id)) byId.set(id, s);
      }
    }
    const fk = foundKeys();
    const missing = [...wantKeys].filter(k => !fk.has(k));
    if (!missing.length) { W(`  all target keys found after round ${round} (${byId.size} unique sources)`); break; }
    if (round === 40) W(`  stopped after ${round} rounds; still missing keys: ${missing.join(', ')} (${byId.size} sources seen)`);
  }
  const sources = [...byId.values()];
  W(`Total unique sources collected: ${sources.length}\n`);
  fs.appendFileSync(out, '--- all sources ---\n' + sources.map(s => `${s.sourceId} key=${s.key} cat=${s.category} "${s.name}"`).join('\n') + '\n\n');

  let allClear = true;
  for (const [slug, g] of Object.entries(GYMS)) {
    W(`================ ${slug} ================`);
    W(`  authoritative GHL location: ${g.ghlLoc}`);
    W(`  inventory: ${g.invSrc} "${g.invName}"`);
    const byKey = sources.filter(s => s.key === g.ghlLoc);
    const nameHits = sources.filter(s => {
      const base = g.invName.toLowerCase().split(' ')[0];
      return (s.name || '').toLowerCase().includes(base);
    });
    if (byKey.length === 1) {
      const s = byKey[0];
      const idMatch = s.sourceId === g.invSrc;
      W(`  >> REAL SOURCE: ${s.sourceId}  "${s.name}"  category=${s.category}`);
      W(`  >> inventory id: ${idMatch ? 'MATCH ✓' : 'MISMATCH ✗ (inventory stale — use the REAL SOURCE above)'}`);
      W(`  >> category ${s.category === 'GHLS' ? 'GHLS ✓ (proper GHL source)' : s.category + ' (NOT GHLS — verify this is bookable)'}`);
      if (!idMatch || s.category !== 'GHLS') allClear = false;
    } else if (byKey.length === 0) {
      W(`  >> NO source key == ${g.ghlLoc}. Cannot confirm. name-similar: ${nameHits.map(s => `${s.sourceId}"${s.name}"key=${s.key}`).join(' | ') || 'none'}`);
      allClear = false;
    } else {
      W(`  >> MULTIPLE key matches: ${byKey.map(s => `${s.sourceId}"${s.name}"`).join(' | ')}`);
      allClear = false;
    }
    const confusion = nameHits.filter(s => s.key !== g.ghlLoc);
    if (confusion.length) W(`  >> name-confusion siblings (NOT this gym): ${confusion.map(s => `${s.sourceId}"${s.name}"`).join(' | ')}`);
    W('');
  }
  W(`================ SUMMARY ================`);
  W(allClear ? 'ALL 5 verified: real source id matches inventory and is GHLS.'
             : 'NOT all clear — at least one mismatch/non-GHLS. Use REAL SOURCE ids above, not the inventory.');
  W(`\nFull log: ${out}\nREAD-ONLY. No changes made.`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
