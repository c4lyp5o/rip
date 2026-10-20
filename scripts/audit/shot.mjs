import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

await page.screenshot({ path: "screenshots/01-studio.png" });

// Fill in a URL so the composer looks real
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges?limit=3");
await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/02-filled.png" });

console.log("ERRORS:", JSON.stringify(errors, null, 1));
await browser.close();
