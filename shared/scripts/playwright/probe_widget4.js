const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const WAIT = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);

  // Click the bubble to open chat
  await page.click('#lc_text-widget--btn');
  await WAIT(4000);

  // Pierce shadow DOM of chat-widget
  const shadowHTML = await page.evaluate(() => {
    const cw = document.querySelector('chat-widget');
    if (!cw) return 'no chat-widget found';
    if (!cw.shadowRoot) return 'no shadow root';
    return cw.shadowRoot.innerHTML.substring(0, 5000);
  });
  console.log('Shadow DOM HTML:\n', shadowHTML);

  await page.screenshot({ path: 'shared/logs/widget_shadow.png' });
  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
