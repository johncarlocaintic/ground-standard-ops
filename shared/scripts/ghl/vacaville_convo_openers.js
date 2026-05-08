/**
 * Pull first 100 GHL conversations for Vacaville Grappling Academy,
 * fetch messages for each, and report on how contacts opened the conversation.
 * Focus: inbound openers from contacts who inquired about booking.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const LOG = path.join(logDir, 'vacaville_convo_openers.log');
const REPORT = path.join(logDir, 'vacaville_convo_openers_report.json');
fs.writeFileSync(LOG, '');

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) {
  if (!process.env[k]) { log(`FATAL: missing env var ${k}`); process.exit(1); }
  return process.env[k];
}

const BASE = 'https://services.leadconnectorhq.com';
const TOKEN = getEnv('GHL_VACAVILLE_API_TOKEN');
const LOC = getEnv('GHL_VACAVILLE_LOCATION_ID');
const H = { 'Authorization': `Bearer ${TOKEN}`, 'Version': '2021-07-28', 'Accept': 'application/json' };

async function ghl(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: H });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  return { status: res.status, ok: res.ok, json };
}

async function getContactTags(contactId) {
  const r = await ghl(`/contacts/${contactId}`);
  if (!r.ok) return [];
  return r.json?.contact?.tags || [];
}

async function getMessages(conversationId) {
  const r = await ghl(`/conversations/${conversationId}/messages?limit=20`);
  if (!r.ok) return [];
  // GHL returns { messages: { messages: [...], nextPage, lastMessageId } }
  return r.json?.messages?.messages || r.json?.messages || r.json?.data || [];
}

async function main() {
  log(`=== Vacaville GHL Conversation Openers ===`);
  log(`Location: ${LOC}`);

  // Pull conversations — try search endpoint first, fall back to listing
  log('\n[1] Fetching conversations...');
  const r = await ghl(`/conversations/search?locationId=${LOC}&limit=100`);
  if (!r.ok) {
    log(`FAIL ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
    process.exit(1);
  }

  const conversations = r.json?.conversations || r.json?.data || r.json || [];
  log(`Got ${conversations.length} conversation(s).`);

  if (conversations.length === 0) {
    log('No conversations returned. Check token scope or location ID.');
    process.exit(0);
  }

  // Save raw for debugging
  fs.writeFileSync(path.join(logDir, 'vacaville_convos_raw.json'), JSON.stringify(r.json, null, 2));

  const report = [];
  let processed = 0;

  for (const convo of conversations) {
    const convoId = convo.id;
    const contactId = convo.contactId;
    const contactName = convo.contactName || convo.fullName || '(unknown)';
    const channel = convo.type || convo.channel || 'unknown';
    const lastMsg = convo.lastMessageBody || '';
    const lastMsgDate = convo.lastMessageDate || convo.updatedAt || '';

    // Get tags to flag booked contacts
    const tags = await getContactTags(contactId);
    const isBooked = tags.some(t => typeof t === 'string'
      ? t.toLowerCase().includes('book') || t.toLowerCase().includes('appointment')
      : (t.name || '').toLowerCase().includes('book') || (t.name || '').toLowerCase().includes('appointment')
    );

    // Fetch messages
    const messages = await getMessages(convoId);

    // Find the first inbound message from the contact
    // Exclude activity types (TYPE_ACTIVITY_*) — those are system events not real messages
    const inboundMessages = messages.filter(m => {
      const dir = (m.direction || '').toLowerCase();
      const msgType = (m.messageType || '');
      const isActivity = msgType.startsWith('TYPE_ACTIVITY') || msgType === 'TYPE_NOTE';
      return dir === 'inbound' && !isActivity;
    });

    // Sort by dateAdded ascending to get the actual opener
    inboundMessages.sort((a, b) => new Date(a.dateAdded || a.createdAt || 0) - new Date(b.dateAdded || b.createdAt || 0));

    const opener = inboundMessages[0];
    const openerText = opener?.body || opener?.message || opener?.text || '(no inbound message found)';
    const openerDate = opener?.dateAdded || opener?.createdAt || '';
    const openerChannel = opener?.type || opener?.channel || channel;

    report.push({
      contactName,
      contactId,
      convoId,
      channel,
      isBooked,
      tags: tags.map(t => typeof t === 'string' ? t : t.name),
      openerText,
      openerDate,
      openerChannel,
      totalMessages: messages.length,
      lastMsgDate,
    });

    processed++;
    if (processed % 10 === 0) log(`  Processed ${processed}/${conversations.length}...`);
  }

  // Save full report
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  log(`\nReport saved to ${REPORT}`);

  // Summary to console
  const booked = report.filter(c => c.isBooked);
  const hasOpener = report.filter(c => !c.openerText.includes('(no inbound message found)'));

  log(`\n=== SUMMARY ===`);
  log(`Total conversations: ${report.length}`);
  log(`With 'booked/appointment' tag: ${booked.length}`);
  log(`With recoverable opener: ${hasOpener.length}`);

  log(`\n=== ALL OPENERS (first inbound message per contact) ===`);
  for (const c of report) {
    const bookedFlag = c.isBooked ? '[BOOKED] ' : '';
    log(`\n${bookedFlag}${c.contactName} | ${c.channel} | ${c.openerDate}`);
    log(`  "${c.openerText.slice(0, 300)}"`);
    if (c.tags.length) log(`  tags: ${c.tags.join(', ')}`);
  }

  log(`\n=== BOOKED CONTACTS ONLY — OPENER BREAKDOWN ===`);
  if (booked.length === 0) {
    log('No contacts with booking tags found in this batch.');
  } else {
    for (const c of booked) {
      log(`\n${c.contactName} | ${c.channel} | ${c.openerDate}`);
      log(`  "${c.openerText.slice(0, 400)}"`);
      log(`  tags: ${c.tags.join(', ')}`);
    }
  }

  log('\n=== DONE ===');
}

main().catch(e => { log(`FATAL: ${e.message}`); console.error(e); process.exit(1); });
