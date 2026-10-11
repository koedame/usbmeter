# USB Meter Web

Live readings from Bluetooth USB testers and power meters, in your browser. Voltage, current,
power, capacity, energy, D+/D−, temperature and elapsed time on a big screen, with a graph and
CSV export. Nothing to install, no account.

Works with the **ATorch UD18**, **AT24** and the **J7-C**, and with other meters that stream the
same "FF 55" frames over Bluetooth LE.

> Deployed at https://usbmeter.koeda.me (address not final yet)

## Use it

1. Switch the meter on and disconnect it from any phone app (these meters accept one connection at a time).
2. Open the page in **Chrome or Edge** (Windows, macOS, Linux, ChromeOS, Android) and choose **Connect to meter**.
3. Pick the meter in the browser's Bluetooth list.

Web Bluetooth is not available in Firefox or Safari, nor in browsers on iPhone and iPad (except apps
that add it, such as Bluefy). **Try the demo** shows made-up readings without a meter.

## Supported meters

| Meter | Type | Status |
|---|---|---|
| J7-C | USB | Checked against frames recorded from a real J7-C (values match its screen) |
| ATorch UD18 and similar | USB | Checked against published sample packets |
| ATorch AC meters (AC18 and similar) | AC | Checked against published sample packets |
| ATorch DC meters, AT24 and others with the same protocol | DC | Experimental: not confirmed on a device |

The type (USB / DC / AC) is read from the data, so a model not listed here may still work.
If your meter connects but shows nothing, please open an issue with its name and model.

The J7-C uses a different checksum from the ATorch one (the formula is unknown), so frames are
accepted without checksum verification when they are otherwise well formed.

## Privacy

Everything runs in the browser. Readings stay in memory and are never sent anywhere. No cookies,
no analytics, no ads. The production headers (`public/_headers`) forbid scripts and connections
to any other origin; `src/security-headers.test.ts` pins them.

## Development

```
pnpm install
pnpm dev          # dev server
pnpm check        # lint, typecheck, tests, build (same as CI)
pnpm exec playwright install chromium   # browser for the screenshot run (once)
pnpm build && pnpm screenshot           # drives the build in a real browser, writes screenshots/
pnpm run deploy   # build and publish to Cloudflare (`pnpm deploy` is a different pnpm command)
```

`pnpm screenshot` serves the build with the production headers, runs the demo and a **fake
Bluetooth meter** that replays real J7-C frames in 20-byte notifications, checks the numbers on
screen and the CSV, and fails on any console error or CSP violation. It is the closest thing to a
hardware test that does not need a meter.

The site address (canonical URL, social preview, `robots.txt`, `sitemap.xml`) comes from
`VITE_SITE_URL` in `.env`. Deployment is Cloudflare Workers static assets (`wrangler.jsonc`);
log in with `wrangler login` or pass `CLOUDFLARE_API_TOKEN`.

```
index.html                 page (connect, live readings, history, about)
src/protocol.ts            frame format: parse, checksum, stream reassembly, encoder
src/bluetooth.ts           Web Bluetooth: pick a meter and subscribe to notifications
src/demo.ts                pretend meter for the demo button
src/history.ts             recorded samples and CSV
src/chart.ts               canvas line chart
src/main.ts                wires the page together
```

## Protocol notes

Every frame is `FF 55 <type> <payload> <checksum>`. A report (type `01`, 36 bytes) carries the
device type (`01` AC, `02` DC, `03` USB) and big-endian readings. The checksum is the sum of the bytes
between the header and the checksum, xor `0x44`. The layout is based on community notes
([esphome-atorch-dl24](https://github.com/syssi/esphome-atorch-dl24/blob/main/docs/protocol-design.md),
[atorch-console](https://github.com/NiceLabs/atorch-console)) and on the J7-C capture in
[this forum thread](https://forum.arduino.cc/t/usb-digital-tester-bt-protocol/943891). Capacity is
read as mAh (value ÷ 1000 Ah); the UD18 sample packets are consistent with that.

## 日本語

Bluetooth 対応の USB テスター（ATorch UD18・AT24・J7-C など）の電圧・電流・電力・容量を、
ブラウザ（Chrome / Edge）で大きく表示します。グラフと CSV 保存つき。アプリの導入は要りません。
値はブラウザの中だけで扱い、どこにも送りません。iPhone の Safari は Web Bluetooth に対応していません。

## License

MIT. Not affiliated with ATorch or any meter maker; product names belong to their owners.
