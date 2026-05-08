// Vacaville PROD sweep — 6 personas (skips adult_only which already passed).
// Each run creates a real Vacaville GHL contact + booking that needs UI cleanup.
import { spawnSync } from 'child_process';
import fs from 'fs';

// Order chosen to test priority cases first per Idriss 2026-05-04:
//   1. parent_broad_01      — parent + 2 kids + self
//   2. multi_kid_family     — parent + multi kids
//   3. kid_only             — kid only (parent collected via prompt)
//   4. comprehensive_happy_path — full happy path
//   5. cooperative_scheduler — easy cooperative
//   6. hostile_aggression   — stress test
const PERSONAS = [
  'parent_broad_01',
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
console.log(`[${startedAt}] === Vacaville PROD sweep (${PERSONAS.length} personas) ===`);
console.log(`Bot: ${env.CB_TEST_BOT_ID}`);
console.log(`Mimic: ${env.MIMIC_SOURCE_ID}`);
console.log(`WARN: each run produces a real booking on Vacaville's calendar — Bobby UI cleanup required afterward.`);

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
fs.writeFileSync('shared/logs/eval/sweep_vacaville_prod_summary.json', JSON.stringify({ startedAt, finishedAt, results }, null, 2));
console.log('\nWrote shared/logs/eval/sweep_vacaville_prod_summary.json');
