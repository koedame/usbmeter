import { bluetoothSupported, connectMeter, MeterError } from "./bluetooth.ts";
import { Dashboard } from "./dashboard.ts";
import { startDemo } from "./demo.ts";
import { purposeName, purposesFor, recordingArchive, skillArchive } from "./export.ts";
import { formatCapacity, formatDuration, formatEnergy } from "./format.ts";
import { History } from "./history.ts";
import { LOCALES, locale, matchLocale, setLocale, startLocale, t, translate } from "./i18n.ts";
import type { MessageKey } from "./locales/en.ts";
import { type Reading, ReportStream } from "./protocol.ts";

type State = "idle" | "connecting" | "live" | "demo" | "error";
type Source = "meter" | "demo";

const PILL_TEXT: Record<State, MessageKey> = {
  idle: "pill.idle",
  connecting: "pill.connecting",
  live: "pill.live",
  demo: "pill.demo",
  error: "pill.idle",
};

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`#${id} is missing from index.html`);
  return found as T;
}

const ui = {
  pill: element("pill"),
  status: element("status"),
  checksumNote: element("checksum-note"),
  unsupported: element("unsupported"),
  connect: element<HTMLButtonElement>("connect"),
  connectAny: element<HTMLButtonElement>("connect-any"),
  anyDevice: element("any-device"),
  demo: element<HTMLButtonElement>("demo"),
  disconnect: element<HTMLButtonElement>("disconnect"),
  csv: element<HTMLButtonElement>("csv"),
  aiExport: element<HTMLButtonElement>("ai-export"),
  exportDialog: element<HTMLDialogElement>("export-dialog"),
  exportPurpose: element<HTMLSelectElement>("export-purpose"),
  exportNotes: element<HTMLTextAreaElement>("export-notes"),
  exportCancel: element<HTMLButtonElement>("export-cancel"),
  exportDownload: element<HTMLButtonElement>("export-download"),
  skill: element<HTMLButtonElement>("skill"),
  clear: element<HTMLButtonElement>("clear"),
  language: element<HTMLSelectElement>("language"),
  range: element("range"),
  energyUnit: element("energy-unit"),
};

// before anything puts text on the page
setLocale(startLocale(location.search, navigator.languages));

const history = new History();
const dashboard = new Dashboard(
  element("panels-row"),
  element("tooltip"),
  element("cursor-reading"),
);
const supported = bluetoothSupported();

/**
 * What is feeding the page right now. Every callback from a source checks that it still
 * belongs to the current session, so a late event from an old connection cannot touch the
 * state of a newer one.
 */
interface Session {
  source: Source;
  stream: ReportStream;
  /** Bluetooth name of the meter once it is connected, "" when it has none */
  meterName: string | undefined;
  stop(): void;
}
let session: Session | undefined;
let lastSource: Source | undefined;
/** Bluetooth names of the meters the recorded readings came from, in the order they arrived */
let meterNames: string[] = [];

/** The buttons that need a recording to work on */
function setRecorded(recorded: boolean): void {
  for (const button of [ui.csv, ui.aiExport, ui.clear]) button.disabled = !recorded;
}

/** Drops the recording and what was noted about it for an export */
function forgetRecording(): void {
  history.clear();
  meterNames = [];
  ui.exportNotes.value = "";
  setRecorded(false);
}

function setText(id: string, text: string): void {
  element(id).textContent = text;
}

/**
 * Where the connection stands, and the status line that goes with it. The line is kept as a
 * way to word it, so that it can be said again when the language changes.
 */
let state: State = "idle";
let status = () => t("status.start");

function showStatus(): void {
  ui.pill.textContent = t(PILL_TEXT[state]);
  ui.status.textContent = status();
}

function setState(next: State, message: () => string): void {
  state = next;
  status = message;
  ui.pill.dataset.state = state;
  showStatus();
  const running = state === "live" || state === "demo";
  const focused = [ui.connect, ui.connectAny, ui.demo, ui.disconnect].find(
    (button) => button === document.activeElement,
  );
  // The browser's list cannot say why it is empty and can cover the status line while it is
  // open, so the way to the full list is on the page before the first try, not only after a
  // failed one.
  ui.anyDevice.hidden = running || !supported;
  ui.connectAny.disabled = state === "connecting";
  ui.connect.hidden = running;
  ui.demo.hidden = running;
  ui.disconnect.hidden = !running;
  ui.connect.disabled = state === "connecting" || !supported;
  ui.demo.disabled = state === "connecting";
  if (state !== "demo" && state !== "live") ui.checksumNote.hidden = true;
  // A hidden button cannot keep the keyboard focus, so hand it to the one that took its place.
  const replacement = running ? ui.disconnect : supported ? ui.connect : ui.demo;
  if (focused) (focused.closest("[hidden]") ? replacement : focused).focus();
}

function showKind(kind: Reading["kind"]): void {
  for (const node of document.querySelectorAll<HTMLElement>("[data-for]")) {
    node.hidden = !(node.dataset.for ?? "").split(" ").includes(kind);
  }
}

function render(reading: Reading): void {
  showKind(reading.kind);
  dashboard.showReading(reading);
  const energy = formatEnergy(reading);
  setText("energy", energy.value);
  ui.energyUnit.textContent = energy.unit;
  setText("duration", formatDuration(reading.durationSec));
  if (reading.capacityAh !== undefined) setText("capacity", formatCapacity(reading.capacityAh));
  ui.checksumNote.hidden = reading.checksumOk;
}

/** The chosen time range in milliseconds, or undefined for everything recorded */
function windowMs(): number | undefined {
  const chosen = ui.range.querySelector<HTMLInputElement>("input:checked")?.value;
  return chosen === undefined || chosen === "all" ? undefined : Number(chosen);
}

function redrawChart(): void {
  const range = windowMs();
  dashboard.showHistory(history.window(range), range);
}

function onChunk(mine: Session, chunk: Uint8Array): void {
  if (mine !== session) return;
  for (const reading of mine.stream.push(chunk)) {
    history.add(reading);
    if (mine.meterName !== undefined && meterNames.at(-1) !== mine.meterName)
      meterNames.push(mine.meterName);
    render(reading);
    setRecorded(true);
    redrawChart();
  }
}

/** Ends the current session, and drops the recorded readings when they came from the other kind of source */
function begin(source: Source, stop: () => void = () => {}): Session {
  session?.stop();
  if (lastSource !== undefined && lastSource !== source) {
    // nothing of the old source may stay on screen under the name of the new one
    forgetRecording();
    dashboard.clearReadings();
    for (const id of ["capacity", "energy", "duration"]) setText(id, "–");
    redrawChart();
  }
  lastSource = source;
  session = { source, stream: new ReportStream(), meterName: undefined, stop };
  return session;
}

/** `anyDevice` lists every Bluetooth device nearby instead of only the ones that look like a meter */
async function connect(anyDevice = false): Promise<void> {
  const mine = begin("meter");
  setState("connecting", () => t("status.choosing"));
  try {
    const connection = await connectMeter(
      (chunk) => onChunk(mine, chunk),
      () => {
        if (mine !== session) return;
        session = undefined;
        setState("idle", () => t("status.lost"));
      },
      anyDevice,
    );
    if (!connection) {
      if (mine !== session) return;
      session = undefined;
      // The browser's list shows only what it hears while it is open, and says nothing when
      // that leaves it empty, so the page says what a meter needs to be in it. What to do
      // about a missing one is on the page all along, in the line under this one.
      setState("idle", () => t("status.noneChosen"));
      return;
    }
    mine.stop = connection.disconnect;
    if (mine !== session) return connection.disconnect();
    const { name, exactName, knownName } = connection;
    mine.meterName = name ?? "";
    setState("live", () => {
      if (name === undefined) return t("status.readingUnnamed");
      return anyDevice && !knownName
        ? t("status.readingUnknown", { name, exact: exactName ?? name })
        : t("status.reading", { name });
    });
  } catch (error) {
    if (mine !== session) return;
    session = undefined;
    // What the browser says about a failed connection comes in the browser's own words
    setState("error", () =>
      t("status.failed", {
        reason:
          error instanceof MeterError
            ? t(`error.${error.code}`)
            : error instanceof Error
              ? error.message
              : String(error),
      }),
    );
  }
}

function startDemoMode(): void {
  const mine = begin("demo");
  mine.stop = startDemo((chunk) => onChunk(mine, chunk));
  setState("demo", () => t("status.demo"));
}

/** Hands a file to the browser's downloads */
function save(blob: Blob, name: string): void {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A file name for the recording as it is now: usb-meter-20260131-235959.<extension> */
function recordingName(extension: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `usb-meter-${stamp}.${extension}`;
}

function download(): void {
  save(new Blob([history.toCsv()], { type: "text/csv;charset=utf-8" }), recordingName("csv"));
}

/** Opens the export dialog with the purposes that fit the meter the readings came from */
function askExport(): void {
  const kind = history.window(undefined).at(-1)?.reading.kind ?? "usb";
  const chosen = ui.exportPurpose.value;
  // shown in the page's language; the value is the English name that goes into the README
  ui.exportPurpose.replaceChildren(
    ...purposesFor(kind).map((id) => new Option(t(`purpose.${id}`), purposeName(id))),
  );
  // keep what was picked for the last export when it is still on offer
  if ([...ui.exportPurpose.options].some((option) => option.value === chosen))
    ui.exportPurpose.value = chosen;
  ui.exportDialog.showModal();
}

function downloadExport(): void {
  const samples = history.window(undefined);
  const archive = recordingArchive(history.toCsv(), samples, {
    kind: samples.at(-1)?.reading.kind ?? "usb",
    source: lastSource ?? "meter",
    meterNames,
    purpose: ui.exportPurpose.value,
    notes: ui.exportNotes.value,
    utcOffsetMinutes: -new Date().getTimezoneOffset(),
  });
  save(new Blob([archive], { type: "application/zip" }), recordingName("zip"));
  ui.exportDialog.close();
}

ui.connect.addEventListener("click", () => void connect());
ui.connectAny.addEventListener("click", () => void connect(true));
ui.demo.addEventListener("click", startDemoMode);
ui.disconnect.addEventListener("click", () => {
  session?.stop();
  session = undefined;
  setState("idle", () => t("status.disconnected"));
});
ui.csv.addEventListener("click", download);
ui.aiExport.addEventListener("click", askExport);
ui.exportCancel.addEventListener("click", () => ui.exportDialog.close());
ui.exportDownload.addEventListener("click", downloadExport);
ui.skill.addEventListener("click", () =>
  save(new Blob([skillArchive()], { type: "application/zip" }), "usbmeter-analysis.zip"),
);
ui.clear.addEventListener("click", () => {
  if (!window.confirm(t("action.clearConfirm"))) return;
  forgetRecording();
  redrawChart();
});
ui.range.addEventListener("change", redrawChart);
// the recording is kept in memory only, so leaving the page loses it
window.addEventListener("beforeunload", (event) => {
  if (history.length > 0) event.preventDefault();
});

/** Puts everything on the page into the language that is set */
function showLanguage(): void {
  document.documentElement.lang = locale().tag;
  ui.language.value = locale().tag;
  translate(document);
  ui.exportNotes.placeholder = t("export.notesExample");
  dashboard.retranslate();
  showStatus(); // last: the status line and the pill follow the connection, not their markup
}

/** Each language is listed under its own name, so it can be found from any other */
ui.language.replaceChildren(
  ...LOCALES.map(({ tag, name }) => {
    const option = new Option(name, tag);
    option.lang = tag;
    return option;
  }),
);
ui.language.addEventListener("change", () => {
  const chosen = matchLocale([ui.language.value]);
  if (!chosen) return;
  setLocale(chosen);
  // The choice goes into the address, which is the one place the page keeps it: a reload or
  // a bookmark opens the page in the same language, and nothing is stored in the browser.
  const address = new URL(location.href);
  address.searchParams.set("lang", chosen.tag);
  window.history.replaceState(null, "", address);
  showLanguage();
});
showLanguage();

if (!supported) {
  ui.unsupported.hidden = false;
  ui.connect.disabled = true;
  ui.anyDevice.hidden = true;
}
showKind("usb"); // the layout to start with, until a meter says what it is
redrawChart();
