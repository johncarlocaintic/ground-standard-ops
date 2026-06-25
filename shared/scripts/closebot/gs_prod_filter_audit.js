/**
 * READ-ONLY. For every bot, inspect each attached source. Flag bots on a
 * REAL GHL source (category GHLS) whose tag filter is empty or non-standard.
 *
 * Classification per GHLS attachment:
 *   OPEN     - no required tag AND no excludes  => bot answers everyone (bad if launched)
 *   NO-REQ   - has excludes but no required tag  => still open entry
 *   NO-AIOFF - has a required tag but missing the 'ai off' kill switch
 *   OK       - has a required tag AND excludes incl 'ai off'
 * Also prints channelList so channel scoping can be eyeballed.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_prod_filter_audit.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'prod_filter_audit.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 300) }; }
}

function classify(tagsArr) {
  const tags = tagsArr || [];
  const req = tags.filter(t => t.approveDeny === true).map(t => t.name);
  const exc = tags.filter(t => t.approveDeny === false).map(t => t.name);
  let verdict;
  if (!req.length && !exc.length) verdict = 'OPEN (no filter at all)';
  else if (!req.length) verdict = 'NO-REQ (no required trigger tag)';
  else if (!exc.some(e => /^ai off$/i.test(e))) verdict = "NO-AIOFF (missing 'ai off' kill switch)";
  else verdict = 'OK';
  return { req, exc, verdict };
}

(async () => {
  const list = await api('/bot');
  const bots = list.ok ? (list.json.bots || list.json.data || list.json) : [];
  if (!Array.isArray(bots)) { W('bad /bot shape'); return; }
  W(`Total bots: ${bots.length}\n`);

  const problems = [];
  for (const b of bots) {
    const id = b.id || b._id;
    const name = b.name || '(unnamed)';
    const d = await api(`/bot/${id}`);
    if (!d.ok) { W(`- ${name} [${id}] detail fail ${d.status}`); continue; }
    const srcs = (d.json.sources || []).filter(s => (s.category || '') === 'GHLS');
    if (!srcs.length) { await sleep(); continue; } // skip bots not on a real GHL source
    for (const s of srcs) {
      const { req, exc, verdict } = classify(s.tags);
      const line = `- ${name}\n    src: ${s.name} [${s.id}]  enabled=${s.enabled}\n` +
        `    channels: ${JSON.stringify(s.channelList ?? '(none)')}\n` +
        `    REQUIRED: [${req.join(', ')}]\n    EXCLUDED: [${exc.join(', ')}]\n    => ${verdict}`;
      W(line);
      if (verdict !== 'OK') problems.push({ name, src: s.name, sid: s.id, verdict, enabled: s.enabled });
    }
    await sleep();
  }

  W(`\n================ SUMMARY ================`);
  W(`Bots on a real GHL source with a NON-OK tag filter: ${problems.length}`);
  for (const p of problems) W(`  [${p.verdict}] ${p.name}  ->  ${p.src} [${p.sid}] enabled=${p.enabled}`);
  W(`\nNote: an OPEN filter on an unlaunched gym is expected (awaiting trigger`);
  W(`tag). An OPEN filter on a LAUNCHED bot (e.g. Vacaville) is the real bug.`);
  W(`\nFull log: ${out}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

function sleep() { return new Promise(r => setTimeout(r, 150)); }
