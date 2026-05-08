const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const WAIT = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);
  await page.click('#lc_text-widget--btn');
  await WAIT(4000);

  const inputHandle = await page.evaluateHandle(() => {
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

  await inputHandle.evaluate(el => el.focus());
  await page.keyboard.type('hey', { delay: 40 });
  await page.keyboard.press('Enter');
  console.log('Sent: hey');
  await WAIT(12000);

  // Read chat-message from pane LIGHT DOM
  const msgs = await page.evaluate(() => {
    const cw = document.querySelector('chat-widget');
    const pane = cw?.shadowRoot?.querySelector('chat-pane');
    if (!pane) return [];

    // chat-message elements live in pane's light DOM (slotted)
    const messages = pane.querySelectorAll('chat-message');
    return Array.from(messages).map(m => ({
      attrs: Array.from(m.attributes).map(a => `${a.name}=${a.value}`).join(', '),
      innerText: m.innerText?.trim(),
      textContent: m.textContent?.trim(),
      shadowHTML: m.shadowRoot?.innerHTML?.substring(0, 400)
    }));
  });

  console.log(`\nFound ${msgs.length} chat-message elements:`);
  msgs.forEach((m, i) => console.log(`\n[${i}]`, JSON.stringify(m, null, 2)));

  await browser.close();
})().catch(e => console.error('FATAL:', e.message));
