const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:5051/project/9764e6e3-b5ee-468c-9e9d-128c0ca8b062/campaigns/create';
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err && err.stack ? err.stack : err));
    page.on('response', async (resp) => {
      const status = resp.status();
      if (status >= 400) {
        try {
          const url = resp.url();
          console.log('HTTP RESP:', status, url);
          const text = await resp.text();
          console.log('RESP BODY SNIPPET:', text.slice(0, 300));
        } catch (e) {
          console.log('HTTP RESP: (could not read body)');
        }
      }
    });
    const resp = await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('HTTP status:', resp.status());

    // If unauthenticated, try a dev login to create a session cookie so subsequent API calls succeed.
    // This will call the dev-only endpoint added to the server: POST /__dev/login { address }
    // (safe because it only runs in non-production environments).
    try {
      const devAddress = process.env.DEV_TEST_ADDRESS || '0x1111111111111111111111111111111111111111';
      console.log('Attempting dev login with address', devAddress);
      const loginRes = await page.evaluate(async (addr) => {
        try {
          const r = await fetch('/__dev/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) });
          const txt = await r.text();
          return { status: r.status, body: txt };
        } catch (e) {
          return { status: 0, body: String(e) };
        }
      }, devAddress);
      console.log('Dev login response:', loginRes.status, loginRes.body && loginRes.body.slice ? loginRes.body.slice(0,300) : loginRes.body);

      // reload page to let client fetch profile with the new cookie
      const resp2 = await page.reload({ waitUntil: 'networkidle2' });
      console.log('Reload HTTP status:', resp2.status());
    } catch (e) {
      console.log('Dev login attempt failed:', e && e.stack ? e.stack : e);
    }
  // give the client a moment to hydrate and render
  await new Promise((res) => setTimeout(res, 1200));
    const body = await page.evaluate(() => document.documentElement.outerHTML);
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');
    console.log('BODY TEXT SNIPPET:', bodyText.slice(0, 800));
    if (bodyText.includes('Create Campaign')) {
      console.log('SUCCESS: page contains "Create Campaign"');
    } else {
      console.log('FAIL: page did not contain the expected text. Full HTML snippet:');
      console.log(body.slice(0, 2000));
    }
  } catch (err) {
    console.error('ERROR:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
  }
})();
