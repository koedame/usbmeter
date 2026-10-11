// Drives the production build in a real browser, checks what is on screen and takes screenshots.
//   pnpm build && pnpm screenshot   # PNGs land in screenshots/
//
// Layout and rendering cannot be measured by unit tests, so run this after a UI change and look at the pictures.
//
// The build is served with the same dist/_headers (CSP and friends) as production. The script
// fails on any console error, CSP violation, wrong reading, plot without a trace, sideways overflow
// or a desktop dashboard that does not fit the window. Two sources are used:
//   - the built-in demo
//   - a fake Bluetooth meter that replays frames recorded from a real J7-C in 20-byte
//     notifications, which exercises the connect, reassembly, parse and render path end to end.
//     Its device picker applies the page's filters the way the browser does, to a room with a
//     keyboard, earbuds and a mouse in it, so the script also sees which devices would be listed.
// Without a meter in reach this is the closest check of the Bluetooth path.
//
// Last, the real device picker is asked what it would list: Chromium gets an emulated
// Bluetooth adapter with meters and unrelated gadgets around it (ROOM), and the script reads
// the picker's list for "Connect to meter" and for "Show all Bluetooth devices".

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

const PC = { width: 1440, height: 900 };
const LAPTOP = { width: 1280, height: 720 };
const MOBILE = { width: 390, height: 844 };

// Frames recorded from a J7-C (see src/protocol.test.ts). The screen showed 4.73 V for these.
const J7C_FRAMES = [
  "FF5501030001D900006C0003070000016E004B004B001F00002C0D3C0DAC012C0320007C",
  "FF5501030001D900006A0003070000016E004A004B001F00002C0E3C0DAC012C032000E7",
  "FF5501030001D900006A0003080000016E004B004B001E00002C0F3C0DAC012C03200054",
  "FF5501030001D900006B0003080000016F004B004B001F00002C103C0DAC012C032000C5",
];

// Sample packets of an ATorch AC meter and DC meter (see src/protocol.test.ts)
const AC_FRAME = "FF55010100090400000E0000040000000000006401F40085002F00000A093C0000000039";
const DC_FRAME = "FF55010200011A00003C0004D40000002000006400000000002600590D363C00000000F0";

/** What the fake J7-C must show once its first frame has arrived: readout or element id, and its text */
const J7C_EXPECTED = {
  voltage: "4.73",
  current: "1.08",
  power: "5.11",
  capacity: "775",
  energy: "3.66",
  dplus: "0.75",
};

/**
 * The devices around the emulated adapter of the picker check: the name and the services each
 * one makes known before a connection, and whether "Connect to meter" should list it.
 */
const ROOM = [
  { name: "UC96_BLE", services: [], meter: true }, // a J7-C: known by name only
  { name: "UD18-BLE", services: [0xffe0], meter: true },
  { name: "AT24-BLE", services: [], meter: true },
  { name: "BT05", services: [0xffe0], meter: true }, // an unknown meter on the same serial service
  { name: "Magic Keyboard", services: [0x1812], meter: false },
  { name: "DAISO_TWS_G273_3", services: [], meter: false },
  { name: "MX Ergo", services: [0x1812, 0x180f], meter: false },
];

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
  { name: "pc-dark-demo", viewport: PC, colorScheme: "dark", source: "demo" },
  { name: "laptop-light-j7c", viewport: LAPTOP, colorScheme: "light", source: "fake-ble" },
  { name: "mobile-dark-j7c", viewport: MOBILE, colorScheme: "dark", source: "fake-ble" },
  { name: "mobile-light-demo", viewport: MOBILE, colorScheme: "light", source: "demo" },
  // a meter whose name the page does not know and that does not advertise its service
  {
    name: "laptop-dark-unlisted",
    viewport: LAPTOP,
    colorScheme: "dark",
    source: "fake-ble",
    meterName: "BT-METER-01",
    unlisted: true,
  },
  // the other kinds of meter get other panels: frequency and power factor, or no extras at all
  {
    name: "laptop-dark-ac",
    viewport: LAPTOP,
    colorScheme: "dark",
    source: "fake-ble",
    meterName: "AC-METER",
    meterServices: [0xffe0],
    frames: [AC_FRAME],
    expected: { voltage: "230.8", current: "0.014", power: "0.4", frequency: "50.0", pf: "0.133" },
    quantities: ["Voltage", "Current", "Power", "Temperature", "Frequency", "Power factor"],
  },
  {
    name: "laptop-light-dc",
    viewport: LAPTOP,
    colorScheme: "light",
    source: "fake-ble",
    meterName: "DC-METER",
    meterServices: [0xffe0],
    frames: [DC_FRAME],
    expected: { voltage: "28.2", current: "0.060", power: "1.69", temperature: "38" },
    quantities: ["Voltage", "Current", "Power", "Temperature"],
  },
];
const USB_QUANTITIES = ["Voltage", "Current", "Power", "Temperature", "D+", "D−"];

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

/**
 * Replaces navigator.bluetooth with a room of devices: a meter called `meterName` that names
 * `meterServices` in its advertisement and replays `frames` once a second in 20-byte chunks,
 * and some unrelated gadgets. `requestDevice` lists
 * the devices the way the browser does for the given options, records the names in
 * `window.pickerListed`, and "picks" the meter when it is in the list (cancels otherwise).
 */
function installFakeBluetooth({ frames, meterName, meterServices }) {
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
    name: meterName,
    gatt: {
      async connect() {
        return server;
      },
    },
    addEventListener() {},
    removeEventListener() {},
  };
  // What each device puts in its advertisement
  const nearby = [
    { name: meterName, services: meterServices },
    { name: "Magic Keyboard", services: [0x1812] },
    { name: "DAISO_TWS_G273_3", services: [] },
    { name: "MX Ergo", services: [0x1812, 0x180f] },
    { name: "", services: [] },
  ];
  const matches = (filter, advert) =>
    (filter.name === undefined || advert.name === filter.name) &&
    (filter.namePrefix === undefined || advert.name.startsWith(filter.namePrefix)) &&
    (filter.services ?? []).every((uuid) => advert.services.includes(uuid));
  window.pickerListed = [];
  Object.defineProperty(navigator, "bluetooth", {
    value: {
      requestDevice: async (options) => {
        const listed = nearby.filter(
          (advert) =>
            options.acceptAllDevices === true ||
            (options.filters ?? []).some((filter) => matches(filter, advert)),
        );
        window.pickerListed = listed.map((advert) => advert.name);
        await new Promise((resolve) => setTimeout(resolve, 800)); // the picker takes a while
        if (!listed.some((advert) => advert.name === meterName))
          throw new DOMException("User cancelled the requestDevice() chooser.", "NotFoundError");
        return device;
      },
    },
  });
}

/** Checks that hold on every screen once readings are flowing. Returns the problems found. */
function inspectDashboard(plotCount) {
  const problems = [];
  const root = document.documentElement;
  if (root.scrollWidth > window.innerWidth)
    problems.push(`the page is ${root.scrollWidth}px wide in a ${window.innerWidth}px window`);
  const plots = [...document.querySelectorAll(".panel:not([hidden]) canvas")];
  if (plots.length !== plotCount)
    problems.push(`${plots.length} plots are shown, expected ${plotCount}`);
  for (const canvas of plots) {
    const label = canvas.getAttribute("aria-label");
    const box = canvas.getBoundingClientRect();
    if (box.width < 200 || box.height < 80)
      problems.push(`"${label}" is only ${Math.round(box.width)}x${Math.round(box.height)}px`);
    // Grid and labels are grey; only a trace and its end dot are coloured. A plot without
    // coloured pixels has lost its trace (for instance to a missing --series-* colour).
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let coloured = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const spread =
        Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) -
        Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
      if (pixels[i + 3] > 200 && spread > 60) coloured++;
    }
    if (coloured < 100) problems.push(`"${label}" has no trace (${coloured} coloured pixels)`);
  }
  // wide and tall enough: the dashboard ends exactly at the bottom of the window
  if (window.innerWidth >= 900 && window.innerHeight >= 640) {
    const bottom = document.querySelector(".dash").getBoundingClientRect().bottom;
    if (Math.abs(bottom - window.innerHeight) > 1)
      problems.push(`the dashboard ends at ${bottom}px in a ${window.innerHeight}px tall window`);
  }
  return problems;
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
  const meterName = screen.meterName ?? "UC96_BLE";
  const quantities = screen.quantities ?? USB_QUANTITIES;
  if (screen.source === "fake-ble")
    await page.addInitScript(installFakeBluetooth, {
      frames: screen.frames ?? J7C_FRAMES,
      meterName,
      meterServices: screen.meterServices ?? [],
    });
  const fail = (message) => problems.push(`${screen.name}: ${message}`);
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") fail(message.text());
  });
  page.on("pageerror", (error) => fail(error.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  // what a visitor sees first, before any reading
  await page.screenshot({ path: join(OUT, `${screen.name}-start.png`) });

  if (screen.source === "demo") {
    await page.getByRole("button", { name: "Try the demo" }).click();
    await page.waitForTimeout(6000);
  } else {
    await page.getByRole("button", { name: "Connect to meter" }).click();
    if (!(await page.getByRole("button", { name: "Try the demo" }).isDisabled()))
      fail("the demo can be started while a connection is pending");
    if (screen.unlisted) {
      // the narrowed list does not show this meter; the page must offer the full list
      const everything = page.getByRole("button", { name: /Show all Bluetooth devices/ });
      await everything.waitFor();
      const narrowed = await page.evaluate(() => window.pickerListed);
      if (narrowed.length > 0) fail(`the narrowed picker listed ${JSON.stringify(narrowed)}`);
      await everything.click();
    }
    await page.getByRole("button", { name: "Disconnect" }).waitFor();
    const listed = await page.evaluate(() => window.pickerListed);
    if (!screen.unlisted && JSON.stringify(listed) !== JSON.stringify([meterName]))
      fail(`the picker listed ${JSON.stringify(listed)}, expected only the meter`);
    if (screen.unlisted && listed.length !== 5)
      fail(`the full picker listed ${JSON.stringify(listed)}, expected every device`);
    const expected = screen.expected ?? J7C_EXPECTED;
    const first = await page.evaluate(
      (ids) =>
        Object.fromEntries(
          ids.map((id) => [
            id,
            (document.querySelector(`[data-readout="${id}"]`) ?? document.getElementById(id))
              .textContent,
          ]),
        ),
      Object.keys(expected),
    );
    for (const [id, text] of Object.entries(expected)) {
      if (first[id] !== text) fail(`${id} shows ${first[id]}, expected ${text}`);
    }
    await page.waitForTimeout(3500);
  }

  // D+ and D− share a plot; every other quantity has its own
  const plots = quantities.includes("D+") ? quantities.length - 1 : quantities.length;
  for (const problem of await page.evaluate(inspectDashboard, plots)) fail(problem);

  const status = await page.locator("#status").textContent();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download CSV" }).click(),
  ]);
  const csv = (await readFile(await download.path(), "utf8")).split("\n");
  if (!csv[0].startsWith("time,elapsed_s,voltage_v") || csv.length < 5)
    fail(`CSV looks wrong (${csv.length} lines)`);

  // The cursor: pointing at one plot shows every quantity at that moment
  const current = page.getByRole("img", { name: "Current over time" });
  await current.scrollIntoViewIfNeeded();
  const plot = await current.boundingBox();
  await page.mouse.move(plot.x + plot.width * 0.8, plot.y + plot.height / 2);
  const tooltip = page.locator("#tooltip");
  const appeared = await tooltip.waitFor({ state: "visible", timeout: 5000 }).then(
    () => true,
    () => false,
  );
  if (appeared) {
    const told = await tooltip.innerText();
    for (const quantity of quantities)
      if (!told.includes(quantity)) fail(`the tooltip does not mention ${quantity}: ${told}`);
    const tip = await tooltip.boundingBox();
    if (tip.x < 0 || tip.x + tip.width > screen.viewport.width)
      fail(`the tooltip sticks out of the window (x=${tip.x}, width=${tip.width})`);
  } else {
    fail("no tooltip appeared when pointing at the Current plot");
  }

  // mobile pages scroll, so capture all of it; on a computer the dashboard is the window
  const fullPage = screen.viewport.width < 900;
  await page.screenshot({ path: join(OUT, `${screen.name}.png`), fullPage });
  console.log(`${screen.name}.png  status="${status.trim()}"  csv rows=${csv.length - 2}`);
  await page.close();
}

await browser.close();

// The real picker. Only the full browser can emulate a Bluetooth adapter; the headless shell cannot.
{
  // Chromium on Linux keeps Web Bluetooth behind this switch
  const full = await chromium.launch({
    channel: "chromium",
    args: ["--enable-features=WebBluetooth"],
  });
  const page = await full.newPage();
  const adapter = await full.newBrowserCDPSession();
  const picker = await page.context().newCDPSession(page);
  await adapter.send("BluetoothEmulation.enable", { state: "powered-on", leSupported: true });
  const address = (i) => `09:09:09:09:09:0${i}`;
  for (const [i, device] of ROOM.entries()) {
    await adapter.send("BluetoothEmulation.simulatePreconnectedPeripheral", {
      address: address(i),
      name: device.name,
      manufacturerData: [],
      knownServiceUuids: device.services.map(
        (uuid) => `0000${uuid.toString(16)}-0000-1000-8000-00805f9b34fb`,
      ),
    });
  }
  await picker.send("DeviceAccess.enable");
  let shown;
  picker.on("DeviceAccess.deviceRequestPrompted", (event) => {
    shown = event; // sent again whenever the list grows
  });
  await page.goto(`http://127.0.0.1:${port}/`);

  const names = (wanted) =>
    ROOM.filter(wanted)
      .map((device) => device.name)
      .sort();
  for (const [button, expected] of [
    [/Connect to meter/, names((device) => device.meter)],
    [/Show all Bluetooth devices/, names(() => true)],
  ]) {
    shown = undefined;
    await page.getByRole("button", { name: button }).click();
    await page.waitForTimeout(2000);
    const listed = (shown?.devices ?? [])
      .map(({ id }) => ROOM.find((_, i) => address(i) === id)?.name ?? id)
      .sort();
    if (JSON.stringify(listed) !== JSON.stringify(expected))
      problems.push(`picker for ${button}: listed ${JSON.stringify(listed)}`);
    console.log(`picker ${button}  lists ${listed.join(", ") || "nothing"}`);
    if (shown) await picker.send("DeviceAccess.cancelPrompt", { id: shown.id });
    await page.getByRole("button", { name: /Show all Bluetooth devices/ }).waitFor();
  }
  await full.close();
}
server.close();

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
