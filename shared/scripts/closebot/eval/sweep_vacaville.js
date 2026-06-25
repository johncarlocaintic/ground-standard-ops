// Stability sweep — run all 6 vacaville personas sequentially against the test bench.
// Sequential because they share src_GDKORXSW4Q8RQUQ8 mimic source and the test bench bot.
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PERSONAS = [
  'cooperative_scheduler',
  'kid_only',
  'adult_only',
  'multi_kid_family',
  'comprehensive_happy_path',
  'hostile_aggression',
];

// Default to GS Ads sandbox source (verified 2026-04-29: routes to Bobby's GS Ads GHL).
// src_GDKORXSW4Q8RQUQ8 is Vacaville production — never default there.
const env = {
  ...process.env,
  CB_TEST_BOT_ID: process.env.CB_TEST_BOT_ID || 'bot_J56AWZ5TYQI9HKJS',
  RUBRIC: 'shared/scripts/closebot/rubrics/vacaville.json',
  MIMIC_SOURCE_ID: process.env.MIMIC_SOURCE_ID || 'src_4R4DUIQTMMX2NFPU',
};

if (env.MIMIC_SOURCE_ID === 'src_GDKORXSW4Q8RQUQ8' && process.env.ALLOW_PROD_MIMIC !== 'true') {
  console.error(`FATAL: sweep MIMIC_SOURCE_ID=${env.MIMIC_SOURCE_ID} is Vacaville production.`);
  console.error(`Refusing to sweep against a live client GHL. Set ALLOW_PROD_MIMIC=true to override.`);
  process.exit(2);
}

const results = [];
const startedAt = new Date().toISOString();
console.log(`[${startedAt}] === Stability sweep across ${PERSONAS.length} personas ===`);

for (const personaName of PERSONAS) {
  const personaPath = `shared/scripts/closebot/personas/vacaville/${personaName}.json`;
  console.log(`\n[${new Date().toISOString()}] --- ${personaName} ---`);
  const r = spawnSync('node', [
    '--env-file=.env',
    '--env-file=clients/ground-standard/.env',
    'shared/scripts/closebot/eval/orchestrator.js',
  ], {
    env: { ...env, PERSONA: personaPath },
    stdio: 'inherit',
    shell: false,
  });
  results.push({ persona: personaName, exitCode: r.status });
}

const finishedAt = new Date().toISOString();
console.log(`\n[${finishedAt}] === Sweep complete ===`);
for (const r of results) console.log(`  ${r.persona}: exit=${r.exitCode}`);
fs.writeFileSync('shared/logs/eval/sweep_summary.json', JSON.stringify({ startedAt, finishedAt, results }, null, 2));
console.log('\nWrote shared/logs/eval/sweep_summary.json');
