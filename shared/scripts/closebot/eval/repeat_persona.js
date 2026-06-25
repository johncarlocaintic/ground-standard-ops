// Run a single persona N times sequentially. Useful for non-determinism testing.
// Usage: node shared/scripts/closebot/eval/repeat_persona.js <persona> <count>
import { spawnSync } from 'child_process';

const persona = process.argv[2] || 'multi_kid_family';
const count = parseInt(process.argv[3] || '5', 10);

const env = {
  ...process.env,
  CB_TEST_BOT_ID: process.env.CB_TEST_BOT_ID || 'bot_PZOCDUEO686MS1O3',
  RUBRIC: process.env.RUBRIC || 'shared/scripts/closebot/rubrics/vacaville.json',
  PERSONA: process.env.PERSONA || `shared/scripts/closebot/personas/vacaville/${persona}.json`,
  MIMIC_SOURCE_ID: process.env.MIMIC_SOURCE_ID || 'src_4R4DUIQTMMX2NFPU',
};

if (env.MIMIC_SOURCE_ID === 'src_GDKORXSW4Q8RQUQ8' && process.env.ALLOW_PROD_MIMIC !== 'true') {
  console.error(`FATAL: MIMIC_SOURCE_ID=${env.MIMIC_SOURCE_ID} is Vacaville production. Refusing.`);
  process.exit(2);
}

console.log(`[${new Date().toISOString()}] === Running ${persona} ${count}× ===`);
const results = [];
for (let i = 1; i <= count; i++) {
  console.log(`\n[${new Date().toISOString()}] --- Run ${i}/${count} ---`);
  const r = spawnSync('node', [
    '--env-file=.env',
    '--env-file=clients/ground-standard/.env',
    'shared/scripts/closebot/eval/orchestrator.js',
  ], { env, stdio: 'inherit', shell: false });
  results.push({ run: i, exitCode: r.status });
}
console.log(`\n[${new Date().toISOString()}] === ${persona} ×${count} complete ===`);
for (const r of results) console.log(`  Run ${r.run}: exit=${r.exitCode}`);
