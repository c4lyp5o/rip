import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

/**
 * Audit the CURRENT dom.
 *
 * Every state of the app is audited, not just the default one. A label
 * that only renders in the error state can be below the type floor
 * without the default-view audit ever seeing it.
 */
const auditDom = async (state) => {
	return await page.evaluate((state) => {
		const out = { state, smallText: [], overflow: [], contrast: [], tiny: [] };
		const seen = new Set();

		// 1. Text smaller than 11px
		document.querySelectorAll("*").forEach((el) => {
			const t = (el.textContent || "").trim();
			if (!t || el.children.length > 0) return;
			const cs = getComputedStyle(el);
			const size = parseFloat(cs.fontSize);
			if (size < 11) {
				const key = el.className + "|" + size;
				if (!seen.has(key)) {
					seen.add(key);
					out.smallText.push({ size, text: t.slice(0, 40), cls: String(el.className).slice(0, 70) });
				}
			}
		});

		// 2. Horizontal overflow anywhere
		document.querySelectorAll("*").forEach((el) => {
			if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
				const cs = getComputedStyle(el);
				if (cs.overflowX === "visible" || cs.overflowX === "hidden") {
					out.overflow.push({ tag: el.tagName, cls: String(el.className).slice(0, 60),
						scrollW: el.scrollWidth, clientW: el.clientWidth, ovx: cs.overflowX });
				}
			}
		});

		// 3. Truncated text (ellipsis) that carries info
		document.querySelectorAll("*").forEach((el) => {
			const cs = getComputedStyle(el);
			if (cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1) {
				out.tiny.push({ text: (el.textContent || "").trim().slice(0, 50), w: el.clientWidth, sw: el.scrollWidth });
			}
		});

		// 4. Element geometry of key regions
		const box = (sel) => { const e = document.querySelector(sel); if (!e) return null;
			const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };

		out.geometry = {
			sidebar: box("aside"),
			composerUrl: box('input[aria-label="Request URL"]'),
			sendBtn: box("button[title='Send request (Ctrl+Enter)']"),
			requestPane: box('section[aria-label="Request"]'),
			responsePane: box('section[aria-label="Response"]'),
			bodyScrollW: document.body.scrollWidth,
			innerW: window.innerWidth,
		};

		// 5. Contrast check on visible text nodes
		const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number);
			const [r, g, b] = m; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
			return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
		const bgOf = (el) => { let n = el; while (n) { const bg = getComputedStyle(n).backgroundColor;
			if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg; n = n.parentElement; } return "rgb(10,11,13)"; };
		const check = new Set();
		document.querySelectorAll("*").forEach((el) => {
			const t = (el.textContent || "").trim();
			if (!t || el.children.length > 0) return;
			const cs = getComputedStyle(el);
			if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.5) return;
			const fg = cs.color, bg = bgOf(el);
			const L1 = lum(fg), L2 = lum(bg);
			const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
			const size = parseFloat(cs.fontSize);
			const bold = parseInt(cs.fontWeight) >= 700;
			const need = size >= 18 || (size >= 14 && bold) ? 3 : 4.5;
			if (ratio < need) {
				const k = fg + "|" + bg + "|" + size;
				if (!check.has(k)) { check.add(k); out.contrast.push({ text: t.slice(0, 35), ratio: +ratio.toFixed(2), need, size, fg, bg }); }
			}
		});

		// 6. Fonts actually loaded
		out.fonts = {
			inter: document.fonts.check("13px Inter"),
			mono: document.fonts.check("13px 'JetBrains Mono'"),
			loaded: Array.from(document.fonts).map((f) => f.family + ":" + f.status).slice(0, 8),
		};
		return out;
	}, state);
};

const states = {};

await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// State 1 — the default shell, nothing sent yet
states.default = await auditDom("default");

// State 2 — a successful response with a body
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges?limit=3");
await page.click("button[title='Send request (Ctrl+Enter)']");
await page.waitForTimeout(1600);
states.success = await auditDom("success");

// State 3 — a failed request (the error panel)
await page.fill('input[aria-label="Request URL"]', "https://error.test/v1/charges");
await page.click("button[title='Send request (Ctrl+Enter)']");
await page.waitForTimeout(1600);
states.error = await auditDom("error");

// State 4 — the composer menus open
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges");
await page.click('button[aria-label="Copy as code"]');
await page.waitForTimeout(600);
states.codeMenu = await auditDom("codeMenu");

console.log(JSON.stringify(states, null, 1));
await browser.close();
