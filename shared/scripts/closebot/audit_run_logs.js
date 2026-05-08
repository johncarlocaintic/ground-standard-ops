// Audit all eval run.log files: extract per-run mimicSourceId + identity + verifier outcome.
import fs from 'fs';
import path from 'path';

const EVAL_DIR = 'shared/logs/eval';
const dirs = fs.readdirSync(EVAL_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.startsWith('vacaville-grappling_'))
  .map(d => d.name)
  .sort();

const rows = [];

for (const dirName of dirs) {
  const runLogPath = path.join(EVAL_DIR, dirName, 'run.log');
  if (!fs.existsSync(runLogPath)) continue;
  const log = fs.readFileSync(runLogPath, 'utf8');

  const mimicMatch = log.match(/mimicSourceId=([^\s,]+)/);
  const identityMatch = log.match(/Test identity:\s*([^|\n]+)\|\s*([^|\n]+)\|/);
  const locMatch = log.match(/locationId=([A-Za-z0-9_-]+)/);
  const verifierFoundMatch = log.match(/ghl_found=([a-z]+),\s*appointments=(\d+)/);
  const verifierMatch = log.match(/Verified verdict:\s*([a-z]+)/);

  rows.push({
    run: dirName.replace('vacaville-grappling_vac_', ''),
    mimic: mimicMatch ? mimicMatch[1] : '?',
    identity: identityMatch ? identityMatch[1].trim() : '?',
    verifierLoc: locMatch ? locMatch[1] : '?',
    appts: verifierFoundMatch ? verifierFoundMatch[2] : '?',
    verdict: verifierMatch ? verifierMatch[1] : '?',
  });
}

console.log('run                                          | mimicSourceId           | identity            | appts | verdict');
console.log('--------------------------------------------------------------------------------------------------------');
for (const r of rows) {
  console.log(`${r.run.padEnd(45)} | ${r.mimic.padEnd(23)} | ${r.identity.padEnd(20)} | ${r.appts.padEnd(5)} | ${r.verdict}`);
}

// Group by mimicSourceId
const byMimic = {};
for (const r of rows) {
  byMimic[r.mimic] = (byMimic[r.mimic] || 0) + 1;
}
console.log('\nMIMIC SOURCE FREQUENCY:');
for (const [k, v] of Object.entries(byMimic)) console.log(`  ${k}: ${v} runs`);
