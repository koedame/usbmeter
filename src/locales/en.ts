// Every text the page shows, in English. The other files in this folder are translations of
// this one and have the same keys. index.html carries the same English text for before the
// script has run, and src/page.test.ts keeps the two the same.
//
// "{name}" is filled in by the page. "<b>…</b>" and other "<word>…</word>" pairs wrap the part
// of a sentence that goes into an element of index.html (a bold label, a link, a button); a
// translation keeps the same pairs around its own words.

export const en = {
  "meta.title": "USB Meter Web – Bluetooth USB tester viewer for ATorch UD18, J7-C",

  "top.tagline": "Live readings from your Bluetooth USB tester, in the browser",
  "top.connect": "Connect to meter",
  "top.demo": "Try the demo",
  "top.disconnect": "Disconnect",
  "top.help": "Help",
  "top.language": "Language",

  "pill.idle": "Not connected",
  "pill.connecting": "Connecting…",
  "pill.live": "Connected",
  "pill.demo": "Demo",

  "status.start": "Plug in the meter, then choose Connect and pick it from the list.",
  "status.choosing": "Choose your meter in the browser's Bluetooth list…",
  "status.noneChosen":
    "No meter chosen. A meter is listed only while it is nearby and powered, its Bluetooth is on and nothing else, such as a phone app or another tab, is connected to it.",
  "status.reading": "Reading from {name}.",
  "status.readingUnnamed": "Reading from a meter without a Bluetooth name.",
  "status.readingUnknown":
    'Reading from {name}. This page does not know that name yet; report it as "{exact}" through Help so it can be added.',
  "status.lost": "The meter disconnected. Choose Connect to reconnect.",
  "status.disconnected": "Disconnected. The recorded readings are still below.",
  "status.demo": "Showing made-up readings from a pretend charger. Nothing is connected.",
  "status.failed": "Could not connect: {reason}",
  "error.noGatt": "This device does not offer a GATT connection.",
  "error.noSerialService":
    "This device has no serial-over-Bluetooth service (0xFFE0) that streams readings. It may not be a supported meter.",
  "error.timeout":
    "The meter did not answer. Check that it is powered and close, then choose Connect to meter again.",

  "hint.notListed":
    "Meter not in the list? <b>Unplug it, plug it back in and choose Connect again right away.</b> Some meters can only be found shortly after they get power. Still missing? <all>Show all Bluetooth devices</all>",
  "note.checksum":
    "This meter does not use the ATorch checksum, so readings are shown without checksum verification.",
  "note.unsupported":
    "This browser cannot talk to Bluetooth devices. Use Chrome or Edge on a computer or an Android phone; on Linux, Chrome needs a setting first (see Help). The demo works everywhere.",

  "range.legend": "Time range",
  "range.1min": "1 min",
  "range.10min": "10 min",
  "range.1h": "1 h",
  "range.all": "All",
  "action.csv": "Download CSV",
  "action.aiExport": "Export for AI",
  "action.clear": "Clear",
  "action.clearConfirm":
    "Clear the recording? It exists only in this tab and cannot be brought back. Download the CSV first to keep it.",

  "panels.title": "Live readings and history",
  "metric.voltage": "Voltage",
  "metric.current": "Current",
  "metric.power": "Power",
  "metric.temperature": "Temperature",
  "metric.frequency": "Frequency",
  "metric.pf": "Power factor",
  "panel.dataLines": "Data lines",
  "panel.overTime": "{name} over time",
  "stat.min": "Min",
  "stat.avg": "Avg",
  "stat.max": "Max",
  "plot.empty": "No data yet",
  "totals.title": "Totals",
  "totals.capacity": "Capacity",
  "totals.energy": "Energy",
  "totals.elapsed": "Elapsed",

  "export.about":
    "Downloads a ZIP with your readings and a README that explains them, ready to hand to Claude, ChatGPT or another AI assistant. Say what you measured, so it knows what to look for.",
  "export.purpose": "What did you measure?",
  "export.notes": "Notes for the assistant <optional>optional</optional>",
  "export.notesExample": "65 W charger, 1 m cable, phone starting at 20 %",
  "export.cancel": "Cancel",
  "export.download": "Download ZIP",
  "purpose.charging": "Charging a device",
  "purpose.charger": "Testing a charger or power supply",
  "purpose.powerBank": "Measuring a power bank or battery",
  "purpose.cable": "Checking a cable",
  "purpose.draw": "Power draw of a device or project",
  "purpose.appliance": "Power use of an appliance",
  "purpose.other": "Something else",

  "help.title": "About this viewer",
  "help.about":
    "Many cheap USB testers have Bluetooth, but their phone apps are slow to pair, full of ads or no longer updated. This page reads the same Bluetooth stream directly and puts every reading on one dashboard: voltage, current, power, temperature and the USB data lines each get a graph, all on the same time axis. Move the pointer over any graph to read every value at that moment, and download the whole recording as CSV or as a ZIP made for AI assistants. There is nothing to install and no account.",

  "help.use.title": "How to use it",
  "help.use.open": "Open this page in Chrome or Edge.",
  "help.use.plug":
    "Plug the meter between a charger and the device you want to measure. If it was plugged in already, unplug it and plug it back in: some meters, the J7-C among them, can only be found shortly after they get power.",
  "help.use.connect":
    "Choose <b>Connect to meter</b> straight away and pick the meter in the list. A J7-C shows up as UC96_BLE, ATorch meters under their model name, such as UD18-BLE or AT24-BLE. Readings start at once.",

  "help.ai.title": "Analyse a recording with AI",
  "help.ai.about":
    "<b>Export for AI</b> downloads a ZIP with two files: your readings as CSV and a README that tells an AI assistant what was recorded, what every column means, what a meter like this can and cannot measure, and how to analyse the kind of test you ran: a charging session, a charger, a power bank, a cable or the power draw of a device. Give the ZIP to Claude, ChatGPT or another assistant and ask your question, for example how long the charge took, whether the charger held its voltage, or how much a power bank really delivers. If the assistant does not take ZIP files, unpack it and give it both files.",
  "help.ai.language":
    "The README is written in English. Ask in your own language and the assistant answers in it.",
  "help.ai.private": "The page still sends nothing anywhere. The file goes only where you put it.",
  "help.ai.skill":
    "For Claude there is also a skill with the same guide, so Claude has it at hand even when it gets only the CSV. <download>Download the Claude skill</download> and add that ZIP to Claude (<how>how to add a skill</how>).",

  "help.meters.title": "Supported meters",
  "help.meters.meter": "Meter",
  "help.meters.type": "Type",
  "help.meters.status": "Status",
  "help.meters.ud18": "ATorch UD18 and other USB meters of the same family",
  "help.meters.acModels": "ATorch AC meters (AT24, AT3010)",
  "help.meters.dcModels":
    "ATorch DC meters (DT24, DT3010) and other models using the same protocol",
  "help.meters.ac": "AC mains",
  "help.meters.j7cStatus": "Checked against frames recorded from a real J7-C",
  "help.meters.samples": "Checked against published sample packets",
  "help.meters.dcStatus":
    "Experimental: voltage, current, power, temperature and time. Capacity and energy are not decoded yet",
  "help.meters.report":
    "If your meter connects but no readings appear, please <issue>open an issue</issue> with its name and model.",

  "help.browsers.title": "Browser support",
  "help.browsers.about":
    "The page uses Web Bluetooth, which Chrome and Edge provide on Windows, macOS, ChromeOS and Android. On Linux, Chrome keeps it switched off: open chrome://flags/#enable-experimental-web-platform-features in Chrome and enable that flag first. Firefox and Safari (including every browser on iPhone and iPad, except apps such as Bluefy that add Web Bluetooth) do not support it.",

  "help.privacy.title": "Privacy",
  "help.privacy.about":
    "Everything happens in your browser. The readings are kept in memory while the page is open and are never sent anywhere. There are no cookies, no analytics and no ads. Like any website, the page is delivered by a hosting provider, which sees your IP address when you load it.",

  "help.faq.title": "Questions",
  "help.faq.missing.q": "The meter does not appear in the list.",
  "help.faq.missing.replug":
    "Unplug the meter, plug it back in and choose <b>Connect to meter</b> again straight away. Some meters, the J7-C among them, can only be found shortly after they get power, so one that has been on for a while stays out of the list.",
  "help.faq.missing.other":
    "If that does not help: the list shows a meter only while the browser can hear it, so the meter needs to be nearby, with its Bluetooth switched on and no other connection. Disconnect it from any phone app or other tab first, because these meters accept one Bluetooth connection at a time. On Windows and Linux, make sure Bluetooth is on.",
  "help.faq.missing.all":
    "The list also leaves out devices that do not look like a supported meter. If yours is still missing, cancel the list and choose <b>Show all Bluetooth devices</b>. When the page does not know the name of a meter connected that way, it says so, and an <issue>issue</issue> with that name gets it added.",
  "help.faq.checksum.q": "Why does it say the checksum is not verified?",
  "help.faq.checksum.a":
    "Some meters, the J7-C among them, use a different checksum from the ATorch one. The readings are still shown when the frame is otherwise well formed.",
  "help.faq.settings.q": "Can it reset the counters or change settings?",
  "help.faq.settings.a": "Not yet. The viewer only reads.",

  "footer.text":
    "MIT licensed · <source>Source on GitHub</source> · Not affiliated with ATorch, any meter maker or any AI provider. Product names belong to their owners and are used only to say what this page works with.",
  "footer.warranty":
    "Run by koedame and provided as is, without warranty. Readings can be wrong: this is not a calibrated instrument or a safety device, so do not use it to decide whether a circuit, a charger or an appliance is safe.",
};

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
