import { bluetoothSupported, connectMeter } from "./bluetooth.ts";
import { Dashboard } from "./dashboard.ts";
import { startDemo } from "./demo.ts";
import { purposesFor, recordingArchive, skillArchive } from "./export.ts";
import { formatCapacity, formatDuration, formatEnergy } from "./format.ts";
import { History } from "./history.ts";
import { FrameStream, parseReport, type Reading } from "./protocol.ts";

type State = "idle" | "connecting" | "live" | "demo" | "error";
type Source = "meter" | "demo";

const PILL_TEXT: Record<State, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  live: "Connected",
  demo: "Demo",
  error: "Not connected",
};

// The browser's list shows only the devices it hears while the list is open, and it says
// nothing when that leaves the list empty. So the page says what a meter needs to be in it
// and what to try when it is still missing: a J7-C that had stopped advertising was heard
// again right after it was plugged back in.
const LISTED_WHEN =
  "A meter is listed only while it is nearby and powered, its Bluetooth is on and nothing else, such as a phone app or another tab, is connected to it. If it stays missing, unplug the meter and plug it back in.";

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
  range: element("range"),
  energyUnit: element("energy-unit"),
};

const history = new History();
const dashboard = new Dashboard(element("panels-row"), element("tooltip"));
const supported = bluetoothSupported();

/**
 * What is feeding the page right now. Every callback from a source checks that it still
 * belongs to the current session, so a late event from an old connection cannot touch the
 * state of a newer one.
 */
interface Session {
  source: Source;
  stream: FrameStream;
  /** Bluetooth name of the meter once it is connected, "unnamed meter" when it has none */
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

function setState(state: State, message: string): void {
  ui.pill.dataset.state = state;
  ui.pill.textContent = PILL_TEXT[state];
  ui.status.textContent = message;
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
  for (const frame of mine.stream.push(chunk)) {
    const reading = parseReport(frame);
    if (!reading) continue;
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
  session = { source, stream: new FrameStream(), meterName: undefined, stop };
  return session;
}

/** `anyDevice` lists every Bluetooth device nearby instead of only the ones that look like a meter */
async function connect(anyDevice = false): Promise<void> {
  const mine = begin("meter");
  setState("connecting", "Choose your meter in the browser's Bluetooth list…");
  try {
    const connection = await connectMeter(
      (chunk) => onChunk(mine, chunk),
      () => {
        if (mine !== session) return;
        session = undefined;
        setState("idle", "The meter disconnected. Choose Connect to reconnect.");
      },
      anyDevice,
    );
    if (!connection) {
      if (mine !== session) return;
      session = undefined;
      setState("idle", `No meter chosen. ${LISTED_WHEN}`);
      return;
    }
    mine.stop = connection.disconnect;
    if (mine !== session) return connection.disconnect();
    mine.meterName = connection.name ?? "unnamed meter";
    let status = `Reading from ${connection.name ?? "a meter without a Bluetooth name"}.`;
    if (anyDevice && connection.name !== undefined && !connection.knownName)
      status += ` This page does not know that name yet; report it as "${connection.exactName}" through Help so it can be added.`;
    setState("live", status);
  } catch (error) {
    if (mine !== session) return;
    session = undefined;
    setState(
      "error",
      `Could not connect: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function startDemoMode(): void {
  const mine = begin("demo");
  mine.stop = startDemo((chunk) => onChunk(mine, chunk));
  setState("demo", "Showing made-up readings from a pretend charger. Nothing is connected.");
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
  ui.exportPurpose.replaceChildren(...purposesFor(kind).map((label) => new Option(label)));
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
  setState("idle", "Disconnected. The recorded readings are still below.");
});
ui.csv.addEventListener("click", download);
ui.aiExport.addEventListener("click", askExport);
ui.exportCancel.addEventListener("click", () => ui.exportDialog.close());
ui.exportDownload.addEventListener("click", downloadExport);
ui.skill.addEventListener("click", () =>
  save(new Blob([skillArchive()], { type: "application/zip" }), "usbmeter-analysis.zip"),
);
ui.clear.addEventListener("click", () => {
  forgetRecording();
  redrawChart();
});
ui.range.addEventListener("change", redrawChart);

if (!supported) {
  ui.unsupported.hidden = false;
  ui.connect.disabled = true;
  ui.anyDevice.hidden = true;
}
showKind("usb"); // the layout to start with, until a meter says what it is
redrawChart();
