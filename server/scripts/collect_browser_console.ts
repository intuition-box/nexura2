import puppeteer from "puppeteer";

async function run() {
  const url = process.env.URL || "http://localhost:5051";
  console.log(`Opening page: ${url}`);

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  page.on("console", (msg) => {
    try {
      const args = msg.args();
      // Print simple text if available
      console.log(`[PAGE ${msg.type()}] ${msg.text()}`);
    } catch (e) {
      console.log(`[PAGE ${msg.type()}] (couldn't stringify)`);
    }
  });

  page.on("pageerror", (err) => {
    console.error("[PAGE ERROR]", err);
  });

  page.on("response", (res) => {
    try {
      if (res.status() >= 400) {
        console.log(`[RESPONSE ${res.status()}] ${res.url()}`);
      }
    } catch (e) {
      // ignore
    }
  });

  page.on("requestfailed", (req) => {
    console.log(`[REQUEST FAILED] ${req.url()} -> ${req.failure()?.errorText}`);
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  // Allow time for client-side scripts (wallet injection, auth flows) to run
  await page.waitForTimeout(5000);

  // If there's a global window.__BACKEND_URL__ print it
  try {
    const backend = await page.evaluate(() => (window as any).__BACKEND_URL__ || null);
    console.log("window.__BACKEND_URL__ =", backend);
  } catch (e) {
    // ignore
  }

  console.log("Finished capturing browser console logs.");
  await browser.close();
}

run().catch((err) => {
  console.error("Collector failed:", err);
  process.exit(1);
});
