const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:5051/project/9764e6e3-b5ee-468c-9e9d-128c0ca8b062/campaigns/create';
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    const resp = await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('HTTP status:', resp.status());
    const body = await page.content();
    if (body.includes('Create Campaign')) {
      console.log('SUCCESS: page contains "Create Campaign"');
    } else {
      console.log('FAIL: page did not contain the expected text. Preview snippet:');
      console.log(body.slice(0, 800));
    }
  } catch (err) {
    console.error('ERROR:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
  }
})();
