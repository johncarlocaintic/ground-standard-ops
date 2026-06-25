// Run two contrasting personas back-to-back so we can compare judge verdicts:
//   adult_inquirer (clean adult phrasing → expected pass)
//   realistic_lead (casual texting → expected fail/warning)
import { spawnSync } from 'child_process';

const PERSONAS = ['adult_inquirer', 'realistic_lead'];
const env = {
  ...process.env,
  CB_TEST_BOT_ID: 'bot_J56AWZ5TYQI9HKJS',
  RUBRIC: 'shared/scripts/closebot/rubrics/vacaville.json',
  MIMIC_SOURCE_ID: 'src_GDKORXSW4Q8RQUQ8',
  ALLOW_PROD_MIMIC: 'true',
};

for (const p of PERSONAS) {
  console.log(`\n\n=== ${p} ===\n`);
  const r = spawnSync('node', [
    '--env-file=.env', '--env-file=clients/ground-standard/.env',
    'shared/scripts/closebot/eval/orchestrator.js',
  ], {
    env: { ...env, PERSONA: `shared/scripts/closebot/personas/vacaville/${p}.json` },
    stdio: 'inherit',
    shell: false,
  });
  console.log(`\nexit ${r.status}`);
}
