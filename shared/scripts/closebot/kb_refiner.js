/**
 * CloseBot KB / Persona Evaluator-Optimizer
 *
 * Usage:
 *   node --env-file=.env shared/scripts/closebot/kb_refiner.js \
 *     --input <file> \
 *     --type kb|persona \
 *     --max-iterations 3 \
 *     --output <file>          (optional; defaults to <input>_refined.txt)
 *
 * Required env: OPENAI_API_KEY
 * Model: gpt-4o
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const standardsPath = path.join(__dirname, '../../../shared/standards/closebot_build_standards.md');
const MODEL = 'gpt-4o';

fs.mkdirSync(logDir, { recursive: true });

// ─── env + args ──────────────────────────────────────────────────────────────

function getEnv(k) {
  if (!process.env[k]) { console.error(`FATAL: missing env var ${k}`); process.exit(1); }
  return process.env[k];
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { input: null, type: 'kb', maxIterations: 3, output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input')          result.input         = args[++i];
    if (args[i] === '--type')           result.type          = args[++i];
    if (args[i] === '--max-iterations') result.maxIterations = parseInt(args[++i]);
    if (args[i] === '--output')         result.output        = args[++i];
  }
  if (!result.input) {
    console.error('Usage: kb_refiner.js --input <file> [--type kb|persona] [--max-iterations 3] [--output <file>]');
    process.exit(1);
  }
  if (!['kb', 'persona'].includes(result.type)) {
    console.error('--type must be "kb" or "persona"');
    process.exit(1);
  }
  return result;
}

// ─── judge schema (OpenAI function calling forces structured output) ─────────

const CHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pass', 'issues'],
  properties: {
    pass:   { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } },
  },
};

const JUDGE_FUNCTION = {
  type: 'function',
  function: {
    name: 'evaluate_content',
    description: 'Evaluate KB or persona content against CloseBot build standards. Return structured pass/fail results. Quote exact failing text in issues arrays.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['kb_check', 'persona_check', 'structure_check', 'overall_pass', 'iteration', 'summary'],
      properties: {
        kb_check: {
          type: 'object',
          additionalProperties: false,
          required: ['no_instructional_language', 'no_pricing_content', 'no_placeholder_text', 'no_source_bleed', 'facts_only', 'no_changelog_content'],
          properties: {
            no_instructional_language: CHECK_SCHEMA,
            no_pricing_content:        CHECK_SCHEMA,
            no_placeholder_text:       CHECK_SCHEMA,
            no_source_bleed:           CHECK_SCHEMA,
            facts_only:                CHECK_SCHEMA,
            no_changelog_content:      CHECK_SCHEMA,
          },
        },
        persona_check: {
          type: 'object',
          additionalProperties: false,
          required: ['no_corporate_language', 'no_banned_phrases', 'nepq_methodology', 'booking_truth_rule'],
          properties: {
            no_corporate_language: CHECK_SCHEMA,
            no_banned_phrases:     CHECK_SCHEMA,
            nepq_methodology:      CHECK_SCHEMA,
            booking_truth_rule:    CHECK_SCHEMA,
          },
        },
        structure_check: {
          type: 'object',
          additionalProperties: false,
          required: ['scenario_descriptions_under_25_words', 'no_booking_language_before_booking_node'],
          properties: {
            scenario_descriptions_under_25_words:    CHECK_SCHEMA,
            no_booking_language_before_booking_node: CHECK_SCHEMA,
          },
        },
        overall_pass: { type: 'boolean' },
        iteration:    { type: 'integer' },
        summary:      { type: 'string' },
      },
    },
    strict: true,
  },
};

// ─── API calls ────────────────────────────────────────────────────────────────

async function callOpenAI({ messages, tools, toolChoice, maxTokens = 4096 }) {
  const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
  const body = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
  };
  if (tools)      body.tools       = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { error: t.slice(0, 500) }; }
}

// ─── judge ───────────────────────────────────────────────────────────────────

async function judge(content, type, iteration, standards) {
  const autoPassNote = type === 'kb'
    ? 'Set all persona_check values to pass: true, issues: []. Set all structure_check values to pass: true, issues: [].'
    : 'Set all kb_check values to pass: true, issues: []. Set all structure_check values to pass: true, issues: [].';

  const systemContent = `You are a CloseBot build standards validator. Evaluate the provided ${type} content against the ruleset below.

${autoPassNote}

For the checks you DO evaluate: be precise. Quote the exact failing text in each issue string. A check fails only if there is a real violation — do not fail checks on technicalities or borderline cases. If in doubt, pass.

RULESET:
${standards}`;

  const response = await callOpenAI({
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user',   content: `CONTENT TYPE: ${type}\nITERATION: ${iteration}\n\nCONTENT TO EVALUATE:\n\n${content}` },
    ],
    tools: [JUDGE_FUNCTION],
    toolChoice: { type: 'function', function: { name: 'evaluate_content' } },
  });

  if (response.error) {
    console.error('Judge API error:', response.error);
    return null;
  }
  const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    console.error('Judge returned no tool_calls. Full response:', JSON.stringify(response).slice(0, 500));
    return null;
  }
  try {
    return JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error('Failed to parse judge arguments:', e.message);
    return null;
  }
}

// ─── editor ──────────────────────────────────────────────────────────────────

async function edit(content, type, judgeResult, standards) {
  const failingChecks = [];
  const allChecks = {
    ...judgeResult.kb_check,
    ...judgeResult.persona_check,
    ...judgeResult.structure_check,
  };
  for (const [key, val] of Object.entries(allChecks)) {
    if (!val.pass && val.issues.length > 0) {
      failingChecks.push(`[${key}]\n${val.issues.map(i => `  - ${i}`).join('\n')}`);
    }
  }

  const systemContent = `You are a CloseBot ${type} editor. You will receive a file and a list of specific issues to fix.

Rules:
- Fix ONLY the flagged issues. Do not change anything that passed review.
- Preserve all facts, section structure, headings, and formatting.
- Preserve the version number and any [INTERNAL FLAGS] appendix unchanged.
- Return the complete corrected file content only — no commentary, no preamble, no markdown fencing.

RULESET (for reference):
${standards}`;

  const response = await callOpenAI({
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user',   content: `ORIGINAL CONTENT:\n\n${content}\n\n---\n\nISSUES TO FIX:\n\n${failingChecks.join('\n\n')}\n\nFix only the above issues. Return the complete corrected content.` },
    ],
    maxTokens: 8096,
  });

  if (response.error) {
    console.error('Editor API error:', response.error);
    return null;
  }
  const text = response.choices?.[0]?.message?.content;
  return text?.trim() || null;
}

// ─── overall_pass recompute (don't trust the judge to compute AND logic) ──────

function computeOverallPass(judgeResult, type) {
  const relevantChecks = type === 'kb'
    ? Object.values(judgeResult.kb_check)
    : Object.values(judgeResult.persona_check);
  return relevantChecks.every(c => c.pass);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(standardsPath)) {
    console.error(`Standards file not found: ${standardsPath}`);
    process.exit(1);
  }

  const standards = fs.readFileSync(standardsPath, 'utf8');
  let content     = fs.readFileSync(inputPath, 'utf8');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logPath   = path.join(logDir, `refiner_${timestamp}.log`);
  const auditEntries = [];

  function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    auditEntries.push(line);
  }

  log('=== KB Refiner ===');
  log(`Model:          ${MODEL}`);
  log(`Input:          ${inputPath}`);
  log(`Type:           ${args.type}`);
  log(`Max iterations: ${args.maxIterations}`);

  let finalJudge = null;
  let passedOnIteration = null;

  for (let i = 1; i <= args.maxIterations; i++) {
    log(`\n--- Iteration ${i} ---`);
    log('Running judge...');

    const judgeResult = await judge(content, args.type, i, standards);
    if (!judgeResult) {
      log('FATAL: Judge returned null. Aborting.');
      process.exit(1);
    }

    // Recompute overall_pass client-side
    judgeResult.overall_pass = computeOverallPass(judgeResult, args.type);
    finalJudge = judgeResult;

    log(`Summary:        ${judgeResult.summary}`);
    log(`Overall pass:   ${judgeResult.overall_pass}`);

    // Log each failing check
    const allChecks = {
      ...judgeResult.kb_check,
      ...judgeResult.persona_check,
      ...judgeResult.structure_check,
    };
    for (const [key, val] of Object.entries(allChecks)) {
      if (!val.pass) {
        val.issues.forEach(issue => log(`  FAIL [${key}]: ${issue}`));
      }
    }

    if (judgeResult.overall_pass) {
      passedOnIteration = i;
      log(`\nPASSED on iteration ${i}.`);
      break;
    }

    if (i === args.maxIterations) {
      log(`\nMax iterations (${args.maxIterations}) reached. Some checks still failing.`);
      break;
    }

    log('Running editor...');
    const edited = await edit(content, args.type, judgeResult, standards);
    if (!edited) {
      log('FATAL: Editor returned null. Aborting.');
      process.exit(1);
    }
    content = edited;
    log('Editor complete.');
  }

  // Write output file
  const ext        = path.extname(inputPath);
  const base       = path.basename(inputPath, ext);
  const outputPath = args.output || path.join(path.dirname(inputPath), `${base}_refined${ext}`);
  fs.writeFileSync(outputPath, content, 'utf8');
  log(`\nOutput written: ${outputPath}`);

  // Write audit log (text + JSON)
  fs.writeFileSync(logPath, auditEntries.join('\n') + '\n', 'utf8');
  const jsonLogPath = logPath.replace('.log', '.json');
  fs.writeFileSync(jsonLogPath, JSON.stringify({ args, finalJudge, passedOnIteration }, null, 2), 'utf8');

  // Final summary
  console.log('\n=== SUMMARY ===');
  console.log(`Result:    ${finalJudge?.overall_pass ? `PASS (iteration ${passedOnIteration})` : `FAIL — see ${logPath}`}`);
  console.log(`Output:    ${outputPath}`);
  console.log(`Audit log: ${logPath}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
