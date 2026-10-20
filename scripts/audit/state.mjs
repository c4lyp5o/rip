import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges?limit=3");
await page.click("button[title='Send request (Ctrl+Enter)']");
await page.waitForTimeout(1200);
const s = await page.evaluate(() => {
  const t = (sel) => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\n/g," | ").slice(0,200) : null; };
  const pane = (sel) => { const e = document.querySelector(sel); if(!e) return null;
    const r = e.getBoundingClientRect(); return {y:Math.round(r.y),h:Math.round(r.height),w:Math.round(r.width)}; };
  return {
    sidebar: t("aside"),
    responseSection: t('section[aria-label="Response"]'),
    requestSection: t('section[aria-label="Request"]'),
    reqPane: pane('section[aria-label="Request"]'),
    resPane: pane('section[aria-label="Response"]'),
    composer: t("input[aria-label='Request URL']") ,
    visibleButtons: Array.from(document.querySelectorAll("button")).filter(b=>b.offsetParent).map(b=>b.innerText.trim()||b.getAttribute("aria-label")).filter(Boolean).slice(0,22),
  };
});
console.log(JSON.stringify(s, null, 1));
await browser.close();
