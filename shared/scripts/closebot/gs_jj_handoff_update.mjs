/**
 * gs_jj_handoff_update.mjs
 * Two fixes applied to all 19 live GS bots:
 *   1. "jiu-jitsu" / "jiu jitsu" → "Jiu-Jitsu" (any case, KDL-wide)
 *   2. Handoff instruction added to conversationReason:
 *      when bot can't answer from KB → apply 'alert' tag + tell lead team will follow up
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_jj_handoff_update.mjs [--execute]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'jj_handoff_update.log');
fs.writeFileSync(logFile, '');
const W = (s) => { console.log(s); fs.appendFileSync(logFile, s + '\n'); };

const EXECUTE = process.argv.includes('--execute');
if (!EXECUTE) W('DRY RUN — pass --execute to write.\n');

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }
const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };

async function api(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, {
    method, headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

const CANONICAL_TAGS = [
  { name: 'concierge',   approveDeny: true,  id: 'concierge' },
  { name: 'booked',      approveDeny: false, id: 'booked' },
  { name: 'member',      approveDeny: false, id: 'member' },
  { name: 'alumni',      approveDeny: false, id: 'alumni' },
  { name: 'spam',        approveDeny: false, id: 'spam' },
  { name: 'staff',       approveDeny: false, id: 'staff' },
  { name: 'service',     approveDeny: false, id: 'service' },
  { name: 'showed',      approveDeny: false, id: 'showed' },
  { name: 'alert',       approveDeny: false, id: 'alert' },
  { name: 'aggressive',  approveDeny: false, id: 'aggressive' },
];
const CANONICAL_CHANNELS = ['WhatsApp', 'GMB', 'Live_Chat', 'SMS', 'FB', 'IG'];

const BOTS = [
  { slug: 'vacaville',    id: 'bot_F0VNPTPCIW88YI3J', src: 'src_GDKORXSW4Q8RQUQ8' },
  { slug: '10p-miami',    id: 'bot_ZC2MREMJ87S77LH1', src: 'src_MXT2RCPXUZNTOP0S' },
  { slug: 'scottsdale',   id: 'bot_01MYV7I9IWMHYPCF', src: 'src_G95K8VC8HQTNWPGL' },
  { slug: 'edenprairie',  id: 'bot_20P7NZ6ZMRY37GC4', src: 'src_OJO9E23V1JJSRJLN' },
  { slug: 'ballantyne',   id: 'bot_SYX87T5XAAKPCUDE', src: 'src_5E8F1KTYKN51FWK5' },
  { slug: 'breathe',      id: 'bot_3TG2JEKB8YHKZ711', src: 'src_J4AHQWBOVA6ZXV0Y' },
  { slug: 'artistry',     id: 'bot_WPGXC5YR7VT13RVY', src: 'src_D87BKGBV6H9K4WRS' },
  { slug: 'grit',         id: 'bot_7H147LLL7WMR506K', src: 'src_6MS3RHIRTR8OEKMO' },
  { slug: 'champion',     id: 'bot_GEGYNE5WQNOYH7UB', src: 'src_EJODL02HM128RGZH' },
  { slug: 'centerline',   id: 'bot_F2IMVLSJ61TQ4R8X', src: 'src_QST1SHU18MPOOHEH' },
  { slug: 'ombjj',        id: 'bot_WKX9WYAUBNGC2RLO', src: 'src_VGIGZ52AQVQZKXS3' },
  { slug: 'sugoi',        id: 'bot_JNTG80QQ0CMJP35W', src: 'src_JPK476A1ODXA5YGB' },
  { slug: 'raylongo',     id: 'bot_78NZSL4KC3Q4HPDI', src: 'src_XM58ZT2N3E8A1UDT' },
  { slug: 'universalmma', id: 'bot_4EH6K792OEHGCAIB', src: 'src_4C7CIFW27LLW2TCH' },
  { slug: 'montgomery',   id: 'bot_96PAT3JCI2YC32KY', src: 'src_4VEFF108BZ7GDG4K' },
  { slug: 'signature',    id: 'bot_QDSOGLYJA9B4HIO0', src: 'src_HHSREAS1NVHJMDSR' },
  { slug: 'roberts',      id: 'bot_YUMT096UZ49BH7AV', src: 'src_E4ZQBA8ABFBDK5RM' },
  { slug: 'simpleman',    id: 'bot_97Q687NTPLF6GHC7', src: 'src_XZH7NHD2M8NF0EQL' },
  { slug: 'killerb',      id: 'bot_FMMFAFOFG7IG89XI', src: 'src_YJOFG6926ILNHH1R' },
];

const HANDOFF_INSTRUCTION = `\\n\\nIf a lead asks something not covered by the knowledge base or outside your scope: tell them "That's a great question — let me get the team to follow up with you on that." Then use @@[Update Tags] to add the 'alert' tag. Do not guess or fabricate an answer.`;

function fixJiuJitsu(kdl) {
  // Match all case variants: jiu-jitsu, jiu jitsu, jiujitsu, with or without hyphen/space
  return kdl.replace(/jiu[\s-]?jitsu/gi, 'Jiu-Jitsu');
}

function addHandoff(kdl) {
  // Find conversationReason "..." and append handoff instruction before the closing quote
  return kdl.replace(
    /(conversationReason\s+")([\s\S]*?)(")/,
    (match, open, body, close) => {
      if (body.includes('alert')) return match; // already has handoff
      return `${open}${body}${HANDOFF_INSTRUCTION}${close}`;
    }
  );
}

function dedupZIndex(kdl) {
  const lines = kdl.split('\n');
  const zSeen = new Set();
  let depth = 0;
  const out = [];
  for (const line of lines) {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (line.trim().startsWith('__zIndex')) {
      if (zSeen.has(depth)) continue;
      zSeen.add(depth);
    }
    out.push(line);
    const prev = depth;
    depth += opens - closes;
    if (closes > opens) {
      for (let d = depth; d <= prev; d++) zSeen.delete(d);
    }
  }
  return out.join('\n');
}

function bumpVersion(name) {
  const m = name.match(/v(\d+)\.(\d+)/);
  if (!m) return name + ' v1.1 [Jiu-Jitsu cap + handoff] (2026-05-22)';
  const newVer = `v${m[1]}.${parseInt(m[2]) + 1}`;
  const base = name.replace(/\s*\[.*\]\s*\(\d{4}-\d{2}-\d{2}\)/, '').replace(/v\d+\.\d+/, newVer).trim();
  return `${base} [Jiu-Jitsu cap + handoff] (2026-05-22)`;
}

(async () => {
  W(`=== GS Jiu-Jitsu + Handoff Update — ${new Date().toISOString()} ===\n`);
  const revert = {};
  const results = {};

  for (const g of BOTS) {
    W(`--- ${g.slug} ---`);

    // 1. Export current KDL
    const ex = await api('GET', `/bot/${g.id}/export`);
    if (!ex.ok) { W(`  SKIP: export failed ${ex.status}`); results[g.slug] = 'EXPORT_FAIL'; continue; }
    const oldKdl = ex.json.kdl || '';
    const oldName = ex.json.name || g.slug;

    // 2. Apply fixes
    let newKdl = fixJiuJitsu(oldKdl);
    newKdl = addHandoff(newKdl);
    newKdl = dedupZIndex(newKdl);

    const jjCount = (oldKdl.match(/jiu[\s-]?jitsu/gi) || []).length;
    const hasHandoffAlready = oldKdl.includes('alert') && oldKdl.includes('outside your scope');
    W(`  jiu-jitsu fixes: ${jjCount} | handoff already: ${hasHandoffAlready}`);

    if (!EXECUTE) { W('  [DRY] would PUT + publish'); results[g.slug] = 'DRY'; continue; }

    // 3. PUT updated KDL in place (Agent Node bots update via PUT, not POST /bot)
    const ur = await api('PUT', `/bot/${g.id}`, { importKdl: newKdl });
    if (!ur.ok) { W(`  FAIL PUT: ${ur.status} ${JSON.stringify(ur.json).slice(0,200)}`); results[g.slug] = 'PUT_FAIL'; continue; }
    W(`  PUT: ${ur.status}`);
    await new Promise(r => setTimeout(r, 1200));

    // 4. Publish
    const pr = await api('POST', `/bot/${g.id}/publish`, {});
    W(`  publish: ${pr.status}`);
    if (!pr.ok) { W(`  FAIL publish: ${JSON.stringify(pr.json).slice(0,200)}`); results[g.slug] = 'PUBLISH_FAIL'; continue; }
    await new Promise(r => setTimeout(r, 1200));

    // 5. Verify still attached to source
    const vr = await api('GET', `/bot/${g.id}`);
    const attached = (vr.json.sources || []).some(s => s.id === g.src);
    const verdict = attached ? 'PASS' : 'VERIFY_FAIL';
    W(`  verify on source: ${verdict}`);
    results[g.slug] = verdict;
    revert[g.slug] = { botId: g.id, src: g.src };

    await new Promise(r => setTimeout(r, 500));
  }

  W('\n=== RESULTS ===');
  for (const [slug, v] of Object.entries(results)) W(`  ${slug}: ${v}`);

  const passCount = Object.values(results).filter(v => v === 'PASS').length;
  W(`\n${passCount}/${BOTS.length} updated and live.`);
  W(`Log: ${logFile}`);

  if (EXECUTE) {
    const revertFile = path.join(logDir, 'jj_handoff_revert.json');
    fs.writeFileSync(revertFile, JSON.stringify(revert, null, 2));
    W(`Revert map: ${revertFile}`);
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
