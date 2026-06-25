/**
 * READ-ONLY CloseBot-side proof. Two questions:
 *  1. Is the Vacaville prod bot's source attachment even scoped to the
 *     Facebook channel? If not, CB categorically could not send the FB reply.
 *  2. Does CloseBot have ANY lead/conversation log for this contact, matched
 *     by email + phone (not the name match I tried before)? If CB has no
 *     log, the bot never produced that pricing message.
 *
 * Contact (from GHL): Ivan D. Dios, allandedios.ad@gmail.com, +17075679233,
 * GHL contactId czYZJCZ5FkzxzpDoKgfw.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_cb_ivan_verify.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'cb_ivan_verify.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

const key = process.env.CB_GS_API_KEY;
if (!key) { console.error('FATAL: missing CB_GS_API_KEY'); process.exit(1); }

const BOT = 'bot_F0VNPTPCIW88YI3J';
const PROD_SRC = 'src_GDKORXSW4Q8RQUQ8';
const EMAIL = 'allandedios.ad@gmail.com';
const PHONE_DIGITS = '7075679233';
const GHL_CONTACT = 'czYZJCZ5FkzxzpDoKgfw';

async function api(ep) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    headers: { 'X-CB-KEY': key, 'Content-Type': 'application/json' },
  });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; }
  catch { return { status: r.status, ok: r.ok, raw: t.slice(0, 400) }; }
}
const norm = (s) => (s || '').toString().replace(/\D/g, '');

(async () => {
  // 1. Bot-source channel scoping
  W('=== 1. Vacaville bot source/channel scoping ===');
  const b = await api(`/bot/${BOT}`);
  if (b.ok) {
    const srcs = b.json.sources || [];
    fs.appendFileSync(out, '\n--- bot.sources raw ---\n' + JSON.stringify(srcs, null, 2) + '\n');
    for (const s of srcs) {
      const sid = s.id || s.sourceId || s;
      W(`  source ${sid}${sid === PROD_SRC ? ' (PROD)' : ''}`);
      W(`    channels: ${JSON.stringify(s.channels ?? s.channel ?? '(field absent)')}`);
      W(`    tags:     ${JSON.stringify(s.tags ?? '(field absent)')}`);
      W(`    enabled:  ${JSON.stringify(s.enabled ?? s.input?.enabled ?? '(field absent)')}`);
    }
    W('  NOTE: if Facebook/Messenger is not in the prod source channels,');
    W('  the CloseBot could not have sent the TYPE_FACEBOOK pricing reply.');
  } else W(`  GET /bot failed ${b.status}`);

  // 2. CloseBot lead log for this contact, by email/phone, account-wide
  W('\n=== 2. CloseBot lead/conversation log for this contact ===');
  let hit = null, scanned = 0;
  for (let p = 1; p <= 30 && !hit; p++) {
    const r = await api(`/lead?page=${p}&pageSize=100`);
    const list = r.ok ? (r.json.results || r.json.leads || r.json.data || []) : [];
    if (!Array.isArray(list) || list.length === 0) break;
    scanned += list.length;
    hit = list.find(l => {
      const em = (l.email || l.contact?.email || '').toLowerCase();
      const ph = norm(l.phone || l.contact?.phone);
      const gid = l.contactId || l.ghlContactId || l.contact?.id || '';
      return em === EMAIL || (ph && ph.endsWith(PHONE_DIGITS)) || gid === GHL_CONTACT;
    });
  }
  W(`  scanned ${scanned} CloseBot leads (account-wide, by email/phone/ghlContactId)`);
  if (!hit) {
    W('  RESULT: NO CloseBot lead exists for this contact.');
    W('  => CloseBot has no conversation log for Ivan D. Dios at all.');
    W('  => The FB pricing reply did not come from this bot (no CB record of it).');
    W(`\nLog: ${out}`);
    return;
  }

  W(`  RESULT: CloseBot lead FOUND: id=${hit.id} name="${hit.firstName || ''} ${hit.lastName || hit.name || ''}" src=${hit.source?.name || hit.sourceId || '?'}`);
  const d = await api(`/lead/${hit.id}`);
  fs.appendFileSync(out, '\n--- CB lead raw ---\n' + JSON.stringify(d.json, null, 2) + '\n');
  const msgs = d.json?.messages || d.json?.conversation || d.json?.transcript || d.json?.history || [];
  W(`\n  === CB conversation log (${Array.isArray(msgs) ? msgs.length : 0} msgs) ===`);
  if (Array.isArray(msgs)) for (const m of msgs) {
    const who = m.role || m.direction || m.from || m.sender || '?';
    const txt = (m.text || m.body || m.message || m.content || '').toString().replace(/\s+/g, ' ').trim();
    W(`  [${who}] ${txt}`);
  }
  W('\n  If a $153/$180 line appears above, the bot DID send it. If not,');
  W('  the CB log does not contain the pricing message.');
  W(`\nLog: ${out}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
