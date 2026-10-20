import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

// Serve a real JSON response so the response pane has content
await page.route("**/v1/charges**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      object: "list",
      url: "/v1/charges",
      has_more: false,
      data: [
        { id: "ch_3PxL8k2eZvKYlo2C", amount: 2000, currency: "usd", status: "succeeded", captured: true },
        { id: "ch_3PxL9k3fAwKYlo2C", amount: 4500, currency: "usd", status: "succeeded", captured: true },
      ],
    }, null, 2),
  })
);

await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges?limit=3");
await page.click("button[title='Send request (Ctrl+Enter)']");
await page.waitForTimeout(1500);
await page.screenshot({ path: "screenshots/03-response.png" });

// Switch the request pane to Headers
await page.click('button[role="tab"]:has-text("Headers")');
await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/04-headers.png" });

// Open a collection request
await page.click("text=Payments API");
await page.waitForTimeout(300);
await page.click("text=List charges");
await page.waitForTimeout(600);
await page.screenshot({ path: "screenshots/05-collection.png" });

console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
