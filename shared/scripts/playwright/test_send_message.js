const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const WAIT = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);

  // Open chat
  await page.click('#lc_text-widget--btn');
  await WAIT(3000);

  // Find input inside nested shadow DOMs using Playwright's shadow-piercing locator
  const input = page.locator('chat-widget input[placeholder="Type a message"], chat-widget textarea');

  // Try shadow-piercing approach
  const inputHandle = await page.evaluateHandle(() => {
    const cw = document.querySelector('chat-widget');
    if (!cw?.shadowRoot) return null;

    // Walk nested shadow roots
    const findInput = (root) => {
      const inp = root.querySelector('input[placeholder], textarea[placeholder]');
      if (inp) return inp;
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          const found = findInput(el.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    };
    return findInput(cw.shadowRoot);
  });

  if (inputHandle && await inputHandle.evaluate(el => !!el)) {
    console.log('Input found via shadow DOM traversal');
    await inputHandle.evaluate(el => el.focus());
    await inputHandle.evaluate(el => { el.value = ''; });
    await page.keyboard.type('Hi, I saw your ad and I am interested in learning more', { delay: 50 });
    await WAIT(500);
    await page.keyboard.press('Enter');
    console.log('Message sent!');
    await WAIT(5000);
    await page.screenshot({ path: 'shared/logs/message_sent.png' });

    // Read all messages from chat
    const messages = await page.evaluate(() => {
      const cw = document.querySelector('chat-widget');
      if (!cw?.shadowRoot) return [];
      const pane = cw.shadowRoot.querySelector('chat-pane');
      if (!pane?.shadowRoot) return ['no pane shadow'];
      return Array.from(pane.shadowRoot.querySelectorAll('chat-message')).map(m => m.shadowRoot?.textContent || m.textContent);
    });
    console.log('\nMessages in chat:', messages);
  } else {
    console.log('Input not found via shadow traversal, trying coordinate click...');
    // Click the input area by coordinates (bottom of widget)
    await page.mouse.click(1060, 675);
    await WAIT(500);
    await page.keyboard.type('Hi, I saw your ad and I am interested in learning more', { delay: 50 });
    await WAIT(500);
    await page.keyboard.press('Enter');
    console.log('Message sent via coordinates!');
    await WAIT(5000);
    await page.screenshot({ path: 'shared/logs/message_sent.png' });
  }

  await browser.close();
  console.log('\nScreenshot saved: shared/logs/message_sent.png');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
