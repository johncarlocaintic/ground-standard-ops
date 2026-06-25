/**
 * Retell AI Auth Test — AI Agency Institute
 * Tests the API key and lists existing agents on the account.
 * Run from repo root: node --env-file=clients/ai-agency-institute/.env shared/scripts/retell/aai_test_auth.js
 */

import fs from 'fs';
import path from 'path';

const LOG_FILE = path.resolve('shared/logs/retell_test.log');
const BASE_URL = 'https://api.retellai.com';

function getEnv(key) {
  const val = process.env[key];
  if (!val) {
    console.error(`ERROR: Missing required env var: ${key}`);
    process.exit(1);
  }
  return val;
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function main() {
  const apiKey = getEnv('RETELL_API_KEY');
  log('=== Retell AI Auth Test — AI Agency Institute ===');
  log(`Key prefix: ${apiKey.slice(0, 10)}...`);

  // List all agents
  log('\n--- GET /list-agents ---');
  const res = await fetch(`${BASE_URL}/list-agents`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json();
  log(`Status: ${res.status}`);

  if (res.status === 401) {
    log('RESULT: API key is INVALID or expired.');
    return;
  }

  if (res.status !== 200) {
    log(`Unexpected response: ${JSON.stringify(body).slice(0, 300)}`);
    return;
  }

  const agents = Array.isArray(body) ? body : (body.agents ?? []);
  log(`RESULT: Auth SUCCESS. Found ${agents.length} existing agent(s).`);

  if (agents.length === 0) {
    log('Account is empty — ready to build fresh.');
  } else {
    log('Existing agents:');
    for (const agent of agents) {
      log(`  ID: ${agent.agent_id} | Name: ${agent.agent_name} | Voice: ${agent.voice_id ?? 'N/A'}`);
    }
  }

  // Also check LLMs
  log('\n--- GET /list-retell-llms ---');
  const res2 = await fetch(`${BASE_URL}/list-retell-llms`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  const body2 = await res2.json();
  log(`Status: ${res2.status}`);
  const llms = Array.isArray(body2) ? body2 : (body2.llms ?? []);
  log(`Found ${llms.length} existing LLM config(s).`);

  if (llms.length > 0) {
    for (const llm of llms) {
      log(`  ID: ${llm.llm_id} | Model: ${llm.model ?? 'N/A'}`);
    }
  }
}

main().catch((err) => {
  const msg = `FATAL: ${err.message}`;
  console.error(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
  process.exit(1);
});
