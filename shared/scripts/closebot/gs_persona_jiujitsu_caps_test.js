/**
 * SSE smoke test — verify Emma "Jiu-Jitsu capitalization" rule influences bot output.
 *
 * Picks a recently-rebuilt Agent Node bot, opens an ephemeral test session
 * (no mimicSourceId — won't touch GHL), sends a baiting message designed to
 * make the bot mention jiu-jitsu in its reply, and inspects capitalization.
 *
 * Pass criteria: bot reply contains "Jiu-Jitsu" with both J's capped, and
 * does NOT contain lowercase "jiu-jitsu" or "jiu jitsu" or "jiujitsu".
 *
 * Note: a single sample is not statistically conclusive — LLMs occasionally
 * slip on casing. If a slip happens, retry or send a second probe; the
 * persona-level rule is a strong nudge, not a hard filter.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
const LOG = path.join(logDir, 'gs_persona_jiujitsu_caps_test.log');
fs.mkdirSync(logDir, { recursive: true });

const BASE = 'https://api.closebot.com';
// Killer B Combat Sports Academy - Launch v1.1 [Agent Node, most recent fix]
const TEST_BOT = 'bot_FMMFAFOFG7IG89XI';

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function getEnv(k) { if (!process.env[k]) { log(`FATAL: missing ${k}`); process.exit(1); } return process.env[k]; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(method, ep, body) {
  const headers = { 'X-CB-KEY': getEnv('CB_GS_API_KEY') };
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BASE}${ep}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t), raw: t }; }
  catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 800) }, raw: t }; }
}

async function readBotReply(botId, leadId, key, timeoutMs = 45000) {
  const sse = await fetch(`${BASE}/bot/${botId}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': key, 'Accept': 'text/event-stream' },
  });
  const reader = sse.body.getReader();
  const dec = new TextDecoder();
  const start = Date.now();
  let buf = '', botMsg = null;
  while (Date.now() - start < timeoutMs) {
    const result = await Promise.race([
      reader.read(),
      new Promise(r => setTimeout(() => r({ done: false, value: null, _to: true }), 1000)),
    ]);
    if (result.done) break;
    if (!result.value) continue;
    buf += dec.decode(result.value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (!d) continue;
      try {
        const evt = JSON.parse(d);
        if (evt.message && evt.sender !== 'lead') { botMsg = evt.message; break; }
      } catch {}
    }
    if (botMsg) break;
  }
  try { reader.releaseLock(); } catch {}
  return { reply: botMsg, elapsed: ((Date.now() - start) / 1000).toFixed(1) };
}

function inspectCasing(text) {
  if (!text) return { verdict: 'NO_REPLY', findings: [] };
  const findings = [];
  // Exact correct form
  const hasCorrect = /\bJiu-Jitsu\b/.test(text);
  // Bad lowercase variants (case-sensitive matches that are wrong)
  const lowerHyphen = /\bjiu-jitsu\b/.test(text);
  const mixedSecondLower = /\bJiu-jitsu\b/.test(text);
  const noHyphen = /\bjiujitsu\b/i.test(text);
  const spaceVariant = /\bjiu jitsu\b/i.test(text); // any casing of the space form

  findings.push({ ok: hasCorrect, label: 'contains "Jiu-Jitsu" (correct)' });
  findings.push({ ok: !lowerHyphen, label: 'no "jiu-jitsu" (lowercase)' });
  findings.push({ ok: !mixedSecondLower, label: 'no "Jiu-jitsu" (mixed)' });
  findings.push({ ok: !noHyphen, label: 'no "jiujitsu" (no hyphen)' });
  findings.push({ ok: !spaceVariant, label: 'no "jiu jitsu" (space)' });

  // Only meaningful if the term came up at all
  const mentionedAtAll = hasCorrect || lowerHyphen || mixedSecondLower || noHyphen || spaceVariant;
  const allGood = findings.every(f => f.ok);
  let verdict;
  if (!mentionedAtAll) verdict = 'TERM_NOT_MENTIONED';
  else if (allGood) verdict = 'PASS';
  else verdict = 'FAIL';
  return { verdict, findings, mentionedAtAll };
}

async function probe(label, message) {
  log(`\n--- probe: ${label} ---`);
  log(`  message: "${message}"`);

  const sess = await api('POST', `/bot/${TEST_BOT}/testSession`, {});
  if (!sess.ok) { log(`  ❌ session create failed: ${sess.status} ${JSON.stringify(sess.json).slice(0, 200)}`); return null; }
  const leadId = sess.json.leadId || sess.json.id;
  log(`  leadId: ${leadId}`);

  // Open SSE first, then post message — matches experiment_a pattern
  const ssePromise = readBotReply(TEST_BOT, leadId, getEnv('CB_GS_API_KEY'));
  await sleep(800);
  const send = await api('POST', `/bot/${TEST_BOT}/testSession/message`, { leadId, message });
  if (!send.ok) { log(`  ❌ send failed: ${send.status}`); return null; }
  const { reply, elapsed } = await ssePromise;
  log(`  bot reply (${elapsed}s):`);
  log(`    "${reply || '(none)'}"`);

  const insp = inspectCasing(reply);
  log(`  verdict: ${insp.verdict}`);
  for (const f of insp.findings) log(`    ${f.ok ? '✓' : '✗'} ${f.label}`);
  return { label, message, reply, ...insp };
}

async function main() {
  log('=== SSE smoke test: Jiu-Jitsu capitalization persona rule ===');
  log(`bot: ${TEST_BOT} (Killer B v1.1, Agent Node)`);

  const probes = [
    ['direct ask', "Tell me about your jiu-jitsu classes."],
    ['casual mention', "hi! is this a jiu jitsu school?"],
  ];

  const results = [];
  for (const [label, msg] of probes) {
    const r = await probe(label, msg);
    if (r) results.push(r);
    await sleep(1500);
  }

  log('\n=== SUMMARY ===');
  for (const r of results) log(`  ${r.label}: ${r.verdict}`);
  const fails = results.filter(r => r.verdict === 'FAIL');
  if (fails.length === 0) log('  ✅ no FAIL verdicts');
  else log(`  ❌ ${fails.length} FAIL — persona rule not holding`);
  log('=== DONE ===');
}

main().catch(e => { log('FATAL: ' + e.message); console.error(e); process.exit(1); });
