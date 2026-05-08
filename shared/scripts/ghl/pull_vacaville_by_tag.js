// Pulls Vacaville GHL conversations filtered to contacts tagged with behaviorally
// rich categories: requesting, hot, lost, booked.
// Output: clients/ground-standard/closebot/vacaville/transcripts_by_tag/<tag>/<name>__<convId>.md

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const baseOut = path.join(repoRoot, 'clients/ground-standard/closebot/vacaville/transcripts_by_tag');
const logDir = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(baseOut, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'ghl_vacaville_by_tag.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function getEnv(key) {
  const v = process.env[key];
  if (!v) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return v;
}

const BASE = 'https://services.leadconnectorhq.com';
const TOKEN = getEnv('GHL_VACAVILLE_API_TOKEN');
const LOCATION_ID = getEnv('GHL_VACAVILLE_LOCATION_ID');
const TARGET_TAGS = ['requesting', 'hot', 'lost', 'booked'];

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-04-15',
  Accept: 'application/json',
};
const HEADERS_V2 = { ...HEADERS, Version: '2021-07-28' };

async function GET(url, headers = HEADERS) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

function sanitizeFilename(s) {
  return (s || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
}

function formatTranscript(conv, messages, contact) {
  const lines = [];
  lines.push(`# Conversation — ${contact?.firstName || ''} ${contact?.lastName || ''}`.trim());
  lines.push('');
  lines.push(`- Conversation ID: ${conv.id}`);
  lines.push(`- Contact ID: ${conv.contactId}`);
  lines.push(`- Email: ${contact?.email || '—'}`);
  lines.push(`- Phone: ${contact?.phone || '—'}`);
  lines.push(`- Tags: ${(contact?.tags || []).join(', ') || '—'}`);
  lines.push(`- Last message: ${conv.lastMessageDate || '—'}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  const sorted = [...messages].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
  for (const m of sorted) {
    const direction = m.direction === 'inbound' ? 'LEAD' : 'TEAM';
    const source = m.source || m.messageType || '';
    const ts = m.dateAdded?.slice(0, 19).replace('T', ' ') || '';
    const body = (m.body || m.message || '').trim();
    lines.push(`**${direction}** [${ts}] (${source})`);
    lines.push('');
    lines.push(body || '_(empty)_');
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  log(`=== Vacaville tag-filtered pull: ${TARGET_TAGS.join(', ')} ===`);

  // Step 1: paginate all contacts, collect those with any target tag.
  const matched = []; // { contact, matchedTags:[] }
  let url = `${BASE}/contacts/?locationId=${LOCATION_ID}&limit=100`;
  let pages = 0, totalScanned = 0;
  while (url) {
    const r = await GET(url, HEADERS_V2);
    if (!r.ok) { log(`contacts fail ${r.status}: ${JSON.stringify(r.json).slice(0,200)}`); break; }
    const contacts = r.json?.contacts || [];
    totalScanned += contacts.length;
    for (const c of contacts) {
      const hits = (c.tags || []).filter(t => TARGET_TAGS.includes(t));
      if (hits.length) matched.push({ contact: c, matchedTags: hits });
    }
    url = r.json?.meta?.nextPageUrl;
    pages++;
    if (pages > 20) { log('safety cap'); break; }
  }
  log(`Scanned ${totalScanned} contacts, ${matched.length} matched target tags`);

  // Step 2: for each matched contact, find their conversation(s) + messages.
  let saved = 0, skippedNoConv = 0;
  for (const { contact, matchedTags } of matched) {
    const convRes = await GET(`${BASE}/conversations/search?locationId=${LOCATION_ID}&contactId=${contact.id}&limit=10`);
    const convs = convRes.json?.conversations || [];
    if (!convs.length) { skippedNoConv++; continue; }

    for (const conv of convs) {
      const msgsRes = await GET(`${BASE}/conversations/${conv.id}/messages`);
      if (!msgsRes.ok) continue;
      const messages = msgsRes.json?.messages?.messages || msgsRes.json?.messages || [];
      if (!messages.length) continue;

      // Save one copy per matched tag folder (so you can browse by behavior category).
      const nameBits = [contact.firstName, contact.lastName].filter(Boolean).join('_');
      const fname = `${sanitizeFilename(nameBits || 'unknown')}__${conv.id}.md`;
      const transcript = formatTranscript(conv, messages, contact);
      for (const tag of matchedTags) {
        const tagDir = path.join(baseOut, sanitizeFilename(tag));
        fs.mkdirSync(tagDir, { recursive: true });
        fs.writeFileSync(path.join(tagDir, fname), transcript);
      }
      saved++;
      if (saved % 20 === 0) log(`  Saved ${saved} transcripts...`);
    }
  }
  log(`\n=== Done. ${saved} transcripts written (${skippedNoConv} contacts had no conversations) ===`);
  log(`Output: ${baseOut}`);
}

main().catch(err => { log(`FATAL: ${err.stack || err.message}`); process.exit(1); });
