/**
 * LIVE PROD WRITE (single, reversible). Restore the Vacaville prod source
 * tag filter + channel scoping on bot_F0VNPTPCIW88YI3J / src_GDKORXSW4Q8RQUQ8.
 *
 * Mirrors the proven gs_deploy_vacaville_v4_6_prod_launch.js attach shape:
 *   POST /bot/{id}/source/{srcId}  body { tags, channels }
 *
 * Steps: capture full pre-state -> write -> read-back verify. If the write
 * call errors, immediately restore the captured pre-state. Pre-state is also
 * written to disk so a human can revert with one call at any time.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_vacaville_restore_filter.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'vacaville_restore_filter.log');
const revertFile = path.join(logDir, 'vacaville_filter_PRESTATE_revert.json');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BASE = 'https://api.closebot.com';
const H = { 'X-CB-KEY': key, 'Content-Type': 'application/json' };
const BOT = 'bot_F0VNPTPCIW88YI3J';
const SRC = 'src_GDKORXSW4Q8RQUQ8';

const TAGS = [
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
// source canonical channel ids: WhatsApp,GMB,Live_Chat,SMS,Email,FB,IG,Custom
// include all EXCEPT Email, Custom, and the dedicated CloseBot widget channel
const CHANNELS = ['WhatsApp', 'GMB', 'Live_Chat', 'SMS', 'FB', 'IG'];

async function api(method, ep, body) {
  const r = await fetch(`${BASE}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}
const tagsOf = (s) => {
  const tg = s.tags || [];
  return { req: tg.filter(t => t.approveDeny === true).map(t => t.name),
           exc: tg.filter(t => t.approveDeny === false).map(t => t.name) };
};

(async () => {
  W('=== Vacaville prod filter restore ===');
  W(`bot=${BOT} src=${SRC}\n`);

  // 1. capture pre-state
  const pre = await api('GET', `/bot/${BOT}`);
  if (!pre.ok) { W(`FATAL: GET /bot failed ${pre.status}`); process.exit(1); }
  const preSrc = (pre.json.sources || []).find(s => s.id === SRC);
  if (!preSrc) { W('FATAL: bot not attached to prod source; aborting (manual check needed)'); process.exit(1); }
  fs.writeFileSync(revertFile, JSON.stringify(preSrc, null, 2));
  const p = tagsOf(preSrc);
  W('PRE-STATE (saved to ' + revertFile + '):');
  W(`  REQUIRED: [${p.req.join(', ')}]`);
  W(`  EXCLUDED: [${p.exc.join(', ')}]`);
  W(`  channelList: ${JSON.stringify(preSrc.channelList ?? '(none)')}`);
  W(`  personaNameOverride: ${JSON.stringify(preSrc.personaNameOverride ?? null)}  enabled: ${preSrc.enabled}`);

  const revertBody = {
    tags: (preSrc.tags || []),
    channels: (preSrc.channelList || []),
    personaNameOverride: preSrc.personaNameOverride ?? null,
    enabled: preSrc.enabled ?? true,
  };

  // 2. write
  W('\nWRITING new filter...');
  W(`  REQUIRED: [concierge]`);
  W(`  EXCLUDED: [${TAGS.filter(t => !t.approveDeny).map(t => t.name).join(', ')}]`);
  W(`  channels: [${CHANNELS.join(', ')}]  (Email, Custom, widget excluded)`);
  const body = { tags: TAGS, channels: CHANNELS, personaNameOverride: preSrc.personaNameOverride ?? null, enabled: true };
  const wr = await api('POST', `/bot/${BOT}/source/${SRC}`, body);
  W(`  POST -> ${wr.status}`);
  if (!wr.ok) {
    W('  WRITE FAILED. Restoring pre-state...');
    const rb = await api('POST', `/bot/${BOT}/source/${SRC}`, revertBody);
    W(`  restore -> ${rb.status}  (pre-state also in ${revertFile})`);
    W('  ABORTED, no net change intended. Inspect: ' + JSON.stringify(wr.json).slice(0, 300));
    process.exit(1);
  }

  // 3. read-back verify
  await new Promise(r => setTimeout(r, 1200));
  const post = await api('GET', `/bot/${BOT}`);
  const postSrc = (post.json.sources || []).find(s => s.id === SRC);
  if (!postSrc) { W('\nVERIFY: source entry missing post-write. Manual check + revert needed.'); process.exit(1); }
  fs.appendFileSync(out, '\n--- POST-STATE raw ---\n' + JSON.stringify(postSrc, null, 2) + '\n');
  const q = tagsOf(postSrc);
  W('\nPOST-STATE:');
  W(`  REQUIRED: [${q.req.join(', ')}]`);
  W(`  EXCLUDED: [${q.exc.join(', ')}]`);
  W(`  channelList: ${JSON.stringify(postSrc.channelList ?? '(none)')}`);

  const reqOK = q.req.length === 1 && q.req[0] === 'concierge';
  const excOK = ['booked','member','alumni','spam','staff','service','showed','alert','aggressive'].every(x => q.exc.includes(x));
  const chArr = postSrc.channelList || [];
  const chNoBad = !chArr.some(c => /email|custom|widget/i.test(c));
  const verdict = reqOK && excOK ? 'PASS (tags)' : 'FAIL (tags)';
  W(`\n=== ${verdict} ===`);
  W(`  required==concierge: ${reqOK}`);
  W(`  all 9 excludes present: ${excOK}`);
  W(`  channelList free of Email/Custom/widget: ${chNoBad}  -> ${JSON.stringify(chArr)}`);
  W(`\n  Revert anytime: re-POST contents of ${revertFile} to /bot/${BOT}/source/${SRC}`);
  if (!reqOK || !excOK) { W('\n  TAG VERIFY FAILED — review before trusting; pre-state saved for revert.'); process.exit(1); }
  W('\nDone. Tag filter restored. Eyeball channelList above.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
