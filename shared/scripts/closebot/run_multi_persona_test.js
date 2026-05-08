// run_multi_persona_test.js
// Runs a suite of persona-specific SSE conversations against a CloseBot bot.
// Evaluates each bot reply against compliance rules (hard rules only in v1).
// Aggregates pass/fail summary at the end.
//
// Usage:
//   CB_TEST_BOT_ID=bot_XXX node --env-file=.env --env-file=clients/ground-standard/.env shared/scripts/closebot/run_multi_persona_test.js
//
// Optional: PERSONAS=happy_adult,parent_one_kid_age5 to run a subset.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'multi_persona_test.log');
fs.writeFileSync(logFile, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function getEnv(key) {
  const val = process.env[key];
  if (!val) { log(`FATAL: Missing env var: ${key}`); process.exit(1); }
  return val;
}

const BASE           = 'https://api.closebot.com';
const CB_KEY         = getEnv('CB_GS_API_KEY');
const OAIK           = getEnv('OPENAI_API_KEY');
const BOT_ID         = getEnv('CB_TEST_BOT_ID');
const BOT_TIMEOUT_MS = 60000;
const DRAIN_MS       = 4000;

const CB_HEADERS = { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' };

// ── Personas ──────────────────────────────────────────────────────────────────
// Each persona has:
//   id          — short name for reporting
//   maxTurns    — how many lead→bot cycles
//   persona     — character description for GPT to play
//   opening     — the lead's first message
//   expect      — free-text "what should happen" for the report

const PERSONAS = [
  {
    id: 'happy_adult',
    maxTurns: 10,
    opening: "Hey, saw your ad. I'm an adult looking to try jiu-jitsu for myself. How do I get started?",
    persona: "You are Alex, 28 years old, male, no martial arts experience. You want to try a free trial class for yourself only. You will provide information when asked (name: Alex Rivera, DOB: 1997-06-15, email: alex.rivera@test.com, phone: 555-204-1100). You are polite and cooperative.",
    expect: "Bot should collect last name, DOB, email, phone, then book Adult No-Gi Submission Grappling.",
  },
  {
    id: 'parent_one_kid_age5',
    maxTurns: 12,
    opening: "Hi, my daughter is 5 and I want to enroll her in a trial jiu-jitsu class.",
    persona: "You are Morgan Chen, a parent inquiring ONLY for your 5-year-old daughter (not yourself). Your daughter is Sofia Chen, DOB: 2020-09-10. Your own info: DOB 1988-04-22, email morgan.chen@test.com, phone 555-319-0077. You are in the area. You will only provide info when asked. Do not ask to enroll yourself.",
    expect: "Bot should collect parent info + kid name + kid DOB, then book Kids 3-5 BJJ for Sofia. No adult booking.",
  },
  {
    id: 'parent_one_kid_age10_overlap',
    maxTurns: 12,
    opening: "My 10-year-old wants to try jiu-jitsu. What program does he go into?",
    persona: "You are Jordan Lee, parent of Ethan Lee (age 10, DOB: 2015-11-20). You're only enrolling your son, not yourself. Your info: DOB 1982-02-12, email jordan.lee@test.com, phone 555-402-8866. Age 10 qualifies for both Kids 7-13 Jiu-Jitsu and Kids 10-14 BJJ — you're curious about the overlap but fine going with whatever the bot suggests.",
    expect: "Bot should book Ethan into either Kids 7-13 Jiu-Jitsu or Kids 10-14 BJJ. Either is valid per KB. Bot should NOT invent a new program.",
  },
  {
    id: 'parent_two_kids',
    maxTurns: 16,
    opening: "Hey, I want to enroll both my kids — ages 7 and 4 — in a trial class.",
    persona: "You are Sam Rivera, parent of Noah (age 7, DOB 2018-07-03) and Lily (age 4, DOB 2021-05-17). Only enrolling your kids, not yourself. Your info: DOB 1985-03-09, email sam.rivera.test@test.com, phone 555-600-2288. When the bot asks about another kid, say yes and give Lily's details.",
    expect: "Bot should book Noah into Kids 7-13 Jiu-Jitsu AND Lily into Kids 3-5 BJJ. Two bookings, same family.",
  },
  {
    id: 'adult_and_kid',
    maxTurns: 14,
    opening: "Hi I want to come try a class — and also bring my son (age 8) to try it too.",
    persona: "You are Casey Park, 35 years old. You want to try a class yourself AND bring your son Liam Park (age 8, DOB 2017-06-28). Your info: DOB 1990-11-02, email casey.park@test.com, phone 555-788-4411. Provide info when asked.",
    expect: "Bot should book Casey into Adult No-Gi AND Liam into Kids 7-13 Jiu-Jitsu. Two bookings.",
  },
  {
    id: 'age_6_edge',
    maxTurns: 8,
    opening: "My son is 6. Can he come try jiu-jitsu?",
    persona: "You are Riley Park, parent of Max Park (age 6, DOB 2019-08-14). You are just asking — you don't know if there's a program. Your info: DOB 1987-12-05, email riley.park@test.com, phone 555-998-7123. Be honest about Max's age.",
    expect: "Bot should explain there is no program currently available for age 6, citing KB. Should not force a booking. May offer to put them on a waitlist or follow up if program opens.",
  },
  {
    id: 'pricing_deflect',
    maxTurns: 10,
    opening: "Before I give you my info, how much does a membership cost?",
    persona: "You are Taylor Brooks, 30. You want to try a class but you're price-sensitive. First thing you ask about is cost. If the bot redirects, you're OK with that — you'll give your info (DOB 1994-10-15, email taylor.brooks@test.com, phone 555-455-9988). You'll also ask once more about the drop-in fee partway through.",
    expect: "Bot must use the approved pricing redirect wording EXACTLY. No dollar figures. No percentages. Can still collect info and book after redirecting.",
  },
  {
    id: 'wrestling_asker',
    maxTurns: 10,
    opening: "Do you offer wrestling classes? I wrestled in high school.",
    persona: "You are Drew Sanders, 24, former high school wrestler looking for a wrestling club. If the bot says they don't have a standalone wrestling program, you'll ask about jiu-jitsu instead and proceed to book (DOB 2001-03-14, email drew.sanders@test.com, phone 555-223-4477).",
    expect: "Bot should acknowledge grappling includes wrestling elements, but clarify there is no standalone wrestling program. Redirect to free trial class. Should NOT say 'yes we have wrestling classes'.",
  },
];

// ── Compliance Rules (hard fails) ─────────────────────────────────────────────
const HARD_RULES = [
  { id: 'H1_no_dollar',         pattern: /\$\s?\d|\bUSD\b|\bdollars\b/i,                  desc: 'No dollar figures' },
  { id: 'H2_no_kickbox',        pattern: /kickbox/i,                                       desc: 'No kickboxing mention (source bleed check)' },
  { id: 'H3_no_percent_discount', pattern: /\b\d{1,3}\s?%/,                                desc: 'No discount percentages' },
  { id: 'H4_no_standalone_wrestling', pattern: /wrestling (class|program|session)|we (have|offer).{0,30}wrestling/i, desc: 'No standalone wrestling offering' },
  { id: 'H5_no_sign_up_fee_figure', pattern: /sign.?up fee.{0,30}\$|\$\d{1,4}.{0,30}sign.?up/i, desc: 'No specific sign-up fee amount' },
];

function checkHardRules(botMessage) {
  return HARD_RULES.map(r => {
    const match = botMessage.match(r.pattern);
    return {
      id: r.id,
      desc: r.desc,
      passed: !match,
      matched: match ? match[0] : null,
    };
  });
}

// ── SSE Reader (same pattern as run_sse_test.js) ──────────────────────────────

function startSseReader(fetchRes) {
  const reader  = fetchRes.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';
  const queue   = [];
  let   waiter  = null;

  function deliver(msg) {
    if (waiter) {
      clearTimeout(waiter.timer);
      const { resolve } = waiter;
      waiter = null;
      resolve(msg);
    } else {
      queue.push(msg);
    }
  }

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { if (waiter) { waiter.reject(new Error('SSE stream closed')); waiter = null; } break; }
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let data = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('data: ')) data = line.slice(6).trim();
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'message-sent' && parsed.sender === 'bot' && parsed.message?.trim()) {
              deliver(parsed.message.trim());
            }
          } catch {}
        }
      }
    } catch (err) {
      if (waiter) { waiter.reject(err); waiter = null; }
    }
  })();

  return {
    next(timeoutMs) {
      return new Promise((resolve, reject) => {
        if (queue.length > 0) { resolve(queue.shift()); return; }
        const timer = setTimeout(() => {
          waiter = null;
          reject(new Error(`No bot reply within ${timeoutMs / 1000}s`));
        }, timeoutMs);
        waiter = { resolve, reject, timer };
      });
    },
  };
}

async function collectBotReply(sseReader) {
  const messages = [];
  messages.push(await sseReader.next(BOT_TIMEOUT_MS));
  try {
    while (true) messages.push(await sseReader.next(DRAIN_MS));
  } catch {}
  return messages.join('\n');
}

async function cbReq(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: CB_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function gptReply(conversation, persona) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OAIK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are simulating a real person texting a business chatbot. Persona: ${persona}\nKeep replies short and natural — 1-2 sentences. Never break character. Never ask multiple questions at once. Answer the bot's questions directly based on the persona's info.`,
        },
        ...conversation.map(m => ({
          role: m.sender === 'bot' ? 'user' : 'assistant',
          content: m.message,
        })),
      ],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ── Run one persona ───────────────────────────────────────────────────────────

async function runPersona(p) {
  log(`\n────────────────────────────────────────────────────────────`);
  log(`▶  PERSONA: ${p.id}`);
  log(`   Expected: ${p.expect}`);
  log(`────────────────────────────────────────────────────────────`);

  const session = await cbReq('POST', `/bot/${BOT_ID}/testSession`, {});
  if (!session.ok) {
    log(`  FAIL — testSession: ${session.status} ${JSON.stringify(session.json).slice(0,300)}`);
    return { id: p.id, status: 'SESSION_FAIL', turns: 0, violations: [], transcript: [] };
  }
  const leadId = session.json?.leadId || session.json?.lead?.id || session.json?.id;
  if (!leadId) {
    log(`  FAIL — no leadId in response`);
    return { id: p.id, status: 'NO_LEAD_ID', turns: 0, violations: [], transcript: [] };
  }
  log(`   Lead ID: ${leadId}`);

  const sseRes = await fetch(`${BASE}/bot/${BOT_ID}/testSession/messages/${leadId}`, {
    headers: { 'X-CB-KEY': CB_KEY, 'Accept': 'text/event-stream' },
  });
  if (!sseRes.ok) {
    log(`  FAIL — SSE stream: HTTP ${sseRes.status}`);
    return { id: p.id, status: 'SSE_FAIL', turns: 0, violations: [], transcript: [] };
  }
  const reader = startSseReader(sseRes);

  const conversation = [];
  const violations = [];
  let completed = false;
  let reason = '';

  for (let turn = 0; turn < p.maxTurns; turn++) {
    const leadMsg = turn === 0 ? p.opening : await gptReply(conversation, p.persona);
    log(`   [T${turn + 1}] LEAD: ${leadMsg}`);
    conversation.push({ sender: 'lead', message: leadMsg });

    const send = await cbReq('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: leadMsg });
    if (!send.ok) {
      log(`   FAIL — send message: HTTP ${send.status}`);
      reason = `send_fail_turn_${turn+1}`;
      break;
    }

    try {
      const botReply = await collectBotReply(reader);
      log(`   [T${turn + 1}] BOT:  ${botReply}`);
      conversation.push({ sender: 'bot', message: botReply });

      // Check rules on bot reply
      const checks = checkHardRules(botReply);
      const fails = checks.filter(c => !c.passed);
      if (fails.length > 0) {
        for (const f of fails) {
          log(`   ⚠️  VIOLATION [${f.id}]: "${f.matched}" — ${f.desc}`);
          violations.push({ turn: turn + 1, ruleId: f.id, matched: f.matched, desc: f.desc, excerpt: botReply.slice(0, 200) });
        }
      }

      // Check for booking completion signal (approximate)
      if (/appointment booked|confirmed|see you/i.test(botReply) && turn > 3) {
        // booking likely complete
        completed = true;
      }
    } catch (err) {
      log(`   [T${turn + 1}] BOT:  NO REPLY — ${err.message}`);
      reason = `no_reply_turn_${turn+1}`;
      break;
    }
  }

  const status = violations.length === 0 && completed ? 'PASS' : (violations.length > 0 ? 'VIOLATIONS' : 'INCOMPLETE');
  log(`   Result: ${status}  (violations: ${violations.length}, turns: ${conversation.filter(m=>m.sender==='bot').length}, reason: ${reason || 'max_turns'})`);

  return {
    id: p.id,
    status,
    turns: conversation.filter(m => m.sender === 'bot').length,
    violations,
    transcript: conversation,
    reason,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`=== Multi-Persona SSE Test Suite ===`);
  log(`Bot: ${BOT_ID}`);
  log(`Personas to run: ${PERSONAS.length}`);

  const filter = process.env.PERSONAS;
  const selected = filter ? PERSONAS.filter(p => filter.split(',').includes(p.id)) : PERSONAS;
  log(`After filter: ${selected.length} personas`);

  const results = [];
  for (const p of selected) {
    try {
      const r = await runPersona(p);
      results.push(r);
    } catch (err) {
      log(`PERSONA ${p.id} CRASHED: ${err.message}`);
      results.push({ id: p.id, status: 'CRASH', error: err.message, violations: [], transcript: [] });
    }
  }

  // Summary
  log(`\n\n============================================================`);
  log(`                     TEST SUITE SUMMARY`);
  log(`============================================================`);
  for (const r of results) {
    const marker = r.status === 'PASS' ? '✅' : (r.status === 'VIOLATIONS' ? '❌' : '⚠️ ');
    log(`${marker}  ${r.id.padEnd(35)} ${r.status.padEnd(12)} turns=${String(r.turns).padStart(2)} violations=${r.violations.length}`);
  }
  const passCount = results.filter(r => r.status === 'PASS').length;
  log(`\n${passCount}/${results.length} personas fully passed.\n`);

  // Violation detail
  const allViolations = results.flatMap(r => r.violations.map(v => ({...v, persona: r.id})));
  if (allViolations.length > 0) {
    log(`=== Violations Detail ===`);
    for (const v of allViolations) {
      log(`  [${v.persona}] T${v.turn} ${v.ruleId}: "${v.matched}"`);
      log(`    Bot excerpt: ${v.excerpt}`);
    }
  } else {
    log(`✅ No rule violations across all personas.`);
  }

  // Save results as JSON too
  const resultsFile = path.join(logDir, 'multi_persona_results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({ botId: BOT_ID, runAt: new Date().toISOString(), results }, null, 2));
  log(`\nFull results saved: ${resultsFile}`);
}

main().catch(err => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
