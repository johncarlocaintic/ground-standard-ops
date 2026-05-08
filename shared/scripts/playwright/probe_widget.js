const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Opening page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page loaded:', await page.title());

  // Dump all iframes
  const frames = page.frames();
  console.log(`\nFrames found: ${frames.length}`);
  frames.forEach((f, i) => console.log(`  [${i}] ${f.url()}`));

  // Look for chat widget elements
  const chatSelectors = [
    'iframe[src*="chat"]',
    'iframe[src*="widget"]',
    'iframe[src*="closebot"]',
    'iframe[src*="leadconnector"]',
    '[id*="chat"]',
    '[class*="chat"]',
    '[id*="widget"]',
    '[class*="widget"]',
  ];

  console.log('\nSearching for chat elements...');
  for (const sel of chatSelectors) {
    const el = await page.$(sel);
    if (el) {
      const info = await el.evaluate(e => ({ tag: e.tagName, id: e.id, class: e.className, src: e.src || '' }));
      console.log(`  FOUND [${sel}]:`, info);
    }
  }

  // Screenshot for visual confirmation
  await page.screenshot({ path: 'shared/logs/widget_probe.png', fullPage: true });
  console.log('\nScreenshot saved to shared/logs/widget_probe.png');

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
