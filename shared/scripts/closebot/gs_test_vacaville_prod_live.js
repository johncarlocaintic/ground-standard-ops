/**
 * Single-persona deep test against the live Vacaville PROD bot.
 *
 * EXCEPTION: uses Vacaville production source as mimicSourceId (against
 * the standing guardrail). Idriss approved this exception 2026-05-07
 * to see end-to-end behavior on the actual live bot. Booking will hit
 * real Vacaville GHL — manual cleanup of the Tester contact may be
 * needed afterward.
 *
 * Bot:    "Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)"
 * Mimic:  src_GDKORXSW4Q8RQUQ8 (Vacaville prod source)
 * Persona: realistic_lead — adult, first-time, books first evening slot offered
 *
 * Output: shared/logs/eval/vac_prod_live_{timestamp}/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runTester } from './eval/tester.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');

const BOT_ID = 'bot_GBIF5HQVM8FPQ0XJ';
const MIMIC = 'src_GDKORXSW4Q8RQUQ8';
const PERSONA_PATH = path.join(REPO_ROOT, 'shared/scripts/closebot/personas/vacaville/realistic_lead.json');

function ts() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

async function main() {
  const runId = `vac_prod_live_${ts()}`;
  const outDir = path.join(REPO_ROOT, 'shared/logs/eval', runId);
  fs.mkdirSync(outDir, { recursive: true });
  const logFile = path.join(outDir, 'run.log');
  fs.writeFileSync(logFile, '');

  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
  };

  log(`=== Vacaville PROD live test ===`);
  log(`Run ID:  ${runId}`);
  log(`Bot:     "Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)"`);
  log(`Mimic:   ${MIMIC} (PROD source — exception approved 2026-05-07)`);
  log(`Persona: realistic_lead`);
  log('');

  const persona = JSON.parse(fs.readFileSync(PERSONA_PATH, 'utf8'));

  const result = await runTester(BOT_ID, persona, {
    maxTurns: 25,
    timeoutMs: 120000,
    mimicSourceId: MIMIC,
    onLog: log,
  });

  // Transcript markdown
  const tLines = [
    `# Transcript — ${runId}`,
    '',
    `**Bot:** Vacaville PROD - Launch v1.0 [tag patches + action opt-in] (2026-05-07)`,
    `**Persona:** ${persona.persona_id}`,
    `**Identity:** ${result.identity.fullName} | ${result.identity.email} | ${result.identity.phone}`,
    `**Total messages:** ${result.transcript.length}`,
    `**Termination:** ${result.terminationReason}`,
    '',
    '---',
    '',
  ];
  let turn = 0;
  for (const m of result.transcript) {
    if (m.sender === 'lead') turn++;
    tLines.push(m.sender === 'lead' ? `**T${turn} LEAD**` : `**T${turn} BOT**`);
    tLines.push('');
    tLines.push(m.message);
    tLines.push('');
  }
  fs.writeFileSync(path.join(outDir, 'transcript.md'), tLines.join('\n'));

  // Events JSON
  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(result.events, null, 2));

  // Summary of key node-level events
  const nodeEvents = result.events.filter(e => {
    if (e.type === 'activity') {
      try {
        const inner = typeof e.activity === 'string' ? JSON.parse(e.activity) : e.activity;
        return ['agent_tool_use', 'node_entered', 'node_exited', 'tool_result'].includes(inner.activity);
      } catch { return false; }
    }
    return false;
  });
  fs.writeFileSync(path.join(outDir, 'node_events.json'), JSON.stringify(nodeEvents, null, 2));

  log('');
  log(`=== TEST COMPLETE ===`);
  log(`Termination: ${result.terminationReason}`);
  log(`Transcript:  ${path.relative(REPO_ROOT, path.join(outDir, 'transcript.md'))}`);
  log(`Events:      ${path.relative(REPO_ROOT, path.join(outDir, 'events.json'))} (${result.events.length} events)`);
  log(`Node events: ${path.relative(REPO_ROOT, path.join(outDir, 'node_events.json'))} (${nodeEvents.length} entries)`);
  log(`Identity created in GHL: ${result.identity.fullName} <${result.identity.email}>`);
}

main().catch(e => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(1); });
