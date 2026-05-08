// Phase 1A — Retell AI API Test
// Script: shared/scripts/retell/test_create_agent.js
//
// What this does:
//   1. Creates a minimal Retell LLM config
//   2. Creates a Retell voice agent referencing that LLM
//   3. Lists agents to confirm the new agent appears
//   4. Logs llm_id and agent_id to shared/scripts/logs/retell_test.log
//
// What this does NOT do:
//   - Assign a phone number
//   - Make any calls
//   - Touch any live client data
//
// Run with:
//   node --env-file=../../../.env test_create_agent.js
//
// Or from the repo root:
//   node --env-file=.env shared/scripts/retell/test_create_agent.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'retell_test.log');
const BASE_URL = 'https://api.retellai.com';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getApiKey() {
  const key = process.env.RETELL_API_KEY;
  if (!key) {
    console.error('ERROR: RETELL_API_KEY is not set. Make sure you run with --env-file=.env');
    process.exit(1);
  }
  return key;
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function retellRequest(method, endpoint, body = null) {
  const apiKey = getApiKey();
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${method} ${endpoint}: ${JSON.stringify(data)}`);
  }
  return data;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure log directory exists
  fs.mkdirSync(LOG_DIR, { recursive: true });

  log('=== Phase 1A — Retell AI Test Starting ===');

  // Step 1: Create a minimal Retell LLM
  log('Step 1: Creating Retell LLM...');
  const llm = await retellRequest('POST', '/create-retell-llm', {
    model: 'gpt-4.1-mini',
    start_speaker: 'agent',
    begin_message: 'Hi, this is a test agent created via API. This call will now end.',
    general_prompt:
      'You are a test agent created by an API script. ' +
      'If anyone calls, politely let them know this is a test agent and end the call.',
    general_tools: [
      {
        type: 'end_call',
        name: 'end_call',
        description: 'End the call.',
      },
    ],
  });

  log(`Step 1 SUCCESS: LLM created — llm_id: ${llm.llm_id}`);

  // Step 2: Create a voice agent referencing the LLM
  log('Step 2: Creating Retell voice agent...');
  const agent = await retellRequest('POST', '/create-agent', {
    agent_name: 'TEST-AGENT-API-DO-NOT-USE',
    response_engine: {
      type: 'retell-llm',
      llm_id: llm.llm_id,
    },
    voice_id: 'retell-Cimo', // Built-in Retell voice, always available
    language: 'en-US',
  });

  log(`Step 2 SUCCESS: Agent created — agent_id: ${agent.agent_id}`);

  // Step 3: List agents and confirm ours appears
  log('Step 3: Listing agents to confirm creation...');
  const agents = await retellRequest('GET', '/list-agents');
  const found = agents.find((a) => a.agent_id === agent.agent_id);

  if (found) {
    log(`Step 3 SUCCESS: Agent confirmed in dashboard — name: "${found.agent_name}", id: ${found.agent_id}`);
  } else {
    log(`Step 3 WARNING: Agent not found in list. It may still be propagating. Check dashboard manually.`);
  }

  // Step 4: Write summary log
  const summary = {
    timestamp: new Date().toISOString(),
    llm_id: llm.llm_id,
    agent_id: agent.agent_id,
    agent_name: agent.agent_name,
    status: 'CREATED — DELETE AFTER CONFIRMING IN DASHBOARD',
  };

  log('=== SUMMARY ===');
  log(`llm_id:    ${summary.llm_id}`);
  log(`agent_id:  ${summary.agent_id}`);
  log(`Log file:  ${LOG_FILE}`);
  log('=== Phase 1A Complete — Go confirm the agent appears in https://dashboard.retellai.com ===');

  // Also write a clean JSON summary to the log file
  fs.appendFileSync(LOG_FILE, '\nSUMMARY JSON:\n' + JSON.stringify(summary, null, 2) + '\n');
}

main().catch((err) => {
  const msg = `FATAL ERROR: ${err.message}`;
  console.error(msg);
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (_) {}
  process.exit(1);
});
