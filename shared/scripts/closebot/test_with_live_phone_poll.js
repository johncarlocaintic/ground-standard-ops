/**
 * Run a single-persona test AND poll phone field on the contact in parallel
 * from the moment of creation through end of conversation.
 *
 * Goal: catch the EXACT timeline of when phone appears/disappears in GHL.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const LOG = path.join(REPO_ROOT, 'shared/logs/test_with_live_phone_poll.log');
fs.writeFileSync(LOG, '');
function log(m) { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); }

const TOKEN = process.env.GHL_VACAVILLE_API_TOKEN;
const LOC = process.env.GHL_VACAVILLE_LOCATION_ID;
const H = { Authorization: `Bearer ${TOKEN}`, Version: '2021-07-28', Accept: 'application/json' };

async function ghl(ep) {
  const r = await fetch(`https://services.leadconnectorhq.com${ep}`, { headers: H });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, ok: r.ok, json: j };
}

const startWindow = new Date();

async function findFreshTestContact() {
  const r = await ghl(`/contacts/?locationId=${LOC}&limit=10&order=desc`);
  if (!r.ok) return null;
  const list = r.json.contacts || [];
  return list.find(c => {
    if (!c.dateAdded) return false;
    return new Date(c.dateAdded) >= startWindow && (c.firstName || '').toLowerCase() === 'testing';
  });
}

let contactId = null;
let lastPhone = '__init__';
let lastDateUpdated = null;
let phoneTimeline = [];

async function pollLoop() {
  while (true) {
    if (!contactId) {
      const c = await findFreshTestContact();
      if (c) {
        contactId = c.id;
        log(`📌 Locked onto contact: ${contactId} (firstName="${c.firstName}", lastName="${c.lastName || ''}", email="${c.email || ''}")`);
      } else {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }
    const r = await ghl(`/contacts/${contactId}`);
    if (!r.ok) {
      log(`  poll fail: ${r.status}`);
    } else {
      const c = r.json.contact || r.json;
      const phone = c.phone;
      const tags = (c.tags || []).join(',') || '(none)';
      const cf = (c.customFields || []).filter(f => f.value).length;
      if (phone !== lastPhone || c.dateUpdated !== lastDateUpdated) {
        log(`  phone=${JSON.stringify(phone)} | dateUpdated=${c.dateUpdated} | tags=${tags} | cf=${cf}  ← change`);
        phoneTimeline.push({ ts: new Date().toISOString(), phone, dateUpdated: c.dateUpdated, tags });
        lastPhone = phone;
        lastDateUpdated = c.dateUpdated;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function runTest() {
  log(`=== Live phone-poll test ===`);
  log(`Persona: realistic_lead`);
  log(`Bot: bot_J56AWZ5TYQI9HKJS`);
  log(`Source mimic: src_GDKORXSW4Q8RQUQ8 (Vacaville prod)`);
  log(`Polling will start immediately and continue throughout the conversation.\n`);

  // Start the orchestrator in a child process
  const child = spawn('node', [
    '--env-file=.env',
    '--env-file=clients/ground-standard/.env',
    'shared/scripts/closebot/eval/orchestrator.js',
  ], {
    env: {
      ...process.env,
      CB_TEST_BOT_ID: 'bot_J56AWZ5TYQI9HKJS',
      PERSONA: 'shared/scripts/closebot/personas/vacaville/realistic_lead.json',
      RUBRIC: 'shared/scripts/closebot/rubrics/vacaville.json',
      MIMIC_SOURCE_ID: 'src_GDKORXSW4Q8RQUQ8',
      ALLOW_PROD_MIMIC: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', d => {
    const line = d.toString().trim();
    if (line.includes('Turn ') || line.includes('update_contact') || line.includes('book_appointment')) {
      log(`  [orch] ${line.split('\n').slice(-3).join(' | ').slice(-300)}`);
    }
  });
  child.stderr.on('data', d => log(`  [orch err] ${d.toString().trim().slice(0, 200)}`));

  // Run polling concurrently
  pollLoop();

  await new Promise((resolve) => {
    child.on('exit', code => {
      log(`\n[orchestrator exited code=${code}]`);
      resolve();
    });
  });

  // Continue polling 60s post-conversation to catch any post-strip
  log(`\n--- Conversation done. Continuing to poll for 60s to catch any post-strip ---`);
  await new Promise(r => setTimeout(r, 60_000));

  log(`\n=== PHONE FIELD TIMELINE ===`);
  for (const e of phoneTimeline) {
    log(`  ${e.ts}  phone=${JSON.stringify(e.phone)}  dateUpdated=${e.dateUpdated}  tags=${e.tags}`);
  }

  process.exit(0);
}

runTest().catch(e => log(`FATAL: ${e.message}`));
