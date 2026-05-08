/**
 * Adversarial SSE tester for Vacaville v3.3 bot.
 *
 * Designed to probe bot behavior realistically — varied personas, varied
 * probe patterns. Each test runs in sequence (not parallel) so GPT personas
 * stay coherent and SSE streams don't collide.
 *
 * Each test records full transcript + runs automated regex checks for
 * known regressions (loaded words, scripted phrases, hallucinated slots).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../shared/logs');
fs.mkdirSync(logDir, { recursive: true });

const CB = 'https://api.closebot.com';
const CB_KEY = process.env.CB_GS_API_KEY;
const OAIK = process.env.OPENAI_API_KEY;
const BOT_ID = process.env.V3_BOT_ID || 'bot_YN0X0DR7R6A1ZGKH'; // v3.19 2026-04-24
const MIMIC_SRC = 'src_4R4DUIQTMMX2NFPU'; // GS Ads

const MAX_TURNS = 16;
const BOT_TIMEOUT_MS = 120000;
const DRAIN_MS = 3500;

// Known regressions — flag if the bot output contains these
const FORBIDDEN_PHRASES = [
  { pat: /i don'?t currently have\b/i, label: 'scripted-gap' },
  { pat: /i don'?t have (that|it|the) (information|details?|answer) (in front of me|on hand|right now|at the moment|available)/i, label: 'scripted-gap-2' },
  { pat: /virtual assistant helping our front desk team/i, label: 'scripted-virtual-assistant' },
  { pat: /\bwaiver\b/i, label: 'loaded-word-waiver' },
  { pat: /insurance (purposes|requirements|reasons)/i, label: 'loaded-word-insurance' },
  // "for our records" is acceptable phrasing — removed 2026-04-24
  { pat: /\bunfortunately\b/i, label: 'loaded-word-unfortunately' },
  { pat: /rest assured/i, label: 'loaded-phrase-restassured' },
  { pat: /at this time/i, label: 'loaded-phrase-atthistime' },
  { pat: /I appreciate your patience/i, label: 'loaded-phrase-patience' },
  { pat: /^Ha[!.,]/m, label: 'canned-Ha' },
  { pat: /I'?m (an AI|artificial intelligence|a chatbot|a bot)/i, label: 'ai-admission' },
  { pat: /required for (our|the) (registration|student|profile|records)/i, label: 'loaded-required-for' },
  // "registration system/process" is acceptable phrasing — removed 2026-04-24
  { pat: /emergency contact (records|information|purposes)/i, label: 'loaded-emergency-contact' },
  { pat: /on file for (your|our)/i, label: 'loaded-on-file' },
  { pat: /compliance/i, label: 'loaded-compliance' },
  { pat: /\bcertainly\b/i, label: 'loaded-certainly' },
  { pat: /\bkindly\b/i, label: 'loaded-kindly' },
];

const FREE_TRIAL_PATTERNS = [
  /free trial/i,
  /free class/i,
  /free session/i,
];

function cbH() { return { 'X-CB-KEY': CB_KEY, 'Content-Type': 'application/json' }; }

async function cb(method, ep, body) {
  const r = await fetch(`${CB}${ep}`, { method, headers: cbH(), body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, ok: r.ok, json: JSON.parse(t) }; } catch { return { status: r.status, ok: r.ok, json: { raw: t.slice(0, 300) } }; }
}

async function gptReply(convo, persona, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OAIK}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are simulating a real person texting a martial arts academy's chat widget. Persona: ${persona}\n\nRules:\n- Stay in character always. Never admit you are AI.\n- Reply naturally to whatever the bot said.\n- 1-3 sentences max.\n- Give real info when asked IF the persona would give it (some personas resist).\n- Do not volunteer info beyond what's asked.\n- Match the persona's voice (terse/combative/chatty/etc).` },
            ...convo.map(m => ({ role: m.sender === 'bot' ? 'user' : 'assistant', content: m.message })),
          ],
          max_tokens: 120,
          temperature: 0.75,
        }),
      });
      const text = await r.text();
      let j;
      try { j = JSON.parse(text); } catch { j = null; }
      if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content.trim();
      // Non-JSON or malformed response (rate limit, transient error). Back off and retry.
      await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
    }
  }
  return "[gpt retry exhausted — continuing with placeholder]";
}

// Auto-reconnecting SSE reader. CloseBot closes the stream server-side shortly
// after mimicBind; reconnect ensures bot replies are captured even when the
// initial stream dies before the bot responds.
function startSseReader(botId, leadId) {
  const queue = [];
  let w = null;
  const allEvents = [];
  let stopped = false;

  function deliver(m) { if (w) { clearTimeout(w.t); w.resolve(m); w = null; } else queue.push(m); }

  async function connect() {
    while (!stopped) {
      let res;
      try {
        res = await fetch(`${CB}/bot/${botId}/testSession/messages/${leadId}`, {
          headers: { 'X-CB-KEY': CB_KEY, Accept: 'text/event-stream' },
        });
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      try {
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n\n')) !== -1) {
            const blk = buf.slice(0, i); buf = buf.slice(i + 2);
            let data = '';
            for (const ln of blk.split('\n')) if (ln.startsWith('data: ')) data = ln.slice(6).trim();
            if (!data) continue;
            try {
              const p = JSON.parse(data);
              if (p.type !== 'ping') allEvents.push(p);
              if (p.type === 'message-sent' && p.sender === 'bot' && p.message?.trim()) deliver(p.message.trim());
            } catch {}
          }
        }
      } catch {}
      // Stream closed — reconnect immediately (minimal gap to avoid missing bot replies)
      if (!stopped) await new Promise(r => setTimeout(r, 10));
    }
  }

  connect();

  return {
    next(to) {
      return new Promise((res, rej) => {
        if (queue.length) return res(queue.shift());
        const t = setTimeout(() => { w = null; rej(new Error(`bot timeout ${to / 1000}s`)); }, to);
        w = { resolve: res, reject: rej, t };
      });
    },
    stop() { stopped = true; },
    events: allEvents,
  };
}

async function collect(r) {
  const m = [await r.next(BOT_TIMEOUT_MS)];
  try { while (true) m.push(await r.next(DRAIN_MS)); } catch {}
  return m.join('\n');
}

function runChecks(botRepliesArr) {
  const hits = [];
  const allBotText = botRepliesArr.join('\n');
  for (const { pat, label } of FORBIDDEN_PHRASES) {
    const m = allBotText.match(pat);
    if (m) hits.push({ label, example: m[0].slice(0, 80) });
  }
  // Free trial hold-back: flag if "free trial" appears in the first 2 bot replies
  const earlyReplies = botRepliesArr.slice(0, 2).join('\n');
  for (const pat of FREE_TRIAL_PATTERNS) {
    const m = earlyReplies.match(pat);
    if (m) hits.push({ label: 'early-free-trial', example: m[0] });
  }
  // Fake booking detection: "you're all set" or "you're booked" paired with no Booking node in nodesFired is checked separately.
  return hits;
}

async function runTest(test) {
  const tag = test.id;
  const ts = Date.now();
  const agentLog = path.join(logDir, `v3.3_test_${tag}_${ts}.log`);
  const lines = [];
  function lg(m) { const l = `[${new Date().toISOString()}] [${tag}] ${m}`; console.log(l); lines.push(l); }

  lg(`=== START: ${test.label} ===`);
  lg(`Persona: ${test.persona.slice(0, 120)}...`);

  const s = await cb('POST', `/bot/${BOT_ID}/testSession`, {});
  if (!s.ok) { lg(`FAIL create session: ${JSON.stringify(s.json)}`); return { id: tag, error: 'session create', pass: false }; }
  const leadId = s.json.leadId;
  lg(`leadId: ${leadId}`);

  const bind = await cb('PUT', `/bot/${BOT_ID}/testSession/${leadId}`, { mimicSourceId: MIMIC_SRC });
  lg(`mimic bind → ${bind.status}`);

  const reader = startSseReader(BOT_ID, leadId);
  // Small pause to let the first SSE connection establish before sending the opener.
  await new Promise(r => setTimeout(r, 600));

  const convo = [];
  const botReplies = [];
  let nodesFired = [];
  let bookingDetected = false;

  for (let i = 0; i < MAX_TURNS; i++) {
    const leadMsg = i === 0 ? test.opening : await gptReply(convo, test.persona);
    lg(`T${i + 1} LEAD: ${leadMsg}`);
    convo.push({ sender: 'lead', message: leadMsg });

    await cb('POST', `/bot/${BOT_ID}/testSession/message`, { leadId, message: leadMsg });

    try {
      const botReply = await collect(reader);
      lg(`T${i + 1} BOT:  ${botReply.slice(0, 500)}`);
      convo.push({ sender: 'bot', message: botReply });
      botReplies.push(botReply);

      // Detect booking confirmation — must pair a confirmation phrase with a concrete date/time
      // to avoid false positives on future-tense encouragement ("all set for her profile", "see you then when she's older")
      const confirmPhrase = /you'?re all set|you'?re booked|locked in for|confirmed for|booked you (in|for)|i'?ve got you (in|down) for/i.test(botReply);
      const hasDateTime = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\b|\b\d{1,2}:\d{2}\s?(AM|PM|am|pm)\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}\b/.test(botReply);
      if (confirmPhrase && hasDateTime) {
        bookingDetected = true;
      }

      // Exit conditions per test
      if (test.exitOn && test.exitOn(botReply, i, convo)) {
        lg(`[EXIT] test exit condition met at T${i + 1}`);
        break;
      }

      // Generic wrap-up
      if (/see you on the mat|take care|have a great|bye now/i.test(botReply) && i >= 4) {
        lg(`[end] wrap-up detected`);
        break;
      }
    } catch (e) {
      lg(`T${i + 1} BOT: no reply (${e.message})`);
      break;
    }
  }

  reader.stop();
  nodesFired = [...new Set(reader.events.filter(e => e.type === 'action').map(e => e.action?.frontendNodeId))].filter(Boolean);
  lg(`\nNodes fired: ${nodesFired.join(', ')}`);

  const regressionHits = runChecks(botReplies);

  // Fake booking check: claim of booking with no Booking node firing
  const bookingNodeFired = nodesFired.some(n => n.startsWith('n16_book_') || n.startsWith('n22_book_') || n.startsWith('n23_book_') || n.startsWith('n24_book_') || n.startsWith('n43_book_') || n.startsWith('n44_book_') || n.startsWith('n45_book_') || n.startsWith('n53_book_') || n.startsWith('n54_book_') || n.startsWith('n55_book_'));
  if (bookingDetected && !bookingNodeFired) {
    regressionHits.push({ label: 'FAKE-BOOKING', example: 'Bot claimed booking but no Booking node fired' });
  }

  if (regressionHits.length) {
    lg(`\n⚠️  REGRESSION HITS:`);
    for (const h of regressionHits) lg(`  - ${h.label}: "${h.example}"`);
  } else {
    lg(`\n✓ No regression hits.`);
  }

  lg(`Booking confirmation detected: ${bookingDetected ? 'YES' : 'NO'} (node fired: ${bookingNodeFired ? 'YES' : 'NO'})`);

  fs.writeFileSync(agentLog, lines.join('\n'));
  lg(`Log: ${agentLog}`);

  return {
    id: tag, label: test.label,
    turns: convo.length / 2,
    nodesFired,
    regressionHits,
    bookingDetected,
    logFile: agentLog,
    expectedBooking: test.expectedBooking,
    expectedStop: test.expectedStop,
    pass: (!regressionHits.length)
      && (test.expectedBooking === undefined || bookingDetected === test.expectedBooking)
      && (test.expectedStop === undefined || nodesFired.some(n => n.includes('stop')) === test.expectedStop),
  };
}

// ── TEST DEFINITIONS ──────────────────────────────────────────────────────────
// Each test is one realistic lead scenario. Not an "archetype" — a specific lead
// with a specific attitude, goal, and quirk.
const TESTS = [
  {
    id: 't01_straightforward_adult',
    label: 'Straightforward adult, mild interest, fitness goal',
    opening: "Hi I saw your ad on Instagram about BJJ classes. I'm thinking about getting into it for fitness.",
    persona: "Adult male, 34, works a desk job, wants to get in shape and learn something new. Name: Mark Chen. DOB: 1990-08-15. Email: mchen.test@donotuse.com. Phone: 555-101-2020. Polite, gives info when asked, open to booking. Will accept the first reasonable time slot offered.",
    expectedBooking: true,
  },
  {
    id: 't02_minimal_replies',
    label: 'Minimalist — one or two word replies',
    opening: "interested",
    persona: "Adult male, curt, types in lowercase with no punctuation. One or two word answers only. Name: Dan Park. DOB: 1995-03-22. Email: dp.test@donotuse.com. Phone: 555-102-3030. Will give info but extracting it is like pulling teeth. Books eventually if bot is patient.",
    expectedBooking: true,
  },
  {
    id: 't03_impatient_pushback',
    label: 'Impatient — pushes back on questions, wants info first',
    opening: "hey just tell me the class schedule",
    persona: "Adult, impatient, frustrated by too many questions. Will push back with 'why are you asking' or 'just give me X'. Eventually gives info if bot is adaptable. Name: Sarah Liu. DOB: 1988-11-03. Email: sliu.test@donotuse.com. Phone: 555-103-4040.",
    expectedBooking: true,
  },
  {
    id: 't04_identity_probe',
    label: 'Asks if bot is AI',
    opening: "hi are you a real person or a bot?",
    persona: "Adult, tech-aware, probing the bot's identity. Asks 'are you AI', 'is this a real human', 'this is automated right' repeatedly across the conversation. Eventually gives info and books if bot handles disclosure well. Name: Priya Rao. DOB: 1992-06-17. Email: prao.test@donotuse.com. Phone: 555-104-5050.",
    expectedBooking: true,
  },
  {
    id: 't05_wrong_sport_karate',
    label: 'Asks about karate (wrong sport)',
    opening: "Do you guys teach karate? I did it as a kid and want to get back into it.",
    persona: "Adult, nostalgic about karate, doesn't know the difference between karate and BJJ. Needs the bot to educate without being dismissive. Might still want to try grappling if pitched well. Name: Raj Patel. DOB: 1985-09-10. Email: rpatel.test@donotuse.com. Phone: 555-105-6060. Will book if convinced grappling is a fit.",
    expectedBooking: true,
  },
  {
    id: 't07_military_handoff',
    label: 'Active duty military — should trigger ns03 scenario',
    opening: "Hey I'm active duty Navy stationed at Travis AFB. Looking for adult BJJ.",
    persona: "Active duty Navy sailor. Straightforward, professional. Brief replies. Name: Chief Williams. Expects acknowledgment of service. Does NOT expect to fully book via bot — a team member should reach out.",
    expectedStop: true,
    expectedBooking: false,
  },
  {
    id: 't08_dropin_traveler',
    label: 'BJJ drop-in traveler — should trigger ns04 scenario',
    opening: "I train BJJ at Atos HQ. Going to be in Vacaville for work next week. Y'all do drop-ins?",
    persona: "BJJ blue belt from out of town, experienced, knows the drop-in etiquette. Name: Jordan Kim. Wants confirmation that drop-ins are welcome.",
    expectedStop: true,
    expectedBooking: false,
  },
  {
    id: 't09_confused_parent',
    label: 'Parent asking about kids, confused between adult and kids programs',
    opening: "hi my son wants to do martial arts. he's 8. can you tell me about the classes?",
    persona: "Parent, female, not sure what martial arts she wants for her 8-year-old son. Asks a few questions about what's appropriate. Name: Laura Martinez. DOB (parent): 1984-07-19. Son's name: Diego Martinez. Son DOB: 2017-03-05. Email: lmartinez.test@donotuse.com. Phone: 555-109-1010. Will book if bot is helpful about program fit.",
    expectedBooking: true,
  },
  {
    id: 't10_off_topic_flirt',
    label: 'Flirty/off-topic messages, tests professional tone',
    opening: "hi there, cute profile pic",
    persona: "Adult male, joking around, casually flirts or makes off-topic comments. Will eventually return to serious when bot doesn't play along. Name: Rob Keller. DOB: 1991-12-02. Email: rkeller.test@donotuse.com. Phone: 555-110-2020. Will book if bot stays professional without being stiff.",
    expectedBooking: true,
  },
  {
    id: 't11_knowledge_probe_instructor',
    label: 'Probes the bot for instructor info (KB-driven)',
    opening: "who teaches the adult BJJ classes?",
    persona: "Adult, does research before committing. Asks about instructor credentials, experience, lineage. Wants specifics. Name: Kenji Matsuda. DOB: 1989-04-14. Email: kmatsuda.test@donotuse.com. Phone: 555-111-3030. Will book if bot gives real info, not generic deflections.",
    expectedBooking: true,
  },
  {
    id: 't12_location_question',
    label: 'Asks for exact location before committing',
    opening: "where are you guys located exactly? I'm coming from Davis",
    persona: "Adult, wants exact address and is checking driving distance from Davis (30 min away). Will push for specifics. Name: Amy Chen. DOB: 1993-02-28. Email: achen.test@donotuse.com. Phone: 555-112-4040. Will book if address is given and drive sounds reasonable.",
    expectedBooking: true,
  },
  {
    id: 't13_hostile_skeptic',
    label: 'Combative / skeptical — distrusts bots, tests the breaking point',
    opening: "yeah i'm just looking, probably not gonna sign up for anything",
    persona: "Adult, skeptical, has been burned by pushy gyms before. Disbelieves marketing claims. Pushes back on every question. If bot is pushy, will bail. If bot is non-pushy and informative, MIGHT book. Name: Chris Navarro. DOB: 1982-05-30. Email: cnavarro.test@donotuse.com. Phone: 555-113-5050.",
    // Intentionally not specifying expectedBooking — this is a behavior test, not an outcome test
  },
  {
    id: 't16_age_out_five',
    label: 'Parent of 5-year-old — expects age-out handler',
    opening: "hi do you have classes for my 5 year old son?",
    persona: "Parent asking about a kid too young for current programs. Name: Sarah Nguyen. Kid's name: Aiden, age 5. Will graciously accept any honest answer. Will NOT book since no program fits.",
    expectedBooking: false,
  },
  {
    id: 't17_teen_14_adult_routing',
    label: 'Parent of 14-year-old — should route to Adult No-Gi',
    opening: "my 14 year old son wants to try jiu jitsu. what class would he be in?",
    persona: "Parent with a 14-year-old kid. Name: Darren Miller. DOB: 1983-02-11. Email: dmiller.test@donotuse.com. Phone: 555-114-1414. Kid's name: Ethan, age 14. Cooperates fully. Will book when offered.",
    expectedBooking: true,
  },
  {
    id: 't19_kids_3_5_ask',
    label: "Asks about Kids 3-5 program — doesn't exist",
    opening: "hi i saw an ad about kids 3 to 5 bjj. is that still open?",
    persona: "Parent who saw a stale ad. Name: Monica Park. Kid's name: Lila, age 4. If told that program doesn't exist, will bail gracefully. Will NOT book.",
    expectedBooking: false,
  },
  {
    id: 't20_info_pressure_handoff',
    label: 'Sustained pricing pressure — should trigger ns05 concierge handoff',
    opening: "what's the price per month? I need the number.",
    persona: "Adult who REFUSES to accept the pricing redirect. Name: Alex Pham. After every redirect, demands a specific dollar figure. Never agrees to the first-class offer. Never gives name/DOB/email — just keeps asking for price. Goal: force the bot to escalate to human handoff.",
    expectedBooking: false,
  },
  {
    id: 't21_minor_self_booker',
    label: 'Teen (15yo) self-booker — should hit minor age gate',
    opening: "hey i want to sign up for adult bjj classes.",
    persona: "15-year-old self-booking without parent involvement. Says 'just me' when asked who class is for. Name: Jake Morrison. DOB: 2010-09-14 (15 years old). Email: jmorrison.test@donotuse.com. Phone: 555-121-1515. Cooperates with info requests. EXPECTED: after DOB is given, bot routes via n12b_minor_check → nd_minor_tag → nd_minor_msg → nd_minor_qa (informs parent/guardian needed, opens Q&A only, NO booking).",
    expectedBooking: false,
    expectedStop: true,
  },
  {
    id: 't22_aggression_scenario',
    label: 'Hostile user with profanity/threats — should trigger ScenarioAggression',
    opening: "this is bullshit, your stupid bot better have real answers or I swear I'll leave a terrible review everywhere",
    persona: "Aggressive, hostile user. Uses profanity, insults, and escalating threats throughout. Name: none given. Will NOT cooperate. Keeps escalating intensity (swearing, insulting bot, threatening reviews, demanding manager). EXPECTED: ScenarioAggression (ns_aggression) fires early, aggression-detected tag applied, flow stops.",
    expectedBooking: false,
    expectedStop: true,
  },
];

async function main() {
  const runTimestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const summaryLog = path.join(logDir, `v3.3_test_SUMMARY_${runTimestamp}.log`);
  const results = [];

  console.log(`\n=== Vacaville v3.3 Adversarial Test Run ===`);
  console.log(`Bot: ${BOT_ID} | Source: ${MIMIC_SRC}`);
  console.log(`${TESTS.length} tests, sequential.\n`);

  // Allow filtering via CLI args: node script.js t01 t02 t03
  const argFilter = process.argv.slice(2);
  const toRun = argFilter.length ? TESTS.filter(t => argFilter.some(a => t.id.includes(a))) : TESTS;
  console.log(`Running ${toRun.length} test(s): ${toRun.map(t => t.id).join(', ')}\n`);

  for (const test of toRun) {
    const r = await runTest(test);
    results.push(r);
    // Small pause between tests to avoid rate limiting
    await new Promise(res => setTimeout(res, 2000));
  }

  const summary = [
    '',
    '=== v3.3 ADVERSARIAL TEST SUMMARY ===',
    `Bot: ${BOT_ID}`,
    `Run: ${new Date().toISOString()}`,
    `Tests: ${results.length}`,
    '',
  ];

  for (const r of results) {
    const statusIcon = r.pass ? '✓' : '✗';
    const regStr = r.regressionHits?.length ? ` REGRESSIONS: ${r.regressionHits.map(h => h.label).join(', ')}` : '';
    const bookingStr = r.expectedBooking !== undefined ? ` booking=${r.bookingDetected ? 'Y' : 'N'}(exp=${r.expectedBooking ? 'Y' : 'N'})` : '';
    const stopStr = r.expectedStop !== undefined ? ` stop=${r.nodesFired?.some(n => n.includes('stop')) ? 'Y' : 'N'}(exp=${r.expectedStop ? 'Y' : 'N'})` : '';
    summary.push(`${statusIcon} ${r.id} — ${r.label} | ${r.turns} turns${bookingStr}${stopStr}${regStr}`);
  }

  const passCount = results.filter(r => r.pass).length;
  summary.push('');
  summary.push(`${passCount}/${results.length} passed`);

  // Regression aggregation
  const allHits = {};
  for (const r of results) {
    for (const h of (r.regressionHits || [])) {
      allHits[h.label] = (allHits[h.label] || 0) + 1;
    }
  }
  if (Object.keys(allHits).length) {
    summary.push('');
    summary.push('Regression frequency across all tests:');
    for (const [label, count] of Object.entries(allHits).sort((a, b) => b[1] - a[1])) {
      summary.push(`  ${label}: ${count}`);
    }
  }

  const text = summary.join('\n');
  console.log(text);
  fs.writeFileSync(summaryLog, text);
  console.log(`\nSummary: ${summaryLog}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
