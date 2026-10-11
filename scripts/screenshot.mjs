// Drives the production build in a real browser and takes screenshots.
//   pnpm build && pnpm screenshot   # PNGs land in screenshots/
//
// Layout and rendering cannot be measured by unit tests, so run this after a UI change and look at the pictures.
//
// The build is served with the same dist/_headers (CSP and friends) as production. The script
// fails on any console error, CSP violation or wrong reading. Two sources are used:
//   - the built-in demo
//   - a fake Bluetooth meter that replays frames recorded from a real J7-C in 20-byte
//     notifications, which exercises the connect, reassembly, parse and render path end to end
// Without a meter in reach this is the closest check of the Bluetooth path.

import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const OUT = fileURLToPath(new URL("../screenshots/", import.meta.url));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

const PC = { width: 1280, height: 900 };
const MOBILE = { width: 390, height: 900 };

// Frames recorded from a J7-C (see src/protocol.test.ts). The screen showed 4.73 V for these.
const J7C_FRAMES = [
  "FF5501030001D900006C0003070000016E004B004B001F00002C0D3C0DAC012C0320007C",
  "FF5501030001D900006A0003070000016E004A004B001F00002C0E3C0DAC012C032000E7",
  "FF5501030001D900006A0003080000016E004B004B001E00002C0F3C0DAC012C03200054",
  "FF5501030001D900006B0003080000016F004B004B001F00002C103C0DAC012C032000C5",
];

/** [name, value, unit] pairs the fake J7-C must show once its first frame has arrived */
const J7C_EXPECTED = {
  voltage: "4.73",
  current: "1.08",
  power: "5.11",
  capacity: "775",
  energy: "3.66",
  dplus: "0.75",
};

/** dist/_headers `/*` block as [name, value] pairs */
async function rootHeaders() {
  const lines = (await readFile(join(DIST, "_headers"), "utf8")).split("\n");
  const start = lines.indexOf("/*");
  if (start < 0) throw new Error("dist/_headers has no /* block");
  const headers = [];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    const at = line.indexOf(":");
    headers.push([line.slice(0, at).trim(), line.slice(at + 1).trim()]);
  }
  return headers;
}

const SCREENS = [
  { name: "pc-demo", viewport: PC, colorScheme: "light", source: "demo" },
  { name: "pc-j7c", viewport: PC, colorScheme: "light", source: "fake-ble" },
  { name: "mobile-demo", viewport: MOBILE, colorScheme: "light", source: "demo" },
  { name: "mobile-dark-j7c", viewport: MOBILE, colorScheme: "dark", source: "fake-ble" },
];

const HEADERS = await rootHeaders();
const server = createServer(async (request, response) => {
  const path = (request.url ?? "/").split("?")[0];
  const file = join(DIST, path === "/" ? "index.html" : path);
  if (!file.startsWith(DIST)) return void response.writeHead(403).end("forbidden");
  try {
    const body = await readFile(file);
    response.writeHead(200, [
      ...HEADERS,
      ["content-type", TYPES[extname(file)] ?? "application/octet-stream"],
    ]);
    response.end(body);
  } catch {
    response.writeHead(404).end("not found");
  }
});

/** Replaces navigator.bluetooth with a meter that replays `frames` once a second in 20-byte chunks */
function installFakeBluetooth(frames) {
  const bytes = frames.map((hex) =>
    Uint8Array.from(hex.match(/../g).map((b) => Number.parseInt(b, 16))),
  );
  const characteristic = {
    uuid: "0000ffe1-0000-1000-8000-00805f9b34fb",
    properties: { notify: true },
    value: null,
    listeners: [],
    addEventListener(type, listener) {
      if (type === "characteristicvaluechanged") this.listeners.push(listener);
    },
    async startNotifications() {
      let i = 0;
      const send = () => {
        const frame = bytes[i++ % bytes.length];
        for (const part of [frame.slice(0, 20), frame.slice(20)]) {
          this.value = new DataView(part.buffer.slice(0));
          for (const listener of this.listeners) listener({});
        }
      };
      send();
      setInterval(send, 1000);
    },
  };
  const service = {
    async getCharacteristics() {
      return [characteristic];
    },
  };
  const server = {
    connected: true,
    async getPrimaryService(uuid) {
      if (uuid === 0xffe0) return service;
      throw new DOMException("no such service", "NotFoundError");
    },
    disconnect() {},
  };
  const device = {
    name: "J7-C (fake)",
    gatt: {
      async connect() {
        return server;
      },
    },
    addEventListener() {},
    removeEventListener() {},
  };
  Object.defineProperty(navigator, "bluetooth", {
    value: {
      requestDevice: async () => {
        await new Promise((resolve) => setTimeout(resolve, 800)); // the picker takes a while
        return device;
      },
    },
  });
}

await mkdir(OUT, { recursive: true });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const browser = await chromium.launch();
const problems = [];

for (const screen of SCREENS) {
  const page = await browser.newPage({
    viewport: screen.viewport,
    colorScheme: screen.colorScheme,
    deviceScaleFactor: 2,
    acceptDownloads: true,
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  if (screen.source === "fake-ble") await page.addInitScript(installFakeBluetooth, J7C_FRAMES);
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      problems.push(`${screen.name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`${screen.name}: ${error.message}`));
  await page.goto(`http://127.0.0.1:${port}/`);

  if (screen.source === "demo") {
    await page.getByRole("button", { name: "Try the demo" }).click();
    await page.waitForTimeout(6000);
  } else {
    await page.getByRole("button", { name: "Connect to meter" }).click();
    if (!(await page.getByRole("button", { name: "Try the demo" }).isDisabled()))
      problems.push(`${screen.name}: the demo can be started while a connection is pending`);
    await page.getByRole("button", { name: "Disconnect" }).waitFor();
    const first = await page.evaluate(() =>
      Object.fromEntries(
        ["voltage", "current", "power", "capacity", "energy", "dplus"].map((id) => [
          id,
          document.getElementById(id).textContent,
        ]),
      ),
    );
    for (const [id, expected] of Object.entries(J7C_EXPECTED)) {
      if (first[id] !== expected)
        problems.push(`${screen.name}: #${id} shows ${first[id]}, expected ${expected}`);
    }
    await page.waitForTimeout(3500);
  }

  const status = await page.locator("#status").textContent();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download CSV" }).click(),
  ]);
  const csv = (await readFile(await download.path(), "utf8")).split("\n");
  if (!csv[0].startsWith("time,elapsed_s,voltage_v") || csv.length < 5)
    problems.push(`${screen.name}: CSV looks wrong (${csv.length} lines)`);
  await page.screenshot({ path: join(OUT, `${screen.name}.png`), fullPage: true });
  console.log(`${screen.name}.png  status="${status}"  csv rows=${csv.length - 2}`);
  await page.close();
}

await browser.close();
server.close();

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
