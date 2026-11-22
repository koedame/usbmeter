# USB Meter Web

Live readings from your Bluetooth USB tester, in the browser. Voltage, current, power, capacity,
temperature and the USB data lines each get a graph on the same time axis. Download the recording
as CSV, or as a ZIP made for AI assistants. There is nothing to install and no account.

This is the Markdown version of the page at https://usbmeter.koeda.me/. The page itself is an
interactive tool: it connects to the meter over Web Bluetooth and needs Chrome or Edge.

## How to use it

1. Open the page in Chrome or Edge.
2. Plug the meter between a charger and the device you want to measure. If it was plugged in
   already, unplug it and plug it back in: some meters, the J7-C among them, can only be found
   shortly after they get power.
3. Choose "Connect to meter" straight away and pick the meter in the list. A J7-C shows up as
   UC96_BLE, ATorch meters under their model name, such as UD18-BLE or AT24-BLE. Readings start at
   once. "Try the demo" runs the page without a meter.

## Analyse a recording with AI

"Export for AI" downloads a ZIP with two files: the readings as CSV and a README that tells an AI
assistant what was recorded, what every column means, what a meter like this can and cannot
measure, and how to analyse the kind of test you ran: a charging session, a charger, a power bank,
a cable or the power draw of a device. Give the ZIP to Claude, ChatGPT or another assistant and ask
your question. The README is written in English. The page sends nothing anywhere; the file goes
only where you put it.

## Supported meters

| Meter | Type | Status |
| --- | --- | --- |
| J7-C | USB | Checked against frames recorded from a real J7-C |
| ATorch UD18 and other USB meters of the same family | USB | Checked against published sample packets |
| ATorch AC meters (AT24, AT3010) | AC mains | Checked against published sample packets |
| ATorch DC meters (DT24, DT3010) and other models using the same protocol | DC | Experimental: voltage, current, power, temperature and time. Capacity and energy are not decoded yet |

If your meter connects but no readings appear, open an issue with its name and model:
https://github.com/koedame/usbmeter/issues

## Browser support

The page uses Web Bluetooth, which Chrome and Edge provide on Windows, macOS, ChromeOS and
Android. On Linux, Chrome keeps it switched off: enable the flag
chrome://flags/#enable-experimental-web-platform-features first. Firefox and Safari (including
every browser on iPhone and iPad, except apps such as Bluefy that add Web Bluetooth) do not
support it.

## Privacy

Everything happens in your browser. The readings are kept in memory while the page is open and are
never sent anywhere. There are no cookies, no analytics and no ads. Like any website, the page is
delivered by a hosting provider, which sees your IP address when you load it.

## Questions

**The meter does not appear in the list.** Unplug the meter, plug it back in and choose "Connect to
meter" again straight away. If that does not help, the meter needs to be nearby, with its Bluetooth
switched on and no other connection (disconnect it from any phone app or other tab first). If it
is still missing, cancel the list and choose "Show all Bluetooth devices".

**Why does it say the checksum is not verified?** Some meters, the J7-C among them, use a
different checksum from the ATorch one. The readings are still shown when the frame is otherwise
well formed.

**Can it reset the counters or change settings?** Not yet. The viewer only reads.

## About

MIT licensed. Source: https://github.com/koedame/usbmeter. Not affiliated with ATorch, any meter
maker or any AI provider. Run by koedame and provided as is, without warranty. Readings can be
wrong: this is not a calibrated instrument or a safety device.
