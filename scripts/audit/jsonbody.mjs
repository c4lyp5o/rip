import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges?limit=3");
await page.click("button[title='Send request (Ctrl+Enter)']");
await page.waitForTimeout(2000);

const out = await page.evaluate(() => {
  const pane = document.querySelector('section[aria-label="Response"]');
  const rows = pane.querySelectorAll("[data-index], .absolute");
  return {
    statusBar: pane.querySelector("h2").parentElement.innerText.replace(/\n/g, " | "),
    bodyText: pane.textContent.replace(/\n+/g, " | ").slice(0, 400),
    hasChargeId: pane.textContent.includes("ch_3PxL8k2eZvKYlo2C"),
    hasAmount: pane.textContent.includes("4500"),
    jsonRows: pane.querySelectorAll("span").length,
  };
});
console.log(JSON.stringify(out, null, 1));
console.log("ERRORS:", JSON.stringify(errors));
await page.screenshot({ path: "screenshots/06-json-body.png" });
await browser.close();
