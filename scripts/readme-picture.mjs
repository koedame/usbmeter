// Renders docs/dashboard.png, the picture at the top of the README: the demo after a minute,
// with the pointer on the current graph. Run when the dashboard looks different:
//   pnpm build && node scripts/readme-picture.mjs
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { preview } from "vite";

const server = await preview({ preview: { port: 0, host: "127.0.0.1" } });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
  colorScheme: "dark",
  locale: "en-US",
});
// the picture shows the page as a browser with Bluetooth has it, without the notice for the others
await page.addInitScript(() => {
  Object.defineProperty(navigator, "bluetooth", { value: {} });
});
await page.goto(server.resolvedUrls.local[0]);
await page.getByRole("button", { name: "Try the demo" }).click();
await page.waitForTimeout(62_000);
const plot = await page.getByRole("img", { name: "Current over time" }).boundingBox();
await page.mouse.move(plot.x + plot.width * 0.48, plot.y + plot.height * 0.72);
await page.locator("#tooltip").waitFor({ state: "visible" });
await page.screenshot({ path: fileURLToPath(new URL("../docs/dashboard.png", import.meta.url)) });
await browser.close();
await server.close();
