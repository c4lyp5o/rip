import { chromium } from "playwright";
const PREVIEW_URL = process.env.RIP_PREVIEW_URL || "http://127.0.0.1:4340/";
import { THEMES } from "../../src/themes/themes.js";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.fill('input[aria-label="Request URL"]', "https://api.stripe.com/v1/charges?limit=3");
await page.waitForTimeout(300);

const results = [];
for (const t of THEMES) {
  const r = await page.evaluate((theme) => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return new Promise((res) => setTimeout(() => {
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number);
        const [r,g,b] = m; const f=(v)=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
        return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
      const bgOf = (el) => { let n = el; while (n) { const bg = getComputedStyle(n).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg; n = n.parentElement; } return "rgb(10,11,13)"; };
      const bad = []; const seen = new Set();
      document.querySelectorAll("*").forEach((el) => {
        const txt = (el.textContent||"").trim();
        if (!txt || el.children.length > 0) return;
        const cs = getComputedStyle(el);
        if (cs.visibility==="hidden"||cs.display==="none"||parseFloat(cs.opacity)<0.5) return;
        const fg=cs.color, bg=bgOf(el);
        const L1=lum(fg), L2=lum(bg);
        const ratio=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
        const size=parseFloat(cs.fontSize); const bold=parseInt(cs.fontWeight)>=700;
        const need=(size>=18||(size>=14&&bold))?3:4.5;
        if (ratio<need) { const k=fg+"|"+bg+"|"+size; if(!seen.has(k)){seen.add(k);
          bad.push({text:txt.slice(0,30),ratio:+ratio.toFixed(2),need,fg,bg}); } }
      });
      // horizontal overflow
      let ovf = 0;
      document.querySelectorAll("*").forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
          const cs = getComputedStyle(el);
          if (cs.overflowX === "visible") ovf++;
        }
      });
      res({ theme: theme.id, bad, ovf, bodyScroll: document.body.scrollWidth, inner: window.innerWidth });
    }, 120));
  }, t);
  results.push(r);
}

for (const r of results) {
  console.log(`\n=== ${r.theme} ===  overflow:${r.ovf}  bodyScroll:${r.bodyScroll}/${r.inner}`);
  r.bad.forEach(b => console.log(`   LOW ${b.ratio} (need ${b.need}) "${b.text}" ${b.fg} on ${b.bg}`));
  if (!r.bad.length) console.log("   contrast OK");
}
await browser.close();
