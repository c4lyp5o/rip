/**
 * The composer menus, verified in a REAL browser.
 *
 * jsdom cannot reproduce the ordering that broke these menus (React flushes
 * effects mid-propagation in a browser, but only after propagation in
 * jsdom), so this is the check that actually catches it.
 */
import { chromium } from "playwright";

const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges");

const open = async (label) => {
	await page.click(`button[aria-label="${label}"]`);
	await page.waitForTimeout(600);
	return page.evaluate(() => {
		const menus = [...document.querySelectorAll("div")].filter(
			(d) => d.className.includes("absolute") && d.className.includes("z-50") && d.innerText.trim(),
		);
		return menus.map((m) => m.innerText.split("\n").filter(Boolean));
	});
};

const code = await open("Copy as code");
console.log("COPY AS MENU:", JSON.stringify(code));

const save = await open("Save request");
console.log("SAVE MENU:", JSON.stringify(save));

console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
