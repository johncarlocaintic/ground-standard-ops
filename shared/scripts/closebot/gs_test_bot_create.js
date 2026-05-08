import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'closebot_gs_bot_create.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}
function logJson(label, data) {
  const block = `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n`;
  console.log(block);
  fs.appendFileSync(logFile, block + '\n');
}
function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`ERROR: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE = 'https://api.closebot.com';
const API_KEY = getEnv('CB_GS_API_KEY');
const HEADERS = { 'X-CB-KEY': API_KEY, 'Content-Type': 'application/json' };

async function req(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method, headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

const MINIMAL_KDL = `__CONFIG__ {
    conversationReason "You are a friendly assistant for Ground Standard. Greet the contact and collect their name and email."
    businessInformation "Ground Standard is a roofing company."
    prohibitedWords
}
Source id="source" {
    showTestPortal false
    activeAiNodeId
    globalAgentTools {
        _ "EnableLibraryContext"
    }
    Next handle="node-1"
    __position 0 0
}
MultiObjective id="node-1" {
    Objectives {
        _ {
            MaxAttempts 3
            Sensitivity 60
            SkipIfNotBlank true
            Variable "contact.first_name"
            Title "Get Name"
            Description "Get the contact's first name"
            Prompt "Greet them warmly and ask for their name."
        }
        _ {
            MaxAttempts 3
            Sensitivity 60
            SkipIfNotBlank true
            Variable "contact.email"
            Title "Get Email"
            Description "Get the contact's email address"
            Prompt "Ask for their email so we can follow up."
        }
    }
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="node-2"
    __position 300 0
}
Conversation id="node-2" {
    ExtraPrompt "Answer any questions the contact has. Be helpful and friendly."
    __dynamicVariables
    showTestPortal false
    activeAiNodeId
    Next handle="EOC"
    __position 600 0
}`;

async function main() {
  log('=== CloseBot Bot Creation Tests — Ground Standard ===');
  const createdIds = [];

  // ── TEST 1: POST /bot/ai-create ──────────────────────────────────────
  log('\n[TEST 1] POST /bot/ai-create — natural language bot creation');

  // Try a few likely payload shapes since schema is unknown
  const aiCreatePayloads = [
    { description: "A bot that greets a roofing lead, collects their name and email, then books them for a free inspection." },
    { prompt: "A bot that greets a roofing lead, collects their name and email, then books them for a free inspection." },
    { name: "TEST-AI-CREATE-DO-NOT-USE", description: "A bot that greets a roofing lead, collects their name and email, then books them for a free inspection." },
  ];

  let aiCreateWorked = false;
  for (const [i, payload] of aiCreatePayloads.entries()) {
    log(`  Attempt ${i + 1} — payload keys: ${Object.keys(payload).join(', ')}`);
    const r = await req('POST', '/bot/ai-create', payload);
    log(`  Response: ${r.status}`);
    logJson(`ai-create attempt ${i + 1}`, r.json);
    if (r.ok) {
      aiCreateWorked = true;
      const id = r.json?.id || r.json?._id || r.json?.data?.id;
      if (id) createdIds.push({ id, name: 'TEST-AI-CREATE' });
      break;
    }
    if (r.status !== 400 && r.status !== 422) break; // stop on unexpected errors
  }
  if (!aiCreateWorked) log('  RESULT: ai-create did not work with any payload shape tested');

  // ── TEST 2: POST /bot with importKdl ────────────────────────────────
  log('\n[TEST 2] POST /bot with importKdl — direct KDL import');
  const kdlImportResult = await req('POST', '/bot', {
    name: 'TEST-KDL-IMPORT-DO-NOT-USE',
    importKdl: MINIMAL_KDL,
  });
  log(`  Response: ${kdlImportResult.status}`);
  logJson('POST /bot with importKdl', kdlImportResult.json);
  if (kdlImportResult.ok) {
    const id = kdlImportResult.json?.id || kdlImportResult.json?._id || kdlImportResult.json?.data?.id;
    if (id) createdIds.push({ id, name: 'TEST-KDL-IMPORT' });
    log('  RESULT: ✅ KDL import worked');
  } else {
    log('  RESULT: ❌ KDL import failed');
  }

  // ── TEST 3: POST /bot shell only (no KDL) ───────────────────────────
  log('\n[TEST 3] POST /bot shell only — verify base create works');
  const shellResult = await req('POST', '/bot', { name: 'TEST-SHELL-DO-NOT-USE' });
  log(`  Response: ${shellResult.status}`);
  logJson('POST /bot shell', shellResult.json);
  if (shellResult.ok) {
    const id = shellResult.json?.id || shellResult.json?._id || shellResult.json?.data?.id;
    if (id) createdIds.push({ id, name: 'TEST-SHELL' });
    log('  RESULT: ✅ Shell create worked');
  } else {
    log('  RESULT: ❌ Shell create failed');
  }

  // ── CLEANUP ──────────────────────────────────────────────────────────
  log(`\n[CLEANUP] Deleting ${createdIds.length} test bot(s)...`);
  for (const { id, name } of createdIds) {
    const del = await req('DELETE', `/bot/${id}`);
    if (del.ok) {
      log(`  ✅ Deleted ${name} (${id})`);
    } else {
      log(`  ⚠️  Could not delete ${name} (${id}) — ${del.status}: ${JSON.stringify(del.json)}`);
    }
  }

  log('\n=== Test complete. Log: shared/logs/closebot_gs_bot_create.log ===');
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });
