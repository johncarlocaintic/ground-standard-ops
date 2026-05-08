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

  // Send message
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
  console.log('Sent: hey — waiting 12s for reply...');
  await WAIT(12000);

  // Simple: get all text from chat-pane shadow root
  const result = await page.evaluate(() => {
    const cw = document.querySelector('chat-widget');
    if (!cw?.shadowRoot) return { error: 'no chat-widget shadow' };

    const box = cw.shadowRoot.querySelector('#lc_text-widget--box');
    if (!box) return { error: 'no box', html: cw.shadowRoot.innerHTML.substring(0, 1000) };

    const pane = cw.shadowRoot.querySelector('chat-pane');
    if (!pane) return { error: 'no pane', boxHTML: box.innerHTML.substring(0, 1000) };

    // Try innerText on the pane element itself
    const paneText = pane.innerText;

    // Try shadow root of pane
    const paneShadow = pane.shadowRoot;
    const paneShadowHTML = paneShadow?.innerHTML?.substring(0, 3000);
    const paneShadowText = paneShadow?.innerText;

    // Get all chat-message elements
    const msgs = paneShadow ? Array.from(paneShadow.querySelectorAll('chat-message')).map(m => ({
      attrs: Array.from(m.attributes).map(a => `${a.name}=${a.value}`).join(', '),
      text: m.innerText || m.textContent,
      shadowHTML: m.shadowRoot?.innerHTML?.substring(0, 300)
    })) : [];

    return { paneText, paneShadowHTML, paneShadowText, msgs };
  });

  console.log('\n=== RESULT ===');
  console.log('paneText:', result.paneText);
  console.log('paneShadowText:', result.paneShadowText);
  console.log('paneShadowHTML:', result.paneShadowHTML?.substring(0, 1000));
  console.log('msgs:', JSON.stringify(result.msgs, null, 2));
  if (result.error) console.log('ERROR:', result.error, result.html || result.boxHTML);

  await browser.close();
})().catch(e => console.error('FATAL:', e.message));
