/**
 * Add "Jiu-Jitsu" capitalization rule to the shared GS Emma persona.
 *
 * Why: bot was caught writing "jiu-jitsu" lowercase in a real reply (2026-05-20).
 * Bobby wants the term capitalized across all GS gym bots.
 *
 * Approach: insert a one-paragraph "Capitalization" rule into Emma's howToRespond,
 * placed right after the existing "Punctuation" paragraph. Persona is shared
 * across all 119 GS bots so one edit covers everyone.
 *
 * Idempotent: detects if the rule is already present and skips.
 *
 * Safe order: GET current → splice in rule → PUT back → re-GET → verify substring.
 * Aborts on any mismatch.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_persona_jiujitsu_caps.log');
fs.mkdirSync(logDir, { recursive: true });

const EMMA_ID = 'pers_CB1LLPENDKDRB5S2';
const BASE = 'https://api.closebot.com';

const RULE_SENTINEL = 'Capitalization: always write "Jiu-Jitsu"';
const RULE_PARAGRAPH = 'Capitalization: always write "Jiu-Jitsu" with both J\'s capitalized and a hyphen, and "Brazilian Jiu-Jitsu" the same way. Never write "jiu-jitsu", "Jiu-jitsu", or "jiujitsu".';

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }

async function api(method, ep, body) {
  const headers = { 'X-CB-KEY': getEnv('CB_GS_API_KEY') };
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BASE}${ep}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t), raw: t }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 800) }, raw: t }; }
}

async function main() {
  log('=== Emma persona — add Jiu-Jitsu capitalization rule ===');

  // Step 1: GET current persona
  log('--- GET /persona/{id} ---');
  const g = await api('GET', `/persona/${EMMA_ID}`);
  log(`  status=${g.status}`);
  if (!g.ok) { log('FATAL: ' + JSON.stringify(g.json).slice(0, 400)); process.exit(1); }

  const current = g.json.howToRespond || '';
  log(`  name: ${g.json.personaName}`);
  log(`  current howToRespond length: ${current.length}`);

  // Step 2: Idempotency check
  if (current.includes(RULE_SENTINEL)) {
    log('  ✅ Rule already present — nothing to do. Exiting.');
    return;
  }

  // Step 3: Construct new value — insert after the "Punctuation:" paragraph
  // Heuristic: split on blank-line paragraph boundaries, find the paragraph
  // starting with "Punctuation:", insert the new rule right after it.
  const paragraphs = current.split(/\n\n/);
  const punctIdx = paragraphs.findIndex(p => p.startsWith('Punctuation:'));
  if (punctIdx < 0) {
    log('  ⚠️  Could not find "Punctuation:" anchor — appending at end instead');
    paragraphs.push(RULE_PARAGRAPH);
  } else {
    paragraphs.splice(punctIdx + 1, 0, RULE_PARAGRAPH);
    log(`  inserted at paragraph index ${punctIdx + 1} (after Punctuation)`);
  }
  const updated = paragraphs.join('\n\n');
  log(`  new howToRespond length: ${updated.length} (delta +${updated.length - current.length})`);

  // Backup
  const backupPath = path.join(logDir, `emma_howtorespond_backup_${Date.now()}.txt`);
  fs.writeFileSync(backupPath, current);
  log(`  backup saved: ${backupPath}`);

  // Step 4: PUT update
  log('--- PUT /persona/{id} ---');
  const u = await api('PUT', `/persona/${EMMA_ID}`, { howToRespond: updated });
  log(`  status=${u.status}`);
  if (!u.ok) {
    log('FATAL update failed: ' + JSON.stringify(u.json).slice(0, 800));
    process.exit(1);
  }

  // Step 5: GET to verify
  log('--- GET /persona/{id} (verify) ---');
  const v = await api('GET', `/persona/${EMMA_ID}`);
  if (!v.ok) { log('FATAL re-read: ' + JSON.stringify(v.json).slice(0, 400)); process.exit(1); }
  const after = v.json.howToRespond || '';
  log(`  after length: ${after.length}`);

  if (!after.includes(RULE_SENTINEL)) {
    log('❌ FAIL: rule sentinel NOT found in re-read howToRespond. Persona may not have updated.');
    process.exit(1);
  }
  log('  ✅ rule sentinel confirmed in re-read.');

  // Show surrounding context
  const idx = after.indexOf('Capitalization:');
  log('  context (±120 chars):');
  log(`    ${JSON.stringify(after.slice(Math.max(0, idx - 120), idx + 280))}`);

  log('=== DONE — persona updated successfully ===');
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
