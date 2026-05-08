import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'openai_check.log');
const ts = () => new Date().toISOString();

function log(msg) {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) {
    log(`FATAL: ${key} not set in environment`);
    process.exit(1);
  }
  return val;
}

const TARGET_MODEL = 'gpt-4o-mini';

async function main() {
  log('=== OpenAI API Diagnostic ===');
  const apiKey = getEnv('OPENAI_API_KEY');
  log(`Key loaded (prefix: ${apiKey.slice(0, 7)}..., length: ${apiKey.length})`);

  // 1. Auth + list models
  log('--- Step 1: Auth check via /v1/models ---');
  const modelsRes = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const modelsText = await modelsRes.text();
  let modelsBody;
  try { modelsBody = JSON.parse(modelsText); }
  catch { modelsBody = modelsText.slice(0, 300); }

  if (!modelsRes.ok) {
    log(`FAIL: /v1/models HTTP ${modelsRes.status} — ${JSON.stringify(modelsBody).slice(0, 300)}`);
    process.exit(1);
  }
  log(`OK: /v1/models HTTP ${modelsRes.status} — ${modelsBody.data?.length ?? 0} models visible`);

  // 2. Confirm gpt-4o-mini is available
  log(`--- Step 2: Confirm "${TARGET_MODEL}" is in model list ---`);
  const hasTarget = modelsBody.data?.some((m) => m.id === TARGET_MODEL);
  if (!hasTarget) {
    log(`FAIL: ${TARGET_MODEL} not found in this key's accessible models`);
    process.exit(1);
  }
  log(`OK: ${TARGET_MODEL} is accessible`);

  // 3. Live chat completion (tiny, ~1 cent max)
  log('--- Step 3: Live chat completion test ---');
  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TARGET_MODEL,
      messages: [
        { role: 'system', content: 'Reply with a single short sentence.' },
        { role: 'user', content: 'Say "diagnostic ok" and nothing else.' },
      ],
      max_tokens: 20,
      temperature: 0,
    }),
  });
  const chatText = await chatRes.text();
  let chatBody;
  try { chatBody = JSON.parse(chatText); }
  catch { chatBody = chatText.slice(0, 300); }

  if (!chatRes.ok) {
    log(`FAIL: chat completion HTTP ${chatRes.status} — ${JSON.stringify(chatBody).slice(0, 300)}`);
    process.exit(1);
  }

  const reply = chatBody.choices?.[0]?.message?.content ?? '(no content)';
  const usage = chatBody.usage ?? {};
  log(`OK: chat completion HTTP ${chatRes.status}`);
  log(`Reply: "${reply.trim()}"`);
  log(`Usage: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}`);

  // Cost estimate for gpt-4o-mini: $0.15/1M input, $0.60/1M output
  const inputCost = (usage.prompt_tokens ?? 0) * 0.15 / 1_000_000;
  const outputCost = (usage.completion_tokens ?? 0) * 0.60 / 1_000_000;
  const totalCost = inputCost + outputCost;
  log(`Cost for this call: $${totalCost.toFixed(6)}`);

  log('=== All checks PASSED — OpenAI access is healthy ===');
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
