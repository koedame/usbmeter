# Contributing

Issues and pull requests are welcome. The most useful reports are:

- **A meter that is missing from the Bluetooth list.** Connect it through
  **Show all Bluetooth devices** and tell us the name the status line shows.
- **A meter that connects but shows nothing or wrong values.** Its name and model, and if you
  can, a few frames captured from it (hex) with what its screen showed at that moment.

## Run it locally

You need Node 22 or later and pnpm.

```
pnpm install
pnpm dev          # dev server on http://localhost:5173
pnpm check        # lint, typecheck, tests, build (what CI runs)
```

Web Bluetooth needs a secure context; `localhost` counts as one.

## Checking a change without a meter

```
pnpm exec playwright install chromium   # once
pnpm build && pnpm screenshot           # writes screenshots/
```

`pnpm screenshot` serves the build with the production headers and drives it in a real browser,
on a desktop, a laptop and a phone-sized window, in both colour schemes. It runs the demo and a
**fake Bluetooth meter** that replays real J7-C frames (and AC and DC sample packets) in 20-byte
notifications, then checks the numbers on screen, the status line, the CSV, the cursor tooltip,
that every plot is painted and that the dashboard fits the window. It runs **Export for AI** on
every screen, unpacks the ZIP the browser downloaded and checks the README and the CSV in it,
and does the same for the Claude skill. Last, it gives Chromium an
emulated Bluetooth adapter with meters and unrelated gadgets around it and reads which of them
the real device picker lists. Any console error or CSP violation fails the run. It is the
closest thing to a hardware test that does not need a meter, so look at the pictures after a
change to the page.

Layout and rendering are checked there; logic is covered by unit tests next to the code
(`src/*.test.ts`). Test names read "when ..., ...", so the list of names doubles as the spec.

## Where things are

```
index.html                 page (top bar, dashboard, about)
src/protocol.ts            frame format: parse, checksum, stream reassembly, encoder
src/bluetooth.ts           Web Bluetooth: narrow the device list, pick a meter, subscribe to notifications
src/demo.ts                pretend meter for the demo button
src/history.ts             recorded samples and CSV
src/summary.ts             what a recording adds up to: ranges, totals, pauses
src/export.ts              "Export for AI": the README of the export, its ZIP, the skill download
src/zip.ts                 ZIP writer (files stored as they are)
skills/usbmeter-analysis/  the analysis guide: a Claude skill, and part of every export's README
src/metrics.ts             the measured quantities and the panels they are grouped into
src/chart.ts               one canvas plot: axis scaling, thinning of long recordings, drawing
src/dashboard.ts           the panels, their readouts and ranges, the shared cursor and tooltip
src/main.ts                wires the page together
scripts/screenshot.mjs     the browser run described above
```

To teach the device list a new meter, add the start of its Bluetooth name to
`METER_NAME_PREFIXES` in `src/bluetooth.ts`.

To add a purpose to **Export for AI**, add it to `PURPOSES` in `src/export.ts` and write a
section under the same heading in `skills/usbmeter-analysis/SKILL.md`; a test keeps the two in
step.

The picture in the README is `docs/dashboard.png`: the demo after about a minute, with the
pointer on the current graph.
