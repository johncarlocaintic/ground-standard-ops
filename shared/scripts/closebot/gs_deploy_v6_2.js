/**
 * v6.2 — single Agent Node bot with NEW persona (openai-legacy primary).
 * Tests if forcing OpenAI provider bypasses the Agent Node exception.
 *
 * Steps:
 *   1. Create new persona with aiProviderPreferences=["openai-legacy","anthropic"]
 *   2. Create v6.2 bot from minimal KDL (Source → Agent Node → EOC)
 *   3. Update bot's personaIds to use the new persona
 *   4. Publish, attach to source, re-publish
 *   5. (Caller runs deep diagnostic separately)
 */
import fs from 'fs';
const CB_KEY = process.env.CB_GS_API_KEY;
const SOURCE = 'src_4R4DUIQTMMX2NFPU';
const CHANNEL = 'Test Chat 12 [VACAVILLE ]';
const KDL_PATH = 'shared/logs/vacaville_v6_minimal_agent.kdl'; // existing minimal KDL (Source → 1 Agent Node)

async function api(method, ep, body) {
  const r = await fetch(`https://api.closebot.com${ep}`, {
    method,
    headers: { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let json;
  try { json = JSON.parse(t); } catch { json = { raw: t.slice(0, 500) }; }
  return { status: r.status, ok: r.ok, json };
}

(async () => {
  console.log('=== v6.2 deploy: single Agent Node + openai-first persona ===\n');

  // Step 1: Create new persona (openai-legacy first)
  // Body shape mirrors what we observed in GET /persona/{id}
  console.log('--- Step 1: Create new persona (openai-legacy first) ---');
  const newPersona = {
    personaName: 'Emma OpenAI Test',
    description: 'Test persona for OpenAI-primary Agent Node experiment 2026-04-27',
    voiceStyles: ' helpful, professional, knowledgable',
    howToRespond: 'Respond professionally and concisely. Use the send_message tool to reply.',
    typoPercent: 0,
    breakupLargeMessagePercent: 0,
    responseTime: 'instant',
    responseDelay: 0,
    aiProviderPreferences: ['openai-legacy', 'anthropic'],
  };

  const personaRes = await api('POST', '/persona', newPersona);
  console.log(`  POST /persona → ${personaRes.status}`);
  if (!personaRes.ok) {
    console.log(`  body: ${JSON.stringify(personaRes.json).slice(0, 500)}`);
    console.log('  Trying PATCH/PUT alternatives may be needed if POST is wrong shape.');
    process.exit(1);
  }
  const newPersonaId = personaRes.json?.id;
  console.log(`  new persona ID: ${newPersonaId}`);
  console.log(`  aiProviderPreferences: ${JSON.stringify(personaRes.json?.aiProviderPreferences)}`);

  // Step 2: Create v6.2 bot
  console.log('\n--- Step 2: Create v6.2 bot ---');
  const kdl = fs.readFileSync(KDL_PATH, 'utf8');
  const name = `Vacaville v6.2 - openai persona test (${new Date().toISOString().slice(0,16)})`;
  const c = await api('POST', '/bot', { name, importKdl: kdl });
  if (!c.ok) { console.log(`FAIL: ${c.status} ${JSON.stringify(c.json).slice(0,500)}`); process.exit(1); }
  const botId = c.json.id;
  console.log(`  bot ID: ${botId}`);
  console.log(`  default personaIds (probably agency default): ${JSON.stringify(c.json.personaIds)}`);

  // Step 3: Update bot to use new persona
  console.log('\n--- Step 3: Swap bot to new persona ---');
  const updateBot = await api('PUT', `/bot/${botId}`, {
    personaIds: [newPersonaId],
  });
  console.log(`  PUT /bot/${botId} (personaIds) → ${updateBot.status}`);
  if (!updateBot.ok) {
    console.log(`  body: ${JSON.stringify(updateBot.json).slice(0, 500)}`);
    console.log('  WARN: persona swap failed — bot will use default persona');
  }

  // Verify
  const verifyBot = await api('GET', `/bot/${botId}`);
  console.log(`  verify personaIds: ${JSON.stringify(verifyBot.json?.personaIds)}`);

  // Step 4: Publish
  console.log('\n--- Step 4: Publish ---');
  const pub = await api('POST', `/bot/${botId}/publish`, {});
  console.log(`  publish → ${pub.status}`);

  // Step 5: Attach
  console.log('\n--- Step 5: Attach to source ---');
  const attach = await api('POST', `/bot/${botId}/source/${SOURCE}`, {
    tags: [],
    channels: [CHANNEL],
    enabled: true,
  });
  console.log(`  attach → ${attach.status}`);

  // Step 6: Re-publish
  console.log('\n--- Step 6: Re-publish ---');
  const pub2 = await api('POST', `/bot/${botId}/publish`, {});
  console.log(`  re-publish → ${pub2.status}`);

  console.log(`\n=== DONE ===`);
  console.log(`v6.2 bot ID: ${botId}`);
  console.log(`new persona ID: ${newPersonaId}`);
  console.log(`Test command:`);
  console.log(`  $env:CB_TEST_BOT_ID="${botId}"; node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/gs_deep_diagnostic.js`);
})();
