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
  console.log('Sent message, waiting for reply...');
  await WAIT(12000);

  // Walk entire shadow DOM tree and collect all text content
  const allText = await page.evaluate(() => {
    const results = [];
    const walk = (node, depth, path) => {
      if (node.shadowRoot) {
        results.push({ depth, path, type: 'shadow-root', html: node.shadowRoot.innerHTML.substring(0, 2000) });
        for (const child of node.shadowRoot.children) {
          walk(child, depth + 1, path + ' > ' + child.tagName + (child.id ? '#' + child.id : '') + (child.className ? '.' + child.className.split(' ')[0] : ''));
        }
      }
      for (const child of (node.children || [])) {
        walk(child, depth + 1, path + ' > ' + child.tagName + (child.id ? '#' + child.id : ''));
      }
    };
    walk(document.querySelector('chat-widget'), 0, 'chat-widget');
    return results;
  });

  allText.forEach(r => {
    console.log(`\n[depth:${r.depth}] ${r.path}`);
    console.log(r.html.substring(0, 800));
  });

  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
