const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const WAIT = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('Opening test portal...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Click the chat widget button to open it
  console.log('Clicking chat widget...');
  await page.click('#lc_text-widget');
  await WAIT(2000);
  await page.screenshot({ path: 'shared/logs/widget_open.png' });
  console.log('Screenshot: widget_open.png');

  // Dump what's now visible
  const frames = page.frames();
  console.log(`\nFrames after opening: ${frames.length}`);
  frames.forEach((f, i) => console.log(`  [${i}] ${f.url()}`));

  // Look for input field
  const inputSelectors = ['input[type="text"]', 'textarea', '[contenteditable]', 'input[placeholder]'];
  for (const sel of inputSelectors) {
    const el = await page.$(sel);
    if (el) {
      const info = await el.evaluate(e => ({ tag: e.tagName, placeholder: e.placeholder || '', id: e.id, class: e.className }));
      console.log(`\nInput found [${sel}]:`, info);
    }
  }

  await page.screenshot({ path: 'shared/logs/widget_open2.png', fullPage: false });
  await browser.close();
  console.log('\nDone.');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
