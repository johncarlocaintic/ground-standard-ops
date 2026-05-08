const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const WAIT = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);

  // Click the actual chat button
  console.log('Clicking chat bubble button...');
  await page.click('#lc_text-widget--btn');
  await WAIT(4000);

  await page.screenshot({ path: 'shared/logs/widget_after_btn.png' });

  // Check for shadow DOM
  const shadowContent = await page.evaluate(() => {
    const widget = document.querySelector('#lc_text-widget');
    if (!widget) return 'no widget found';

    // Walk all children looking for shadow roots
    const results = [];
    const walk = (el, depth = 0) => {
      if (el.shadowRoot) {
        results.push(`Shadow root at: ${el.tagName}#${el.id}.${el.className}`);
        results.push('Shadow innerHTML preview: ' + el.shadowRoot.innerHTML.substring(0, 500));
      }
      for (const child of el.children) walk(child, depth + 1);
    };
    walk(widget);

    return results.length ? results.join('\n') : 'No shadow roots found. Full HTML: ' + widget.innerHTML.substring(0, 1000);
  });

  console.log('\nShadow DOM check:\n', shadowContent);

  // Also check if chat window appeared elsewhere in DOM
  const chatWindow = await page.evaluate(() => {
    const selectors = ['[class*="chat-window"]', '[class*="chat-open"]', '[id*="chat-window"]', 'ion-app', 'chat-widget'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return `Found: ${sel} -> ${el.outerHTML.substring(0, 300)}`;
    }
    return 'No chat window element found in DOM';
  });
  console.log('\nChat window check:', chatWindow);

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
