// Round 3 — re-run the 4 personas that never got past turn 1 due to network blips.
// multi_kid_family already partially completed (booked Ben Marsh successfully).
import { spawnSync } from 'child_process';
import fs from 'fs';

const PERSONAS = [
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
console.log(`[${startedAt}] === Vacaville PROD sweep ROUND 3 (${PERSONAS.length}) ===`);

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

console.log(`\n=== Round 3 done ===`);
for (const r of results) console.log(`  ${r.persona}: exit=${r.exitCode}`);
fs.writeFileSync('shared/logs/eval/sweep_vacaville_prod_round3_summary.json', JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), results }, null, 2));
