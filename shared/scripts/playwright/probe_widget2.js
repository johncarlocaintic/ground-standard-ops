const { chromium } = require('playwright');

const URL = 'https://app.gohighlevel.com/v2/preview/gwj3rq0K3mhtWLqjY3Qg';
const WAIT = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await WAIT(2000);

  // Dump full widget HTML
  const widgetHTML = await page.$eval('#lc_text-widget', el => el.outerHTML);
  console.log('Widget HTML:\n', widgetHTML.substring(0, 3000));

  // Try clicking the chat button (the round icon)
  const btn = await page.$('#lc_text-widget button, #lc_text-widget [role="button"], .lc_text-widget button');
  if (btn) {
    console.log('\nFound button, clicking...');
    await btn.click();
  } else {
    // Click by coordinates - bottom right area
    console.log('\nNo button found, clicking by position...');
    await page.mouse.click(1230, 750);
  }

  await WAIT(3000);
  await page.screenshot({ path: 'shared/logs/widget_opened.png' });

  const html2 = await page.$eval('#lc_text-widget', el => el.outerHTML);
  console.log('\nWidget HTML after click:\n', html2.substring(0, 5000));

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
