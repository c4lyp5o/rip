import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => {
	if (m.type() === "error" && !m.text().includes("ERR_CONNECTION_REFUSED"))
		errors.push(m.text());
});

/**
 * Capture a screenshot, asserting the state first.
 *
 * A screenshot that silently shows the wrong state is worse than no
 * screenshot — it looks like evidence but is not. Every shot below
 * declares what must be on screen.
 */
const shot = async (name, expect) => {
	if (expect) {
		const body = await page.evaluate(() => document.body.textContent);
		if (!body.includes(expect)) {
			throw new Error(
				`SHOT "${name}" FAILED its assertion: expected "${expect}" on screen.`,
			);
		}
	}
	await page.waitForTimeout(450);
	await page.screenshot({ path: `${OUT}/${name}.png` });
	console.log("shot:", name, expect ? `(asserted "${expect}")` : "");
};

const goto = async () => {
	await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
	await page.waitForTimeout(2200);
};

const send = async (url) => {
	await page.fill('input[aria-label="Request URL"]', url);
	await page.click("button[title='Send request (Ctrl+Enter)']");
	await page.waitForTimeout(1500);
};

/** Switch theme through the real picker in the sidebar. */
const setTheme = async (name) => {
	await page.click('button[aria-haspopup="listbox"]');
	await page.waitForTimeout(350);
	await page.click(`[role="option"]:has-text("${name}")`);
	await page.waitForTimeout(600);
};

// 1 — the shell as it opens
await goto();
await shot("01-studio-shell", "History");

// 2 — a real request with the response and body side by side
await send("https://api.stripe.com/v1/charges?limit=3");
await shot("02-request-response", "200 OK");

// 3 — the request pane on Headers
await page.click('button[role="tab"]:has-text("Headers")');
await shot("03-request-headers", "Params");

// 4 — the code generator menu, open
await page.click('button[aria-label="Copy as code"]');
await page.waitForTimeout(600);
await shot("04-code-menu", "cURL");

// 4b — the same menu, cropped so the generators are legible
{
	const m = await page.evaluate(() => {
		const el = [...document.querySelectorAll("div")].find(
			(d) =>
				d.className.includes("absolute") &&
				d.className.includes("z-50") &&
				d.innerText.includes("cURL"),
		);
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return { x: r.x, y: r.y, w: r.width, h: r.height };
	});
	if (!m) throw new Error('SHOT "04b-code-menu-crop" FAILED: no code menu on screen');
	await page.screenshot({
		path: `${OUT}/04b-code-menu-crop.png`,
		clip: {
			x: Math.max(0, m.x - 300),
			y: Math.max(0, m.y - 80),
			width: m.w + 320,
			height: m.h + 100,
		},
	});
	console.log("shot: 04b-code-menu-crop");
}
await page.keyboard.press("Escape");
await page.mouse.click(900, 600);
await page.waitForTimeout(400);

// 5 — a failed request
await send("https://error.test/v1/charges");
await shot("05-error-state", "Request failed");

// 6 — the theme picker open
await goto();
await page.click('button[aria-haspopup="listbox"]');
await page.waitForTimeout(500);
await shot("06-theme-picker", "Studio");
await page.keyboard.press("Escape");

// 7 — other themes
for (const [theme, label] of [
	["Linear-ish", "07-theme-linear"],
	["Dark Brutalist", "08-theme-dark-brutalist"],
	["Minimal Light", "09-theme-minimal-light"],
]) {
	await goto();
	await setTheme(theme);
	await send("https://api.stripe.com/v1/charges?limit=3");
	await shot(label, "200 OK");
}

console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
