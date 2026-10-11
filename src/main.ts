import { bluetoothSupported, connectMeter } from "./bluetooth.ts";
import { Dashboard } from "./dashboard.ts";
import { startDemo } from "./demo.ts";
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
  stop(): void;
}
let session: Session | undefined;
let lastSource: Source | undefined;

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
    render(reading);
    ui.csv.disabled = false;
    ui.clear.disabled = false;
    redrawChart();
  }
}

/** Ends the current session, and drops the recorded readings when they came from the other kind of source */
function begin(source: Source, stop: () => void = () => {}): Session {
  session?.stop();
  if (lastSource !== undefined && lastSource !== source) {
    // nothing of the old source may stay on screen under the name of the new one
    history.clear();
    ui.csv.disabled = true;
    ui.clear.disabled = true;
    dashboard.clearReadings();
    for (const id of ["capacity", "energy", "duration"]) setText(id, "–");
    redrawChart();
  }
  lastSource = source;
  session = { source, stream: new FrameStream(), stop };
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

function download(): void {
  const blob = new Blob([history.toCsv()], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  link.href = url;
  link.download = `usb-meter-${stamp}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
ui.clear.addEventListener("click", () => {
  history.clear();
  ui.csv.disabled = true;
  ui.clear.disabled = true;
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
