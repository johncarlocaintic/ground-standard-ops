/**
 * READ-ONLY GHL probe. Question: who actually replied with pricing to
 * "Ivan D. Dios" - the CloseBot, or a human staff member in the GHL inbox.
 *
 * Finds the contact in the Vacaville sub-account, pulls the conversation,
 * and prints every message with its direction + attribution (source,
 * userId, messageType). Human inbox replies carry a real userId / source
 * "manual"; CloseBot replies come via app/api with no human userId.
 *
 * Run: node --env-file=.env --env-file=clients/ground-standard/.env \
 *        shared/scripts/closebot/gs_ghl_ivan_check.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const out = path.join(logDir, 'ghl_ivan_check.log');
fs.writeFileSync(out, '');
const W = (s) => { console.log(s); fs.appendFileSync(out, s + '\n'); };

function getEnv(k) { const v = process.env[k]; if (!v) { console.error('FATAL: missing ' + k); process.exit(1); } return v; }
const TOKEN = getEnv('GHL_VACAVILLE_API_TOKEN');
const LOC = getEnv('GHL_VACAVILLE_LOCATION_ID');
const GHL = 'https://services.leadconnectorhq.com';
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/json' };
const PRICE_RX = /\$\s?\d|\b\d{2,4}\s?(usd|dollars?|month|mo)\b|\b(price|pricing|cost|fee|tuition|per month|monthly|drop[- ]?in)\b/i;

async function req(method, ep, body) {
  const r = await fetch(`${GHL}${ep}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json: j };
}

(async () => {
  W(`Vacaville loc=${LOC}`);

  // 1. find contact
  let contacts = [];
  const s = await req('POST', '/contacts/search', { locationId: LOC, query: 'Dios', pageLimit: 20 });
  if (s.ok) contacts = s.json.contacts || [];
  if (!contacts.length) {
    const s2 = await req('GET', `/contacts/?locationId=${LOC}&query=Ivan&limit=20`);
    if (s2.ok) contacts = s2.json.contacts || [];
  }
  W(`\n=== contact matches (${contacts.length}) ===`);
  const cand = contacts.filter(c => /ivan|dios/i.test(`${c.firstName || ''} ${c.lastName || ''} ${c.contactName || ''} ${c.email || ''}`));
  (cand.length ? cand : contacts).slice(0, 10).forEach(c =>
    W(`  ${c.firstName || ''} ${c.lastName || ''} | ${c.email || ''} | ${c.phone || ''} | id=${c.id}`));
  const contact = cand[0] || contacts[0];
  if (!contact) { W('\nNo contact found for Ivan / Dios in Vacaville. Give the GHL contact id directly.'); return; }

  W(`\nUsing contact id=${contact.id} (${contact.firstName || ''} ${contact.lastName || ''})`);
  fs.appendFileSync(out, '\n--- contact raw ---\n' + JSON.stringify(contact, null, 2) + '\n');
  // scan contact custom fields for an injected price
  const cfBlob = JSON.stringify(contact.customFields || contact.customField || []);
  W(`contact customFields price signal: ${PRICE_RX.test(cfBlob) ? 'YES -> ' + cfBlob.slice(0, 300) : 'none'}`);

  // 2. conversations for contact
  const cv = await req('GET', `/conversations/search?locationId=${LOC}&contactId=${contact.id}`);
  const convs = cv.ok ? (cv.json.conversations || []) : [];
  W(`\n=== conversations (${convs.length}) ===`);
  if (!convs.length) { W('  none; raw: ' + JSON.stringify(cv.json).slice(0, 300)); return; }
  for (const c of convs) W(`  conv id=${c.id} lastMsg="${(c.lastMessageBody || '').slice(0, 60)}"`);

  // 3. messages per conversation, with attribution
  for (const c of convs) {
    W(`\n=== messages for conv ${c.id} ===`);
    const m = await req('GET', `/conversations/${c.id}/messages`);
    const msgs = m.ok ? (m.json.messages?.messages || m.json.messages || []) : [];
    fs.appendFileSync(out, `\n--- raw messages ${c.id} ---\n` + JSON.stringify(m.json, null, 2) + '\n');
    if (!Array.isArray(msgs) || !msgs.length) { W('  none / shape: ' + JSON.stringify(m.json).slice(0, 300)); continue; }
    for (const x of msgs.slice().reverse()) {
      const dir = x.direction || '?';
      const body = (x.body || x.message || '').toString().replace(/\s+/g, ' ').trim();
      const who = dir === 'inbound' ? 'CONTACT'
        : x.userId ? `HUMAN(userId=${x.userId})`
        : `OUTBOUND(source=${x.source || '?'} type=${x.messageType || x.type || '?'})`;
      const flag = PRICE_RX.test(body) ? '  <<< PRICE' : '';
      W(`[${who}] ${body}${flag}`);
    }
  }
  W(`\nFull raw in: ${out}`);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
