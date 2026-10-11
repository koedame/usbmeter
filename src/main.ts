import { bluetoothSupported, connectMeter, type MeterConnection } from "./bluetooth.ts";
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
let stream = new FrameStream();
let stop: (() => void) | undefined;
let lastReading: Reading | undefined;

function setText(id: string, text: string): void {
  element(id).textContent = text;
}

function setState(state: State, message: string): void {
  ui.pill.dataset.state = state;
  ui.pill.textContent = PILL_TEXT[state];
  ui.status.textContent = message;
  const running = state === "live" || state === "demo";
  ui.connect.hidden = running;
  ui.demo.hidden = running;
  ui.disconnect.hidden = !running;
  ui.connect.disabled = state === "connecting";
}

function showKind(kind: Reading["kind"]): void {
  for (const node of document.querySelectorAll<HTMLElement>("[data-for]")) {
    node.hidden = node.dataset.for !== kind;
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
}

function windowMs(): number | undefined {
  return ui.range.value === "all" ? undefined : Number(ui.range.value);
}

function redrawChart(): void {
  drawChart(ui.chart, history.window(windowMs()), ui.metric.value as Metric);
}

function onChunk(chunk: Uint8Array): void {
  for (const frame of stream.push(chunk)) {
    const reading = parseReport(frame);
    if (!reading) continue;
    lastReading = reading;
    history.add(reading);
    render(reading);
    ui.csv.disabled = false;
    ui.clear.disabled = false;
    redrawChart();
  }
}

function stopStreaming(): void {
  stop?.();
  stop = undefined;
}

async function connect(): Promise<void> {
  setState("connecting", "Choose your meter in the browser's Bluetooth list…");
  stream = new FrameStream();
  try {
    const connection: MeterConnection = await connectMeter(onChunk, () => {
      stop = undefined;
      setState("idle", "The meter disconnected. Choose Connect to reconnect.");
    });
    stop = connection.disconnect;
    setState("live", `Reading from ${connection.name}.`);
  } catch (error) {
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
  stream = new FrameStream();
  stop = startDemo(onChunk);
  setState("demo", "Showing made-up readings from a pretend charger. Nothing is connected.");
}

function download(): void {
  const blob = new Blob([history.toCsv()], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `usb-meter-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

ui.connect.addEventListener("click", () => void connect());
ui.demo.addEventListener("click", startDemoMode);
ui.disconnect.addEventListener("click", () => {
  stopStreaming();
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

if (!bluetoothSupported()) {
  ui.unsupported.hidden = false;
  ui.connect.disabled = true;
}
if (lastReading) render(lastReading);
redrawChart();
