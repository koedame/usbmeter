import { bluetoothSupported, connectMeter } from "./bluetooth.ts";
import { drawChart } from "./chart.ts";
import { startDemo } from "./demo.ts";
import {
  formatCapacity,
  formatCurrent,
  formatDuration,
  formatEnergy,
  formatPower,
  formatVoltage,
} from "./format.ts";
import { History, type Metric } from "./history.ts";
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
  demo: element<HTMLButtonElement>("demo"),
  disconnect: element<HTMLButtonElement>("disconnect"),
  csv: element<HTMLButtonElement>("csv"),
  clear: element<HTMLButtonElement>("clear"),
  metric: element<HTMLSelectElement>("metric"),
  range: element<HTMLSelectElement>("range"),
  chart: element<HTMLCanvasElement>("chart"),
  energyUnit: element("energy-unit"),
};

const history = new History();
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
  const hadFocus = [ui.connect, ui.demo, ui.disconnect].includes(
    document.activeElement as HTMLButtonElement,
  );
  ui.connect.hidden = running;
  ui.demo.hidden = running;
  ui.disconnect.hidden = !running;
  ui.connect.disabled = state === "connecting" || !supported;
  ui.demo.disabled = state === "connecting";
  if (state !== "demo" && state !== "live") ui.checksumNote.hidden = true;
  // A hidden button cannot keep the keyboard focus, so hand it to the one that took its place.
  if (hadFocus) (running ? ui.disconnect : supported ? ui.connect : ui.demo).focus();
}

function showKind(kind: Reading["kind"]): void {
  for (const node of document.querySelectorAll<HTMLElement>("[data-for]")) {
    node.hidden = !(node.dataset.for ?? "").split(" ").includes(kind);
  }
}

function render(reading: Reading): void {
  showKind(reading.kind);
  setText("voltage", formatVoltage(reading));
  setText("current", formatCurrent(reading));
  setText("power", formatPower(reading));
  const energy = formatEnergy(reading);
  setText("energy", energy.value);
  ui.energyUnit.textContent = energy.unit;
  setText("duration", formatDuration(reading.durationSec));
  setText("temperature", String(reading.temperatureC));
  if (reading.capacityAh !== undefined) setText("capacity", formatCapacity(reading.capacityAh));
  if (reading.dPlus !== undefined) setText("dplus", reading.dPlus.toFixed(2));
  if (reading.dMinus !== undefined) setText("dminus", reading.dMinus.toFixed(2));
  if (reading.frequencyHz !== undefined) setText("frequency", reading.frequencyHz.toFixed(1));
  if (reading.powerFactor !== undefined) setText("pf", reading.powerFactor.toFixed(3));
  ui.checksumNote.hidden = reading.checksumOk;
}

function windowMs(): number | undefined {
  return ui.range.value === "all" ? undefined : Number(ui.range.value);
}

function redrawChart(): void {
  drawChart(ui.chart, history.window(windowMs()), ui.metric.value as Metric);
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
    history.clear();
    ui.csv.disabled = true;
    ui.clear.disabled = true;
  }
  lastSource = source;
  session = { source, stream: new FrameStream(), stop };
  return session;
}

async function connect(): Promise<void> {
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
    );
    mine.stop = connection.disconnect;
    if (mine !== session) return connection.disconnect();
    setState("live", `Reading from ${connection.name}.`);
  } catch (error) {
    if (mine !== session) return;
    session = undefined;
    const cancelled = error instanceof DOMException && error.name === "NotFoundError";
    setState(
      cancelled ? "idle" : "error",
      cancelled
        ? "No meter chosen. Choose Connect to try again."
        : `Could not connect: ${error instanceof Error ? error.message : String(error)}`,
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
ui.metric.addEventListener("change", redrawChart);
ui.range.addEventListener("change", redrawChart);
window.addEventListener("resize", redrawChart);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawChart);

if (!supported) {
  ui.unsupported.hidden = false;
  ui.connect.disabled = true;
}
redrawChart();
