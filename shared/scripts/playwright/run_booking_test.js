const { chromium } = require('playwright');
const fs = require('fs');

const URL         = 'https://app.gohighlevel.com/v2/preview/hQknECdmqlTW4P6978BD';
const LOG_PATH    = 'shared/logs/booking_test_vacaville.log';
const OPENAI_KEY  = process.env.OPENAI_API_KEY;
const WAIT        = ms => new Promise(r => setTimeout(r, ms));
const MAX_TURNS   = 30;

// ─── RANDOMIZED IDENTITY ──────────────────────────────────────────────────────
const rand = (n) => Math.random().toString(36).substring(2, 2 + n);
const randPhone = () => `555-${String(Math.floor(Math.random()*900)+100)}-${String(Math.floor(Math.random()*9000)+1000)}`;

const LAST_NAME = rand(6).charAt(0).toUpperCase() + rand(5);
const PERSONA = {
  adult: { firstName: 'Tester', lastName: LAST_NAME, fullName: `Tester ${LAST_NAME}`, dob: '03/15/1985', email: `tester.${rand(6)}@donotuse.com`, phone: randPhone() },
  son:   { firstName: 'Jake',   lastName: LAST_NAME, fullName: `Jake ${LAST_NAME}`,   dob: '06/20/2015', age: 9  },
  daughter: { firstName: 'Lily', lastName: LAST_NAME, fullName: `Lily ${LAST_NAME}`,  dob: '09/10/2021', age: 4  },
};

// ─── TEST OBJECTIVE (fed to GPT) ─────────────────────────────────────────────
const OBJECTIVE = `
You are ${PERSONA.adult.fullName}, a real person testing a martial arts academy chatbot.
Your goal: book a free trial class for yourself (adult) AND your two kids:
- Son: ${PERSONA.son.fullName}, age 9, DOB ${PERSONA.son.dob}
- Daughter: ${PERSONA.daughter.fullName}, age 4, DOB ${PERSONA.daughter.dob}

Your contact info:
- DOB: ${PERSONA.adult.dob}
- Email: ${PERSONA.adult.email}
- Phone: ${PERSONA.adult.phone}

Rules for how you respond:
- Reply naturally like a real person texting — casual, short, conversational
- Answer ONLY what the bot just asked, don't volunteer all info at once
- If the bot asks for multiple things, answer them all in one message
- If the bot asks what day/time works, pick a specific one (e.g. "Monday evening works")
- If the bot says a child is too young, push back once naturally, then accept if it insists
- If the bot confirms a booking, say thank you and ask if there's anything else needed
- Never break character. Never mention you are testing.
- Keep replies under 2 sentences unless giving multiple pieces of info
`.trim();

// ─── GPT-4o-mini RESPONSE ENGINE ─────────────────────────────────────────────
async function generateReply(history, botMessage) {
  const messages = [
    { role: 'system', content: OBJECTIVE },
    ...history,
    { role: 'user', content: `The bot just said: "${botMessage}"\n\nRespond as ${PERSONA.adult.firstName}:` },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 150, temperature: 0.7 }),
  });

  const json = await res.json();
  if (!json.choices) { console.error('OpenAI error:', json); return null; }
  return json.choices[0].message.content.trim();
}

// ─── EVALUATION ───────────────────────────────────────────────────────────────
const checks = {
  multiPersonRecognized:  false,
  adultRouted:            false,
  sonRouted:              false,
  daughterRouted:         false,
  guardianInfoRequested:  false,
  requiredFieldsAsked:    false,
  bookingConfirmed:       false,
};

function evaluate(botMsg) {
  const m = botMsg.toLowerCase();
  if (/jake|lily|kids|children|son|daughter|both|all three|family/.test(m))              checks.multiPersonRecognized = true;
  if (/adult|no.gi|submission grappling/.test(m))                                         checks.adultRouted = true;
  if (/7.1[34]|youth/.test(m) && /jake/.test(m))                                         checks.sonRouted = true;
  if (/3.5/.test(m) && /lily/.test(m))                                                    checks.daughterRouted = true;
  if (/parent|guardian/.test(m))                                                           checks.guardianInfoRequested = true;
  if (/birth|email|phone|name/.test(m))                                                    checks.requiredFieldsAsked = true;
  if (/you('re| are) all set|see you (at|for) your|booking.*confirmed|all three.*booked|successfully (booked|registered)|trial.*confirmed|looking forward to.*seeing you/.test(m)) checks.bookingConfirmed = true;
}

// ─── DOM HELPERS ──────────────────────────────────────────────────────────────
const readMessages = async (page) => page.evaluate(() => {
  const pane = document.querySelector('chat-widget')?.shadowRoot?.querySelector('chat-pane');
  if (!pane) return [];
  return Array.from(pane.querySelectorAll('chat-message')).map(m => {
    const sh = m.shadowRoot?.innerHTML || '';
    return {
      direction: sh.includes('bubble incoming') ? 'bot' : sh.includes('bubble outgoing') ? 'user' : 'unknown',
      text: m.innerText?.trim() || '',
      typing: sh.includes('bubble incoming') && !(m.innerText?.trim()),
    };
  });
});

const getInput = async (page) => page.evaluateHandle(() => {
  const find = (root) => {
    const el = root.querySelector('input[placeholder], textarea[placeholder]');
    if (el) return el;
    for (const c of root.querySelectorAll('*')) { if (c.shadowRoot) { const f = find(c.shadowRoot); if (f) return f; } }
    return null;
  };
  return find(document.querySelector('chat-widget').shadowRoot);
});

const sendMsg = async (page, input, text) => {
  await input.evaluate(el => el.focus());
  await page.keyboard.type(text, { delay: 40 });
  await WAIT(300);
  await page.keyboard.press('Enter');
};

const waitForReply = async (page, prevCount, timeoutMs = 18000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await WAIT(1500);
    const msgs = await readMessages(page);
    const botMsgs = msgs.filter(m => m.direction === 'bot' && !m.typing);
    if (botMsgs.length > prevCount && !msgs.some(m => m.typing)) return botMsgs[botMsgs.length - 1].text;
  }
  const msgs = await readMessages(page);
  const botMsgs = msgs.filter(m => m.direction === 'bot' && !m.typing);
  return botMsgs.length > prevCount ? botMsgs[botMsgs.length - 1].text : null;
};

// ─── LOG ──────────────────────────────────────────────────────────────────────
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!OPENAI_KEY) { console.error('OPENAI_API_KEY missing from .env'); process.exit(1); }
  fs.mkdirSync('shared/logs', { recursive: true });
  fs.writeFileSync(LOG_PATH,
    `=== BOOKING TEST: Vacaville Grappling Academy ===\n` +
    `Started: ${new Date().toISOString()}\n` +
    `Persona: ${PERSONA.adult.fullName} (adult) | ${PERSONA.son.fullName} (son, 9) | ${PERSONA.daughter.fullName} (daughter, 4)\n` +
    `Email: ${PERSONA.adult.email} | Phone: ${PERSONA.adult.phone}\n\n`
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page    = await context.newPage();

  log('Opening test portal...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);

  log('Opening chat widget...');
  await page.click('#lc_text-widget--btn');
  await WAIT(5000);

  const input = await getInput(page);
  const gptHistory = []; // tracks conversation for GPT context
  let noResponseStreak = 0;

  // Opening message
  const opener = `Hi, my name is ${PERSONA.adult.fullName}. I'd like to book a free trial for myself and my two kids — my son ${PERSONA.son.firstName} who is 9 and my daughter ${PERSONA.daughter.firstName} who is 4.`;
  log(`\n>>> TESTER: ${opener}`);
  await sendMsg(page, input, opener);
  gptHistory.push({ role: 'assistant', content: opener });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const prevCount = (await readMessages(page)).filter(m => m.direction === 'bot' && !m.typing).length;
    const botReply  = await waitForReply(page, prevCount, 18000);

    if (!botReply) {
      noResponseStreak++;
      log(`<<< BOT: [no response — turn ${turn + 1}]`);
      if (noResponseStreak >= 3) { log('3 consecutive no-responses. Ending test.'); break; }
      continue;
    }

    noResponseStreak = 0;
    log(`<<< BOT: ${botReply}`);
    evaluate(botReply);
    gptHistory.push({ role: 'user', content: botReply });

    if (checks.bookingConfirmed) { log('Booking confirmed. Test complete.'); break; }

    // Skip pure holding messages — wait for real question
    const isHolding = /give us a minute|assign you|best person to help/.test(botReply.toLowerCase());
    if (isHolding) continue;

    await WAIT(2000); // human-like pause before replying

    const reply = await generateReply(gptHistory, botReply);
    if (!reply) { log('>>> TESTER: [GPT returned no response — ending]'); break; }

    log(`\n>>> TESTER: ${reply}`);
    await sendMsg(page, input, reply);
    gptHistory.push({ role: 'assistant', content: reply });
  }

  // ── Report ──
  log('\n' + '='.repeat(60));
  log('EVALUATION REPORT');
  log('='.repeat(60));
  Object.entries(checks).forEach(([k, v]) => log(`${v ? '✅' : '❌'} ${k}`));

  log('\nKB INCONSISTENCIES (needs client confirmation):');
  [
    'KB only defines ages 7–13 (youth) and 14+ (adult). GHL has 4 calendars: Kids 3-5, Kids 7-13, Kids 10-14, Adult.',
    'Ages 5–6 fall in a gap between Kids 3-5 and Kids 7-13 — no KB coverage.',
    'Age 14 overlaps between Kids 10-14 BJJ and Adult No-Gi — KB assigns 14 to adult only.',
  ].forEach(f => log(`  ⚠️  ${f}`));

  await page.screenshot({ path: 'shared/logs/booking_test_final.png' });
  log('\n=== TEST COMPLETE ===');
  await browser.close();
})().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
