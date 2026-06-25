// Vacaville PROD sweep v2 — targets the current live bot (Launch v1.0, 2026-05-07).
// Replaces sweep_vacaville_prod.js which was pinned to a previous bot generation.
//
// WARNING: each run creates a REAL contact + REAL appointment on Vacaville's
// live GHL calendar (location JFnXPPTB9Rkgyi0KOUv8). Bobby will need to
// clean these up afterward. 8 personas → 8 contacts + up to 8 bookings.
//
// Idriss approved prod-mimic for this run on 2026-05-11 to validate
// CloseBot support's claim that the @@[Update Contact] silent failure is fixed.
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../../');

const PERSONAS = [
  'adult_inquirer',
  'realistic_lead',
  'cooperative_scheduler',
  'comprehensive_happy_path',
  'multi_kid_family',
  'parent_broad_01',
  'kid_only',
  'hostile_aggression',
];

const env = {
  ...process.env,
  CB_TEST_BOT_ID: 'bot_GBIF5HQVM8FPQ0XJ',
  RUBRIC: 'shared/scripts/closebot/rubrics/vacaville.json',
  MIMIC_SOURCE_ID: 'src_GDKORXSW4Q8RQUQ8',
  ALLOW_PROD_MIMIC: 'true',
};

const startedAt = new Date().toISOString();
const sweepId = `sweep_${startedAt.replace(/[:.]/g, '-')}`;
const results = [];

console.log(`[${startedAt}] === Vacaville PROD sweep v2 (${PERSONAS.length} personas) ===`);
console.log(`Bot:   ${env.CB_TEST_BOT_ID} (Launch v1.0, 2026-05-07)`);
console.log(`Mimic: ${env.MIMIC_SOURCE_ID} (Vacaville PROD — real bookings will be created)`);
console.log(`Goal:  validate @@[Update Contact] bug is fixed per CloseBot support reply.`);
console.log('');

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
    cwd: REPO_ROOT,
  });
  results.push({ persona: personaName, exitCode: r.status });
}

const finishedAt = new Date().toISOString();
console.log(`\n[${finishedAt}] === Sweep complete ===`);
for (const r of results) console.log(`  ${r.persona}: exit=${r.exitCode}`);

const outPath = path.join(REPO_ROOT, 'shared/logs/eval', `sweep_vacaville_prod_v2_${startedAt.replace(/[:.]/g, '-')}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ sweep_id: sweepId, startedAt, finishedAt, bot_id: env.CB_TEST_BOT_ID, mimic_source_id: env.MIMIC_SOURCE_ID, results }, null, 2));
console.log(`\nWrote ${path.relative(REPO_ROOT, outPath)}`);
