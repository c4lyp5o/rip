import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.fill('input[aria-label="Request URL"]', "https://error.test/v1/charges");
await page.click("button[title='Send request (Ctrl+Enter)']");
await page.waitForTimeout(1500);
const out = await page.evaluate(() => {
  const pane = document.querySelector('section[aria-label="Response"]');
  return {
    statusBar: pane.querySelector("h2").parentElement.innerText.replace(/\n/g, " | "),
    hasZeroMs: /0ms|0KB/.test(pane.innerText),
    hasBodyHeadersToggle: /Headers/.test(pane.querySelector("h2").parentElement.innerText),
    body: pane.innerText.replace(/\n+/g, " | ").slice(0, 260),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
