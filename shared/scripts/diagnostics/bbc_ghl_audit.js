// Bikini Bootcamp / Amansala — read-only GHL audit.
// Pulls every read-side API surface relevant to the client's stated pain
// (booking workflow, inbox state, contact list anatomy, tags, custom fields)
// and writes both raw JSON dumps and a synthesized markdown report.
//
// Run:  node --env-file=.env --env-file=clients/bikini-bootcamp/.env shared/scripts/diagnostics/bbc_ghl_audit.js
// Output:
//   clients/bikini-bootcamp/ghl/raw/*.json   raw responses (one file per endpoint)
//   clients/bikini-bootcamp/ghl/ghl-audit-YYYY-MM-DD.md   synthesized report

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const clientDir = path.join(repoRoot, 'clients/bikini-bootcamp');
const outDir = path.join(clientDir, 'ghl');
const rawDir = path.join(outDir, 'raw');
const logDir = path.join(repoRoot, 'shared/logs');
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const reportPath = path.join(outDir, `ghl-audit-${today}.md`);
const logFile = path.join(logDir, 'bbc_ghl_audit.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

const TOKEN = process.env.GHL_BBC_API_TOKEN;
const LOC = process.env.GHL_BBC_LOCATION_ID;
if (!TOKEN || !LOC) {
  log('FATAL: GHL_BBC_API_TOKEN or GHL_BBC_LOCATION_ID missing');
  process.exit(1);
}

const BASE = 'https://services.leadconnectorhq.com';
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Version: '2021-07-28',
  Accept: 'application/json',
};

async function ghlGet(pathAndQuery) {
  const res = await fetch(`${BASE}${pathAndQuery}`, { headers: HEADERS });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 500) }; }
  return { ok: res.ok, status: res.status, body };
}

async function ghlPost(pathOnly, payload) {
  const res = await fetch(`${BASE}${pathOnly}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 500) }; }
  return { ok: res.ok, status: res.status, body };
}

function dumpRaw(name, data) {
  fs.writeFileSync(path.join(rawDir, `${name}.json`), JSON.stringify(data, null, 2));
}

// ---- pulls ----

async function pullLocation() {
  log('pull: location');
  const r = await ghlGet(`/locations/${LOC}`);
  dumpRaw('location', r);
  return r;
}

async function pullAllContacts() {
  log('pull: contacts (full, search endpoint)');
  const all = [];
  let searchAfter = null;
  let page = 0;
  const PAGE_LIMIT = 100;
  while (true) {
    page += 1;
    const payload = {
      locationId: LOC,
      pageLimit: PAGE_LIMIT,
    };
    if (searchAfter) payload.searchAfter = searchAfter;
    const r = await ghlPost('/contacts/search', payload);
    if (!r.ok) {
      log(`  page ${page} HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 300)}`);
      break;
    }
    const contacts = r.body.contacts || [];
    all.push(...contacts);
    log(`  page ${page}: +${contacts.length} (total ${all.length} of ${r.body.total ?? '?'})`);
    if (contacts.length < PAGE_LIMIT) break;
    const last = contacts[contacts.length - 1];
    searchAfter = last.searchAfter || last.sortBy;
    if (!searchAfter) {
      log('  no searchAfter cursor on last contact; stopping pagination');
      break;
    }
    if (page > 200) {
      log('  pagination safety cap (200 pages) hit; stopping');
      break;
    }
  }
  dumpRaw('contacts_full', { count: all.length, contacts: all });
  return all;
}

async function pullTags() {
  log('pull: tags');
  const r = await ghlGet(`/locations/${LOC}/tags`);
  dumpRaw('tags', r);
  return r;
}

async function pullCustomFields() {
  log('pull: custom fields');
  const r = await ghlGet(`/locations/${LOC}/customFields`);
  dumpRaw('custom_fields', r);
  return r;
}

async function pullCustomValues() {
  log('pull: custom values');
  const r = await ghlGet(`/locations/${LOC}/customValues`);
  dumpRaw('custom_values', r);
  return r;
}

async function pullPipelines() {
  log('pull: pipelines');
  const r = await ghlGet(`/opportunities/pipelines?locationId=${LOC}`);
  dumpRaw('pipelines', r);
  return r;
}

async function pullWorkflows() {
  log('pull: workflows');
  const r = await ghlGet(`/workflows/?locationId=${LOC}`);
  dumpRaw('workflows', r);
  return r;
}

async function pullCalendars() {
  log('pull: calendars');
  const r = await ghlGet(`/calendars/?locationId=${LOC}`);
  dumpRaw('calendars', r);
  return r;
}

async function pullConversations() {
  log('pull: conversations (recent sample)');
  const r = await ghlGet(`/conversations/search?locationId=${LOC}&limit=100`);
  dumpRaw('conversations_sample', r);
  return r;
}

async function pullUsers() {
  log('pull: users');
  const r = await ghlGet(`/users/?locationId=${LOC}`);
  dumpRaw('users', r);
  return r;
}

// ---- analysis helpers ----

function tally(arr, fn) {
  const m = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (k == null) continue;
    const keys = Array.isArray(k) ? k : [k];
    for (const kk of keys) m.set(kk, (m.get(kk) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function fmtTable(rows, headers) {
  const lines = [];
  lines.push(`| ${headers.join(' | ')} |`);
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  for (const r of rows) lines.push(`| ${r.map(c => String(c ?? '')).join(' | ')} |`);
  return lines.join('\n');
}

// ---- main ----

async function main() {
  log('=== Bikini Bootcamp GHL Audit ===');
  log(`Location: ${LOC}`);

  const loc = await pullLocation();
  const contacts = await pullAllContacts();
  const tags = await pullTags();
  const customFields = await pullCustomFields();
  const customValues = await pullCustomValues();
  const pipelines = await pullPipelines();
  const workflows = await pullWorkflows();
  const calendars = await pullCalendars();
  const conversations = await pullConversations();
  const users = await pullUsers();

  // ---- analyze contacts ----
  const sourceTally = tally(contacts, c => c.source || '(no source)');
  const tagTally = tally(contacts, c => (c.tags && c.tags.length ? c.tags : ['(no tags)']));
  const typeTally = tally(contacts, c => c.type || '(no type)');
  const hasEmail = contacts.filter(c => c.email).length;
  const hasPhone = contacts.filter(c => c.phone).length;
  const hasName = contacts.filter(c => c.firstName || c.lastName).length;

  // duplicate detection by email
  const emailMap = new Map();
  for (const c of contacts) {
    if (!c.email) continue;
    const k = c.email.toLowerCase().trim();
    if (!emailMap.has(k)) emailMap.set(k, []);
    emailMap.get(k).push(c.id);
  }
  const dupEmails = [...emailMap.entries()].filter(([, ids]) => ids.length > 1);

  // contacts created over time (last 12 months bucket by year-month)
  const monthTally = new Map();
  for (const c of contacts) {
    const dt = c.dateAdded || c.createdAt || c.dateCreated;
    if (!dt) continue;
    const ym = String(dt).slice(0, 7);
    monthTally.set(ym, (monthTally.get(ym) || 0) + 1);
  }
  const monthRows = [...monthTally.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // suspected bot spam: Latin-script names / unusual character composition
  const looksLikeBotSpam = c => {
    const fn = (c.firstName || '') + ' ' + (c.lastName || '');
    if (!fn.trim()) return false;
    const nonLatin = /[^\x00-\x7F]/.test(fn);
    const tooLong = fn.length > 60;
    const allCaps = fn === fn.toUpperCase() && fn.length > 4;
    return nonLatin || tooLong || allCaps;
  };
  const suspectBots = contacts.filter(looksLikeBotSpam).length;

  // ---- analyze workflows ----
  const wfList = workflows.body?.workflows || [];
  const wfStatus = tally(wfList, w => w.status || '(unknown)');

  // ---- analyze pipelines ----
  const pipeList = pipelines.body?.pipelines || [];

  // ---- analyze tags ----
  const tagsList = tags.body?.tags || [];

  // ---- analyze custom fields ----
  const cfList = customFields.body?.customFields || [];

  // populated-field rate (only fields used in contacts.customFields[])
  const cfUsage = new Map();
  for (const c of contacts) {
    if (!Array.isArray(c.customFields)) continue;
    for (const f of c.customFields) {
      if (f.value === undefined || f.value === null || f.value === '') continue;
      cfUsage.set(f.id, (cfUsage.get(f.id) || 0) + 1);
    }
  }
  const cfWithUsage = cfList.map(f => ({
    name: f.name,
    fieldKey: f.fieldKey,
    type: f.dataType,
    populated: cfUsage.get(f.id) || 0,
  })).sort((a, b) => b.populated - a.populated);

  // ---- analyze conversations ----
  const convs = conversations.body?.conversations || [];
  const convChannels = tally(convs, c => c.lastMessageType || c.type || '(unknown)');
  const unread = convs.filter(c => c.unreadCount > 0).length;

  // ---- analyze calendars ----
  const calList = calendars.body?.calendars || [];

  // ---- analyze users ----
  const userList = users.body?.users || [];

  // ---- write report ----

  const md = [];
  md.push(`# Bikini Bootcamp / Amansala — GHL Audit (${today})`);
  md.push('');
  md.push(`**Sub-account:** ${loc.body?.location?.name || '(unknown)'} (\`${LOC}\`)`);
  md.push(`**Timezone:** ${loc.body?.location?.timezone || '(unknown)'}`);
  md.push(`**Audit run by:** Idriss, ${new Date().toISOString()}`);
  md.push('');
  md.push('Read-only audit. No mutations performed. Raw JSON dumps in `clients/bikini-bootcamp/ghl/raw/`.');
  md.push('');
  md.push('---');
  md.push('');

  // executive summary placeholder (will fill post-data)
  md.push('## At a Glance');
  md.push('');
  md.push(fmtTable([
    ['Total contacts', contacts.length],
    ['Contacts with email', `${hasEmail} (${pct(hasEmail, contacts.length)})`],
    ['Contacts with phone', `${hasPhone} (${pct(hasPhone, contacts.length)})`],
    ['Contacts with name', `${hasName} (${pct(hasName, contacts.length)})`],
    ['Suspected bot/spam contacts', `${suspectBots} (${pct(suspectBots, contacts.length)})`],
    ['Duplicate email groups', dupEmails.length],
    ['Workflows', wfList.length],
    ['Pipelines', pipeList.length],
    ['Calendars', calList.length],
    ['Tags defined', tagsList.length],
    ['Custom fields defined', cfList.length],
    ['Conversations (recent sample)', convs.length],
    ['Conversations with unread', unread],
    ['Users on sub-account', userList.length],
  ], ['Metric', 'Value']));
  md.push('');
  md.push('---');
  md.push('');

  // ---- Cross-reference vs. her stated pain ----
  md.push('## Cross-Reference vs. Stated Pain Points');
  md.push('');
  md.push('| Pain (from discovery call) | What the data says |');
  md.push('|---|---|');
  md.push(`| GHL inbox impossible to triage; can\'t tell real leads from bounce-backs | Recent conversations sample: ${convs.length}, of which ${unread} have unread messages. Channel mix: ${convChannels.slice(0,3).map(([k,v]) => `${k}=${v}`).join(', ') || '(none)'}. See Conversations section. |`);
  md.push(`| Past guest list sitting unused | ${contacts.length} total contacts, ${hasEmail} with email (${pct(hasEmail, contacts.length)}). Source breakdown shows where each entry came from (see Contact Anatomy). Suspected bot spam: ${suspectBots}. |`);
  md.push(`| Half-built GHL booking workflow that they abandoned | ${wfList.length} workflows total, status mix: ${wfStatus.map(([k,v]) => `${k}=${v}`).join(', ') || 'none'}. See Workflows section to identify the booking-call flow. |`);
  md.push('| Lead forms got bot-attacked (Latin-script spam) | Suspected bot/spam by name pattern: ' + suspectBots + ' contacts. See Contact Anatomy for full source breakdown. |');
  md.push('');
  md.push('---');
  md.push('');

  // ---- Contact anatomy ----
  md.push('## Contact List Anatomy (the big one)');
  md.push('');
  md.push(`Total contacts: **${contacts.length}**.`);
  md.push('');
  md.push('### By source field');
  md.push('');
  md.push(fmtTable(sourceTally.slice(0, 20), ['Source', 'Count']));
  md.push('');
  if (sourceTally.length > 20) md.push(`_(${sourceTally.length - 20} more sources truncated, see raw/contacts_full.json)_`);
  md.push('');
  md.push('### By type');
  md.push('');
  md.push(fmtTable(typeTally, ['Type', 'Count']));
  md.push('');
  md.push('### By tag (top 30)');
  md.push('');
  md.push(fmtTable(tagTally.slice(0, 30), ['Tag', 'Contacts']));
  md.push('');
  md.push('### Created over time (year-month)');
  md.push('');
  md.push(fmtTable(monthRows, ['Year-Month', 'New contacts']));
  md.push('');
  md.push('### Duplicate emails');
  md.push('');
  md.push(`Found **${dupEmails.length}** email addresses associated with more than one contact ID.`);
  if (dupEmails.length > 0) {
    md.push('');
    md.push('Top 10 most-duplicated emails:');
    md.push('');
    md.push(fmtTable(
      dupEmails.sort((a, b) => b[1].length - a[1].length).slice(0, 10).map(([email, ids]) => [email, ids.length]),
      ['Email', 'Contact IDs']
    ));
  }
  md.push('');
  md.push('---');
  md.push('');

  // ---- Workflows ----
  md.push('## Workflows');
  md.push('');
  md.push(`Total: **${wfList.length}**`);
  md.push('');
  if (wfList.length > 0) {
    md.push(fmtTable(
      wfList.map(w => [w.name || '(unnamed)', w.status || '?', w.id || '']),
      ['Name', 'Status', 'ID']
    ));
  } else {
    md.push('_No workflows returned._');
  }
  md.push('');
  md.push('---');
  md.push('');

  // ---- Pipelines ----
  md.push('## Pipelines');
  md.push('');
  md.push(`Total: **${pipeList.length}**`);
  md.push('');
  for (const p of pipeList) {
    md.push(`### ${p.name || '(unnamed)'}  (\`${p.id || ''}\`)`);
    md.push('');
    if (Array.isArray(p.stages) && p.stages.length) {
      md.push(fmtTable(p.stages.map(s => [s.name, s.id]), ['Stage', 'ID']));
    } else {
      md.push('_No stages._');
    }
    md.push('');
  }
  md.push('---');
  md.push('');

  // ---- Calendars ----
  md.push('## Calendars');
  md.push('');
  md.push(`Total: **${calList.length}**`);
  md.push('');
  if (calList.length > 0) {
    md.push(fmtTable(
      calList.map(c => [c.name || '(unnamed)', c.calendarType || c.eventType || '?', c.id || '']),
      ['Name', 'Type', 'ID']
    ));
  }
  md.push('');
  md.push('---');
  md.push('');

  // ---- Tags ----
  md.push('## Tags Defined on the Sub-Account');
  md.push('');
  md.push(`Total: **${tagsList.length}**`);
  md.push('');
  if (tagsList.length > 0) {
    md.push(fmtTable(
      tagsList.slice(0, 100).map(t => [t.name || '(unnamed)', t.id || '']),
      ['Tag', 'ID']
    ));
    if (tagsList.length > 100) md.push(`_(${tagsList.length - 100} more truncated)_`);
  }
  md.push('');
  md.push('---');
  md.push('');

  // ---- Custom fields ----
  md.push('## Custom Fields (with usage)');
  md.push('');
  md.push(`Total defined: **${cfList.length}**`);
  md.push('');
  if (cfWithUsage.length > 0) {
    md.push(fmtTable(
      cfWithUsage.map(f => [f.name, f.fieldKey || '?', f.type || '?', f.populated]),
      ['Name', 'Field key', 'Type', 'Populated count']
    ));
  }
  md.push('');
  md.push('---');
  md.push('');

  // ---- Conversations ----
  md.push('## Conversations (recent 100 sample)');
  md.push('');
  md.push(`Returned: **${convs.length}**`);
  md.push(`Unread: **${unread}**`);
  md.push('');
  md.push('Channel mix:');
  md.push('');
  md.push(fmtTable(convChannels, ['Channel', 'Count']));
  md.push('');
  md.push('---');
  md.push('');

  // ---- Users ----
  md.push('## Users on Sub-Account');
  md.push('');
  md.push(`Total: **${userList.length}**`);
  md.push('');
  if (userList.length > 0) {
    md.push(fmtTable(
      userList.map(u => [
        `${u.firstName || ''} ${u.lastName || ''}`.trim() || '(unnamed)',
        u.email || '?',
        Array.isArray(u.roles?.role) ? u.roles.role.join('/') : (u.role || '?'),
      ]),
      ['Name', 'Email', 'Role']
    ));
  }
  md.push('');
  md.push('---');
  md.push('');

  // ---- Custom values ----
  const cvList = customValues.body?.customValues || [];
  md.push('## Custom Values (location-level constants)');
  md.push('');
  md.push(`Total: **${cvList.length}**`);
  if (cvList.length > 0) {
    md.push('');
    md.push(fmtTable(
      cvList.map(v => [v.name || '(unnamed)', v.fieldKey || '?', truncate(v.value, 80)]),
      ['Name', 'Key', 'Value (truncated)']
    ));
  }
  md.push('');
  md.push('---');
  md.push('');

  md.push('## Next Steps (to fill in after Idriss reviews)');
  md.push('');
  md.push('- [ ] Identify which workflow is the half-built booking flow');
  md.push('- [ ] Decide whether to keep / archive / rewrite each existing workflow');
  md.push('- [ ] Plan the contact list cleanup pass (bot spam, duplicates, segmentation tags)');
  md.push('- [ ] Confirm Darlene\'s calendar is the booking target');
  md.push('- [ ] Define the "$500 off summer" past-guest campaign target segment');

  fs.writeFileSync(reportPath, md.join('\n') + '\n');
  log(`report written: ${reportPath}`);
  log('PASS: audit complete');
}

function pct(n, total) {
  if (!total) return '0%';
  return ((n / total) * 100).toFixed(1) + '%';
}

function truncate(s, n) {
  if (s == null) return '';
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '...' : str;
}

main().catch(err => {
  log(`FAIL: ${err.message}`);
  log(err.stack || '');
  process.exitCode = 1;
});
