// Retry the 5 personas that didn't complete on the first sweep run.
// parent_broad_01 already passed (no booking — lead opted out before info capture).
import { spawnSync } from 'child_process';
import fs from 'fs';

const PERSONAS = [
  'multi_kid_family',
  'kid_only',
  'comprehensive_happy_path',
  'cooperative_scheduler',
  'hostile_aggression',
];

const env = {
  ...process.env,
  CB_TEST_BOT_ID: 'bot_J56AWZ5TYQI9HKJS',
  RUBRIC: 'shared/scripts/closebot/rubrics/vacaville.json',
  MIMIC_SOURCE_ID: 'src_GDKORXSW4Q8RQUQ8',
  ALLOW_PROD_MIMIC: 'true',
};

const results = [];
const startedAt = new Date().toISOString();
console.log(`[${startedAt}] === Vacaville PROD sweep RETRY (${PERSONAS.length} personas) ===`);

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
  // small breathing pause between runs to be kind to the network
  if (PERSONAS.indexOf(personaName) < PERSONAS.length - 1) {
    console.log('   (3s breather)');
  }
}

const finishedAt = new Date().toISOString();
console.log(`\n[${finishedAt}] === Sweep retry complete ===`);
for (const r of results) console.log(`  ${r.persona}: exit=${r.exitCode}`);
fs.writeFileSync('shared/logs/eval/sweep_vacaville_prod_retry_summary.json', JSON.stringify({ startedAt, finishedAt, results }, null, 2));
