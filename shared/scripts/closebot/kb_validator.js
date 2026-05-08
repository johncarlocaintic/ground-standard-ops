/**
 * KB Validator v1.0.1 (2026-04-23)
 *
 * Hard-coded enforcement of CloseBot KB content rules.
 * Rule reference: references/kb_validator_rules.md
 *
 * Usage:
 *   node --env-file=.env shared/scripts/closebot/kb_validator.js --file <path>
 *   node --env-file=.env shared/scripts/closebot/kb_validator.js --file <path> --bleed "Term1,Term2"
 *   cat kb.txt | node --env-file=.env shared/scripts/closebot/kb_validator.js --stdin
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const VERSION = '1.0.1';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'kb_validator.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

// ─── Rule definitions ──────────────────────────────────────────────────────────
// Each rule: { id, group, severity, pattern, description }
// severity: 'FAIL' = hard stop (exit 1), 'WARN' = print but continue

const RULES = [
  // Group A — Instructional Language
  { id: 'A001', group: 'A', severity: 'FAIL', pattern: /\byou (must|should|need to|have to|are required to)\b/i,    description: 'Direct command to bot' },
  { id: 'A002', group: 'A', severity: 'FAIL', pattern: /\balways (say|respond|reply|tell|ask)\b/i,                   description: 'Hardcoded response instruction' },
  { id: 'A003', group: 'A', severity: 'FAIL', pattern: /\bnever (say|mention|discuss|tell)\b/i,                       description: 'Negative behavior command' },
  { id: 'A004', group: 'A', severity: 'FAIL', pattern: /\brespond (with|by saying)\b/i,                               description: 'Scripted response phrase' },
  { id: 'A005', group: 'A', severity: 'FAIL', pattern: /\btell (the|them|leads?|contacts?|customers?)\b/i,            description: 'Tell-the-bot directive' },
  { id: 'A006', group: 'A', severity: 'FAIL', pattern: /\bdo not (say|mention|discuss|reveal)\b/i,                    description: 'Prohibition instruction' },

  // Group B — Pricing
  { id: 'B001', group: 'B', severity: 'FAIL', pattern: /\$\d/,                                                        description: 'Dollar sign + number' },
  { id: 'B002', group: 'B', severity: 'FAIL', pattern: /\b\d+\s*(dollars?|\/mo|per month|per class|\/class|\/session)\b/i, description: 'Written-out price' },
  // B003 intentionally omitted: "free trial class" is a common product name (e.g. martial arts gyms)
  // and generates too many false positives. Re-add if a client KB contains actual no-cost offers
  // that should be redirected to a human instead.

  // Group C — Booking Language (bot must not pre-commit to booking; that lives in the GHL Booking node)
  // Scoped to bot-voice phrasing (first-person "I will", second-person "you're booked").
  // FAQ questions that contain "book a trial class" are false positives — skip Q: lines.
  { id: 'C001', group: 'C', severity: 'FAIL', pattern: /^(?!Q:).*\bI('ll| will) (book|schedule|set up|arrange)\b/i,  description: 'First-person booking promise' },
  { id: 'C002', group: 'C', severity: 'FAIL', pattern: /\byou('re| are) (booked|scheduled|confirmed|all set)\b/i,     description: 'Booking confirmation language' },
  { id: 'C003', group: 'C', severity: 'FAIL', pattern: /^(?!Q:|A:).*\b(book|schedule|reserve)\s+(you|your)\s+(class|session|appointment|slot|trial|visit)\b/i, description: 'Bot-voice direct booking phrase (not in Q&A)' },

  // Group D — Placeholders
  { id: 'D001', group: 'D', severity: 'FAIL', pattern: /\[.*?\]/,                                                     description: 'Square bracket placeholder' },
  { id: 'D002', group: 'D', severity: 'FAIL', pattern: /\{.*?\}/,                                                     description: 'Curly brace placeholder' },
  { id: 'D003', group: 'D', severity: 'FAIL', pattern: /\bTBD\b|\bTBC\b|\bPLACEHOLDER\b|\bINSERT\b|\bXXX\b/i,       description: 'Draft token' },
  { id: 'D004', group: 'D', severity: 'FAIL', pattern: /lorem ipsum/i,                                                description: 'Lorem ipsum filler' },
];

// ─── Arg parsing ───────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: null, stdin: false, bleedTerms: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) opts.file = args[++i];
    if (args[i] === '--stdin') opts.stdin = true;
    if (args[i] === '--bleed' && args[i + 1]) {
      opts.bleedTerms = args[++i].split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  return opts;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function buildBleedRules(terms) {
  return terms.map((term, i) => ({
    id: `E${String(i + 1).padStart(3, '0')}`,
    group: 'E',
    severity: 'FAIL',
    pattern: new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
    description: `Cross-client bleed: "${term}"`,
  }));
}

function validateLines(lines, rules) {
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const text = lines[i];
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        hits.push({ lineNum, text: text.trim(), rule });
      }
    }
  }
  return hits;
}

// ─── Output ────────────────────────────────────────────────────────────────────

function printResults(hits, label) {
  const fails = hits.filter(h => h.rule.severity === 'FAIL');
  const warns = hits.filter(h => h.rule.severity === 'WARN');

  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`KB Validator v${VERSION} — ${label}`);
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (hits.length === 0) {
    log('✅ PASS — no violations found.');
    return true;
  }

  for (const h of fails) {
    log(`❌ FAIL [${h.rule.id}] line ${h.lineNum}: ${h.rule.description}`);
    log(`   → "${h.text.substring(0, 120)}"`);
  }
  for (const h of warns) {
    log(`⚠️  WARN [${h.rule.id}] line ${h.lineNum}: ${h.rule.description}`);
    log(`   → "${h.text.substring(0, 120)}"`);
  }

  log(`\nSummary: ${fails.length} FAIL, ${warns.length} WARN`);

  if (fails.length > 0) {
    log('❌ KB did not pass — fix violations before deploying.');
    return false;
  } else {
    log('✅ PASS (with warnings) — review warnings before deploying.');
    return true;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function readStdin() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    const lines = [];
    rl.on('line', l => lines.push(l));
    rl.on('close', () => resolve(lines));
  });
}

async function main() {
  const opts = parseArgs();

  if (!opts.file && !opts.stdin) {
    log('Usage: kb_validator.js --file <path> [--bleed "Term1,Term2"]');
    log('       cat kb.txt | kb_validator.js --stdin');
    process.exit(1);
  }

  let lines;
  let label;

  if (opts.stdin) {
    lines = await readStdin();
    label = 'stdin';
  } else {
    const absPath = path.resolve(opts.file);
    if (!fs.existsSync(absPath)) {
      log(`File not found: ${absPath}`);
      process.exit(1);
    }
    lines = fs.readFileSync(absPath, 'utf8').split('\n');
    label = path.basename(absPath);
  }

  const allRules = [...RULES, ...buildBleedRules(opts.bleedTerms)];
  const hits = validateLines(lines, allRules);
  const passed = printResults(hits, label);

  process.exit(passed ? 0 : 1);
}

main().catch(err => {
  log(`Fatal: ${err.message}`);
  process.exit(1);
});
