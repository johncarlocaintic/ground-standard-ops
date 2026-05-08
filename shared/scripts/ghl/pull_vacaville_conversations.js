// Pulls full threaded conversations from Bobby's Vacaville Grappling Academy
// GHL sub-account and saves them as readable transcripts for study.
//
// REQUIRES:
//   GHL_VACAVILLE_API_TOKEN  (Private Integration Token from Vacaville sub-account)
//   GHL_VACAVILLE_LOCATION_ID
//
// Run from repo root:
//   node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/ghl/pull_vacaville_conversations.js
//
// Output:
//   clients/ground-standard/closebot/vacaville/transcripts/<contactName>__<conversationId>.md

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const outDir = path.join(repoRoot, 'clients/ground-standard/closebot/vacaville/transcripts');
const logDir = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'ghl_vacaville_pull.log');
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
const PULL_LIMIT = parseInt(process.env.PULL_LIMIT || '0', 10);

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-04-15',
  Accept: 'application/json',
};

async function GET(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS });
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
  lines.push(`- Unread: ${conv.unreadCount || 0}`);
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
  log(`=== Vacaville GHL conversation pull (location ${LOCATION_ID}) ===`);

  // Step 1: search all conversations in the location.
  // GHL caps per-page at 100; paginate via startAfter if more than 100.
  let allConvos = [];
  let page = 1;
  let startAfter;
  while (true) {
    const qs = new URLSearchParams({ locationId: LOCATION_ID, limit: '100' });
    if (startAfter) qs.set('startAfter', startAfter);
    const r = await GET(`/conversations/search?${qs.toString()}`);
    if (!r.ok) { log(`FAIL page ${page}: ${r.status} ${JSON.stringify(r.json).slice(0,200)}`); break; }
    const convos = r.json?.conversations || [];
    allConvos = allConvos.concat(convos);
    log(`Page ${page}: ${convos.length} conversations (total so far ${allConvos.length})`);
    if (convos.length < 100) break;
    if (PULL_LIMIT && allConvos.length >= PULL_LIMIT) break;
    startAfter = convos[convos.length - 1].lastMessageDate;
    page++;
    if (page > 50) { log('Safety cap — 50 pages'); break; }
  }
  if (PULL_LIMIT && allConvos.length > PULL_LIMIT) allConvos = allConvos.slice(0, PULL_LIMIT);
  log(`\nTotal conversations found: ${allConvos.length}`);

  // Step 2: for each, pull all messages + contact detail.
  let saved = 0;
  for (const conv of allConvos) {
    const msgsRes = await GET(`/conversations/${conv.id}/messages`);
    if (!msgsRes.ok) { log(`  SKIP ${conv.id} — messages ${msgsRes.status}`); continue; }
    const messages = msgsRes.json?.messages?.messages || msgsRes.json?.messages || [];

    let contact = null;
    if (conv.contactId) {
      const cRes = await GET(`/contacts/${conv.contactId}`);
      if (cRes.ok) contact = cRes.json?.contact || cRes.json;
    }

    const nameBits = [contact?.firstName, contact?.lastName].filter(Boolean).join('_');
    const fname = `${sanitizeFilename(nameBits || 'unknown')}__${conv.id}.md`;
    const transcript = formatTranscript(conv, messages, contact);
    fs.writeFileSync(path.join(outDir, fname), transcript);
    saved++;
    if (saved % 10 === 0) log(`  Saved ${saved}/${allConvos.length}...`);
  }

  log(`\n=== Done. ${saved} transcripts written to ${outDir} ===`);
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
