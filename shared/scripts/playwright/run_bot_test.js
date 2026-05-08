const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const LOG_PATH = path.join('shared', 'logs', 'bot_test_vacaville.log');
const WAIT = ms => new Promise(r => setTimeout(r, ms));

const SCENARIO = [
  { send: 'Hey, I wanted to ask about your academy', waitMs: 12000 },
  { send: 'My name is Alex', waitMs: 12000 },
  { send: 'Can you tell me more about who you are and what you do?', waitMs: 15000 },
  { send: 'What kind of classes or services do you offer?', waitMs: 15000 },
  { send: 'Do you have classes for kids?', waitMs: 12000 },
  { send: 'What about adults, do you have adult classes too?', waitMs: 12000 },
  { send: 'What does the schedule look like?', waitMs: 15000 },
  { send: 'Is there a free trial or any free classes to start?', waitMs: 12000 },
  { send: 'How much does it cost?', waitMs: 12000 },
  { send: 'Who are the coaches there?', waitMs: 15000 },
];

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
};

const readMessages = async (page) => {
  return await page.evaluate(() => {
    const cw = document.querySelector('chat-widget');
    const pane = cw?.shadowRoot?.querySelector('chat-pane');
    if (!pane) return [];
    return Array.from(pane.querySelectorAll('chat-message')).map(m => {
      const sh = m.shadowRoot?.innerHTML || '';
      const isBot = sh.includes('bubble incoming');
      const isUser = sh.includes('bubble outgoing');
      const text = m.innerText?.trim() || '';
      return { direction: isBot ? 'bot' : isUser ? 'user' : 'unknown', text, typing: isBot && !text };
    });
  });
};

const getInput = async (page) => {
  return page.evaluateHandle(() => {
    const findInput = (root) => {
      const inp = root.querySelector('input[placeholder], textarea[placeholder]');
      if (inp) return inp;
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) { const f = findInput(el.shadowRoot); if (f) return f; }
      }
      return null;
    };
    return findInput(document.querySelector('chat-widget').shadowRoot);
  });
};

const sendMessage = async (page, inputHandle, text) => {
  await inputHandle.evaluate(el => { el.focus(); });
  await page.keyboard.type(text, { delay: 40 });
  await WAIT(300);
  await page.keyboard.press('Enter');
};

const waitForBotReply = async (page, prevBotCount, timeoutMs) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await WAIT(1500);
    const msgs = await readMessages(page);
    const botMsgs = msgs.filter(m => m.direction === 'bot' && !m.typing);
    // Wait until typing stops and new message appears
    const stillTyping = msgs.some(m => m.typing);
    if (botMsgs.length > prevBotCount && !stillTyping) {
      return botMsgs[botMsgs.length - 1].text;
    }
  }
  // Return whatever bot text is there even if still typing
  const msgs = await readMessages(page);
  const botMsgs = msgs.filter(m => m.direction === 'bot' && !m.typing);
  return botMsgs.length > prevBotCount ? botMsgs[botMsgs.length - 1].text : null;
};

(async () => {
  fs.mkdirSync('shared/logs', { recursive: true });
  fs.writeFileSync(LOG_PATH, `=== BOT TEST: Vacaville Grappling Academy ===\nStarted: ${new Date().toISOString()}\n\n`);

  const browser  = await chromium.launch({ headless: true });
  const context  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page     = await context.newPage();

  log('Opening test portal...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);

  log('Opening chat widget...');
  await page.click('#lc_text-widget--btn');
  await WAIT(5000);

  const inputHandle = await getInput(page);
  let msgs = await readMessages(page);
  let botCount = msgs.filter(m => m.direction === 'bot' && !m.typing).length;
  log(`Initial bot messages: ${botCount}`);

  for (const step of SCENARIO) {
    log(`\n>>> YOU: ${step.send}`);
    await sendMessage(page, inputHandle, step.send);

    const prevBotCount = (await readMessages(page)).filter(m => m.direction === 'bot' && !m.typing).length;
    const reply = await waitForBotReply(page, prevBotCount, step.waitMs);

    if (reply) {
      log(`<<< BOT: ${reply}`);
    } else {
      log(`<<< BOT: [no response within ${step.waitMs / 1000}s]`);
    }
    await WAIT(1500);
  }

  await page.screenshot({ path: 'shared/logs/bot_test_final.png' });
  log('\n=== TEST COMPLETE ===');
  await browser.close();
})().catch(e => {
  log(`FATAL: ${e.message}`);
  process.exit(1);
});
