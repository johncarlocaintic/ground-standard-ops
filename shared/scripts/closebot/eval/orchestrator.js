/**
 * Orchestrator — single-run MVP.
 *
 * Runs ONE Tester→QA cycle and writes the per-run artifact directory.
 * Loop + coverage tracking + next-directive routing deferred for the next iteration.
 *
 * Usage:
 *   CB_TEST_BOT_ID=bot_xxxx \
 *   PERSONA=shared/scripts/closebot/personas/vacaville/parent_broad_01.json \
 *   RUBRIC=shared/scripts/closebot/rubrics/vacaville.json \
 *   node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/eval/orchestrator.js
 *
 * Output:
 *   shared/logs/eval/{run_id}/
 *     report.md       — human-readable summary + links
 *     transcript.md   — formatted lead/bot exchange
 *     score.json      — raw QA output
 *     run.log         — orchestrator log
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runTester } from './tester.js';
import { runQa, loadRubric } from './qa_agent.js';
import { runVerifier, computeAgeAnnotations } from './verifier.js';
import { runJudge, extractClosebotData, resolveCustomFieldNames, resolveAppointmentCalendars, extractFingerprint } from './judge_agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../../');

function getEnv(k, required = true) {
  const v = process.env[k];
  if (!v && required) { console.error(`FATAL: missing env var ${k}`); process.exit(1); }
  return v;
}

function ts() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function mkLog(logFile) {
  return (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logFile, line + '\n');
  };
}

function writeTranscriptMd(filePath, transcript, meta) {
  const lines = [
    `# Transcript — ${meta.run_id}`,
    '',
    `**Bot:** \`${meta.bot_id}\``,
    `**Persona:** \`${meta.persona_id}\``,
    `**Total messages:** ${transcript.length}`,
    `**Termination:** ${meta.terminationReason}`,
    '',
    '---',
    '',
  ];
  let turnCount = 0;
  for (const m of transcript) {
    if (m.sender === 'lead') turnCount++;
    const tag = m.sender === 'lead' ? `**T${turnCount} LEAD**` : `**T${turnCount} BOT**`;
    lines.push(tag);
    lines.push('');
    lines.push(m.message);
    lines.push('');
  }
  fs.writeFileSync(filePath, lines.join('\n'));
}

function writeReportMd(filePath, score, meta, extras = {}) {
  const { verified, ghlFacts, ageAnnotations, identity } = extras;
  const finalScore = verified || score;
  const verdictBadge = finalScore.overall_verdict === 'pass' ? 'PASS' : 'FAIL';
  const lines = [
    `# Eval Report — ${meta.run_id}`,
    '',
    `**Bot:** \`${meta.bot_id}\``,
    `**Persona:** \`${meta.persona_id}\``,
    `**Turns:** ${finalScore.transcript_turns}`,
    `**Termination:** ${meta.terminationReason}`,
  ];
  if (identity) {
    lines.push(`**Test identity:** ${identity.fullName} | ${identity.email} | ${identity.phone}${identity.kidName ? ` | kid: ${identity.kidName}` : ''}`);
  }
  lines.push('');
  lines.push(`## Overall: ${verdictBadge}${verified ? ' (verified)' : ''}`);
  lines.push('');
  lines.push(`- Blocker fails: **${finalScore.blocker_fails}**`);
  lines.push(`- Standard fails: ${finalScore.standard_fails}`);
  lines.push(`- Flags: ${finalScore.flags}`);
  if (verified) {
    lines.push(`- QA-only verdict (pre-verifier): ${score.overall_verdict} (blockers=${score.blocker_fails}, standard=${score.standard_fails}, flags=${score.flags})`);
  }
  lines.push('');

  if (verified && verified.verifier_overrides && verified.verifier_overrides.length) {
    lines.push('## Verifier overrides');
    lines.push('');
    lines.push('| Checkpoint | From | To | Reason |');
    lines.push('|---|---|---|---|');
    for (const o of verified.verifier_overrides) {
      lines.push(`| ${o.checkpoint_id} | ${o.from} | ${o.to} | ${o.reason} |`);
    }
    lines.push('');
  }

  if (ghlFacts) {
    lines.push('## GHL ground truth');
    lines.push('');
    if (!ghlFacts.found) {
      lines.push('_No matching GHL contact found for this test identity._');
    } else {
      lines.push(`- Contact: \`${ghlFacts.contact_id}\` (${ghlFacts.contact_name || 'no name'} / ${ghlFacts.contact_email || 'no email'})`);
      lines.push(`- Tags: ${ghlFacts.tags.length ? ghlFacts.tags.map(t => `\`${t}\``).join(', ') : '_none_'}`);
      lines.push(`- Custom fields populated: ${ghlFacts.custom_fields.length}`);
      lines.push(`- Appointments: **${ghlFacts.appointments.length}**`);
      if (ghlFacts.appointments.length) {
        lines.push('');
        lines.push('| Appt ID | Calendar | Status | Start | Title |');
        lines.push('|---|---|---|---|---|');
        for (const a of ghlFacts.appointments) {
          lines.push(`| \`${a.id}\` | \`${a.calendarId || '?'}\` | ${a.appointmentStatus || a.status || '?'} | ${a.startTime || '?'} | ${(a.title || '').replace(/\|/g, '\\|')} |`);
        }
      }
    }
    lines.push('');
  }

  if (ageAnnotations && ageAnnotations.length) {
    lines.push('## Calculated ages (passed to QA)');
    lines.push('');
    for (const a of ageAnnotations) {
      lines.push(`- T${a.turn}: DOB \`${a.dob_iso}\` → age **${a.age}** as of ${a.age_as_of}`);
    }
    lines.push('');
  }

  lines.push('## Checkpoints');
  lines.push('');
  lines.push('| ID | Description | Level | Verdict | Evidence | Notes |');
  lines.push('|---|---|---|---|---|---|');

  const rubricById = Object.fromEntries(meta.rubric.checkpoints.map(c => [c.id, c]));
  for (const r of finalScore.results) {
    const cp = rubricById[r.checkpoint_id] || { description: '?', level: '?' };
    const verdict = r.verdict === 'fail' ? `**fail**` : r.verdict;
    const evidence = (r.evidence || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const notes = (r.notes || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${r.checkpoint_id} | ${cp.description} | ${cp.level} | ${verdict} | ${evidence} | ${notes} |`);
  }

  lines.push('');
  lines.push('## QA next directive');
  lines.push('');
  lines.push(finalScore.next_directive || '(none)');
  lines.push('');
  lines.push('## Artifacts');
  lines.push('');
  lines.push('- [Full transcript](transcript.md)');
  lines.push('- [Raw QA score](score.json)');
  if (verified) lines.push('- [Verified score](verified_score.json)');
  if (ghlFacts) lines.push('- [GHL facts](ghl_facts.json)');
  lines.push('- [SSE events stream](events.json)');
  lines.push('- [Orchestrator log](run.log)');
  lines.push('');

  fs.writeFileSync(filePath, lines.join('\n'));
}

// Production source IDs that route to live client GHLs. Tests MUST NOT bind to
// these unless ALLOW_PROD_MIMIC=true is explicitly set. Verified 2026-04-29 by
// controlled experiment: src_GDKORXSW4Q8RQUQ8 mimic creates real Vacaville
// production appointments. The intended sandbox source is src_4R4DUIQTMMX2NFPU
// (GS Ads), which writes to Bobby's GS Ads GHL — safe for evals.
//
// To register a new client's production source as protected, add its source ID
// to EXTRA_PROD_MIMIC_SOURCES in the sweep env (comma-separated):
//   EXTRA_PROD_MIMIC_SOURCES=src_ABC123,src_DEF456
const PROD_MIMIC_SOURCES = new Set([
  'src_GDKORXSW4Q8RQUQ8', // Vacaville Grappling Academy production
  ...(process.env.EXTRA_PROD_MIMIC_SOURCES || '').split(',').map(s => s.trim()).filter(Boolean),
]);
const SANDBOX_MIMIC_DEFAULT = 'src_4R4DUIQTMMX2NFPU'; // GS Ads sandbox

async function main() {
  const botId      = getEnv('CB_TEST_BOT_ID');
  const personaPath = getEnv('PERSONA');
  const rubricPath  = getEnv('RUBRIC');

  // Hard guardrail: refuse to run if mimic source resolves to a production GHL.
  const mimicResolved = process.env.MIMIC_SOURCE_ID || SANDBOX_MIMIC_DEFAULT;
  if (PROD_MIMIC_SOURCES.has(mimicResolved) && process.env.ALLOW_PROD_MIMIC !== 'true') {
    console.error(`FATAL: MIMIC_SOURCE_ID=${mimicResolved} routes to a live client GHL.`);
    console.error(`Running this eval would create real production bookings. Refusing.`);
    console.error(`If this is intentional (e.g. validating a production deploy), set ALLOW_PROD_MIMIC=true explicitly.`);
    process.exit(2);
  }
  // If MIMIC_SOURCE_ID was unset, default to the sandbox so tests never fall through to a prod source by accident.
  if (!process.env.MIMIC_SOURCE_ID) process.env.MIMIC_SOURCE_ID = SANDBOX_MIMIC_DEFAULT;

  const persona = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, personaPath), 'utf8'));
  const rubric  = loadRubric(path.resolve(REPO_ROOT, rubricPath));

  const runId = `${rubric.bot}_${persona.persona_id}_${ts()}`;
  const runDir = path.join(REPO_ROOT, 'shared/logs/eval', runId);
  fs.mkdirSync(runDir, { recursive: true });
  const logFile = path.join(runDir, 'run.log');
  fs.writeFileSync(logFile, '');
  const log = mkLog(logFile);

  log(`=== Eval orchestrator MVP ===`);
  log(`run_id: ${runId}`);
  log(`bot_id: ${botId}`);
  log(`persona: ${persona.persona_id}`);
  log(`rubric:  ${rubric.rubric_id} (${rubric.checkpoints.length} checkpoints)`);
  log(`runDir:  ${runDir}`);
  log('');

  log('--- Step 1: Run Tester ---');
  const runStartMs = Date.now();
  const { transcript, terminationReason, identity, events } = await runTester(botId, persona, { onLog: log });
  const runEndMs = Date.now();
  log(`Tester complete. messages=${transcript.length}, termination=${terminationReason}`);
  log(`Test identity used: ${identity.fullName} | ${identity.email} | ${identity.phone}`);

  // Persist SSE events so we can trace which node fired vs what the bot said.
  // Required for diagnosing routing bugs (e.g. bot says "you're booked" but
  // contact ends up tagged unaccompanied_minor with 0 appointments).
  const eventsPath = path.join(runDir, 'events.json');
  fs.writeFileSync(eventsPath, JSON.stringify(events || [], null, 2));
  log(`wrote ${eventsPath} (${(events || []).length} events)`);
  log('');

  const meta = {
    run_id: runId,
    bot_id: botId,
    persona_id: persona.persona_id,
    terminationReason,
    rubric,
  };

  log('--- Step 2: Write transcript.md ---');
  const transcriptPath = path.join(runDir, 'transcript.md');
  writeTranscriptMd(transcriptPath, transcript, meta);
  log(`wrote ${transcriptPath}`);
  log('');

  log('--- Step 3: Run QA agent (with age annotations) ---');
  const ageAnnotations = computeAgeAnnotations(transcript, new Date());
  if (ageAnnotations.length) {
    log(`Pre-computed ${ageAnnotations.length} age annotation(s) from DOBs in transcript:`);
    for (const a of ageAnnotations) log(`  T${a.turn}: DOB ${a.dob_iso} → age ${a.age}`);
  } else {
    log('No DOBs detected in lead messages.');
  }
  const score = await runQa(rubric, transcript, {
    run_id: runId,
    bot_id: botId,
    persona_id: persona.persona_id,
    age_annotations: ageAnnotations,
  });
  log(`QA verdict: ${score.overall_verdict} (blockers=${score.blocker_fails}, standard=${score.standard_fails}, flags=${score.flags})`);

  const scorePath = path.join(runDir, 'score.json');
  fs.writeFileSync(scorePath, JSON.stringify(score, null, 2));
  log(`wrote ${scorePath}`);
  log('');

  log('--- Step 4: Run verifier (GHL ground-truth) ---');
  // Verifier credentials must point at the SAME GHL location the bot wrote to.
  // The mimicSourceId determines that. Resolve from explicit override first, then by mimic mapping.
  const mimicId = process.env.MIMIC_SOURCE_ID;
  const isSandboxMimic = mimicId === SANDBOX_MIMIC_DEFAULT;
  const isProdMimic = PROD_MIMIC_SOURCES.has(mimicId);
  let ghlToken, ghlLocationId;
  if (process.env.GHL_VERIFY_TOKEN && process.env.GHL_VERIFY_LOCATION_ID) {
    ghlToken = process.env.GHL_VERIFY_TOKEN;
    ghlLocationId = process.env.GHL_VERIFY_LOCATION_ID;
  } else if (isSandboxMimic) {
    ghlToken = process.env.GHL_GS_API_TOKEN;
    ghlLocationId = process.env.GHL_GS_LOCATION_ID;
  } else if (isProdMimic) {
    ghlToken = process.env.GHL_VACAVILLE_API_TOKEN;
    ghlLocationId = process.env.GHL_VACAVILLE_LOCATION_ID;
  } else {
    // Unknown mimic source — do NOT fall back to GS Ads creds; that would read
    // from the wrong GHL account. Require explicit GHL_VERIFY_TOKEN + GHL_VERIFY_LOCATION_ID.
    // New client sweeps: set those two vars in the sweep env or chain the client .env.
    ghlToken = null;
    ghlLocationId = null;
    log(`WARN: MIMIC_SOURCE_ID=${mimicId} is not a known sandbox or production source.`);
    log(`  Verifier disabled. Set GHL_VERIFY_TOKEN + GHL_VERIFY_LOCATION_ID to enable it.`);
  }
  let verified = null;
  let ghlFacts = null;
  if (!ghlToken || !ghlLocationId) {
    log('SKIP: no GHL credentials in env (set GHL_VERIFY_TOKEN/GHL_VERIFY_LOCATION_ID or chain client .env). Verifier disabled.');
  } else {
    try {
      const result = await runVerifier({
        identity,
        transcript,
        score,
        rubric,
        ghl: { token: ghlToken, locationId: ghlLocationId },
        opts: {
          onLog: log,
          runDate: new Date(),
          // Run window with 60s padding on each side to absorb clock skew between
          // local machine and GHL server. Used by the kid-only / referral fallback
          // when primary identity search fails.
          runWindow: { start: runStartMs - 60_000, end: runEndMs + 60_000 },
        },
      });
      verified = result.verified_score;
      ghlFacts = result.ghl_facts;
      log(`Verifier: ghl_found=${ghlFacts.found}, appointments=${ghlFacts.appointments.length}, tags=${ghlFacts.tags.length}, overrides=${verified.verifier_overrides.length}`);
      log(`Verified verdict: ${verified.overall_verdict} (blockers=${verified.blocker_fails}, standard=${verified.standard_fails}, flags=${verified.flags})`);
      const verifiedScorePath = path.join(runDir, 'verified_score.json');
      fs.writeFileSync(verifiedScorePath, JSON.stringify(verified, null, 2));
      log(`wrote ${verifiedScorePath}`);
      const ghlFactsPath = path.join(runDir, 'ghl_facts.json');
      fs.writeFileSync(ghlFactsPath, JSON.stringify(ghlFacts, null, 2));
      log(`wrote ${ghlFactsPath}`);
    } catch (err) {
      log(`Verifier FAILED (non-fatal): ${err.message}`);
    }
  }
  log('');

  // Step 4b: Judge agent v2 — full LLM cross-reference of CloseBot side + GHL side
  if (ghlToken && ghlLocationId) {
    log('--- Step 4b: Judge agent v2 (cross-reference CloseBot + GHL) ---');
    try {
      // Build the unique test key
      const testKey = {
        run_id: runId,
        email_fingerprint: extractFingerprint(identity.email),
        lead_id: meta.lead_id || '(unknown)', // pulled from tester transcript metadata if available
        test_identity_summary: `${identity.fullName} | ${identity.email} | ${identity.phone}`,
      };

      // Build CloseBot side from events.json + transcript
      const closebotData = extractClosebotData(events, transcript, testKey.lead_id);

      // Build GHL side: pull full contact detail + resolve custom field names + resolve calendar names
      let ghlData = { contact: null, custom_fields_named: [], appointments: [], attempted_lookup: { email: identity.email } };
      if (ghlFacts?.found && ghlFacts.contact_id) {
        const r = await fetch(`https://services.leadconnectorhq.com/contacts/${ghlFacts.contact_id}`, {
          headers: { 'Authorization': `Bearer ${ghlToken}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
        });
        if (r.ok) {
          const j = await r.json();
          const contact = j.contact || j;
          ghlData.contact = {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            dateOfBirth: contact.dateOfBirth,
            tags: contact.tags || [],
            dateAdded: contact.dateAdded,
            dateUpdated: contact.dateUpdated,
          };
          ghlData.custom_fields_named = await resolveCustomFieldNames(contact.customFields || [], ghlToken, ghlLocationId);
          ghlData.appointments = await resolveAppointmentCalendars(ghlFacts.appointments || [], ghlToken, ghlLocationId);
        }
      }

      const judgeResult = await runJudge({
        test_key: testKey,
        closebot: closebotData,
        ghl: ghlData,
        persona,
        rubric,
      });
      log(`Judge verdict: ${judgeResult.assessment.verdict} (severity=${judgeResult.assessment.severity || 'n/a'})`);
      log(`Judge summary: ${judgeResult.assessment.summary}`);
      log(`Judge production_safe: ${judgeResult.assessment.production_safety?.safe_for_real_customers}`);
      log(`Test key used: fingerprint=${testKey.email_fingerprint}, lead_id=${testKey.lead_id}, ghl_contact_id=${ghlData.contact?.id || '(not found)'}`);
      const judgePath = path.join(runDir, 'judge_assessment.json');
      fs.writeFileSync(judgePath, JSON.stringify(judgeResult.assessment, null, 2));
      log(`wrote ${judgePath} (prompt=${judgeResult.prompt_chars} chars)`);
    } catch (err) {
      log(`Judge FAILED (non-fatal): ${err.message}\n${err.stack}`);
    }
    log('');
  }

  log('--- Step 5: Write report.md ---');
  const reportPath = path.join(runDir, 'report.md');
  writeReportMd(reportPath, score, meta, { verified, ghlFacts, ageAnnotations, identity });
  log(`wrote ${reportPath}`);
  log('');

  log('=== ORCHESTRATOR COMPLETE ===');
  log(`Open: ${path.relative(REPO_ROOT, reportPath)}`);
}

main().then(() => {
  // Force exit — SSE reader may have lingering fetch handles that hold the event loop open.
  process.exit(0);
}).catch(err => {
  console.error(`FATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
