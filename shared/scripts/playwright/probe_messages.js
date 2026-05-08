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

  // Send one message and wait for reply
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
  await WAIT(10000);

  // Dump full chat-message structure
  const dump = await page.evaluate(() => {
    const cw = document.querySelector('chat-widget');
    if (!cw?.shadowRoot) return 'no shadow';
    const pane = cw.shadowRoot.querySelector('chat-pane');
    if (!pane?.shadowRoot) return 'no pane shadow';

    const msgs = pane.shadowRoot.querySelectorAll('chat-message');
    return Array.from(msgs).map(msg => ({
      attributes: Array.from(msg.attributes).map(a => `${a.name}="${a.value}"`),
      classes: msg.className,
      shadowText: msg.shadowRoot?.textContent?.trim().substring(0, 200),
      shadowHTML: msg.shadowRoot?.innerHTML?.substring(0, 500),
      outerHTML: msg.outerHTML.substring(0, 300)
    }));
  });

  console.log('\nchat-message elements:');
  dump.forEach((m, i) => console.log(`\n[${i}]`, JSON.stringify(m, null, 2)));

  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
