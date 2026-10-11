// Renders public/og.png (the social preview, 1200x630). Run when the wording changes:
//   pnpm exec node scripts/og-image.mjs
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;width:1200px;height:630px;box-sizing:border-box;padding:72px;background:#0f1419;color:#e8ecf0;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:space-between}
  h1{margin:0;font-size:72px;font-weight:700}
  p{margin:12px 0 0;font-size:34px;color:#9aa5b1}
  .row{display:flex;gap:24px}
  .card{flex:1;border:2px solid #2d343c;border-radius:20px;padding:24px 32px;background:#1a1e24}
  .card span{display:block;font-size:26px;color:#9aa5b1}
  .card b{font-size:80px;font-variant-numeric:tabular-nums}
  .card small{font-size:32px;color:#9aa5b1;margin-left:8px}
  .meters{font-size:28px;color:#5aa9ff}
</style>
<div><h1>USB Meter Web</h1><p>Live readings from your Bluetooth USB tester, in the browser</p></div>
<div class="row">
  <div class="card"><span>Voltage</span><b>5.08</b><small>V</small></div>
  <div class="card"><span>Current</span><b>1.24</b><small>A</small></div>
  <div class="card"><span>Power</span><b>6.30</b><small>W</small></div>
</div>
<div class="meters">ATorch UD18 · AT24 · J7-C · and similar meters</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: fileURLToPath(new URL("../public/og.png", import.meta.url)) });
await browser.close();
